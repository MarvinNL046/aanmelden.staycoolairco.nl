'use client'

import React, { useState, useEffect } from 'react'
import { ContractType, CustomerData, SepaData } from '@/types/contract'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import ContractSelection from './ContractSelection'
import CustomerForm from './CustomerForm'
import SepaForm from './SepaForm'
import Summary from './Summary'
import StepTransition from './StepTransition'
import AutoSaveIndicator from './AutoSaveIndicator'

type Step = 'contract' | 'customer' | 'sepa' | 'summary'

export default function ContractForm() {
  const [savedData, setSavedData, clearSavedData] = useLocalStorage('contractFormData', {
    currentStep: 'contract' as Step,
    contractType: 'geen' as ContractType,
    customerData: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      postalCode: '',
      city: '',
      numberOfAircos: 1,
      numberOfOutdoorUnits: 1,
      numberOfIndoorUnits: 1,
      contractType: 'geen',
      paymentFrequency: 'maandelijks',
      customerNumber: '',
      lastQuoteNumber: '',
      lastInvoiceNumber: ''
    } as CustomerData,
    sepaData: {
      iban: '',
      accountHolder: '',
      mandateDate: new Date('2024-01-01') // Fixed date to prevent hydration mismatch
    } as SepaData
  })

  const [currentStep, setCurrentStep] = useState<Step>(savedData.currentStep)
  const [contractType, setContractType] = useState<ContractType>(savedData.contractType)
  const [customerData, setCustomerData] = useState<CustomerData>(savedData.customerData)
  const [sepaData, setSepaData] = useState<SepaData>({
    ...savedData.sepaData,
    mandateDate: new Date() // Use current date when actually submitting
  })
  const [showSaveIndicator, setShowSaveIndicator] = useState(false)

  // Save to localStorage whenever data changes
  useEffect(() => {
    setSavedData({
      currentStep,
      contractType,
      customerData,
      sepaData
    })
    // Show save indicator
    setShowSaveIndicator(true)
  }, [currentStep, contractType, customerData, sepaData])

  const handleContractSelect = (type: ContractType) => {
    setContractType(type)
    setCustomerData({ ...customerData, contractType: type })
    setCurrentStep('customer')
    // Scroll to top of the page
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCustomerSubmit = (data: CustomerData) => {
    setCustomerData(data)
    if (data.contractType !== 'geen') {
      setCurrentStep('sepa')
    } else {
      setCurrentStep('summary')
    }
    // Scroll to top of the page
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSepaSubmit = (data: SepaData) => {
    setSepaData(data)
    setCurrentStep('summary')
    // Scroll to top of the page
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleBack = () => {
    switch (currentStep) {
      case 'customer':
        setCurrentStep('contract')
        break
      case 'sepa':
        setCurrentStep('customer')
        break
      case 'summary':
        setCurrentStep(customerData.contractType !== 'geen' ? 'sepa' : 'customer')
        break
    }
    // Scroll to top of the page
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div>
      <AutoSaveIndicator show={showSaveIndicator} />
      
      {/* Progress indicator */}
      <div className="mb-8 bg-white rounded-lg shadow-md p-4 sm:p-6">
        <div className="text-center mb-4">
          <span className="text-base sm:text-lg font-semibold text-gray-800">
            Stap {contractType === 'geen' ? 
              currentStep === 'contract' ? '1' : currentStep === 'customer' ? '2' : '3'
              : currentStep === 'contract' ? '1' : currentStep === 'customer' ? '2' : currentStep === 'sepa' ? '3' : '4'
            } van {contractType === 'geen' ? '3' : '4'}
          </span>
        </div>
        <div className="flex items-center justify-center px-2">
          <div className="flex items-center flex-wrap sm:flex-nowrap justify-center gap-2 sm:gap-0">
            {[
              { step: 'contract', label: 'Contract', icon: '1' },
              { step: 'customer', label: 'Gegevens', icon: '2' },
              { step: 'sepa', label: 'Betaling', icon: '3' },
              { step: 'summary', label: 'Overzicht', icon: '4' }
            ].map((s, idx) => {
              // Skip SEPA step for 'geen' contract
              if (s.step === 'sepa' && contractType === 'geen') {
                return null
              }
              
              // Calculate display index
              const displaySteps = contractType === 'geen' ? ['contract', 'customer', 'summary'] : ['contract', 'customer', 'sepa', 'summary']
              const displayIdx = displaySteps.indexOf(s.step)
              const currentIdx = displaySteps.indexOf(currentStep)
              
              return (
                <React.Fragment key={s.step}>
                  <div className="flex items-center">
                    <div className="flex flex-col sm:flex-row items-center">
                      <div className={`flex items-center justify-center w-12 h-12 sm:w-10 sm:h-10 rounded-full border-3 transition-all duration-300 ${
                        currentStep === s.step 
                          ? 'bg-blue-600 border-blue-600 text-white shadow-lg scale-110' 
                          : currentIdx > displayIdx
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'bg-gray-100 border-gray-400 text-gray-600'
                      }`}>
                        {currentIdx > displayIdx ? (
                          <svg className="w-6 h-6 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <span className="font-bold text-lg sm:text-base">{displayIdx + 1}</span>
                        )}
                      </div>
                      <span className={`mt-2 sm:mt-0 sm:ml-2 text-xs sm:text-sm font-medium ${
                        currentStep === s.step ? 'text-gray-900 font-bold' : 'text-gray-600'
                      }`}>{s.label}</span>
                    </div>
                  </div>
                  {s.step !== 'summary' && s.step !== (contractType === 'geen' ? 'customer' : 'sepa') && (
                    <div className={`hidden sm:block w-8 sm:w-12 h-1 sm:h-0.5 mx-2 sm:mx-4 transition-all duration-300 ${
                      currentIdx > displayIdx ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                  )}
                </React.Fragment>
              )
            })}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl overflow-hidden">
        <div className="p-6 sm:p-8 lg:p-12">
          <StepTransition stepKey={currentStep}>
            {currentStep === 'contract' && (
              <ContractSelection onSelect={handleContractSelect} selected={contractType} />
            )}
            
            {currentStep === 'customer' && (
              <CustomerForm 
                data={customerData}
                onSubmit={handleCustomerSubmit}
                onBack={handleBack}
              />
            )}
            
            {currentStep === 'sepa' && (
              <SepaForm
                data={sepaData}
                onSubmit={handleSepaSubmit}
                onBack={handleBack}
              />
            )}
            
            {currentStep === 'summary' && (
              <Summary
                customerData={customerData}
                sepaData={sepaData}
                onBack={handleBack}
              />
            )}
          </StepTransition>
        </div>
      </div>
    </div>
  )
}