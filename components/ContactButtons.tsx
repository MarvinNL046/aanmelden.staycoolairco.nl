export default function ContactButtons() {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
      <a href="tel:+31462021430" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-800 sm:text-base">
        <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.69 2.79a2 2 0 0 1-.45 2.11L8.09 9.89a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.89.33 1.83.56 2.79.69A2 2 0 0 1 22 16.92Z" /></svg>
        Bel 046 202 1430
      </a>
      <a href="mailto:info@staycoolairco.nl?subject=Vraag%20over%20onderhoudsabonnement" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-blue-700 bg-white px-5 py-3 text-sm font-semibold text-blue-800 transition-colors hover:bg-blue-50 sm:text-base">
        <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 6 9 7 9-7" /></svg>
        Mail ons
      </a>
    </div>
  )
}
