import { Navbar } from "@/components/Navbar"
import { Hero } from "@/components/Hero"
import { BackgroundSquares } from "@/components/BackgroundSquares"

export default function Home() {
  return (
    <main className="min-h-screen bg-background relative">
      <BackgroundSquares />
      <div className="relative z-10">
        <Navbar />
        <Hero />
      </div>
    </main>
  )
}
