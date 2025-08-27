import { Button } from "@/components/ui/button"
import { Logo } from "@/components/Logo"

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-start justify-center pt-32 pb-16 px-4 sm:px-6 lg:px-8">
      {/* Interactive Background Element - Placeholder for future implementation */}
      <div 
        className="absolute inset-0 -z-20"
        aria-label="Interactive background element for future implementation"
      >
        {/* This div will contain the interactive background element */}
        <div className="w-full h-full bg-gradient-to-br from-primary/5 via-background to-secondary/5" />
      </div>

      {/* Hero Content */}
      <div className="text-center max-w-4xl mx-auto">
        
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight tracking-tight mb-8">
          SaaS Competitor Tracking Made Simple,{" "}
          <span className="text-primary">Finally</span>
        </h1>
        
        <p className="text-xl sm:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
        Add your competitors. Get alerts when they change prices, launch features, or update their message. That's it
        </p>

        <Button size="lg" className="text-lg px-8 py-6 h-auto">
          Join waiting list
        </Button>
      </div>
    </section>
  )
}
