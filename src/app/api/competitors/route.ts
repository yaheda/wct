import { NextRequest, NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { validateSaasDomain, extractDomainFromUrl } from "@/lib/saas-detection"

export async function GET() {
  try {
    const user = await currentUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const companies = await db.company.findMany({
      where: {
        userId: user.id,
      },
      include: {
        pages: {
          where: { isActive: true },
          orderBy: { createdAt: "asc" }
        },
        _count: {
          select: {
            changes: true
          }
        }
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(companies)
  } catch (error) {
    console.error("Error fetching competitors:", error)
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
    const { domain, name, selectedPages } = body

    if (!domain || !name) {
      return NextResponse.json(
        { error: "Domain and name are required" },
        { status: 400 }
      )
    }

    if (!selectedPages || !Array.isArray(selectedPages) || selectedPages.length === 0) {
      return NextResponse.json(
        { error: "At least one page must be selected for monitoring" },
        { status: 400 }
      )
    }

    // Validate domain format
    const validation = validateSaasDomain(domain)
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error || "Invalid domain format" },
        { status: 400 }
      )
    }

    const cleanDomain = extractDomainFromUrl(domain)

    // Check if user already monitors this competitor
    const existingCompany = await db.company.findFirst({
      where: {
        userId: user.id,
        domain: cleanDomain,
      },
    })

    if (existingCompany) {
      return NextResponse.json(
        { error: "You are already monitoring this competitor" },
        { status: 409 }
      )
    }

    // Create company record
    const company = await db.company.create({
      data: {
        name,
        domain: cleanDomain,
        userId: user.id,
      },
    })

    // Parse and create monitored pages
    const pagePromises = selectedPages.map(async (pageKey: string) => {
      const [pageType, pageUrl] = pageKey.split(':')

      return db.monitoredPage.create({
        data: {
          companyId: company.id,
          url: pageUrl,
          pageType,
          checkInterval: 1440, // Daily for all pages
        }
      })
    })

    await Promise.all(pagePromises)

    // Return the created company with its monitored pages
    const result = await db.company.findUnique({
      where: { id: company.id },
      include: {
        pages: {
          where: { isActive: true },
          orderBy: { createdAt: "asc" }
        },
        _count: {
          select: {
            changes: true
          }
        }
      }
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error("Error creating competitor:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}