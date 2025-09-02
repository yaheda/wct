import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')
    const changeType = searchParams.get('changeType')
    const impactLevel = searchParams.get('impactLevel')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const sortBy = searchParams.get('sortBy') || 'detectedAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Build where clause
    const whereClause: Record<string, unknown> = {
      company: {
        userId
      }
    }

    if (companyId) {
      whereClause.companyId = companyId
    }

    if (changeType) {
      whereClause.changeType = changeType
    }

    if (impactLevel) {
      whereClause.impactLevel = impactLevel
    }

    // Get total count for pagination
    const totalCount = await db.saasChange.count({
      where: whereClause
    })

    // Get changes with pagination
    const changes = await db.saasChange.findMany({
      where: whereClause,
      include: {
        company: {
          select: {
            id: true,
            name: true,
            domain: true
          }
        },
        page: {
          select: {
            id: true,
            url: true,
            pageType: true
          }
        }
      },
      orderBy: {
        [sortBy]: sortOrder as 'asc' | 'desc'
      },
      skip: (page - 1) * limit,
      take: limit
    })

    // Get summary stats
    const stats = await db.saasChange.groupBy({
      by: ['changeType'],
      where: whereClause,
      _count: {
        id: true
      }
    })

    const impactStats = await db.saasChange.groupBy({
      by: ['impactLevel'],
      where: whereClause,
      _count: {
        id: true
      }
    })

    const response = {
      changes,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1
      },
      stats: {
        byType: stats.map(stat => ({
          type: stat.changeType,
          count: stat._count.id
        })),
        byImpact: impactStats.map(stat => ({
          level: stat.impactLevel,
          count: stat._count.id
        })),
        total: totalCount
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Changes API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch changes' },
      { status: 500 }
    )
  }
}