export type ContractType = 'geen' | 'basis' | 'premium'
export type PaymentFrequency = 'maandelijks' | 'jaarlijks'

export interface ContractOption {
  id: ContractType
  name: string
  price: number
  description: string
  features: string[]
}

export interface CustomerData {
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  postalCode: string
  city: string
  numberOfAircos: number
  numberOfOutdoorUnits: number
  numberOfIndoorUnits: number
  contractType: ContractType
  paymentFrequency: PaymentFrequency
  customerNumber?: string
  lastQuoteNumber?: string
  lastInvoiceNumber?: string
}

export interface SepaData {
  iban: string
  accountHolder: string
  mandateDate: Date
  signature?: string
}