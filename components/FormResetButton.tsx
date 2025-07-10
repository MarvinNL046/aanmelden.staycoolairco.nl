'use client'

import { useState } from 'react'

interface Props {
  onReset: () => void
  className?: string
}

export default function FormResetButton({ onReset, className = '' }: Props) {
  const [showConfirm, setShowConfirm] = useState(false)

  const handleReset = () => {
    if (showConfirm) {
      onReset()
      setShowConfirm(false)
    } else {
      setShowConfirm(true)
      // Auto-hide confirmation after 3 seconds
      setTimeout(() => setShowConfirm(false), 3000)
    }
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={handleReset}
        className={`${className} ${showConfirm ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-500 hover:bg-gray-600'} transition-colors`}
      >
        {showConfirm ? 'Klik nogmaals om te bevestigen' : 'Formulier wissen'}
      </button>
      
      {showConfirm && (
        <div className="absolute bottom-full left-0 mb-2 p-2 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap">
          Alle gegevens worden gewist
          <div className="absolute bottom-0 left-4 transform translate-y-full">
            <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      )}
    </div>
  )
}