import type { Id } from '@/convex/_generated/dataModel'
import { CustomerData, SepaData } from '@/types/contract'
import { generateContractPDFBuffer } from '@/utils/pdf-generator'

export async function uploadContractPDF(
  uploadUrl: string,
  customerData: CustomerData,
  sepaData: SepaData | null,
  contractId: string
): Promise<Id<'_storage'> | null> {
  try {
    const pdfBuffer = generateContractPDFBuffer(customerData, sepaData, contractId)
    const pdfBlob = new Blob([pdfBuffer], { type: 'application/pdf' })

    const result = await fetch(uploadUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/pdf' },
      body: pdfBlob,
    })

    if (!result.ok) {
      console.error('PDF upload failed:', result.status, await result.text())
      return null
    }

    const { storageId } = (await result.json()) as { storageId: Id<'_storage'> }
    return storageId
  } catch (error) {
    console.error('Error generating/uploading PDF:', error)
    return null
  }
}
