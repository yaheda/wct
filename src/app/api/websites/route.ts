import { NextRequest, NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const user = await currentUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const websites = await db.website.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(websites)
  } catch (error) {
    console.error("Error fetching websites:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { url, name, checkInterval } = body

    if (!url || !name) {
      return NextResponse.json(
        { error: "URL and name are required" },
        { status: 400 }
      )
    }

    // Validate URL format
    try {
      new URL(url)
    } catch {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      )
    }

    // Check if user already monitors this URL
    const existingWebsite = await db.website.findFirst({
      where: {
        userId: user.id,
        url: url,
      },
    })

    if (existingWebsite) {
      return NextResponse.json(
        { error: "You are already monitoring this website" },
        { status: 409 }
      )
    }

    const website = await db.website.create({
      data: {
        url,
        name,
        checkInterval: checkInterval || 1440, // Default to daily
        userId: user.id,
      },
    })

    return NextResponse.json(website, { status: 201 })
  } catch (error) {
    console.error("Error creating website:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}