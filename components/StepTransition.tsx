'use client'

import { useEffect, useState } from 'react'

interface Props {
  children: React.ReactNode
  stepKey: string
}

export default function StepTransition({ children, stepKey }: Props) {
  const [isVisible, setIsVisible] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted) return
    
    // Reset animation when step changes
    setIsVisible(false)
    
    // Trigger animation after a short delay
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 50)

    return () => clearTimeout(timer)
  }, [stepKey, isMounted])

  // Show content immediately on first render to prevent loading hang
  if (!isMounted) {
    return <div>{children}</div>
  }

  return (
    <div
      className={`transition-all duration-500 transform ${
        isVisible 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 translate-y-4'
      }`}
    >
      {children}
    </div>
  )
}