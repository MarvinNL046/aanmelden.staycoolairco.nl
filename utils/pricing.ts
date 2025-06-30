import { ContractType } from '@/types/contract'

export const contractPrices = {
  geen: 179,
  basis: 11,
  premium: 16
}

export const EXTRA_INDOOR_UNIT_PRICE = 7

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
  
  // Totaal: (aantal volledige systemen × basis prijs) + (extra binnendelen × €7)
  return (fullSystems * basePrice) + (extraIndoorUnits * EXTRA_INDOOR_UNIT_PRICE)
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