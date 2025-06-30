'use client'

import { useEffect } from 'react'

export default function ServiceWorkerCleanup() {
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return

    // Force clean all service workers and caches
    const cleanup = async () => {
      try {
        // Unregister ALL service workers
        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations()
          for (const registration of registrations) {
            await registration.unregister()
            console.log('Service worker unregistered')
          }
        }

        // Clear ALL caches
        if ('caches' in window) {
          const cacheNames = await caches.keys()
          for (const cacheName of cacheNames) {
            await caches.delete(cacheName)
            console.log('Cache cleared:', cacheName)
          }
        }

        // If we found old service workers, just clean them silently
        // No need to reload - the page will work normally
      } catch (error) {
        console.error('Cleanup error:', error)
      }
    }

    cleanup()
  }, [])

  return null
}