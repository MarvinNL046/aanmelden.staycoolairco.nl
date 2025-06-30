import { CustomerData, SepaData } from '@/types/contract'
import { calculateMonthlyPrice, contractPrices } from '@/utils/pricing'

// GoHighLevel webhook configuratie
const WEBHOOK_URL = process.env.NEXT_PUBLIC_GHL_WEBHOOK_URL || ''

interface GHLContact {
  firstName: string
  lastName: string
  email: string
  phone: string
  address1: string
  city: string
  postalCode: string
  tags: string[]
  customFields: {
    contract_type: string
    monthly_amount: number
    outdoor_units: number
    indoor_units: number
    payment_frequency: string
    iban_last4?: string
    has_signature: boolean
    contract_id: string
  }
}

export async function sendToGoHighLevel(
  customer: CustomerData,
  sepa: SepaData | null,
  contractId: string
) {
  if (!WEBHOOK_URL) {
    console.warn('GoHighLevel webhook URL not configured')
    return { success: false, error: 'Webhook URL not configured' }
  }

  const monthlyPrice = calculateMonthlyPrice(
    customer.contractType,
    customer.numberOfOutdoorUnits,
    customer.numberOfIndoorUnits
  )

  // Bepaal tags op basis van contract type
  const tags = [
    'onderhoudscontract',
    `contract_${customer.contractType}`,
    customer.paymentFrequency
  ]

  if (customer.contractType === 'premium') {
    tags.push('premium_klant')
  }

  const ghlData: GHLContact = {
    firstName: customer.firstName,
    lastName: customer.lastName,
    email: customer.email,
    phone: customer.phone.replace(/\s/g, ''), // Verwijder spaties
    address1: customer.address,
    city: customer.city,
    postalCode: customer.postalCode,
    tags,
    customFields: {
      contract_type: customer.contractType,
      monthly_amount: monthlyPrice,
      outdoor_units: customer.numberOfOutdoorUnits,
      indoor_units: customer.numberOfIndoorUnits,
      payment_frequency: customer.paymentFrequency,
      iban_last4: sepa?.iban?.slice(-4),
      has_signature: !!sepa?.signature,
      contract_id: contractId
    }
  }

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...ghlData,
        source: 'onderhoudscontract_app',
        timestamp: new Date().toISOString()
      })
    })

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.status}`)
    }

    const result = await response.json()
    console.log('GoHighLevel webhook success:', result)
    
    return { success: true, result }
  } catch (error) {
    console.error('GoHighLevel webhook error:', error)
    return { success: false, error }
  }
}