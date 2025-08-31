import { NextRequest, NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import { db } from "@/lib/db"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await currentUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

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

    // Delete the company (cascade will handle related records)
    await db.company.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting competitor:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(
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
    const { name, isActive } = body

    // Check if the company exists and belongs to the user
    const existingCompany = await db.company.findFirst({
      where: {
        id,
        userId: user.id,
      },
    })

    if (!existingCompany) {
      return NextResponse.json(
        { error: "Competitor not found" },
        { status: 404 }
      )
    }

    // Update the company
    const updatedCompany = await db.company.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(isActive !== undefined && { 
          pages: {
            updateMany: {
              where: { companyId: id },
              data: { isActive }
            }
          }
        }),
      },
      include: {
        pages: {
          where: { isActive: true },
          orderBy: { priority: "asc" }
        },
        _count: {
          select: {
            changes: true
          }
        }
      }
    })

    return NextResponse.json(updatedCompany)
  } catch (error) {
    console.error("Error updating competitor:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}