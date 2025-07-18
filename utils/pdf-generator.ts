import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { CustomerData, SepaData, ContractType } from '@/types/contract'
import { calculateMonthlyPrice, calculateYearlyPrice, calculateDiscount, contractPrices, EXTRA_INDOOR_UNIT_PRICE, EXTRA_INDOOR_UNIT_PRICE_PREMIUM } from './pricing'
import { formatIBAN, getBankName } from './iban-validator'

// Extend jsPDF type for autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

const contractNames = {
  geen: 'Geen contract',
  basis: 'Basis pakket', 
  premium: 'Premium pakket'
}

export function generateContractPDF(
  customerData: CustomerData,
  sepaData: SepaData | null
): void {
  const doc = new jsPDF()
  const contractId = `OC-${Date.now()}`
  const date = new Date().toLocaleDateString('nl-NL')
  
  // Calculate pricing
  const monthlyPrice = calculateMonthlyPrice(
    customerData.contractType,
    customerData.numberOfOutdoorUnits,
    customerData.numberOfIndoorUnits
  )
  const yearlyPrice = calculateYearlyPrice(monthlyPrice, false)
  const yearlyDiscount = customerData.paymentFrequency === 'jaarlijks' ? calculateDiscount(yearlyPrice) : 0
  const totalPrice = customerData.contractType === 'geen'
    ? contractPrices.geen
    : customerData.paymentFrequency === 'jaarlijks'
      ? yearlyPrice - yearlyDiscount
      : monthlyPrice

  // Header
  doc.setFontSize(24)
  doc.setTextColor(30, 144, 255) // Blue color
  doc.text('StayCool Airco', 20, 20)
  
  doc.setFontSize(16)
  doc.setTextColor(0, 0, 0)
  doc.text('Onderhoudscontract', 20, 30)
  
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.text(`Contract ID: ${contractId}`, 20, 40)
  doc.text(`Datum: ${date}`, 20, 45)
  
  // Personal data section
  doc.setFontSize(14)
  doc.setTextColor(0, 0, 0)
  doc.text('Persoonlijke gegevens', 20, 60)
  
  const personalData = [
    ['Naam', `${customerData.firstName} ${customerData.lastName}`],
    ['Email', customerData.email],
    ['Telefoon', customerData.phone],
    ['Adres', `${customerData.address}, ${customerData.postalCode} ${customerData.city}`]
  ]
  
  autoTable(doc, {
    startY: 65,
    head: [],
    body: personalData,
    theme: 'plain',
    styles: {
      fontSize: 10,
      cellPadding: 2
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 40 },
      1: { cellWidth: 130 }
    }
  })
  
  // Contract details section
  const contractY = (doc as any).lastAutoTable.finalY + 15
  doc.setFontSize(14)
  doc.text('Contract details', 20, contractY)
  
  const contractDetails = [
    ['Type contract', contractNames[customerData.contractType]],
    ['Buitendelen', customerData.numberOfOutdoorUnits.toString()],
    ['Binnendelen', customerData.numberOfIndoorUnits.toString()]
  ]
  
  if (customerData.contractType !== 'geen') {
    contractDetails.push(['Basis prijs', `€${contractPrices[customerData.contractType]},- per complete airco unit/mnd`])
    contractDetails.push(['', 'Complete airco unit = 1 buitendeel + 1 binnendeel'])
    
    if (customerData.contractType === 'premium') {
      contractDetails.push(['', 'Premium inclusief vervangende unit bij defect'])
    }
    
    contractDetails.push(['Betalingsfrequentie', customerData.paymentFrequency])
    
    if (customerData.numberOfIndoorUnits > customerData.numberOfOutdoorUnits) {
      const extraUnits = customerData.numberOfIndoorUnits - customerData.numberOfOutdoorUnits
      const extraUnitPrice = customerData.contractType === 'premium' ? EXTRA_INDOOR_UNIT_PRICE_PREMIUM : EXTRA_INDOOR_UNIT_PRICE
      contractDetails.push(['Multi-split toeslag', `${extraUnits} extra binnendelen × €${extraUnitPrice},-/mnd`])
    }
    
    if (customerData.paymentFrequency === 'jaarlijks') {
      contractDetails.push(['Jaarlijkse korting (5%)', `-€${yearlyDiscount},-`])
    }
  }
  
  contractDetails.push(['', '']) // Empty row for spacing
  contractDetails.push(['Totaalbedrag', `€${totalPrice},-${customerData.contractType !== 'geen' ? (customerData.paymentFrequency === 'jaarlijks' ? ' per jaar' : ' per maand') : ''}`])
  
  autoTable(doc, {
    startY: contractY + 5,
    head: [],
    body: contractDetails,
    theme: 'plain',
    styles: {
      fontSize: 10,
      cellPadding: 2
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 60 },
      1: { cellWidth: 110 }
    },
    didParseCell: function(data: any) {
      // Style the total row
      if (data.row.index === contractDetails.length - 1) {
        data.cell.styles.fontSize = 12
        data.cell.styles.fontStyle = 'bold'
      }
    }
  })
  
  // SEPA details (if applicable)
  if (customerData.contractType !== 'geen' && sepaData?.iban) {
    const sepaY = (doc as any).lastAutoTable.finalY + 15
    doc.setFontSize(14)
    doc.text('SEPA Machtiging', 20, sepaY)
    
    const sepaDetails = [
      ['IBAN', formatIBAN(sepaData.iban)],
      ['Bank', getBankName(sepaData.iban) || 'Onbekend'],
      ['Rekeninghouder', sepaData.accountHolder],
      ['Handtekening', sepaData.signature || ''],
      ['Datum handtekening', `${date} - Online`]
    ]
    
    autoTable(doc, {
      startY: sepaY + 5,
      head: [],
      body: sepaDetails,
      theme: 'plain',
      styles: {
        fontSize: 10,
        cellPadding: 2
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 60 },
        1: { cellWidth: 110 }
      }
    })
    
    // SEPA mandate info
    const mandateY = (doc as any).lastAutoTable.finalY + 10
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.text('Incassant: StayCool Airco B.V.', 20, mandateY)
    doc.text('Incassant ID: NL18ZZZ820658880000', 20, mandateY + 4)
    doc.text(`Kenmerk machtiging: ${contractId}`, 20, mandateY + 8)
  }
  
  // Footer
  const footerY = 270
  doc.setDrawColor(200, 200, 200)
  doc.line(20, footerY - 5, 190, footerY - 5)
  
  doc.setFontSize(8)
  doc.setTextColor(100, 100, 100)
  doc.text('StayCool Airco B.V. | KvK: 82065888 | BTW: NL003638007B69', 105, footerY, { align: 'center' })
  doc.text('info@staycoolairco.nl | 046 202 1430', 105, footerY + 4, { align: 'center' })
  
  // Save the PDF
  doc.save(`StayCool_Contract_${customerData.lastName}_${date.replace(/\//g, '-')}.pdf`)
}

export function generateContractPDFBuffer(
  customerData: CustomerData,
  sepaData: SepaData | null,
  contractId: string
): ArrayBuffer {
  const doc = new jsPDF()
  const date = new Date().toLocaleDateString('nl-NL')
  
  // Calculate pricing
  const monthlyPrice = calculateMonthlyPrice(
    customerData.contractType,
    customerData.numberOfOutdoorUnits,
    customerData.numberOfIndoorUnits
  )
  const yearlyPrice = calculateYearlyPrice(monthlyPrice, false)
  const yearlyDiscount = customerData.paymentFrequency === 'jaarlijks' ? calculateDiscount(yearlyPrice) : 0
  const totalPrice = customerData.contractType === 'geen'
    ? contractPrices.geen
    : customerData.paymentFrequency === 'jaarlijks'
      ? yearlyPrice - yearlyDiscount
      : monthlyPrice

  // Header
  doc.setFontSize(24)
  doc.setTextColor(30, 144, 255) // Blue color
  doc.text('StayCool Airco', 20, 20)
  
  doc.setFontSize(16)
  doc.setTextColor(0, 0, 0)
  doc.text('Onderhoudscontract', 20, 30)
  
  // Contract ID and date
  doc.setFontSize(10)
  doc.text(`Contract ID: ${contractId}`, 20, 40)
  doc.text(`Datum: ${date}`, 20, 45)
  
  // Customer details
  doc.setFontSize(14)
  doc.text('Klantgegevens', 20, 60)
  
  const customerDetails = [
    ['Naam', `${customerData.firstName} ${customerData.lastName}`],
    ['Email', customerData.email],
    ['Telefoon', customerData.phone],
    ['Adres', customerData.address],
    ['Postcode', customerData.postalCode],
    ['Plaats', customerData.city]
  ]
  
  // Add identification fields if present
  if (customerData.customerNumber) {
    customerDetails.push(['Klantnummer', customerData.customerNumber])
  }
  if (customerData.lastQuoteNumber) {
    customerDetails.push(['Laatste offertenummer', customerData.lastQuoteNumber])
  }
  if (customerData.lastInvoiceNumber) {
    customerDetails.push(['Laatste factuurnummer', customerData.lastInvoiceNumber])
  }
  
  autoTable(doc, {
    startY: 65,
    head: [],
    body: customerDetails,
    theme: 'plain',
    styles: {
      fontSize: 10,
      cellPadding: 2
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 60 },
      1: { cellWidth: 110 }
    }
  })
  
  // Contract details
  const contractY = (doc as any).lastAutoTable.finalY + 15
  doc.setFontSize(14)
  doc.text('Contract details', 20, contractY)
  
  const contractDetails = [
    ['Type contract', contractNames[customerData.contractType]],
    ['Aantal buitendelen', customerData.numberOfOutdoorUnits.toString()],
    ['Aantal binnendelen', customerData.numberOfIndoorUnits.toString()]
  ]
  
  if (customerData.contractType !== 'geen') {
    contractDetails.push(['Betalingsfrequentie', customerData.paymentFrequency === 'jaarlijks' ? 'Jaarlijks' : 'Maandelijks'])
  }
  
  // Add pricing
  if (customerData.contractType === 'geen') {
    contractDetails.push(['Prijs per onderhoudsbeurt', `€${totalPrice},-`])
  } else if (customerData.paymentFrequency === 'jaarlijks') {
    contractDetails.push(['Prijs per jaar', `€${totalPrice},-`])
    if (yearlyDiscount > 0) {
      contractDetails.push(['Korting (5%)', `-€${yearlyDiscount},-`])
    }
  } else {
    contractDetails.push(['Prijs per maand', `€${totalPrice},-`])
  }
  
  // Show extra indoor unit price if applicable
  if (customerData.contractType !== 'geen' && customerData.numberOfIndoorUnits > customerData.numberOfOutdoorUnits) {
    const extraUnits = customerData.numberOfIndoorUnits - customerData.numberOfOutdoorUnits
    const extraUnitPrice = customerData.contractType === 'premium' ? EXTRA_INDOOR_UNIT_PRICE_PREMIUM : EXTRA_INDOOR_UNIT_PRICE
    contractDetails.push(['Extra binnendelen', `${extraUnits} x €${extraUnitPrice},- = €${extraUnits * extraUnitPrice},-`])
  }
  
  contractDetails.push(['', '']) // Empty row
  contractDetails.push(['Totaal', customerData.contractType === 'geen' 
    ? `€${totalPrice},- per onderhoudsbeurt`
    : customerData.paymentFrequency === 'jaarlijks'
      ? `€${totalPrice},- per jaar`
      : `€${totalPrice},- per maand`
  ])
  
  autoTable(doc, {
    startY: contractY + 5,
    head: [],
    body: contractDetails,
    theme: 'plain',
    styles: {
      fontSize: 10,
      cellPadding: 2
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 60 },
      1: { cellWidth: 110 }
    },
    didParseCell: function(data: any) {
      // Style the total row
      if (data.row.index === contractDetails.length - 1) {
        data.cell.styles.fontSize = 12
        data.cell.styles.fontStyle = 'bold'
      }
    }
  })
  
  // SEPA details (if applicable)
  if (customerData.contractType !== 'geen' && sepaData?.iban) {
    const sepaY = (doc as any).lastAutoTable.finalY + 15
    doc.setFontSize(14)
    doc.text('SEPA Machtiging', 20, sepaY)
    
    const sepaDetails = [
      ['IBAN', formatIBAN(sepaData.iban)],
      ['Bank', getBankName(sepaData.iban) || 'Onbekend'],
      ['Rekeninghouder', sepaData.accountHolder],
      ['Handtekening', sepaData.signature || ''],
      ['Datum handtekening', `${date} - Online`]
    ]
    
    autoTable(doc, {
      startY: sepaY + 5,
      head: [],
      body: sepaDetails,
      theme: 'plain',
      styles: {
        fontSize: 10,
        cellPadding: 2
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 60 },
        1: { cellWidth: 110 }
      }
    })
    
    // SEPA mandate info
    const mandateY = (doc as any).lastAutoTable.finalY + 10
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.text('Incassant: StayCool Airco B.V.', 20, mandateY)
    doc.text('Incassant ID: NL18ZZZ820658880000', 20, mandateY + 4)
    doc.text(`Kenmerk machtiging: ${contractId}`, 20, mandateY + 8)
  }
  
  // Footer
  const footerY = 270
  doc.setDrawColor(200, 200, 200)
  doc.line(20, footerY - 5, 190, footerY - 5)
  
  doc.setFontSize(8)
  doc.setTextColor(100, 100, 100)
  doc.text('StayCool Airco B.V. | KvK: 82065888 | BTW: NL003638007B69', 105, footerY, { align: 'center' })
  doc.text('info@staycoolairco.nl | 046 202 1430', 105, footerY + 4, { align: 'center' })
  
  // Return the PDF as ArrayBuffer
  return doc.output('arraybuffer')
}