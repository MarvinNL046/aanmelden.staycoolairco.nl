import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { CustomerData, SepaData, ContractType } from '@/types/contract'
import { 
  calculateMonthlyPrice, 
  calculateYearlyPrice, 
  calculateDiscount, 
  calculateOneTimePrice,
  calculateQuantityDiscount,
  calculateWeightedPoints,
  qualifiesForQuantityDiscount,
  contractPrices, 
  EXTRA_INDOOR_UNIT_PRICE, 
  EXTRA_INDOOR_UNIT_PRICE_PREMIUM,
  EXTRA_INDOOR_UNIT_ONETIME 
} from './pricing'
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
  
  const hasQuantityDiscount = qualifiesForQuantityDiscount(
    customerData.numberOfOutdoorUnits,
    customerData.numberOfIndoorUnits
  )
  const quantityDiscount = calculateQuantityDiscount(
    customerData.contractType,
    customerData.numberOfOutdoorUnits,
    customerData.numberOfIndoorUnits
  )
  const weightedPoints = calculateWeightedPoints(
    customerData.numberOfOutdoorUnits,
    customerData.numberOfIndoorUnits
  )
  
  const totalPrice = customerData.contractType === 'geen'
    ? calculateOneTimePrice(customerData.numberOfOutdoorUnits, customerData.numberOfIndoorUnits)
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
  
  if (customerData.contractType === 'geen') {
    const completeUnits = Math.min(customerData.numberOfOutdoorUnits, customerData.numberOfIndoorUnits)
    const extraUnits = Math.max(0, customerData.numberOfIndoorUnits - customerData.numberOfOutdoorUnits)
    
    contractDetails.push(['Prijs per complete unit', `€${contractPrices.geen},-`])
    
    if (completeUnits > 1) {
      contractDetails.push(['', `${completeUnits} complete units × €${contractPrices.geen},- = €${completeUnits * contractPrices.geen},-`])
    }
    
    if (extraUnits > 0) {
      contractDetails.push(['Multi-split toeslag', `${extraUnits} extra binnendelen × €${EXTRA_INDOOR_UNIT_ONETIME},-`])
    }
    
    if (hasQuantityDiscount) {
      contractDetails.push(['Kwantumkorting (10%)', `-€${quantityDiscount},-`])
    }
  } else {
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
    
    if (hasQuantityDiscount) {
      const discountAmount = quantityDiscount * (customerData.paymentFrequency === 'jaarlijks' ? 12 : 1)
      contractDetails.push(['Kwantumkorting (10%)', `-€${discountAmount.toFixed(2).replace(/\.00$/, '')}${customerData.paymentFrequency === 'jaarlijks' ? ' per jaar' : ' per maand'}`])
    }
    
    if (customerData.paymentFrequency === 'jaarlijks') {
      contractDetails.push(['Jaarlijkse korting (5%)', `-€${yearlyDiscount},-`])
      if (hasQuantityDiscount) {
        contractDetails.push(['', 'Totale korting: 15% (10% kwantum + 5% jaar)'])
      }
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
  
  const hasQuantityDiscount = qualifiesForQuantityDiscount(
    customerData.numberOfOutdoorUnits,
    customerData.numberOfIndoorUnits
  )
  const quantityDiscount = calculateQuantityDiscount(
    customerData.contractType,
    customerData.numberOfOutdoorUnits,
    customerData.numberOfIndoorUnits
  )
  const weightedPoints = calculateWeightedPoints(
    customerData.numberOfOutdoorUnits,
    customerData.numberOfIndoorUnits
  )
  
  const totalPrice = customerData.contractType === 'geen'
    ? calculateOneTimePrice(customerData.numberOfOutdoorUnits, customerData.numberOfIndoorUnits)
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
  
  // Add pricing details
  if (customerData.contractType === 'geen') {
    const completeUnits = Math.min(customerData.numberOfOutdoorUnits, customerData.numberOfIndoorUnits)
    const extraUnits = Math.max(0, customerData.numberOfIndoorUnits - customerData.numberOfOutdoorUnits)
    const baseAmount = completeUnits * contractPrices.geen + extraUnits * EXTRA_INDOOR_UNIT_ONETIME
    
    if (completeUnits > 1 || extraUnits > 0) {
      contractDetails.push(['Complete units', `${completeUnits} x €${contractPrices.geen},- = €${completeUnits * contractPrices.geen},-`])
    }
    if (extraUnits > 0) {
      contractDetails.push(['Extra binnendelen', `${extraUnits} x €${EXTRA_INDOOR_UNIT_ONETIME},- = €${extraUnits * EXTRA_INDOOR_UNIT_ONETIME},-`])
    }
    if (hasQuantityDiscount) {
      contractDetails.push(['Subtotaal', `€${baseAmount},-`])
      contractDetails.push(['Kwantumkorting (10%)', `-€${quantityDiscount},-`])
    }
    contractDetails.push(['Totaal per beurt', `€${totalPrice},-`])
  } else {
    // Show base pricing
    contractDetails.push(['Basis prijs', `€${contractPrices[customerData.contractType]},- per airco/mnd`])
    
    // Show extra indoor unit price if applicable
    if (customerData.numberOfIndoorUnits > customerData.numberOfOutdoorUnits) {
      const extraUnits = customerData.numberOfIndoorUnits - customerData.numberOfOutdoorUnits
      const extraUnitPrice = customerData.contractType === 'premium' ? EXTRA_INDOOR_UNIT_PRICE_PREMIUM : EXTRA_INDOOR_UNIT_PRICE
      contractDetails.push(['Extra binnendelen', `${extraUnits} x €${extraUnitPrice},- = €${extraUnits * extraUnitPrice},-/mnd`])
    }
    
    // Show quantity discount if applicable
    if (hasQuantityDiscount) {
      const discountAmount = quantityDiscount * (customerData.paymentFrequency === 'jaarlijks' ? 12 : 1)
      contractDetails.push(['Kwantumkorting (10%)', `-€${discountAmount.toFixed(2).replace(/\.00$/, '')}${customerData.paymentFrequency === 'jaarlijks' ? '/jaar' : '/mnd'}`])
    }
    
    // Show yearly discount if applicable
    if (customerData.paymentFrequency === 'jaarlijks') {
      contractDetails.push(['Jaarlijkse korting (5%)', `-€${yearlyDiscount},-`])
      if (hasQuantityDiscount) {
        contractDetails.push(['', 'Totale korting: 15%'])
      }
      contractDetails.push(['Totaal per jaar', `€${totalPrice},-`])
    } else {
      contractDetails.push(['Totaal per maand', `€${totalPrice},-`])
    }
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

/**
 * Generates a blank contract template PDF with empty fields
 * For custom/manual contracts
 */
export function generateBlankContractPDF(): void {
  const doc = new jsPDF()
  const date = new Date().toLocaleDateString('nl-NL')

  // Header - same as regular contract
  doc.setFontSize(24)
  doc.setTextColor(30, 144, 255)
  doc.text('StayCool Airco', 20, 20)

  doc.setFontSize(16)
  doc.setTextColor(0, 0, 0)
  doc.text('Onderhoudscontract', 20, 30)

  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.text('Contract ID: ____________________', 20, 40)
  doc.text(`Datum: ${date}`, 20, 45)

  // Personal data section - matching original style
  doc.setFontSize(14)
  doc.setTextColor(0, 0, 0)
  doc.text('Persoonlijke gegevens', 20, 60)

  const personalData = [
    ['Naam', ''],
    ['Email', ''],
    ['Telefoon', ''],
    ['Adres', '']
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
    },
    didDrawCell: function(data: any) {
      // Draw underline for empty cells
      if (data.column.index === 1) {
        doc.setDrawColor(200, 200, 200)
        doc.line(
          data.cell.x + 2,
          data.cell.y + data.cell.height - 2,
          data.cell.x + data.cell.width - 2,
          data.cell.y + data.cell.height - 2
        )
      }
    }
  })

  // Contract details section
  const contractY = (doc as any).lastAutoTable.finalY + 15
  doc.setFontSize(14)
  doc.text('Contract details', 20, contractY)

  const contractDetails = [
    ['Type contract', '☐ Geen contract   ☐ Basis pakket   ☐ Premium pakket'],
    ['Buitendelen', ''],
    ['Binnendelen', ''],
    ['Betalingsfrequentie', '☐ Maandelijks   ☐ Jaarlijks'],
    ['', ''],
    ['Prijs per unit', '€ __________ per __________'],
    ['Extra binnendelen', '_____ × € __________ = € __________'],
    ['Korting', '€ __________ (__________________)'],
    ['', ''],
    ['Totaalbedrag', '€ __________ per __________']
  ]

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
    },
    didDrawCell: function(data: any) {
      // Draw underline for specific empty cells
      if (data.column.index === 1 && (data.row.index === 1 || data.row.index === 2)) {
        doc.setDrawColor(200, 200, 200)
        doc.line(
          data.cell.x + 2,
          data.cell.y + data.cell.height - 2,
          data.cell.x + 40,
          data.cell.y + data.cell.height - 2
        )
      }
    }
  })

  // Opmerkingen section
  const notesY = (doc as any).lastAutoTable.finalY + 15
  doc.setFontSize(14)
  doc.setTextColor(0, 0, 0)
  doc.text('Opmerkingen', 20, notesY)

  doc.setDrawColor(200, 200, 200)
  for (let i = 0; i < 6; i++) {
    doc.line(20, notesY + 8 + (i * 7), 190, notesY + 8 + (i * 7))
  }

  // New page for SEPA section
  doc.addPage()

  // SEPA section header on new page
  doc.setFontSize(24)
  doc.setTextColor(30, 144, 255)
  doc.text('StayCool Airco', 20, 20)

  doc.setFontSize(16)
  doc.setTextColor(0, 0, 0)
  doc.text('SEPA Machtiging', 20, 30)

  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.text('Doorlopende machtiging voor automatische incasso', 20, 40)

  // SEPA section - matching original style
  const sepaY = 55
  doc.setFontSize(14)
  doc.setTextColor(0, 0, 0)
  doc.text('Gegevens rekeninghouder', 20, sepaY)

  const sepaDetails = [
    ['IBAN', ''],
    ['Bank', ''],
    ['Naam rekeninghouder', ''],
    ['Adres', ''],
    ['Postcode + Plaats', '']
  ]

  autoTable(doc, {
    startY: sepaY + 5,
    head: [],
    body: sepaDetails,
    theme: 'plain',
    styles: {
      fontSize: 10,
      cellPadding: 3
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 60 },
      1: { cellWidth: 110 }
    },
    didDrawCell: function(data: any) {
      if (data.column.index === 1) {
        doc.setDrawColor(200, 200, 200)
        doc.line(
          data.cell.x + 2,
          data.cell.y + data.cell.height - 2,
          data.cell.x + data.cell.width - 2,
          data.cell.y + data.cell.height - 2
        )
      }
    }
  })

  // Machtiging tekst
  const machtigingY = (doc as any).lastAutoTable.finalY + 15
  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)
  doc.text('Door ondertekening van dit formulier geeft u toestemming aan StayCool Airco B.V.', 20, machtigingY)
  doc.text('om doorlopende incasso-opdrachten te sturen naar uw bank om het verschuldigde', 20, machtigingY + 5)
  doc.text('bedrag van uw rekening af te schrijven.', 20, machtigingY + 10)

  // Handtekening sectie
  const sigSectionY = machtigingY + 25
  doc.setFontSize(14)
  doc.text('Handtekening', 20, sigSectionY)

  const signatureData = [
    ['Plaats', ''],
    ['Datum', ''],
    ['Handtekening', '']
  ]

  autoTable(doc, {
    startY: sigSectionY + 5,
    head: [],
    body: signatureData,
    theme: 'plain',
    styles: {
      fontSize: 10,
      cellPadding: 3
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 60 },
      1: { cellWidth: 110 }
    },
    didDrawCell: function(data: any) {
      if (data.column.index === 1) {
        doc.setDrawColor(200, 200, 200)
        if (data.row.index === 2) {
          // Signature box
          doc.rect(data.cell.x + 2, data.cell.y + 2, 100, 25)
        } else {
          // Underline
          doc.line(
            data.cell.x + 2,
            data.cell.y + data.cell.height - 2,
            data.cell.x + data.cell.width - 2,
            data.cell.y + data.cell.height - 2
          )
        }
      }
    }
  })

  // SEPA mandate info
  const mandateY = (doc as any).lastAutoTable.finalY + 20
  doc.setFontSize(9)
  doc.setTextColor(80, 80, 80)
  doc.text('Incassant:', 20, mandateY)
  doc.text('StayCool Airco B.V.', 60, mandateY)
  doc.text('Incassant ID:', 20, mandateY + 5)
  doc.text('NL18ZZZ820658880000', 60, mandateY + 5)
  doc.text('Kenmerk machtiging:', 20, mandateY + 10)
  doc.text('____________________', 60, mandateY + 10)

  // Footer - same as original
  const footerY = 270
  doc.setDrawColor(200, 200, 200)
  doc.line(20, footerY - 5, 190, footerY - 5)

  doc.setFontSize(8)
  doc.setTextColor(100, 100, 100)
  doc.text('StayCool Airco B.V. | KvK: 82065888 | BTW: NL003638007B69', 105, footerY, { align: 'center' })
  doc.text('info@staycoolairco.nl | 046 202 1430', 105, footerY + 4, { align: 'center' })

  // Save the PDF
  doc.save(`StayCool_Blanco_Contract_${date.replace(/\//g, '-')}.pdf`)
}