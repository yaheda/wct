'use client'

import { useEffect, useState, useRef } from 'react'

interface Square {
  id: number
  x: number
  y: number
  size: number
  rotation: number
  opacity: number
  speed: number
  vx: number
  vy: number
  rotationSpeed: number
}

export function BackgroundSquares() {
  const [squares, setSquares] = useState<Square[]>([])
  const animationRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    const generateSquares = () => {
      const newSquares: Square[] = []
      const numSquares = 180

      for (let i = 0; i < numSquares; i++) {
        newSquares.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 100 + 50,
          rotation: Math.random() * 360,
          opacity: Math.random() * 0.4 + 0.4,
          speed: Math.random() * 0.5 + 0.2,
          vx: (Math.random() - 0.5) * 0.02,
          vy: (Math.random() - 0.5) * 0.02,
          rotationSpeed: (Math.random() - 0.5) * 5.5,
        })
      }
      setSquares(newSquares)
    }

    const animate = () => {
      setSquares(prevSquares => 
        prevSquares.map(square => {
          let newX = square.x + square.vx
          let newY = square.y + square.vy
          let newVx = square.vx
          let newVy = square.vy

          // Bounce off edges
          if (newX <= -5 || newX >= 105) {
            newVx = -newVx
            newX = Math.max(-5, Math.min(105, newX))
          }
          if (newY <= -5 || newY >= 105) {
            newVy = -newVy
            newY = Math.max(-5, Math.min(105, newY))
          }

          return {
            ...square,
            x: newX,
            y: newY,
            vx: newVx,
            vy: newVy,
            rotation: square.rotation + square.rotationSpeed,
          }
        })
      )
      
      animationRef.current = requestAnimationFrame(animate)
    }

    generateSquares()
    animate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {squares.map((square) => (
        <div
          key={square.id}
          className="absolute transition-all duration-75 ease-out"
          style={{
            left: `${square.x}%`,
            top: `${square.y}%`,
            width: `${square.size}px`,
            height: `${square.size}px`,
            transform: `rotate(${square.rotation}deg)`,
            opacity: square.opacity,
          }}
        >
          <div 
            className="w-full h-full bg-primary/30 border border-primary/40 rounded-lg"
          />
        </div>
      ))}
    </div>
  )
}