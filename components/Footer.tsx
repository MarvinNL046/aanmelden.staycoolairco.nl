export default function Footer() {
  return (
    <footer className="mt-16 border-t border-gray-200 bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">StayCool Airco B.V.</h3>
            <p className="text-sm text-gray-600">
              Specialist in airconditioning installatie en onderhoud.<br />
              Tel: 046 202 1430<br />
              Email: info@staycoolairco.nl
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Juridische informatie</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a 
                  href="https://staycoolairco.nl/privacy" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  Privacyverklaring
                </a>
              </li>
              <li>
                <a 
                  href="https://staycoolairco.nl/voorwaarden" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  Algemene voorwaarden
                </a>
              </li>
              <li>
                <a 
                  href="https://staycoolairco.nl/cookie-policy" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  Cookiebeleid
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-gray-200 text-center text-sm text-gray-600">
          <p>© 2025 StayCool Airco B.V. | KvK: 82065888 | BTW: NL003638007B69</p>
        </div>
      </div>
    </footer>
  )
}