'use client'

import { PaymentFrequency } from '@/types/contract'

interface Props {
  selected: PaymentFrequency
  onChange: (frequency: PaymentFrequency) => void
  monthlyPrice: number
  numberOfUnits: number
  disabled?: boolean
}

export default function PaymentFrequencySelector({ 
  selected, 
  onChange, 
  monthlyPrice, 
  numberOfUnits,
  disabled = false 
}: Props) {
  const monthlyTotal = monthlyPrice // Already calculated total
  const yearlyTotal = Math.round(monthlyTotal * 12)
  const yearlyDiscount = Math.round(yearlyTotal * 0.05) // 5% korting bij jaarlijkse betaling
  const yearlyDiscountedPrice = yearlyTotal - yearlyDiscount

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Betalingsfrequentie</h3>
      
      <div className="grid md:grid-cols-2 gap-4">
        <div
          onClick={() => !disabled && onChange('maandelijks')}
          className={`relative rounded-xl p-6 cursor-pointer transition-all ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          } ${
            selected === 'maandelijks'
              ? 'bg-blue-50 border-2 border-blue-500'
              : 'bg-white border-2 border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center mb-3">
            <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
              selected === 'maandelijks' ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
            }`}>
              {selected === 'maandelijks' && (
                <div className="w-2 h-2 bg-white rounded-full" />
              )}
            </div>
            <h4 className="font-semibold text-gray-900">Maandelijks</h4>
          </div>
          
          <div className="text-2xl font-bold text-blue-600 mb-1">
            €{monthlyTotal.toFixed(2).replace(/\.00$/, '')},-/mnd
          </div>
          <p className="text-sm text-gray-600">
            Totaal per jaar: €{yearlyTotal},-
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Flexibel opzegbaar per maand
          </p>
        </div>

        <div
          onClick={() => !disabled && onChange('jaarlijks')}
          className={`relative rounded-xl p-6 cursor-pointer transition-all ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          } ${
            selected === 'jaarlijks'
              ? 'bg-blue-50 border-2 border-blue-500'
              : 'bg-white border-2 border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="absolute -top-3 -right-3 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
            5% korting
          </div>
          
          <div className="flex items-center mb-3">
            <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
              selected === 'jaarlijks' ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
            }`}>
              {selected === 'jaarlijks' && (
                <div className="w-2 h-2 bg-white rounded-full" />
              )}
            </div>
            <h4 className="font-semibold text-gray-900">Jaarlijks</h4>
          </div>
          
          <div className="text-2xl font-bold text-blue-600 mb-1">
            €{yearlyDiscountedPrice},-/jaar
          </div>
          <p className="text-sm text-gray-600">
            <span className="line-through text-gray-400">€{yearlyTotal},-</span>
            <span className="ml-2 text-green-600 font-medium">Bespaar €{yearlyDiscount},-</span>
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Betaal het hele jaar vooruit
          </p>
        </div>
      </div>
    </div>
  )
}