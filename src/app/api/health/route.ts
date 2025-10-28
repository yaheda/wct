import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const startTime = Date.now()

export async function GET() {
  try {
    // Check database connectivity
    await prisma.$queryRaw`SELECT 1`

    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '0.1.0',
      environment: process.env.NODE_ENV || 'development',
      database: 'connected',
      uptime: Date.now() - startTime,
    }

    return NextResponse.json(healthData, { status: 200 })

  } catch (error) {
    console.error('Health check failed:', error)

    const errorData = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '0.1.0',
      environment: process.env.NODE_ENV || 'development',
      database: 'disconnected',
      uptime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    }

    return NextResponse.json(errorData, { status: 503 })

  } finally {
    await prisma.$disconnect()
  }
}
