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
    const search = searchParams.get('search')

    // Build where clause
    const where: any = {}
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Get customers with pagination
    const customers = await prisma.customer.findMany({
      where,
      include: {
        _count: {
          select: { orders: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    })

    const totalCustomers = await prisma.customer.count({ where })

    return NextResponse.json({
      customers,
      pagination: {
        page,
        limit,
        total: totalCustomers,
        pages: Math.ceil(totalCustomers / limit)
      }
    })

  } catch (error) {
    console.error('Get customers error:', error)
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

    // Check if user can create customers
    if (!['ADMIN', 'TEAM'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      name,
      email,
      phone,
      company,
      address,
      city,
      country,
      language = 'ru'
    } = body

    // Validate input
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      )
    }

    // Check if customer already exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { email }
    })

    if (existingCustomer) {
      return NextResponse.json(
        { error: 'Customer with this email already exists' },
        { status: 409 }
      )
    }

    // Create customer
    const customer = await prisma.customer.create({
      data: {
        name,
        email,
        phone,
        company,
        address,
        city,
        country: country || 'Russia',
        language
      }
    })

    return NextResponse.json({
      success: true,
      customer
    })

  } catch (error) {
    console.error('Create customer error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
