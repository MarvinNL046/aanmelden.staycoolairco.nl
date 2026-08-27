import type { Metadata } from 'next'
import Link from 'next/link'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Zo ziet een onderhoudsbeurt eruit - StayCool Airco',
  description:
    'Bekijk in 9 seconden hoe StayCool een airco professioneel reinigt en onderhoudt.',
  robots: { index: false },
}

/**
 * Landingspagina voor de video-link uit de campagnemails (e-mailclients
 * kunnen geen video afspelen, dus de mail toont een thumbnail met
 * play-knop die hierheen linkt). Na de video: door naar /direct.
 */
export default function OnderhoudsbeurtPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50">
      <div className="container mx-auto px-4 py-10 sm:py-14">
        <div className="mx-auto max-w-md text-center">
          <h1 className="mb-2 text-2xl font-bold text-gray-900">
            Zo ziet een onderhoudsbeurt eruit
          </h1>
          <p className="mb-6 text-gray-600">
            Negen seconden uit de praktijk: grondige reiniging van het
            binnendeel, zonder rommel in huis.
          </p>
          <video
            src="/campagne/onderhoudsbeurt.mp4"
            poster="/campagne/video-thumb.jpg"
            controls
            autoPlay
            muted
            playsInline
            className="mx-auto w-full max-w-sm rounded-xl shadow-lg"
          />
          <div className="mt-8">
            <Link
              href="/direct?utm_source=email&utm_medium=drip&utm_campaign=onderhoudsabonnement&utm_content=video"
              className="inline-block rounded-xl bg-blue-600 px-8 py-4 text-lg font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Bekijk het onderhoudsabonnement
            </Link>
            <p className="mt-3 text-xs text-gray-500">
              Vanaf €13 per maand per airco — opzegbaar per maand
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}
