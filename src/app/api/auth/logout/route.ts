import { NextResponse } from 'next/server'

export async function POST() {
  try {
    // In a more complex setup, you might invalidate the token on the server
    // For now, we'll just return a success response
    // The client will handle removing the token from localStorage
    
    return NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    })

  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
