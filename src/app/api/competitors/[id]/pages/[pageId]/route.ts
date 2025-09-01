import { NextRequest, NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import { db } from "@/lib/db"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; pageId: string }> }
) {
  try {
    const user = await currentUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id, pageId } = await params

    // Check if the page exists and belongs to a company owned by the user
    const page = await db.monitoredPage.findFirst({
      where: {
        id: pageId,
        companyId: id,
        company: {
          userId: user.id,
        },
      },
    })

    if (!page) {
      return NextResponse.json(
        { error: "Monitored page not found" },
        { status: 404 }
      )
    }

    // Delete the page
    await db.monitoredPage.delete({
      where: { id: pageId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting monitored page:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; pageId: string }> }
) {
  try {
    const user = await currentUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id, pageId } = await params
    const body = await request.json()
    const { pageType } = body

    // Check if the page exists and belongs to a company owned by the user
    const existingPage = await db.monitoredPage.findFirst({
      where: {
        id: pageId,
        companyId: id,
        company: {
          userId: user.id,
        },
      },
    })

    if (!existingPage) {
      return NextResponse.json(
        { error: "Monitored page not found" },
        { status: 404 }
      )
    }

    // Prepare update data
    const updateData: { pageType?: string } = {}
    if (pageType !== undefined) {
      updateData.pageType = pageType
    }

    // Update the page
    const updatedPage = await db.monitoredPage.update({
      where: { id: pageId },
      data: updateData,
    })

    return NextResponse.json(updatedPage)
  } catch (error) {
    console.error("Error updating monitored page:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}