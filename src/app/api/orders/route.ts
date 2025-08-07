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

    // For buyers, only show their orders
    if (user.role === 'BUYER') {
      const customer = await prisma.customer.findFirst({
        where: { email: user.email }
      })
      if (customer) {
        where.customerId = customer.id
      }
    }

    // Get orders with pagination
    const orders = await prisma.order.findMany({
      where,
      include: {
        customer: true,
        user: {
          select: { id: true, name: true, email: true }
        },
        orderItems: {
          include: {
            product: true
          }
        },
        _count: {
          select: { shipments: true, documents: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    })

    const totalOrders = await prisma.order.count({ where })

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total: totalOrders,
        pages: Math.ceil(totalOrders / limit)
      }
    })

  } catch (error) {
    console.error('Get orders error:', error)
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

    // Check if user can create orders
    if (!['ADMIN', 'TEAM'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { customerId, orderItems, notes, currency = 'USD' } = body

    // Validate input
    if (!customerId || !orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
      return NextResponse.json(
        { error: 'Customer ID and order items are required' },
        { status: 400 }
      )
    }

    // Generate order number
    const orderCount = await prisma.order.count()
    const orderNo = `ORD-${new Date().getFullYear()}-${String(orderCount + 1).padStart(4, '0')}`

    // Calculate totals
    let totalKg = 0
    let totalPrice = 0

    for (const item of orderItems) {
      totalKg += item.quantity
      totalPrice += item.quantity * item.pricePerKg
    }

    // Create order with items
    const order = await prisma.order.create({
      data: {
        orderNo,
        customerId,
        totalKg,
        totalPrice,
        currency,
        notes,
        createdBy: user.id,
        orderItems: {
          create: orderItems.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            pricePerKg: item.pricePerKg,
            totalPrice: item.quantity * item.pricePerKg
          }))
        }
      },
      include: {
        customer: true,
        orderItems: {
          include: {
            product: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      order
    })

  } catch (error) {
    console.error('Create order error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
