import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyJWT } from '@/lib/auth'
import jsPDF from 'jspdf'

export async function GET(request: NextRequest) {
  try {
    // Get auth token from header
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const user = verifyJWT(token)
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const orderId = searchParams.get('orderId')

    // Build where clause
    const where: any = {}
    if (orderId) {
      where.orderId = parseInt(orderId)
    }

    // Get documents with pagination
    const documents = await prisma.document.findMany({
      where,
      include: {
        order: {
          include: {
            customer: true
          }
        },
        user: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { generatedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    })

    const totalDocuments = await prisma.document.count({ where })

    return NextResponse.json({
      documents,
      pagination: {
        page,
        limit,
        total: totalDocuments,
        pages: Math.ceil(totalDocuments / limit)
      }
    })

  } catch (error) {
    console.error('Get documents error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get auth token from header
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const user = verifyJWT(token)
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    // Check if user can generate documents
    if (!['ADMIN', 'TEAM'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { orderId, type } = body

    // Validate input
    if (!orderId || !type) {
      return NextResponse.json(
        { error: 'Order ID and document type are required' },
        { status: 400 }
      )
    }

    // Get order details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        orderItems: {
          include: {
            product: {
              include: {
                supplier: true
              }
            }
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Generate PDF based on document type
    const pdf = new jsPDF()
    const fileName = `${type}_${order.orderNo}_${Date.now()}.pdf`

    // Add company header
    pdf.setFontSize(20)
    pdf.text('NAFRU', 20, 30)
    pdf.setFontSize(12)
    pdf.text('Egyptian Fruit Export Company', 20, 40)
    pdf.text('Cairo, Egypt', 20, 50)

    // Add document title
    pdf.setFontSize(16)
    const documentTitle = getDocumentTitle(type)
    pdf.text(documentTitle, 20, 70)

    // Add order information
    pdf.setFontSize(12)
    pdf.text(`Order No: ${order.orderNo}`, 20, 90)
    pdf.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 20, 100)
    pdf.text(`Customer: ${order.customer.name}`, 20, 110)
    pdf.text(`Company: ${order.customer.company || 'N/A'}`, 20, 120)
    pdf.text(`Country: ${order.customer.country}`, 20, 130)

    // Add order items
    let yPosition = 150
    pdf.text('Order Items:', 20, yPosition)
    yPosition += 10

    order.orderItems.forEach((item, index) => {
      pdf.text(
        `${index + 1}. ${item.product.name} - ${item.quantity}kg @ ${item.pricePerKg} ${order.currency}/kg`,
        25,
        yPosition
      )
      yPosition += 10
    })

    // Add totals
    yPosition += 10
    pdf.text(`Total Weight: ${order.totalKg} kg`, 20, yPosition)
    yPosition += 10
    pdf.text(`Total Amount: ${order.totalPrice} ${order.currency}`, 20, yPosition)

    // Add document-specific content
    yPosition += 20
    addDocumentSpecificContent(pdf, type, order, yPosition)

    // Convert PDF to base64
    const pdfBase64 = pdf.output('datauristring')

    // Save document record
    const document = await prisma.document.create({
      data: {
        orderId,
        type: type as any,
        fileName,
        status: 'generated',
        createdBy: user.id
      },
      include: {
        order: {
          include: {
            customer: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      document,
      pdfData: pdfBase64
    })

  } catch (error) {
    console.error('Generate document error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function getDocumentTitle(type: string): string {
  const titles = {
    COMMERCIAL_INVOICE: 'Commercial Invoice',
    CERTIFICATE_OF_ORIGIN: 'Certificate of Origin',
    PHYTOSANITARY_CERTIFICATE: 'Phytosanitary Certificate',
    PACKING_LIST: 'Packing List',
    BILL_OF_LADING: 'Bill of Lading'
  }
  return titles[type as keyof typeof titles] || 'Document'
}

function addDocumentSpecificContent(pdf: jsPDF, type: string, order: any, yPosition: number) {
  switch (type) {
    case 'COMMERCIAL_INVOICE':
      pdf.text('Payment Terms: As per agreement', 20, yPosition)
      pdf.text('Delivery Terms: FOB Alexandria Port', 20, yPosition + 10)
      break
    
    case 'CERTIFICATE_OF_ORIGIN':
      pdf.text('Country of Origin: Egypt', 20, yPosition)
      pdf.text('Certification: This is to certify that the goods described', 20, yPosition + 10)
      pdf.text('above are of Egyptian origin.', 20, yPosition + 20)
      break
    
    case 'PHYTOSANITARY_CERTIFICATE':
      pdf.text('Plant Health Certificate', 20, yPosition)
      pdf.text('The plants/products described above have been', 20, yPosition + 10)
      pdf.text('inspected and found free from quarantine pests.', 20, yPosition + 20)
      break
    
    case 'PACKING_LIST':
      pdf.text('Packing Details:', 20, yPosition)
      pdf.text('Packed in cartons suitable for export', 20, yPosition + 10)
      pdf.text('Net Weight: As specified above', 20, yPosition + 20)
      break
    
    case 'BILL_OF_LADING':
      pdf.text('Vessel: TBD', 20, yPosition)
      pdf.text('Port of Loading: Alexandria, Egypt', 20, yPosition + 10)
      pdf.text('Port of Discharge: As per destination', 20, yPosition + 20)
      break
  }
}
