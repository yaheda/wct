import { NextRequest, NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import { db } from "@/lib/db"

interface Params {
  params: Promise<{ id: string }>
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const user = await currentUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Verify the website belongs to the user
    const website = await db.website.findFirst({
      where: {
        id,
        userId: user.id,
      },
    })

    if (!website) {
      return NextResponse.json(
        { error: "Website not found" },
        { status: 404 }
      )
    }

    await db.website.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Website deleted successfully" })
  } catch (error) {
    console.error("Error deleting website:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const user = await currentUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, checkInterval, isActive } = body

    // Verify the website belongs to the user
    const existingWebsite = await db.website.findFirst({
      where: {
        id,
        userId: user.id,
      },
    })

    if (!existingWebsite) {
      return NextResponse.json(
        { error: "Website not found" },
        { status: 404 }
      )
    }

    const website = await db.website.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(checkInterval !== undefined && { checkInterval }),
        ...(isActive !== undefined && { isActive }),
      },
    })

    return NextResponse.json(website)
  } catch (error) {
    console.error("Error updating website:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}