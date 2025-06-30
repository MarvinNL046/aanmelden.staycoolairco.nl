import { useState, useEffect } from 'react'

export function useLocalStorage<T>(key: string, initialValue: T) {
  // Always start with initial value to prevent hydration mismatch
  const [storedValue, setStoredValue] = useState<T>(initialValue)
  
  // Load from localStorage after mount
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    try {
      const item = window.localStorage.getItem(key)
      if (item) {
        setStoredValue(JSON.parse(item))
      }
    } catch (error) {
      console.error(`Error loading localStorage key "${key}":`, error)
    }
  }, [key])

  // Return een wrapped versie van useState's setter functie
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Sta toe dat value een functie is zodat we dezelfde API hebben als useState
      const valueToStore = value instanceof Function ? value(storedValue) : value
      
      setStoredValue(valueToStore)
      
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error)
    }
  }

  // Clear functie om data te verwijderen
  const clearValue = () => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key)
      }
      setStoredValue(initialValue)
    } catch (error) {
      console.error(`Error clearing localStorage key "${key}":`, error)
    }
  }

  return [storedValue, setValue, clearValue] as const
}