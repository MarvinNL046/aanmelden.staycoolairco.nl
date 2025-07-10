import emailjs from '@emailjs/browser'
import { CustomerData, SepaData } from '@/types/contract'
import { calculateMonthlyPrice, calculateOneTimePrice, contractPrices } from '@/utils/pricing'

// EmailJS configuration
const SERVICE_ID = 'service_23v69t7'
const TEMPLATE_ID = 'template_lo61bri'
const PUBLIC_KEY = 'sjJ8kK6U9wFjY0zX9'

// Initialize EmailJS
emailjs.init(PUBLIC_KEY)

interface EmailData {
  customer: CustomerData
  sepa: SepaData | null
}

export async function sendConfirmationEmail(data: EmailData) {
  const { customer, sepa } = data
  
  const contractTypeNames = {
    geen: 'Geen contract (eenmalig)',
    basis: 'Basis pakket',
    premium: 'Premium pakket'
  }
  
  const monthlyPrice = calculateMonthlyPrice(
    customer.contractType,
    customer.numberOfOutdoorUnits,
    customer.numberOfIndoorUnits
  )
  
  const totalPrice = customer.contractType === 'geen'
    ? calculateOneTimePrice(customer.numberOfOutdoorUnits, customer.numberOfIndoorUnits)
    : customer.paymentFrequency === 'jaarlijks'
      ? Math.round(monthlyPrice * 12 * 0.95) // 5% korting
      : monthlyPrice
  
  const priceText = customer.contractType === 'geen'
    ? `€${totalPrice},- per onderhoudsbeurt`
    : customer.paymentFrequency === 'jaarlijks'
      ? `€${totalPrice},- per jaar`
      : `€${totalPrice},- per maand`
  
  const serviceDetails = customer.contractType !== 'geen' 
    ? `Uw contract gaat in binnen 5 werkdagen. De afschrijving zal plaatsvinden aan het einde van de maand tussen de 27ste en 28ste op de door u opgegeven rekening eindigend op ...${sepa?.iban?.slice(-4) || '****'}.`
    : `Wij nemen contact met u op voor het plannen van de onderhoudsbeurt. U betaalt na afloop van de onderhoudsbeurt.`
  
  const templateParams = {
    // Voor EmailJS template
    email: customer.email, // Dit matcht {{email}} in je template
    order_id: `OC-${Date.now()}`, // Uniek contract nummer
    
    // Klant gegevens
    to_name: `${customer.firstName} ${customer.lastName}`,
    from_email: customer.email,
    phone: customer.phone,
    city: customer.city,
    
    // Klant identificatie
    customer_number: customer.customerNumber || '',
    last_quote_number: customer.lastQuoteNumber || '',
    last_invoice_number: customer.lastInvoiceNumber || '',
    
    // Contract details
    contract_type: contractTypeNames[customer.contractType],
    outdoor_units: customer.numberOfOutdoorUnits.toString(),
    indoor_units: customer.numberOfIndoorUnits.toString(),
    payment_frequency: customer.contractType !== 'geen' ? customer.paymentFrequency : '',
    total_price: priceText,
    
    // SEPA gegevens
    iban: sepa?.iban || '',
    account_holder: sepa?.accountHolder || '',
    
    // Extra informatie
    service: serviceDetails
  }
  
  try {
    const response = await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      templateParams
    )
    console.log('Email sent successfully:', response)
    return { success: true, response }
  } catch (error) {
    console.error('Email send failed:', error)
    return { success: false, error }
  }
}