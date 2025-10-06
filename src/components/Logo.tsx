interface LogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
}

export function Logo({ className = "", size = 'md', showText = true }: LogoProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8', 
    lg: 'w-12 h-12'
  }

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`${sizeClasses[size]} text-primary`}>
        <svg width="100%" height="100%" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Monitor Base */}
          <rect x="5" y="12" width="24" height="16" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
          {/* Monitor Screen */}
          <rect x="7" y="14" width="20" height="10" rx="1" fill="currentColor" opacity="0.1"/>
          {/* Monitor Stand */}
          <rect x="17" y="28" width="6" height="3" rx="1" fill="currentColor"/>
          <rect x="12" y="30" width="16" height="2" rx="1" fill="currentColor"/>
          
          {/* Change Indicator Pulse */}
          <circle cx="32" cy="8" r="6" fill="currentColor" opacity="0.2"/>
          <circle cx="32" cy="8" r="4" fill="currentColor" opacity="0.4"/>
          <circle cx="32" cy="8" r="2" fill="currentColor"/>
          
          {/* Alert Lines */}
          <path d="M26 18L30 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
          <path d="M26 20L28 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
          <path d="M26 22L30 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
        </svg>
      </div>
      {showText && (
        <span className={`font-bold text-primary ${textSizeClasses[size]}`}>
          Simple Competitor Analysis
        </span>
      )}
    </div>
  )
}