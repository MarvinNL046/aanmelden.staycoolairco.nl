import { supabase } from './supabase'
import { CustomerData, SepaData } from '@/types/contract'
import { generateContractPDFBuffer } from '@/utils/pdf-generator'

export async function uploadContractPDF(
  customerData: CustomerData,
  sepaData: SepaData | null,
  contractId: string
): Promise<string | null> {
  if (!supabase) {
    console.log('Supabase not configured, skipping PDF upload')
    return null
  }

  try {
    // Generate PDF as buffer
    const pdfBuffer = generateContractPDFBuffer(customerData, sepaData, contractId)
    
    // Convert ArrayBuffer to Blob
    const pdfBlob = new Blob([pdfBuffer], { type: 'application/pdf' })
    
    // Upload to Supabase Storage
    const fileName = `${contractId}/contract.pdf`
    const { data, error } = await supabase.storage
      .from('contracts')
      .upload(fileName, pdfBlob, {
        contentType: 'application/pdf',
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Error uploading PDF:', error)
      return null
    }

    // Create a signed URL that expires in 1 year
    const { data: signedUrlData, error: urlError } = await supabase.storage
      .from('contracts')
      .createSignedUrl(fileName, 365 * 24 * 60 * 60) // 1 year expiry

    if (urlError || !signedUrlData?.signedUrl) {
      console.error('Error creating signed URL:', urlError)
      return null
    }

    console.log('PDF uploaded successfully:', {
      fileName,
      signedUrl: 'Generated (hidden for security)',
      timestamp: new Date().toISOString()
    })

    return signedUrlData.signedUrl
  } catch (error) {
    console.error('Error generating/uploading PDF:', error)
    return null
  }
}

export async function getContractPDFUrl(contractId: string): Promise<string | null> {
  if (!supabase) {
    return null
  }

  const fileName = `${contractId}/contract.pdf`
  
  // Create a signed URL that expires in 1 year
  const { data: signedUrlData, error } = await supabase.storage
    .from('contracts')
    .createSignedUrl(fileName, 365 * 24 * 60 * 60) // 1 year expiry

  if (error || !signedUrlData?.signedUrl) {
    console.error('Error creating signed URL:', error)
    return null
  }

  return signedUrlData.signedUrl
}