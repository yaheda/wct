import { NextRequest, NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import { detectSaasPages, validateSaasDomain, extractDomainFromUrl } from "@/lib/saas-detection"

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { domain } = body

    if (!domain) {
      return NextResponse.json(
        { error: "Domain is required" },
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

    try {
      // Detect SaaS pages for this domain
      const detectionResult = await detectSaasPages(cleanDomain)
      
      return NextResponse.json({
        domain: cleanDomain,
        pages: detectionResult.pages,
        confidence: detectionResult.confidence,
        success: true
      })
    } catch (error) {
      console.error(`Error detecting pages for ${cleanDomain}:`, error)
      return NextResponse.json(
        { error: "Failed to detect pages. Please check the domain and try again." },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error("Error in page detection API:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}