import { createClient } from '@supabase/supabase-js'
import { CustomerData, SepaData } from '@/types/contract'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Only create client if credentials are provided
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

interface ContractSubmission {
  customer: CustomerData
  sepa: SepaData | null
}

export async function submitContract(data: ContractSubmission) {
  const { customer, sepa } = data
  
  const contractData = {
    first_name: customer.firstName,
    last_name: customer.lastName,
    email: customer.email,
    phone: customer.phone,
    address: customer.address,
    postal_code: customer.postalCode,
    city: customer.city,
    number_of_aircos: customer.numberOfAircos,
    number_of_outdoor_units: customer.numberOfOutdoorUnits,
    number_of_indoor_units: customer.numberOfIndoorUnits,
    contract_type: customer.contractType,
    payment_frequency: customer.paymentFrequency,
    iban: sepa?.iban || null,
    account_holder: sepa?.accountHolder || null,
    mandate_date: sepa?.mandateDate || null,
    created_at: new Date().toISOString()
  }
  
  // If supabase is not configured, just log the data
  if (!supabase) {
    console.log('Contract submission (Supabase not configured):', contractData)
    return { data: contractData, error: null }
  }
  
  const { data: result, error } = await supabase
    .from('contracts')
    .insert([contractData])
    .select()
  
  if (error) {
    console.error('Supabase error:', error)
    throw error
  }
  
  // Send confirmation email (this would be handled by Supabase Edge Functions or a separate service)
  // For now, we'll just log it
  console.log('Contract submitted:', result)
  
  return result
}