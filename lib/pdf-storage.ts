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

    // Get public URL instead of signed URL
    const { data: publicUrlData } = supabase.storage
      .from('contracts')
      .getPublicUrl(fileName)

    if (!publicUrlData?.publicUrl) {
      console.error('Error getting public URL')
      return null
    }

    console.log('PDF uploaded successfully:', {
      fileName,
      publicUrl: publicUrlData.publicUrl,
      timestamp: new Date().toISOString()
    })

    return publicUrlData.publicUrl
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
  
  // Get public URL instead of signed URL
  const { data: publicUrlData } = supabase.storage
    .from('contracts')
    .getPublicUrl(fileName)

  if (!publicUrlData?.publicUrl) {
    console.error('Error getting public URL')
    return null
  }

  return publicUrlData.publicUrl
}