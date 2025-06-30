'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { CustomerData, SepaData } from '@/types/contract'
import { submitContract } from '@/lib/supabase'
import { sendConfirmationEmail } from '@/lib/emailjs'
import { sendToGoHighLevel } from '@/lib/gohighlevel'
import { calculateMonthlyPrice, calculateYearlyPrice, calculateDiscount, calculateOneTimePrice, contractPrices, EXTRA_INDOOR_UNIT_PRICE, EXTRA_INDOOR_UNIT_ONETIME } from '@/utils/pricing'
import { RateLimiter } from '@/utils/rate-limiter'
import { formatIBAN, getBankName } from '@/utils/iban-validator'
import { generateContractPDF } from '@/utils/pdf-generator'
import SuccessAnimation from './SuccessAnimation'

// Dynamic import voor reCAPTCHA
const ReCAPTCHA = dynamic(() => import('react-google-recaptcha'), { ssr: false })

// Rate limiter instance
const submitLimiter = new RateLimiter('contract_submit', 3, 300000) // 3 attempts per 5 minutes

interface Props {
  customerData: CustomerData
  sepaData: SepaData
  onBack: () => void
}

const contractNames = {
  geen: 'Geen contract',
  basis: 'Basis pakket', 
  premium: 'Premium pakket'
}

export default function Summary({ customerData, sepaData, onBack }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [recaptchaValue, setRecaptchaValue] = useState<string | null>(null)
  const [contractId, setContractId] = useState<string>('')

  const monthlyPrice = calculateMonthlyPrice(
    customerData.contractType,
    customerData.numberOfOutdoorUnits,
    customerData.numberOfIndoorUnits
  )
    
  const yearlyPrice = calculateYearlyPrice(monthlyPrice, false)
  const yearlyDiscount = customerData.paymentFrequency === 'jaarlijks' ? calculateDiscount(yearlyPrice) : 0
  const totalPrice = customerData.contractType === 'geen'
    ? calculateOneTimePrice(customerData.numberOfOutdoorUnits, customerData.numberOfIndoorUnits)
    : customerData.paymentFrequency === 'jaarlijks'
      ? yearlyPrice - yearlyDiscount
      : monthlyPrice

  const handleDownloadPDF = () => {
    generateContractPDF(customerData, customerData.contractType !== 'geen' ? sepaData : null)
  }

  const handleSubmit = async () => {
    // Check rate limit
    if (!submitLimiter.canAttempt()) {
      const remainingTime = submitLimiter.getRemainingTime()
      setError(`Te veel pogingen. Probeer het opnieuw over ${remainingTime} seconden.`)
      return
    }
    
    if (!recaptchaValue && process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY) {
      setError('Verifieer dat u geen robot bent')
      return
    }
    
    setIsSubmitting(true)
    setError('')
    submitLimiter.recordAttempt()
    
    try {
      // Generate contract ID
      const generatedContractId = `OC-${Date.now()}`
      setContractId(generatedContractId)
      
      // Submit to database
      await submitContract({
        customer: customerData,
        sepa: customerData.contractType !== 'geen' ? sepaData : null
      })
      
      // Send confirmation email
      const emailResult = await sendConfirmationEmail({
        customer: customerData,
        sepa: customerData.contractType !== 'geen' ? sepaData : null
      })
      
      if (!emailResult.success) {
        console.error('Email verzenden mislukt, maar contract is wel opgeslagen')
      }
      
      // Send to GoHighLevel CRM
      const ghlResult = await sendToGoHighLevel(
        customerData,
        customerData.contractType !== 'geen' ? sepaData : null,
        generatedContractId
      )
      
      if (!ghlResult.success) {
        console.error('GoHighLevel sync mislukt, maar contract is wel opgeslagen')
      }
      
      setSubmitted(true)
      
      // Clear localStorage na succesvolle submit
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('contractFormData')
      }
    } catch (err) {
      setError('Er is iets misgegaan. Probeer het opnieuw.')
      console.error('Submit error:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="text-center py-12">
        <SuccessAnimation />
        <h2 className="text-2xl font-semibold mb-2">Bedankt voor uw aanmelding!</h2>
        
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <p className="text-sm text-gray-600">Uw contractnummer:</p>
          <p className="text-lg font-mono font-bold text-gray-900">{contractId}</p>
        </div>
        
        <p className="text-gray-600 mb-4">
          U ontvangt binnen enkele minuten een bevestiging per email.
        </p>
        <p className="text-sm text-gray-500 mb-8">
          {customerData.contractType !== 'geen' 
            ? 'De afschrijving zal plaatsvinden aan het einde van de maand tussen de 27ste en 28ste.'
            : 'Wij nemen contact met u op voor het plannen van de onderhoudsbeurt.'
          }
        </p>
        
        <div className="space-y-3">
          <button
            onClick={() => generateContractPDF(customerData, customerData.contractType !== 'geen' ? sepaData : null)}
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download contract als PDF
          </button>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="https://staycoolairco.nl"
              className="inline-flex items-center justify-center px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Ga naar hoofdwebsite
            </a>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Nieuwe aanmelding
            </button>
          </div>
        </div>
        
        <p className="text-sm text-gray-400 mt-8">
          U kunt deze pagina nu veilig sluiten
        </p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900 mb-2">Controleer uw gegevens</h2>
      <p className="text-gray-600 mb-8">Controleer alle gegevens voordat u het contract definitief maakt</p>
      
      <div className="space-y-6">
        {/* Persoonlijke gegevens */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 flex items-center">
              <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Persoonlijke gegevens
            </h3>
          </div>
          <div className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">Naam</p>
                <p className="font-medium text-gray-900">{customerData.firstName} {customerData.lastName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Email</p>
                <p className="font-medium text-gray-900">{customerData.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Telefoon</p>
                <p className="font-medium text-gray-900">{customerData.phone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Adres</p>
                <p className="font-medium text-gray-900">
                  {customerData.address}<br />
                  {customerData.postalCode} {customerData.city}
                </p>
              </div>
            </div>
          </div>
        </div>
      
        {/* Contract details */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-blue-200">
            <h3 className="font-semibold text-gray-900 flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Contract details
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">Type contract</span>
                <span className="font-semibold text-gray-900 bg-blue-100 px-3 py-1 rounded-full text-sm">
                  {contractNames[customerData.contractType]}
                </span>
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-gray-600">Airconditioning units</span>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Buitendelen</span>
                    <span className="font-medium">{customerData.numberOfOutdoorUnits}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Binnendelen</span>
                    <span className="font-medium">{customerData.numberOfIndoorUnits}</span>
                  </div>
                </div>
              </div>
              
              {customerData.contractType === 'geen' ? (
                <div className="border-t pt-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Prijs per complete unit</span>
                    <span className="font-medium">€{contractPrices.geen},-</span>
                  </div>
                  
                  {Math.min(customerData.numberOfOutdoorUnits, customerData.numberOfIndoorUnits) > 1 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{Math.min(customerData.numberOfOutdoorUnits, customerData.numberOfIndoorUnits)} complete units</span>
                      <span className="font-medium">€{Math.min(customerData.numberOfOutdoorUnits, customerData.numberOfIndoorUnits) * contractPrices.geen},-</span>
                    </div>
                  )}
                  
                  {customerData.numberOfIndoorUnits > customerData.numberOfOutdoorUnits && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-sm text-yellow-800">
                        <strong>Multi-split toeslag:</strong> {customerData.numberOfIndoorUnits - customerData.numberOfOutdoorUnits} extra binnendelen × €{EXTRA_INDOOR_UNIT_ONETIME},-
                      </p>
                      <p className="text-xs text-yellow-700 mt-1">
                        Bij een multi-split systeem betaalt u €{EXTRA_INDOOR_UNIT_ONETIME},- per extra binnendeel
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="border-t pt-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Basis prijs</span>
                    <span className="font-medium">€{contractPrices[customerData.contractType]},- per complete airco unit/mnd</span>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
                    <p>Complete airco unit = 1 buitendeel + 1 binnendeel</p>
                    {customerData.contractType === 'premium' && (
                      <p className="mt-1">Premium pakket inclusief vervangende unit bij defect</p>
                    )}
                  </div>
                  
                  {customerData.numberOfIndoorUnits > customerData.numberOfOutdoorUnits && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-sm text-yellow-800">
                        <strong>Multi-split toeslag:</strong> {customerData.numberOfIndoorUnits - customerData.numberOfOutdoorUnits} extra binnendelen × €{EXTRA_INDOOR_UNIT_PRICE},-/mnd
                      </p>
                      <p className="text-xs text-yellow-700 mt-1">
                        Extra binnendelen worden toegevoegd aan multi-split systemen
                      </p>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Betalingsfrequentie</span>
                    <span className="font-medium capitalize">{customerData.paymentFrequency}</span>
                  </div>
                  
                  {customerData.paymentFrequency === 'jaarlijks' && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex justify-between text-green-800">
                        <span className="text-sm">5% jaarlijkse korting</span>
                        <span className="font-medium">-€{yearlyDiscount},-</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">Totaalbedrag</span>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-blue-600">€{totalPrice},-</span>
                    <p className="text-sm text-gray-600">
                      {customerData.contractType !== 'geen' && (
                        customerData.paymentFrequency === 'jaarlijks' ? 'per jaar' : 'per maand'
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      
        {/* Betaalgegevens */}
        {customerData.contractType !== 'geen' && sepaData.iban && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-green-50 to-green-100 px-6 py-4 border-b border-green-200">
              <h3 className="font-semibold text-gray-900 flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                SEPA Machtiging
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">IBAN</p>
                  <p className="font-medium text-gray-900 font-mono">{formatIBAN(sepaData.iban)}</p>
                  {getBankName(sepaData.iban) && (
                    <p className="text-sm text-green-600 mt-1">✓ {getBankName(sepaData.iban)}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Rekeninghouder</p>
                  <p className="font-medium text-gray-900">{sepaData.accountHolder}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Digitale handtekening</p>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p className="font-medium text-gray-900">{sepaData.signature}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Getekend op {new Date().toLocaleDateString('nl-NL')} - Online
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}
      
      {process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY && (
        <div className="mb-6 flex justify-center">
          <ReCAPTCHA
            sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
            onChange={(value) => setRecaptchaValue(value)}
            onExpired={() => setRecaptchaValue(null)}
          />
        </div>
      )}
      
      <div className="flex justify-between">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          disabled={isSubmitting}
        >
          Terug
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Bezig met verzenden...
            </>
          ) : 'Bevestig aanmelding'}
        </button>
      </div>
    </div>
  )
}