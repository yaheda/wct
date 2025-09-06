import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    // Validate email
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      )
    }

    // Try to create the waitlist entry
    const waitlistEntry = await prisma.waitlistEntry.create({
      data: {
        email: email.toLowerCase().trim(),
      },
    })

    return NextResponse.json(
      { 
        success: true, 
        message: 'Successfully added to waitlist',
        id: waitlistEntry.id 
      },
      { status: 201 }
    )

  } catch (error: any) {
    // Handle unique constraint violation (duplicate email)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'This email is already on the waitlist' },
        { status: 409 }
      )
    }

    console.error('Waitlist signup error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}