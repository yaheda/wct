import { NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import { syncUser } from "@/lib/sync-user"

export async function POST() {
  try {
    const clerkUser = await currentUser()
    
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await syncUser(clerkUser)
    
    return NextResponse.json({ success: true, user })
  } catch (error) {
    console.error("Error syncing user:", error)
    return NextResponse.json(
      { error: "Failed to sync user" },
      { status: 500 }
    )
  }
}