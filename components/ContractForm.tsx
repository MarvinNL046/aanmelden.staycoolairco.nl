'use client'

import React, { useState, useEffect } from 'react'
import { ContractType, CustomerData, SepaData } from '@/types/contract'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import ContractSelection from './ContractSelection'
import CustomerForm from './CustomerForm'
import SepaForm from './SepaForm'
import Summary from './Summary'
import StepTransition from './StepTransition'

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
      paymentFrequency: 'maandelijks'
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

  // Save to localStorage whenever data changes
  useEffect(() => {
    setSavedData({
      currentStep,
      contractType,
      customerData,
      sepaData
    })
  }, [currentStep, contractType, customerData, sepaData])

  const handleContractSelect = (type: ContractType) => {
    setContractType(type)
    setCustomerData({ ...customerData, contractType: type })
    setCurrentStep('customer')
  }

  const handleCustomerSubmit = (data: CustomerData) => {
    setCustomerData(data)
    if (data.contractType !== 'geen') {
      setCurrentStep('sepa')
    } else {
      setCurrentStep('summary')
    }
  }

  const handleSepaSubmit = (data: SepaData) => {
    setSepaData(data)
    setCurrentStep('summary')
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
  }

  return (
    <div>
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-center">
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
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                    currentStep === s.step 
                      ? 'bg-blue-600 border-blue-600 text-white' 
                      : currentIdx > displayIdx
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'bg-white border-gray-300 text-gray-500'
                  }`}>
                    {currentIdx > displayIdx ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span>{displayIdx + 1}</span>
                    )}
                  </div>
                  <span className={`ml-2 text-sm font-medium ${
                    currentStep === s.step ? 'text-gray-900' : 'text-gray-500'
                  }`}>{s.label}</span>
                </div>
                {s.step !== 'summary' && s.step !== (contractType === 'geen' ? 'customer' : 'sepa') && (
                  <div className="w-12 h-0.5 bg-gray-300 mx-4" />
                )}
              </React.Fragment>
            )
          })}
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