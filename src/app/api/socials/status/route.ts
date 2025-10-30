import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { socialsDetectionService } from '@/lib/socials-service'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const systemHealth = await socialsDetectionService.getSystemHealth()

    return NextResponse.json(systemHealth)

  } catch (error) {
    console.error('Socials system health API error:', error)
    return NextResponse.json(
      { error: 'Failed to get system health' },
      { status: 500 }
    )
  }
}
