'use client'

import { useEffect, useState } from 'react'

interface Square {
  id: number
  x: number
  y: number
  size: number
  rotation: number
  opacity: number
  speed: number
}

export function BackgroundSquares() {
  const [squares, setSquares] = useState<Square[]>([])

  useEffect(() => {
    const generateSquares = () => {
      const newSquares: Square[] = []
      const numSquares = 8

      for (let i = 0; i < numSquares; i++) {
        newSquares.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 100 + 50,
          rotation: Math.random() * 360,
          opacity: Math.random() * 0.4 + 0.4,
          speed: Math.random() * 0.5 + 0.2,
        })
      }
      setSquares(newSquares)
    }

    generateSquares()
  }, [])

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {squares.map((square) => (
        <div
          key={square.id}
          className="absolute animate-pulse"
          style={{
            left: `${square.x}%`,
            top: `${square.y}%`,
            width: `${square.size}px`,
            height: `${square.size}px`,
            transform: `rotate(${square.rotation}deg)`,
            opacity: square.opacity,
            animationDelay: `${square.id * 0.5}s`,
            animationDuration: `${4 + square.speed}s`,
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