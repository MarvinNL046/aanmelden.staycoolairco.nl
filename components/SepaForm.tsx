'use client'

import { useState } from 'react'
import { SepaData } from '@/types/contract'
import { validateIBAN, formatIBAN, getBankName } from '@/utils/iban-validator'

interface Props {
  data: SepaData
  onSubmit: (data: SepaData) => void
  onBack: () => void
}

type FormErrors = {
  [K in keyof SepaData]?: string
}

export default function SepaForm({ data, onSubmit, onBack }: Props) {
  const [formData, setFormData] = useState<SepaData>(data)
  const [errors, setErrors] = useState<FormErrors>({})
  const [agreed, setAgreed] = useState(false)
  const [bankName, setBankName] = useState<string | null>(null)

  const validate = () => {
    const newErrors: FormErrors = {}
    
    if (!formData.iban.trim()) newErrors.iban = 'IBAN is verplicht'
    else if (!validateIBAN(formData.iban)) newErrors.iban = 'IBAN is ongeldig'
    
    if (!formData.accountHolder.trim()) newErrors.accountHolder = 'Rekeninghouder is verplicht'
    
    if (!formData.signature || !formData.signature.trim()) {
      newErrors.signature = 'Handtekening (volledige naam) is verplicht'
    } else if (formData.signature.trim().split(' ').length < 2) {
      newErrors.signature = 'Vul uw volledige naam in (voor- en achternaam)'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0 && agreed
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) {
      onSubmit({
        ...formData,
        mandateDate: new Date()
      })
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
    setErrors({ ...errors, [name]: undefined })
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="text-2xl font-semibold mb-6">SEPA Machtiging</h2>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-800">
          Door ondertekening van dit formulier geeft u toestemming aan StayCool Airco 
          om doorlopende incasso-opdrachten te sturen naar uw bank om een bedrag van 
          uw rekening af te schrijven en aan uw bank om doorlopend een bedrag van uw 
          rekening af te schrijven overeenkomstig de opdracht van StayCool Airco.
        </p>
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          IBAN
        </label>
        <input
          type="text"
          name="iban"
          value={formatIBAN(formData.iban)}
          onChange={(e) => {
            const cleanedValue = e.target.value.replace(/\s/g, '').toUpperCase()
            setFormData({
              ...formData,
              iban: cleanedValue
            })
            setErrors({ ...errors, iban: undefined })
            
            // Check bank name
            if (cleanedValue.length >= 8) {
              const bank = getBankName(cleanedValue)
              setBankName(bank)
            } else {
              setBankName(null)
            }
          }}
          placeholder="NL00 BANK 0000 0000 00"
          maxLength={29}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.iban ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {bankName && (
          <p className="text-green-600 text-sm mt-1">✓ {bankName}</p>
        )}
        {errors.iban && (
          <p className="text-red-500 text-sm mt-1">{errors.iban}</p>
        )}
      </div>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Naam rekeninghouder
        </label>
        <input
          type="text"
          name="accountHolder"
          value={formData.accountHolder}
          onChange={handleChange}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.accountHolder ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.accountHolder && (
          <p className="text-red-500 text-sm mt-1">{errors.accountHolder}</p>
        )}
      </div>
      
      <div className="mb-6 space-y-4">
        <label className="flex items-start">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-1 mr-2"
          />
          <span className="text-sm text-gray-700">
            Ik ga akkoord met de automatische incasso voor het gekozen onderhoudscontract. 
            U kunt het afgegeven machtiging te allen tijde intrekken door contact op te nemen 
            met StayCool Airco of uw bank.
          </span>
        </label>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-xs text-gray-600">
            Door dit formulier te verzenden gaat u akkoord met onze{' '}
            <a 
              href="https://staycoolairco.nl/privacy-policy" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              privacyverklaring
            </a>
            {' '}en{' '}
            <a 
              href="https://staycoolairco.nl/algemene-voorwaarden" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              algemene voorwaarden
            </a>.
            Uw gegevens worden veilig verwerkt conform de AVG/GDPR wetgeving.
          </p>
        </div>
        
        {!agreed && (
          <p className="text-red-500 text-sm mt-1">
            U moet akkoord gaan met de voorwaarden
          </p>
        )}
      </div>
      
      <div className="bg-gray-50 rounded-lg p-6 mb-6">
        <h3 className="font-semibold mb-4">Digitale Handtekening</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Handtekening (volledige naam)
            </label>
            <input
              type="text"
              name="signature"
              value={formData.signature || ''}
              onChange={(e) => {
                setFormData({ ...formData, signature: e.target.value })
                setErrors({ ...errors, signature: undefined })
              }}
              placeholder="Typ hier uw voor- en achternaam"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.signature ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.signature && (
              <p className="text-red-500 text-sm mt-1">{errors.signature}</p>
            )}
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Datum
              </label>
              <input
                type="text"
                value={new Date().toLocaleDateString('nl-NL')}
                disabled
                className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-600"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Plaats
              </label>
              <input
                type="text"
                value="Online"
                disabled
                className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-600"
              />
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <p className="text-xs text-gray-600">
          <strong>Incassant:</strong> StayCool Airco B.V.<br />
          <strong>Incassant ID:</strong> NL18ZZZ820658880000<br />
          <strong>Kenmerk machtiging:</strong> U ontvangt dit na bevestiging
        </p>
      </div>
      
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
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
          disabled={!agreed || !formData.signature?.trim()}
        >
          Volgende
        </button>
      </div>
    </form>
  )
}