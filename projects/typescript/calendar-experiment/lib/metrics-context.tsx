'use client'

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'

interface Metrics {
  uxQuality: number
  userComfort: number
  systemReliability: number
  entropy: number
  errorCount: number
}

interface MetricsContextValue extends Metrics {
  bump: () => void
  registerError: () => void
}

const INITIAL: Metrics = {
  uxQuality: 2,
  userComfort: 1,
  systemReliability: 99,
  entropy: 73,
  errorCount: 0,
}

const MetricsContext = createContext<MetricsContextValue | null>(null)

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function MetricsProvider({ children }: { children: ReactNode }) {
  const [metrics, setMetrics] = useState<Metrics>(INITIAL)
  const errorCountRef = useRef(0)

  const bump = useCallback(() => {
    setMetrics((prev) => ({
      ...prev,
      entropy: clamp(prev.entropy + Math.round((Math.random() - 0.5) * 14), 41, 96),
      uxQuality: clamp(prev.uxQuality + Math.round((Math.random() - 0.7) * 3), 0, 4),
      userComfort: clamp(prev.userComfort + Math.round((Math.random() - 0.6) * 2), 0, 3),
      systemReliability: clamp(prev.systemReliability + Math.round((Math.random() - 0.3) * 2), 97, 100),
    }))
  }, [])

  const registerError = useCallback(() => {
    errorCountRef.current += 1
    setMetrics((prev) => ({ ...prev, entropy: clamp(prev.entropy + 5, 41, 99) }))
  }, [])

  return (
    <MetricsContext.Provider value={{ ...metrics, bump, registerError }}>
      {children}
    </MetricsContext.Provider>
  )
}

export function useMetrics() {
  const ctx = useContext(MetricsContext)
  if (!ctx) throw new Error('useMetrics must be used within MetricsProvider')
  return ctx
}
