'use client'

import { ContractType } from '@/types/contract'
import { 
  calculateMonthlyPrice, 
  calculateYearlyPrice, 
  calculateOneTimePrice, 
  calculateQuantityDiscount,
  calculateWeightedPoints,
  qualifiesForQuantityDiscount,
  contractPrices, 
  EXTRA_INDOOR_UNIT_PRICE, 
  EXTRA_INDOOR_UNIT_ONETIME,
  EXTRA_INDOOR_UNIT_PRICE_PREMIUM 
} from '@/utils/pricing'

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
  
  const hasQuantityDiscount = qualifiesForQuantityDiscount(outdoorUnits, indoorUnits)
  const quantityDiscount = calculateQuantityDiscount(contractType, outdoorUnits, indoorUnits)
  const weightedPoints = calculateWeightedPoints(outdoorUnits, indoorUnits)
  
  if (contractType === 'geen') {
    const baseAmount = completeUnits * contractPrices.geen + extraIndoorUnits * EXTRA_INDOOR_UNIT_ONETIME
    
    return (
      <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-blue-900">Totaalprijs:</span>
          <div className="text-right">
            <span className="text-lg font-bold text-blue-600">€{oneTimePrice},-</span>
            {hasQuantityDiscount && (
              <p className="text-xs text-green-600">10% kwantumkorting toegepast!</p>
            )}
          </div>
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
          {hasQuantityDiscount && (
            <>
              <p className="text-xs text-blue-700">
                Subtotaal: €{baseAmount},-
              </p>
              <p className="text-xs text-green-700">
                Kwantumkorting (10%): -€{quantityDiscount},-
              </p>
            </>
          )}
        </div>
      </div>
    )
  }

  const baseMonthlyPrice = completeUnits * contractPrices[contractType] + extraIndoorUnits * (contractType === 'premium' ? EXTRA_INDOOR_UNIT_PRICE_PREMIUM : EXTRA_INDOOR_UNIT_PRICE)
  
  return (
    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-blue-900">Prijs:</span>
        <div className="text-right">
          {paymentFrequency === 'maandelijks' ? (
            <>
              <span className="text-lg font-bold text-blue-600">€{monthlyPrice.toFixed(2).replace(/\.00$/, '')},-/mnd</span>
              {hasQuantityDiscount && (
                <p className="text-xs text-green-600">10% kwantumkorting toegepast!</p>
              )}
            </>
          ) : (
            <>
              <span className="text-lg font-bold text-blue-600">€{yearlyDiscounted},-/jaar</span>
              <p className="text-xs text-green-600">
                Bespaar €{yearlyPrice - yearlyDiscounted},-
                {hasQuantityDiscount && ' (10% kwantum + 5% jaarkorting)'}
              </p>
            </>
          )}
        </div>
      </div>
      <div className="space-y-1 mt-2">
        {completeUnits > 1 && (
          <p className="text-xs text-blue-700">
            {completeUnits} complete units à €{contractPrices[contractType]},-/mnd
          </p>
        )}
        {extraIndoorUnits > 0 && (
          <p className="text-xs text-blue-700">
            {extraIndoorUnits} extra {extraIndoorUnits === 1 ? 'binnendeel' : 'binnendelen'} à €{contractType === 'premium' ? EXTRA_INDOOR_UNIT_PRICE_PREMIUM : EXTRA_INDOOR_UNIT_PRICE},-/mnd
          </p>
        )}
        {hasQuantityDiscount && (
          <>
            <p className="text-xs text-blue-700">
              Basis maandprijs: €{baseMonthlyPrice},-
            </p>
            <p className="text-xs text-green-700">
              Kwantumkorting (10%): -€{(baseMonthlyPrice * 0.1).toFixed(2).replace(/\.00$/, '')}
            </p>
          </>
        )}
      </div>
    </div>
  )
}