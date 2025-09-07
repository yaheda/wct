import { NextResponse } from 'next/server'
import { seedEmailTemplates } from '@/lib/email-templates'

export async function POST() {
  try {
    await seedEmailTemplates()
    return NextResponse.json({ success: true, message: 'Email templates seeded successfully' })
  } catch (error) {
    console.error('Error seeding email templates:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}