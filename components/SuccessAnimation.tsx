'use client'

import { useEffect, useState } from 'react'

export default function SuccessAnimation() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <div 
      className={`w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 transition-all duration-500 ${
        isVisible ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
      }`}
    >
      <svg 
        className={`w-8 h-8 text-green-600 transition-all duration-700 delay-300 ${
          isVisible ? 'scale-100' : 'scale-0'
        }`} 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M5 13l4 4L19 7" 
          className={`transition-all duration-500 delay-500 ${
            isVisible ? 'stroke-dashoffset-0' : 'stroke-dashoffset-100'
          }`}
          style={{
            strokeDasharray: 100,
            strokeDashoffset: isVisible ? 0 : 100
          }}
        />
      </svg>
    </div>
  )
}