'use client'

import { ContractOption, ContractType } from '@/types/contract'

const contractOptions: ContractOption[] = [
  {
    id: 'geen',
    name: 'Geen contract',
    price: 179,
    description: 'Eenmalige onderhoudsbeurt',
    features: [
      'Professionele onderhoudsbeurt',
      'Arbeidsloon inbegrepen',
      'Onderhoudsmaterialen inbegrepen',
      'Betaling per onderhoudsbeurt',
      'Service op aanvraag'
    ]
  },
  {
    id: 'basis',
    name: 'Basis pakket',
    price: 11,
    description: '€11,- per maand per complete airco unit',
    features: [
      'Jaarlijkse onderhoudsbeurt',
      'Arbeidsloon inbegrepen',
      'Onderhoudsmaterialen inbegrepen',
      'Voorrang bij storingen',
      'Geen voorrijkosten',
      'Opzegbaar per maand'
    ]
  },
  {
    id: 'premium',
    name: 'Premium pakket',
    price: 16,
    description: '€16,- per maand per complete airco unit',
    features: [
      'Jaarlijkse onderhoudsbeurt',
      'Arbeidsloon inbegrepen', 
      'Onderhoudsmaterialen inbegrepen',
      'Alle onderdelen inbegrepen',
      'VERVANGEND TOESTEL BIJ DEFECT',
      'Voorrang bij storingen',
      'Geen voorrijkosten',
      'Opzegbaar per maand'
    ]
  }
]

interface Props {
  onSelect: (type: ContractType) => void
  selected: ContractType
}

export default function ContractSelection({ onSelect, selected }: Props) {
  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900 mb-2">Kies uw onderhoudscontract</h2>
      <p className="text-gray-600 mb-2">Selecteer het pakket dat het beste bij uw situatie past</p>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
        <p className="text-sm text-blue-900 font-medium mb-2">
          <span className="font-semibold">Complete airco unit</span> = 1 buitendeel + 1 binnendeel
        </p>
        <p className="text-sm text-blue-800">
          <span className="font-semibold">Multi-split voorbeeld:</span> Heeft u 1 buitendeel met 3 binnendelen? 
          Dan betaalt u voor 1 complete unit + 2 extra binnendelen (€7,-/mnd bij Basis, €11,-/mnd bij Premium)
        </p>
      </div>
      
      <div className="grid lg:grid-cols-3 gap-6">
        {contractOptions.map((option) => (
          <div
            key={option.id}
            className={`relative rounded-2xl p-8 cursor-pointer transition-all transform hover:scale-105 ${
              selected === option.id 
                ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-2xl' 
                : 'bg-white border border-gray-200 hover:shadow-lg'
            }`}
            onClick={() => onSelect(option.id)}
          >
            {option.id === 'basis' && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                <span className="bg-gradient-to-r from-green-400 to-green-500 text-green-900 text-sm font-bold px-4 py-1.5 rounded-full shadow-sm whitespace-nowrap">
                  €47 VOORDEEL
                </span>
              </div>
            )}
            
            {option.id === 'premium' && (
              <>
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                  <span className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 text-sm font-bold px-4 py-1.5 rounded-full shadow-sm whitespace-nowrap">
                    MEEST GEKOZEN
                  </span>
                </div>
                <div className={`mt-6 p-3 rounded-lg ${
                  selected === option.id ? 'bg-blue-600/20' : 'bg-yellow-50'
                }`}>
                  <p className={`text-xs ${
                    selected === option.id ? 'text-blue-100' : 'text-gray-700'
                  }`}>
                    <strong>Unieke zekerheid:</strong> Als uw airco defect raakt en niet te repareren is, 
                    zorgen wij voor een vervangend toestel. U zit nooit zonder koeling of verwarming!
                  </p>
                </div>
              </>
            )}
            
            <div className={`text-center mb-6 ${option.id === 'basis' ? 'mt-6' : ''}`}>
              <h3 className={`text-2xl font-bold mb-2 ${selected === option.id ? 'text-white' : 'text-gray-900'}`}>
                {option.name}
              </h3>
              <div className="flex items-baseline justify-center">
                <span className={`text-5xl font-bold ${selected === option.id ? 'text-white' : 'text-blue-600'}`}>
                  €{option.price}
                </span>
                <span className={`ml-1 ${selected === option.id ? 'text-blue-100' : 'text-gray-500'}`}>
                  {option.id === 'geen' ? 'per beurt' : '/mnd'}
                </span>
              </div>
              {option.id !== 'geen' && (
                <p className={`text-sm ${selected === option.id ? 'text-blue-100' : 'text-gray-500'}`}>
                  €{option.price * 12},- per jaar
                </p>
              )}
              <p className={`mt-2 ${selected === option.id ? 'text-blue-100' : 'text-gray-600'}`}>
                {option.description}
              </p>
            </div>
            
            <ul className="space-y-3 mb-8">
              {option.features.map((feature, index) => {
                const isHighlight = feature.includes('VERVANGEND TOESTEL')
                return (
                  <li key={index} className="flex items-start">
                    <svg className={`w-5 h-5 mr-3 mt-0.5 flex-shrink-0 ${
                      isHighlight 
                        ? (selected === option.id ? 'text-yellow-300' : 'text-yellow-500')
                        : (selected === option.id ? 'text-blue-200' : 'text-green-500')
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {isHighlight ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      )}
                    </svg>
                    <span className={`${
                      isHighlight 
                        ? (selected === option.id ? 'text-yellow-100 font-bold' : 'text-yellow-600 font-bold')
                        : (selected === option.id ? 'text-blue-50' : 'text-gray-700')
                    }`}>
                      {feature}
                    </span>
                  </li>
                )
              })}
            </ul>
            
            <button
              className={`w-full py-3 px-6 rounded-xl font-semibold transition-all ${
                selected === option.id
                  ? 'bg-white text-blue-600 hover:bg-blue-50'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
              onClick={() => onSelect(option.id)}
            >
              {selected === option.id ? 'Geselecteerd ✓' : 'Selecteer dit pakket'}
            </button>
          </div>
        ))}
      </div>
      
      {/* Voordelen van een contract */}
      <div className="mt-12 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100">
        <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Waarom kiezen voor een onderhoudscontract?
        </h3>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
              <svg className="w-6 h-6 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Zonder contract
            </h4>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-start">
                <span className="text-red-500 mr-2">•</span>
                <span>€179,- per onderhoudsbeurt</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-500 mr-2">•</span>
                <span>Voorrijkosten bij storing (€45,-)</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-500 mr-2">•</span>
                <span>Geen voorrang bij storingen</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-500 mr-2">•</span>
                <span>Onderdelen tegen meerprijs</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-500 mr-2">•</span>
                <span>Geen vervangend toestel bij defect</span>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
              <svg className="w-6 h-6 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Met contract (Basis/Premium)
            </h4>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Vanaf €11,- per maand (all-in)</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Geen voorrijkosten</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Voorrang bij storingen</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Premium: alle onderdelen inbegrepen</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Premium: vervangend toestel bij defect</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            <strong>Rekenvoorbeeld:</strong> Zonder contract betaalt u €179,- voor onderhoud + €45,- per storing. 
            Met een Basis contract (€132,-/jaar) bespaart u al €47,- op onderhoud én €45,- per storing!
          </p>
        </div>
      </div>
    </div>
  )
}