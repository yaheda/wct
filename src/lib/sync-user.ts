import { User as ClerkUser } from "@clerk/nextjs/server"
import { db } from "@/lib/db"

export async function syncUser(clerkUser: ClerkUser) {
  try {
    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { id: clerkUser.id }
    })

    if (existingUser) {
      // Update existing user with latest Clerk data
      const updatedUser = await db.user.update({
        where: { id: clerkUser.id },
        data: {
          email: clerkUser.emailAddresses[0]?.emailAddress || existingUser.email,
          name: clerkUser.fullName || existingUser.name,
          updatedAt: new Date()
        }
      })
      return updatedUser
    }

    // Create new user if doesn't exist
    const newUser = await db.user.create({
      data: {
        id: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
        name: clerkUser.fullName || null,
      }
    })

    return newUser
  } catch (error) {
    console.error('Error syncing user:', error)
    throw new Error('Failed to sync user data')
  }
}