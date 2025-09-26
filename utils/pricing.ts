import { ContractType } from '@/types/contract'

export const contractPrices = {
  geen: 179,
  basis: 11,
  premium: 16
}

export const EXTRA_INDOOR_UNIT_PRICE = 7 // For display purposes (Basis package)
export const EXTRA_INDOOR_UNIT_PRICE_PREMIUM = 11
export const EXTRA_INDOOR_UNIT_ONETIME = 89.5 // Helft van €179

// Kwantumkorting: 10% vanaf 3 gewogen punten
export const QUANTITY_DISCOUNT_THRESHOLD = 3 // punten
export const QUANTITY_DISCOUNT_PERCENTAGE = 0.10 // 10%

// Bereken gewogen punten voor kwantumkorting
// Complete unit = 1 punt, extra binnendeel = 0.5 punt
export function calculateWeightedPoints(outdoorUnits: number, indoorUnits: number): number {
  const completeUnits = Math.min(outdoorUnits, indoorUnits)
  const extraIndoorUnits = Math.max(0, indoorUnits - outdoorUnits)
  return completeUnits + (extraIndoorUnits * 0.5)
}

// Check of klant in aanmerking komt voor kwantumkorting
export function qualifiesForQuantityDiscount(outdoorUnits: number, indoorUnits: number): boolean {
  return calculateWeightedPoints(outdoorUnits, indoorUnits) >= QUANTITY_DISCOUNT_THRESHOLD
}

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
  
  // Basisbedrag: (aantal volledige systemen × basis prijs) + (extra binnendelen × extra prijs)
  const baseAmount = (fullSystems * basePrice) + (extraIndoorUnits * extraUnitPrice)
  
  // Pas kwantumkorting toe als van toepassing
  if (qualifiesForQuantityDiscount(outdoorUnits, indoorUnits)) {
    return Math.round(baseAmount * (1 - QUANTITY_DISCOUNT_PERCENTAGE) * 100) / 100
  }
  
  return baseAmount
}

export function calculateYearlyPrice(monthlyPrice: number, withDiscount: boolean = false): number {
  // Vermenigvuldig eerst met 12, dan pas afronden om floating point errors te voorkomen
  const yearlyPrice = Math.round(monthlyPrice * 12)
  if (withDiscount) {
    const discount = Math.round(yearlyPrice * 0.05) // 5% korting
    return yearlyPrice - discount
  }
  return yearlyPrice
}

export function calculateDiscount(yearlyPrice: number): number {
  return Math.round(yearlyPrice * 0.05)
}

// Bereken de kwantumkorting in euro's
export function calculateQuantityDiscount(
  contractType: ContractType,
  outdoorUnits: number,
  indoorUnits: number
): number {
  if (!qualifiesForQuantityDiscount(outdoorUnits, indoorUnits)) {
    return 0
  }
  
  const basePrice = contractPrices[contractType]
  
  if (contractType === 'geen') {
    const completeUnits = Math.min(outdoorUnits, indoorUnits)
    const extraIndoorUnits = Math.max(0, indoorUnits - outdoorUnits)
    const baseAmount = (completeUnits * basePrice) + (extraIndoorUnits * EXTRA_INDOOR_UNIT_ONETIME)
    return Math.round(baseAmount * QUANTITY_DISCOUNT_PERCENTAGE)
  }
  
  const fullSystems = Math.min(outdoorUnits, indoorUnits)
  const extraIndoorUnits = Math.max(0, indoorUnits - outdoorUnits)
  const extraUnitPrice = contractType === 'premium' ? EXTRA_INDOOR_UNIT_PRICE_PREMIUM : EXTRA_INDOOR_UNIT_PRICE
  const baseAmount = (fullSystems * basePrice) + (extraIndoorUnits * extraUnitPrice)
  
  return Math.round(baseAmount * QUANTITY_DISCOUNT_PERCENTAGE * 100) / 100
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
  
  // Basisbedrag: (aantal complete units × €179) + (extra binnendelen × €89,50)
  const baseAmount = (completeUnits * basePrice) + (extraIndoorUnits * EXTRA_INDOOR_UNIT_ONETIME)
  
  // Pas kwantumkorting toe als van toepassing
  if (qualifiesForQuantityDiscount(outdoorUnits, indoorUnits)) {
    return Math.round(baseAmount * (1 - QUANTITY_DISCOUNT_PERCENTAGE))
  }
  
  return baseAmount
}