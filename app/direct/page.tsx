'use client'

/**
 * /direct — de lage-frictie funnel uit de e-mail-CTA's: pakket + aantal
 * airco's kiezen, prijs direct in beeld, en met één klik naar de Stripe-
 * betaalpagina. Naam, e-mail, telefoon en adres vraagt Stripe daar zelf
 * uit; het contract wordt pas ná de betaling aangemaakt (webhook), dus
 * een afgebroken poging laat niets achter.
 *
 * Het volledige formulier (met SEPA-machtiging voor de ING-incasso)
 * blijft gewoon bestaan op de homepagina — deze pagina is de kortere weg
 * voor wie via een factuur- of campagnemail binnenkomt.
 */

import { useState } from 'react'
import Link from 'next/link'
import PricePreview from '@/components/PricePreview'
import Footer from '@/components/Footer'
import type { ContractType, PaymentFrequency } from '@/types/contract'

const PAKKETTEN: Array<{
  id: ContractType
  naam: string
  prijs: string
  punten: string[]
}> = [
  {
    id: 'basis',
    naam: 'Basis',
    prijs: '€13/mnd per airco',
    punten: [
      'Jaarlijkse onderhoudsbeurt',
      'Arbeidsloon en materialen inbegrepen',
      'Voorrang bij storingen, geen voorrijkosten',
      'Opzegbaar per maand',
    ],
  },
  {
    id: 'premium',
    naam: 'Premium',
    prijs: '€16/mnd per airco',
    punten: [
      'Alles van Basis',
      'Alle onderdelen inbegrepen',
      'Vervangend toestel bij defect',
      'Opzegbaar per maand',
    ],
  },
  {
    id: 'geen',
    naam: 'Losse beurt',
    prijs: '€189 eenmalig',
    punten: [
      'Eenmalige professionele onderhoudsbeurt',
      'Arbeidsloon en materialen inbegrepen',
      'Geen abonnement',
    ],
  },
]

function Stepper({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string
  value: number
  onChange: (next: number) => void
  min: number
  max: number
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label={`Minder ${label.toLowerCase()}`}
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="h-9 w-9 rounded-full border border-gray-300 text-lg font-semibold text-gray-700 disabled:opacity-40"
        >
          −
        </button>
        <span className="w-6 text-center text-lg font-semibold tabular-nums">
          {value}
        </span>
        <button
          type="button"
          aria-label={`Meer ${label.toLowerCase()}`}
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="h-9 w-9 rounded-full border border-gray-300 text-lg font-semibold text-gray-700 disabled:opacity-40"
        >
          +
        </button>
      </div>
    </div>
  )
}

export default function DirectPage() {
  const [pakket, setPakket] = useState<ContractType>('basis')
  const [buiten, setBuiten] = useState(1)
  const [binnen, setBinnen] = useState(1)
  const [multiSplit, setMultiSplit] = useState(false)
  const [frequentie, setFrequentie] = useState<PaymentFrequency>('maandelijks')
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)

  // Zonder multi-split volgt het aantal binnendelen de buitendelen 1-op-1.
  const effectiefBinnen = multiSplit ? Math.max(binnen, buiten) : buiten

  async function naarBetalen() {
    setBezig(true)
    setFout(null)
    try {
      const response = await fetch('/api/stripe/direct', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          contractType: pakket,
          outdoorUnits: buiten,
          indoorUnits: effectiefBinnen,
          paymentFrequency: pakket === 'geen' ? 'maandelijks' : frequentie,
        }),
      })
      const json = (await response.json()) as { url?: string; error?: string }
      if (!response.ok || typeof json.url !== 'string') {
        setFout(
          'De betaalpagina kon niet worden geopend. Probeer het opnieuw, of gebruik het volledige formulier.',
        )
        setBezig(false)
        return
      }
      window.location.href = json.url
    } catch {
      setFout('Er ging iets mis. Controleer uw verbinding en probeer opnieuw.')
      setBezig(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50">
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="mx-auto max-w-xl">
          <div className="mb-8 text-center">
            <h1 className="mb-3 text-2xl font-bold text-gray-900 sm:text-3xl">
              Onderhoudsabonnement afsluiten
            </h1>
            <p className="text-gray-600">
              Kies uw pakket en aantal airco&apos;s — afrekenen gaat direct en
              veilig via Stripe. Klaar in één minuut.
            </p>
          </div>

          <div className="mb-6 grid gap-3">
            {PAKKETTEN.map((optie) => (
              <button
                key={optie.id}
                type="button"
                onClick={() => setPakket(optie.id)}
                className={`rounded-xl border-2 p-4 text-left transition-colors ${
                  pakket === optie.id
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-blue-300'
                }`}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-lg font-semibold text-gray-900">
                    {optie.naam}
                    {optie.id === 'premium' && (
                      <span className="ml-2 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-bold text-yellow-800">
                        MEEST GEKOZEN
                      </span>
                    )}
                  </span>
                  <span className="text-sm font-medium text-blue-700">
                    {optie.prijs}
                  </span>
                </div>
                <ul className="mt-2 space-y-0.5">
                  {optie.punten.map((punt) => (
                    <li key={punt} className="text-sm text-gray-600">
                      ✓ {punt}
                    </li>
                  ))}
                </ul>
              </button>
            ))}
          </div>

          <div className="mb-4 grid gap-3">
            <Stepper
              label={multiSplit ? "Airco's (buitendelen)" : "Aantal airco's"}
              value={buiten}
              onChange={(next) => {
                setBuiten(next)
                if (binnen < next) setBinnen(next)
              }}
              min={1}
              max={8}
            />
            <label className="flex items-center gap-2 px-1 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={multiSplit}
                onChange={(event) => setMultiSplit(event.target.checked)}
                className="h-4 w-4"
              />
              Ik heb een multi-split (meer binnendelen dan buitendelen)
            </label>
            {multiSplit && (
              <Stepper
                label="Binnendelen (totaal)"
                value={Math.max(binnen, buiten)}
                onChange={setBinnen}
                min={buiten}
                max={12}
              />
            )}
          </div>

          {pakket !== 'geen' && (
            <div className="mb-4 flex overflow-hidden rounded-lg border border-gray-200 bg-white text-sm font-medium">
              <button
                type="button"
                onClick={() => setFrequentie('maandelijks')}
                className={`flex-1 px-4 py-3 ${
                  frequentie === 'maandelijks'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700'
                }`}
              >
                Maandelijks
              </button>
              <button
                type="button"
                onClick={() => setFrequentie('jaarlijks')}
                className={`flex-1 px-4 py-3 ${
                  frequentie === 'jaarlijks'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700'
                }`}
              >
                Jaarlijks (5% korting)
              </button>
            </div>
          )}

          <PricePreview
            contractType={pakket}
            outdoorUnits={buiten}
            indoorUnits={effectiefBinnen}
            paymentFrequency={pakket === 'geen' ? 'maandelijks' : frequentie}
          />

          {fout !== null && (
            <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {fout}
            </p>
          )}

          <button
            type="button"
            onClick={() => void naarBetalen()}
            disabled={bezig}
            className="mt-6 w-full rounded-xl bg-blue-600 px-6 py-4 text-lg font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
          >
            {bezig ? 'Even geduld…' : 'Direct afsluiten — naar betalen'}
          </button>
          <p className="mt-3 text-center text-xs text-gray-500">
            U rekent af via Stripe (iDEAL of kaart). Uw naam, adres en
            telefoonnummer vult u daar in — meer is niet nodig.
          </p>
          <p className="mt-6 text-center text-sm text-gray-600">
            Liever betalen via automatische incasso (ING-machtiging)?{' '}
            <Link href="/" className="font-medium text-blue-700 underline">
              Gebruik het volledige formulier
            </Link>
          </p>
        </div>
      </div>
      <Footer />
    </main>
  )
}
