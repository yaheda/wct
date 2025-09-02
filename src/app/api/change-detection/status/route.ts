import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { changeDetectionService } from '@/lib/change-detection-service'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const systemHealth = await changeDetectionService.getSystemHealth()
    
    return NextResponse.json(systemHealth)

  } catch (error) {
    console.error('System health API error:', error)
    return NextResponse.json(
      { error: 'Failed to get system health' },
      { status: 500 }
    )
  }
}