'use client'

import { useState, useEffect, useRef } from 'react'
import { CustomerData, PaymentFrequency } from '@/types/contract'
import PaymentFrequencySelector from './PaymentFrequency'
import Tooltip, { InfoIcon } from './Tooltip'
import { calculateMonthlyPrice, EXTRA_INDOOR_UNIT_PRICE, EXTRA_INDOOR_UNIT_PRICE_PREMIUM } from '@/utils/pricing'
import NumberInput from './NumberInput'
import PricePreview from './PricePreview'

interface Props {
  data: CustomerData
  onSubmit: (data: CustomerData) => void
  onBack: () => void
}

type FormErrors = {
  [K in keyof CustomerData]?: string
}

export default function CustomerForm({ data, onSubmit, onBack }: Props) {
  const [formData, setFormData] = useState<CustomerData>(data)
  const [errors, setErrors] = useState<FormErrors>({})
  const firstFieldRef = useRef<HTMLInputElement>(null)
  
  // Auto-focus first field when component mounts
  useEffect(() => {
    firstFieldRef.current?.focus()
  }, [])

  const validate = () => {
    const newErrors: FormErrors = {}
    
    if (!formData.firstName.trim()) newErrors.firstName = 'Voornaam is verplicht'
    if (!formData.lastName.trim()) newErrors.lastName = 'Achternaam is verplicht'
    if (!formData.email.trim()) newErrors.email = 'Email is verplicht'
    if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is ongeldig'
    if (!formData.phone.trim()) newErrors.phone = 'Telefoonnummer is verplicht'
    
    // Check if at least one identification field is filled
    const hasCustomerNumber = formData.customerNumber && formData.customerNumber.trim()
    const hasQuoteNumber = formData.lastQuoteNumber && formData.lastQuoteNumber.trim()
    const hasInvoiceNumber = formData.lastInvoiceNumber && formData.lastInvoiceNumber.trim()
    
    if (!hasCustomerNumber && !hasQuoteNumber && !hasInvoiceNumber) {
      newErrors.customerNumber = 'Vul minimaal één identificatienummer in (klantnummer, offertenummer of factuurnummer)'
    }
    
    if (!formData.address.trim()) newErrors.address = 'Adres is verplicht'
    if (!formData.postalCode.trim()) newErrors.postalCode = 'Postcode is verplicht'
    else if (!/^\d{4}\s?[A-Z]{2}$/i.test(formData.postalCode.trim())) newErrors.postalCode = 'Ongeldige postcode (bijv. 1234 AB)'
    if (!formData.city.trim()) newErrors.city = 'Plaats is verplicht'
    if (formData.numberOfOutdoorUnits < 1) newErrors.numberOfOutdoorUnits = 'Minimum 1 buitendeel'
    if (formData.numberOfIndoorUnits < 1) newErrors.numberOfIndoorUnits = 'Minimum 1 binnendeel'
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) {
      onSubmit(formData)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    const isNumberField = ['numberOfAircos', 'numberOfOutdoorUnits', 'numberOfIndoorUnits'].includes(name)
    
    setFormData({
      ...formData,
      [name]: isNumberField ? parseInt(value) || 1 : value,
      // Update total when outdoor/indoor units change
      ...(name === 'numberOfOutdoorUnits' || name === 'numberOfIndoorUnits' ? {
        numberOfAircos: (name === 'numberOfOutdoorUnits' ? parseInt(value) || 1 : formData.numberOfOutdoorUnits) + 
                       (name === 'numberOfIndoorUnits' ? parseInt(value) || 1 : formData.numberOfIndoorUnits)
      } : {})
    })
    setErrors({ ...errors, [name]: undefined })
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-6">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Terug naar pakketkeuze
        </button>
      </div>
      
      <h2 className="text-3xl font-bold text-gray-900 mb-2">Uw gegevens</h2>
      <p className="text-gray-600 mb-6">Vul uw contactgegevens in voor het onderhoudscontract</p>
      <p className="text-sm text-gray-500 mb-8"><span className="text-red-500">*</span> Verplichte velden</p>
      
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Voornaam <span className="text-red-500">*</span>
          </label>
          <input
            ref={firstFieldRef}
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.firstName ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.firstName && (
            <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Achternaam
          </label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.lastName ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.lastName && (
            <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
          )}
        </div>
      </div>
      
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.email ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Telefoon
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.phone ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.phone && (
            <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
          )}
        </div>
      </div>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Klantidentificatie</h3>
        <p className="text-sm text-gray-600 mb-4">
          Vul minimaal één van onderstaande nummers in. Dit abonnement is alleen beschikbaar voor bestaande klanten.
        </p>
        
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Klantnummer
            </label>
            <input
              type="text"
              name="customerNumber"
              value={formData.customerNumber || ''}
              onChange={handleChange}
              placeholder="bijv. 12345"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.customerNumber ? 'border-red-500' : 'border-gray-300'
              }`}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Laatste offertenummer
            </label>
            <input
              type="text"
              name="lastQuoteNumber"
              value={formData.lastQuoteNumber || ''}
              onChange={handleChange}
              placeholder="bijv. OFF-2024-001"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Laatste factuurnummer
            </label>
            <input
              type="text"
              name="lastInvoiceNumber"
              value={formData.lastInvoiceNumber || ''}
              onChange={handleChange}
              placeholder="bijv. INV-2024-001"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        {errors.customerNumber && (
          <p className="text-red-500 text-sm mt-2">{errors.customerNumber}</p>
        )}
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Adres
        </label>
        <input
          type="text"
          name="address"
          value={formData.address}
          onChange={handleChange}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.address ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.address && (
          <p className="text-red-500 text-sm mt-1">{errors.address}</p>
        )}
      </div>
      
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Postcode
          </label>
          <input
            type="text"
            name="postalCode"
            value={formData.postalCode}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.postalCode ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.postalCode && (
            <p className="text-red-500 text-sm mt-1">{errors.postalCode}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Plaats
          </label>
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.city ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.city && (
            <p className="text-red-500 text-sm mt-1">{errors.city}</p>
          )}
        </div>
      </div>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          Airconditioning units
          <Tooltip content="Single-split: 1 buitendeel, 1 binnendeel. Multi-split: 1 buitendeel, meerdere binnendelen.">
            <InfoIcon className="ml-2" />
          </Tooltip>
        </h3>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-blue-800">
            Voor multi-split systemen: geef het aantal buiten- en binnendelen apart op. 
            Voor single-split systemen: vul bij beide 1 in.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-4">
          <NumberInput
            name="numberOfOutdoorUnits"
            value={formData.numberOfOutdoorUnits}
            onChange={(name, value) => setFormData({ ...formData, [name]: value })}
            label="Aantal buitendelen"
            error={errors.numberOfOutdoorUnits}
            min={1}
            max={10}
          />
          
          <NumberInput
            name="numberOfIndoorUnits"
            value={formData.numberOfIndoorUnits}
            onChange={(name, value) => setFormData({ ...formData, [name]: value })}
            label="Aantal binnendelen"
            error={errors.numberOfIndoorUnits}
            min={1}
            max={20}
          />
        </div>
        
        <PricePreview 
          contractType={formData.contractType}
          outdoorUnits={formData.numberOfOutdoorUnits}
          indoorUnits={formData.numberOfIndoorUnits}
          paymentFrequency={formData.paymentFrequency}
        />
        
        {formData.contractType !== 'geen' && formData.numberOfIndoorUnits > formData.numberOfOutdoorUnits && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Multi-split systeem gedetecteerd:</strong> U heeft {formData.numberOfIndoorUnits - formData.numberOfOutdoorUnits} extra 
              binnendelen. Deze worden berekend tegen €{formData.contractType === 'premium' ? EXTRA_INDOOR_UNIT_PRICE_PREMIUM : EXTRA_INDOOR_UNIT_PRICE},-/maand per stuk.
            </p>
          </div>
        )}
      </div>
      
      {formData.contractType !== 'geen' && (
        <PaymentFrequencySelector
          selected={formData.paymentFrequency}
          onChange={(frequency) => setFormData({ ...formData, paymentFrequency: frequency })}
          monthlyPrice={calculateMonthlyPrice(formData.contractType, formData.numberOfOutdoorUnits, formData.numberOfIndoorUnits)}
          numberOfUnits={1}
        />
      )}
      
      <div className="flex justify-between">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Terug
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Volgende
        </button>
      </div>
    </form>
  )
}