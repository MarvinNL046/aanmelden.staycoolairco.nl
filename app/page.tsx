'use client'

import { useState } from 'react'
import ContractForm from '@/components/ContractForm'
import WhatsAppButton from '@/components/WhatsAppButton'
import ServiceWorkerCleanup from '@/components/ServiceWorkerCleanup'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50">
      <ServiceWorkerCleanup />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-blue-100 rounded-full mb-4 sm:mb-6">
              <svg className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
              </svg>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              StayCool Airco Service
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto px-4 sm:px-0">
              Zorg voor optimale prestaties van uw airconditioning met onze onderhoudscontracten
            </p>
          </div>
          
          <ContractForm />
          
          <div className="mt-8 text-center">
            <p className="text-gray-600 mb-4">Heeft u vragen? Wij helpen u graag!</p>
            <WhatsAppButton />
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}