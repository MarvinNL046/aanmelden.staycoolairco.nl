'use client'

import { ContractType } from '@/types/contract'
import { calculateMonthlyPrice, calculateYearlyPrice, calculateOneTimePrice, contractPrices, EXTRA_INDOOR_UNIT_PRICE, EXTRA_INDOOR_UNIT_ONETIME } from '@/utils/pricing'

interface Props {
  contractType: ContractType
  outdoorUnits: number
  indoorUnits: number
  paymentFrequency: 'maandelijks' | 'jaarlijks'
}

export default function PricePreview({ contractType, outdoorUnits, indoorUnits, paymentFrequency }: Props) {
  if (!outdoorUnits || !indoorUnits) return null

  const monthlyPrice = calculateMonthlyPrice(contractType, outdoorUnits, indoorUnits)
  const yearlyPrice = calculateYearlyPrice(monthlyPrice, false)
  const yearlyDiscounted = calculateYearlyPrice(monthlyPrice, true)
  const oneTimePrice = calculateOneTimePrice(outdoorUnits, indoorUnits)
  
  const extraIndoorUnits = Math.max(0, indoorUnits - outdoorUnits)
  const completeUnits = Math.min(outdoorUnits, indoorUnits)
  
  if (contractType === 'geen') {
    return (
      <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-blue-900">Totaalprijs:</span>
          <span className="text-lg font-bold text-blue-600">€{oneTimePrice},-</span>
        </div>
        <div className="space-y-1 mt-2">
          {completeUnits > 1 && (
            <p className="text-xs text-blue-700">
              {completeUnits} complete units à €{contractPrices.geen},- = €{completeUnits * contractPrices.geen},-
            </p>
          )}
          {extraIndoorUnits > 0 && (
            <p className="text-xs text-blue-700">
              {extraIndoorUnits} extra {extraIndoorUnits === 1 ? 'binnendeel' : 'binnendelen'} à €{EXTRA_INDOOR_UNIT_ONETIME},- = €{extraIndoorUnits * EXTRA_INDOOR_UNIT_ONETIME},-
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-blue-900">Prijs:</span>
        <div className="text-right">
          {paymentFrequency === 'maandelijks' ? (
            <span className="text-lg font-bold text-blue-600">€{monthlyPrice},-/mnd</span>
          ) : (
            <>
              <span className="text-lg font-bold text-blue-600">€{yearlyDiscounted},-/jaar</span>
              <p className="text-xs text-green-600">Bespaar €{yearlyPrice - yearlyDiscounted},-</p>
            </>
          )}
        </div>
      </div>
      {extraIndoorUnits > 0 && (
        <p className="text-xs text-blue-700 mt-1">
          Inclusief {extraIndoorUnits} extra {extraIndoorUnits === 1 ? 'binnendeel' : 'binnendelen'} à €{EXTRA_INDOOR_UNIT_PRICE},-/mnd
        </p>
      )}
    </div>
  )
}