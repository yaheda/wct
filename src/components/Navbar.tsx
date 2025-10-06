"use client"

import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs"
import { Logo } from "@/components/Logo"
import { WaitlistSignup } from "@/components/WaitlistSignup"

export function Navbar() {
  const { isSignedIn } = useUser()
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false)
  
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/">
              <Logo size="md" />
            </Link>
          </div>

          {/* Navigation Links */}
          {process.env.NODE_ENV === "development" && (<>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Features
              </Link>
              <Link href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Pricing
              </Link>
              <Button 
                variant="ghost" 
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors p-0 h-auto"
                onClick={() => setIsWaitlistOpen(true)}
              >
                Join Waitlist
              </Button>
            </div>

            <div className="flex items-center space-x-4">
              {!isSignedIn ? (
                <>
                  <SignInButton mode="modal">
                    <Button variant="outline" size="sm">
                      Login
                    </Button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <Button size="sm">
                      Join up
                    </Button> 
                  </SignUpButton>
                </>
              ) : (
                <>
                  <Link href="/dashboard">
                    <Button variant="outline" size="sm">
                      Dashboard
                    </Button>
                  </Link>
                  <UserButton 
                    appearance={{
                      elements: {
                        avatarBox: "w-8 h-8"
                      }
                    }}
                  />
                </>
              )}
            </div>
            </>)}
        </div>
      </div>

      {/* Waitlist Signup Modal */}
      <WaitlistSignup 
        isOpen={isWaitlistOpen}
        onClose={() => setIsWaitlistOpen(false)}
      />
    </nav>
  )
}
