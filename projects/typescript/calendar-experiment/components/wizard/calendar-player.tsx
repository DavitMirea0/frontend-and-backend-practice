'use client'

import { useEffect, useRef, useState } from 'react'

const DURATION_LABEL = '03:09'
const TICK_MS = 120
const TOTAL_TICKS = 60 // fake ~7s playthrough standing in for 03:09

export function CalendarPlayer() {
  const [playing, setPlaying] = useState(false)
  const [tick, setTick] = useState(0)
  const [message, setMessage] = useState<string | null>(null)
  const rhythmTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    if (!playing) return
    const interval = setInterval(() => {
      setTick((t) => {
        if (t + 1 >= TOTAL_TICKS) {
          setPlaying(false)
          return 0
        }
        return t + 1
      })
    }, TICK_MS)
    return () => clearInterval(interval)
  }, [playing])

  const togglePlay = () => {
    if (playing) {
      setPlaying(false)
      return
    }
    setPlaying(true)
    setTick(0)
    setMessage('Мы не можем включить песню. Но можем включить календарь.')
    if (rhythmTimer.current) clearTimeout(rhythmTimer.current)
    rhythmTimer.current = setTimeout(() => {
      setMessage('♫ temporal rhythm detected')
    }, 3000)
  }

  useEffect(() => {
    return () => {
      if (rhythmTimer.current) clearTimeout(rhythmTimer.current)
    }
  }, [])

  const pct = Math.round((tick / TOTAL_TICKS) * 100)

  return (
    <div className="flex flex-col gap-2 rounded-md border border-dashed border-border bg-secondary/30 p-3 font-mono text-xs">
      <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
        <span>♫ CALENDAR PLAYER</span>
        <span className="tabular-nums">{DURATION_LABEL}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full border border-border bg-card">
        <div
          className="h-full bg-pink transition-all duration-100"
          style={{ width: `${pct}%` }}
          aria-hidden="true"
        />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">TRACK: SEPTEMBER / CALENDAR EVENT</span>
        <button
          type="button"
          onClick={togglePlay}
          aria-label={playing ? 'Остановить воспроизведение' : 'Воспроизвести'}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm border border-border bg-card hover:border-foreground"
        >
          {playing ? '❙❙' : '▶'}
        </button>
      </div>
      {message && (
        <p role="status" className="text-muted-foreground">
          {message}
        </p>
      )}
    </div>
  )
}
