// Simple client-side rate limiter using localStorage
export class RateLimiter {
  private key: string
  private maxAttempts: number
  private windowMs: number

  constructor(key: string, maxAttempts: number = 3, windowMs: number = 60000) {
    this.key = `rate_limit_${key}`
    this.maxAttempts = maxAttempts
    this.windowMs = windowMs
  }

  canAttempt(): boolean {
    if (typeof window === 'undefined') return true
    
    const now = Date.now()
    const attempts = this.getAttempts()
    
    // Clean old attempts
    const validAttempts = attempts.filter(time => now - time < this.windowMs)
    
    if (validAttempts.length >= this.maxAttempts) {
      return false
    }
    
    return true
  }

  recordAttempt(): void {
    if (typeof window === 'undefined') return
    
    const now = Date.now()
    const attempts = this.getAttempts()
    attempts.push(now)
    
    // Keep only recent attempts
    const validAttempts = attempts.filter(time => now - time < this.windowMs)
    
    localStorage.setItem(this.key, JSON.stringify(validAttempts))
  }

  getRemainingTime(): number {
    if (typeof window === 'undefined') return 0
    
    const attempts = this.getAttempts()
    if (attempts.length === 0) return 0
    
    const oldestAttempt = Math.min(...attempts)
    const remainingMs = this.windowMs - (Date.now() - oldestAttempt)
    
    return Math.max(0, Math.ceil(remainingMs / 1000))
  }

  private getAttempts(): number[] {
    try {
      const data = localStorage.getItem(this.key)
      return data ? JSON.parse(data) : []
    } catch {
      return []
    }
  }

  reset(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.key)
    }
  }
}