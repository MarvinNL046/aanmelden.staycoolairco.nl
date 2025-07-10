import { ContractType } from '@/types/contract'

export const contractPrices = {
  geen: 179,
  basis: 11,
  premium: 16
}

export const EXTRA_INDOOR_UNIT_PRICE = 7 // For display purposes (Basis package)
export const EXTRA_INDOOR_UNIT_PRICE_PREMIUM = 11
export const EXTRA_INDOOR_UNIT_ONETIME = 89.5 // Helft van €179

export function calculateMonthlyPrice(
  contractType: ContractType,
  outdoorUnits: number,
  indoorUnits: number
): number {
  if (contractType === 'geen') return 0
  
  const basePrice = contractPrices[contractType]
  
  // Bereken hoeveel "volledige" airco's er zijn (1 buiten + 1 binnen)
  const fullSystems = Math.min(outdoorUnits, indoorUnits)
  
  // Bereken extra binnendelen (meer binnen dan buiten)
  const extraIndoorUnits = Math.max(0, indoorUnits - outdoorUnits)
  
  // Bepaal de prijs per extra binnendeel op basis van contract type
  const extraUnitPrice = contractType === 'premium' ? EXTRA_INDOOR_UNIT_PRICE_PREMIUM : EXTRA_INDOOR_UNIT_PRICE
  
  // Totaal: (aantal volledige systemen × basis prijs) + (extra binnendelen × extra prijs)
  return (fullSystems * basePrice) + (extraIndoorUnits * extraUnitPrice)
}

export function calculateYearlyPrice(monthlyPrice: number, withDiscount: boolean = false): number {
  const yearlyPrice = monthlyPrice * 12
  if (withDiscount) {
    const discount = Math.round(yearlyPrice * 0.05) // 5% korting
    return yearlyPrice - discount
  }
  return yearlyPrice
}

export function calculateDiscount(yearlyPrice: number): number {
  return Math.round(yearlyPrice * 0.05)
}

export function calculateOneTimePrice(
  outdoorUnits: number,
  indoorUnits: number
): number {
  const basePrice = contractPrices.geen
  
  // Bereken aantal complete units (1 buiten + 1 binnen = 1 complete unit)
  const completeUnits = Math.min(outdoorUnits, indoorUnits)
  
  // Bij multi-split: extra €89,50 per extra binnendeel
  const extraIndoorUnits = Math.max(0, indoorUnits - outdoorUnits)
  
  // Totaal: (aantal complete units × €179) + (extra binnendelen × €89,50)
  return (completeUnits * basePrice) + (extraIndoorUnits * EXTRA_INDOOR_UNIT_ONETIME)
}