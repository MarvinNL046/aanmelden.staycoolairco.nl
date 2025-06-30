// IBAN validatie met checksum controle
export function validateIBAN(iban: string): boolean {
  // Verwijder spaties en maak hoofdletters
  const cleanIBAN = iban.replace(/\s/g, '').toUpperCase()
  
  // Basis checks
  if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(cleanIBAN)) return false
  if (cleanIBAN.length < 15 || cleanIBAN.length > 34) return false
  
  // Nederlandse IBAN specifieke check
  if (cleanIBAN.startsWith('NL') && cleanIBAN.length !== 18) return false
  
  // IBAN checksum validatie (mod 97)
  const rearranged = cleanIBAN.substring(4) + cleanIBAN.substring(0, 4)
  const numeric = rearranged.replace(/[A-Z]/g, (char) => (char.charCodeAt(0) - 55).toString())
  
  // Gebruik BigInt voor grote getallen
  const remainder = BigInt(numeric) % 97n
  
  return remainder === 1n
}

// Nederlandse bank codes voor extra validatie
const DUTCH_BANKS: Record<string, string> = {
  'ABNA': 'ABN AMRO',
  'RABO': 'Rabobank',
  'INGB': 'ING',
  'SNSB': 'SNS Bank',
  'TRIO': 'Triodos Bank',
  'BUNQ': 'Bunq',
  'KNAB': 'Knab',
  'ASNB': 'ASN Bank',
  'RBRB': 'RegioBank'
}

export function getBankName(iban: string): string | null {
  const cleanIBAN = iban.replace(/\s/g, '').toUpperCase()
  if (!cleanIBAN.startsWith('NL')) return null
  
  const bankCode = cleanIBAN.substring(4, 8)
  return DUTCH_BANKS[bankCode] || 'Onbekende bank'
}

export function formatIBAN(iban: string): string {
  const cleaned = iban.replace(/\s/g, '').toUpperCase()
  const groups = cleaned.match(/.{1,4}/g) || []
  return groups.join(' ')
}