import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyJWT } from '@/lib/auth'

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
    const status = searchParams.get('status')

    // Build where clause
    const where: any = {}
    if (status) {
      where.status = status
    }

    // For buyers, only show shipments for their orders
    if (user.role === 'BUYER') {
      const customer = await prisma.customer.findFirst({
        where: { email: user.email }
      })
      if (customer) {
        where.order = {
          customerId: customer.id
        }
      }
    }

    // Get shipments with pagination
    const shipments = await prisma.shipment.findMany({
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
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    })

    const totalShipments = await prisma.shipment.count({ where })

    return NextResponse.json({
      shipments,
      pagination: {
        page,
        limit,
        total: totalShipments,
        pages: Math.ceil(totalShipments / limit)
      }
    })

  } catch (error) {
    console.error('Get shipments error:', error)
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

    // Check if user can create shipments
    if (!['ADMIN', 'TEAM'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      orderId,
      containerNo,
      vesselName,
      portOfLoading,
      portOfDischarge,
      etd,
      eta,
      carrier,
      notes
    } = body

    // Validate input
    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    // Check if order exists
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Create shipment
    const shipment = await prisma.shipment.create({
      data: {
        orderId,
        containerNo,
        vesselName,
        portOfLoading,
        portOfDischarge,
        etd: etd ? new Date(etd) : null,
        eta: eta ? new Date(eta) : null,
        carrier,
        notes,
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
      shipment
    })

  } catch (error) {
    console.error('Create shipment error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
