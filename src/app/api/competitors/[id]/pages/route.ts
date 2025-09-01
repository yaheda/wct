import { NextRequest, NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import { db } from "@/lib/db"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await currentUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { url, pageType } = body

    if (!url || !pageType) {
      return NextResponse.json(
        { error: "URL and pageType are required" },
        { status: 400 }
      )
    }

    // Check if the company exists and belongs to the user
    const company = await db.company.findFirst({
      where: {
        id,
        userId: user.id,
      },
    })

    if (!company) {
      return NextResponse.json(
        { error: "Competitor not found" },
        { status: 404 }
      )
    }

    // Basic URL validation
    try {
      new URL(url)
    } catch {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      )
    }

    // Check if page already exists for this company
    const existingPage = await db.monitoredPage.findFirst({
      where: {
        companyId: id,
        url: url,
      },
    })

    if (existingPage) {
      return NextResponse.json(
        { error: "This page is already being monitored for this competitor" },
        { status: 409 }
      )
    }

    // Create the monitored page
    const newPage = await db.monitoredPage.create({
      data: {
        companyId: id,
        url,
        pageType,
        checkInterval: 1440, // Daily for all pages
      },
    })

    return NextResponse.json(newPage, { status: 201 })
  } catch (error) {
    console.error("Error creating monitored page:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}