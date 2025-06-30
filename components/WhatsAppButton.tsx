'use client'

interface Props {
  phoneNumber?: string
  message?: string
  className?: string
}

export default function WhatsAppButton({ 
  phoneNumber = '31462021430', // StayCool Airco nummer zonder +
  message = 'Hallo, ik heb een vraag over het onderhoudscontract',
  className = ''
}: Props) {
  const handleClick = () => {
    const encodedMessage = encodeURIComponent(message)
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`
    window.open(whatsappUrl, '_blank')
  }

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center px-4 sm:px-6 py-2.5 sm:py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors text-sm sm:text-base ${className}`}
      type="button"
    >
      <svg 
        className="w-5 h-5 sm:w-6 sm:h-6 mr-2" 
        fill="currentColor" 
        viewBox="0 0 24 24"
      >
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 15.56c-.21.21-.45.39-.71.52-.74.37-1.58.56-2.41.56-1.32 0-2.63-.49-3.65-1.43-1.02-.94-1.89-2.18-2.42-3.57-.27-.71-.42-1.46-.42-2.21 0-.65.12-1.28.35-1.85.23-.58.59-1.11 1.04-1.56.47-.47 1.04-.84 1.65-1.08.62-.24 1.29-.37 1.97-.37.28 0 .56.02.83.07.27.05.53.12.78.22l-.39 2.25c-.17-.06-.35-.1-.53-.13-.18-.03-.37-.04-.55-.04-.78 0-1.51.3-2.06.85-.55.55-.85 1.28-.85 2.06 0 .51.13 1.01.38 1.45.39.69.95 1.28 1.6 1.7.65.42 1.4.66 2.17.66.37 0 .74-.06 1.09-.17.17-.06.34-.13.5-.22l.46 2.22c-.26.11-.53.2-.81.26-.43.1-.88.15-1.33.15-.84 0-1.67-.19-2.41-.56-.26-.13-.5-.31-.71-.52z"/>
      </svg>
      WhatsApp Contact
    </button>
  )
}