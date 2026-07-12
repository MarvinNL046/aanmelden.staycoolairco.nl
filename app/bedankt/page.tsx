'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

/**
 * Landing na Stripe Checkout (success- én cancel-URL). Toont alleen
 * niet-gevoelige info (contractnummer uit de query, geen bedragen).
 */
export default function BedanktPage() {
  return (
    <Suspense>
      <BedanktContent />
    </Suspense>
  )
}

function BedanktContent() {
  const searchParams = useSearchParams()
  const cancelled = searchParams.get('status') === 'geannuleerd'
  const contractId = searchParams.get('contract')

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        {cancelled ? (
          <>
            <div className="text-5xl mb-4">↩️</div>
            <h1 className="text-2xl font-semibold mb-3">
              Betaling geannuleerd
            </h1>
            <p className="text-gray-600 mb-2">
              U heeft de online betaling afgebroken. Uw aanmelding is wél
              opgeslagen{contractId ? ` (contractnummer ${contractId})` : ''}.
            </p>
            <p className="text-gray-600 mb-6">
              Wij nemen contact met u op om de betaling alsnog te regelen, of
              u kunt het formulier opnieuw afronden.
            </p>
          </>
        ) : (
          <>
            <div className="text-5xl mb-4">✅</div>
            <h1 className="text-2xl font-semibold mb-3">
              Bedankt, alles is geregeld!
            </h1>
            <p className="text-gray-600 mb-2">
              Uw betaling is gelukt en uw aanmelding
              {contractId ? ` (contractnummer ${contractId})` : ''} is
              compleet.
            </p>
            <p className="text-gray-600 mb-6">
              U ontvangt de bevestiging per e-mail. Vervolgbetalingen gaan
              vanaf nu automatisch — u hoeft niets meer te doen.
            </p>
          </>
        )}
        <Link
          href="https://staycoolairco.nl"
          className="inline-block bg-blue-600 text-white font-medium rounded-lg px-6 py-3 hover:bg-blue-700 transition-colors"
        >
          Naar staycoolairco.nl
        </Link>
      </div>
    </main>
  )
}
