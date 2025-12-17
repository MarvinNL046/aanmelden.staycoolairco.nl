'use client'

import { generateBlankContractPDF } from '@/utils/pdf-generator'

export default function BlancoContractPage() {
  const handleDownload = () => {
    generateBlankContractPDF()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-12 px-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Blanco Contract
            </h1>
            <p className="text-gray-600">
              Download een leeg onderhoudscontract voor op maat gemaakte overeenkomsten.
            </p>
          </div>

          <button
            onClick={handleDownload}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center gap-3"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Download Blanco Contract (PDF)
          </button>

          <p className="mt-6 text-sm text-gray-500">
            Dit contract bevat invulvelden voor klantgegevens, contractdetails,
            opmerkingen en SEPA machtiging.
          </p>

          <a
            href="/"
            className="mt-6 inline-block text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            ← Terug naar aanmeldformulier
          </a>
        </div>
      </div>
    </div>
  )
}
