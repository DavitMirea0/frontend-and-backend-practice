'use client'

import { useEffect, useRef, useState } from 'react'
import { getDateFeedback } from '@/lib/september-captcha'

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
const DAYS = Array.from({ length: 30 }, (_, i) => i + 1)
const COMMIT_DELAY = 650

interface DateAnomalyGridProps {
  onResolved: (elapsedMs: number) => void
  onVisitTwo: () => void
  onWrongDate?: (day: number) => void
  hasVisitedTwo: boolean
}

export function DateAnomalyGrid({ onResolved, onVisitTwo, onWrongDate, hasVisitedTwo }: DateAnomalyGridProps) {
  const [pending, setPending] = useState<number | null>(null)
  const [committed, setCommitted] = useState<number | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [resolved, setResolved] = useState(false)
  const [hoverDay, setHoverDay] = useState<number | null>(null)
  const [slowNudge, setSlowNudge] = useState<string | null>(null)
  const startedAt = useRef(Date.now())
  const commitTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    const first = setTimeout(() => {
      if (!resolved) setSlowNudge('Вы всё ещё выбираете дату?\nДата уже выбрала вас.')
    }, 30_000)
    const second = setTimeout(() => {
      if (!resolved) setSlowNudge('03.09 is waiting.')
    }, 35_000)
    return () => {
      clearTimeout(first)
      clearTimeout(second)
    }
  }, [resolved])

  useEffect(() => {
    return () => {
      if (commitTimer.current) clearTimeout(commitTimer.current)
    }
  }, [])

  const selectDay = (day: number) => {
    if (resolved) return
    setPending(day)
    setSlowNudge(null)

    if (day === 2 && !hasVisitedTwo) {
      onVisitTwo()
      onWrongDate?.(day)
      setMessage('Интересный выбор.\n\nНо календарь кое-что помнит.')
      setTimeout(() => setMessage('Попробуйте посмотреть на следующий день.'), 1800)
      setPending(null)
      return
    }

    if (commitTimer.current) clearTimeout(commitTimer.current)
    commitTimer.current = setTimeout(() => {
      setCommitted(day)
      setPending(null)
      setMessage(getDateFeedback(day, hasVisitedTwo))

      if (day === 3) {
        setResolved(true)
        const elapsed = Date.now() - startedAt.current
        setTimeout(() => onResolved(elapsed), 900)
      } else {
        onWrongDate?.(day)
      }
    }, COMMIT_DELAY)
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">
        Календарь перевёрнут. Какую дату он показывает?
      </p>

      <div className="grid grid-cols-7 gap-1 text-center font-mono text-[10px] uppercase text-muted-foreground">
        {WEEKDAYS.map((wd) => (
          <span key={wd}>{wd}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {DAYS.map((day) => {
          const isCommitted = committed === day
          const isPending = pending === day
          return (
            <div key={day} className="relative">
              <button
                type="button"
                disabled={resolved}
                onClick={() => selectDay(day)}
                onMouseEnter={() => setHoverDay(day)}
                onMouseLeave={() => setHoverDay(null)}
                className={`flex aspect-square w-full items-center justify-center rounded-sm border font-mono text-xs transition-colors ${
                  isCommitted
                    ? 'border-foreground bg-secondary text-foreground'
                    : isPending
                      ? 'border-foreground/60 bg-secondary/50 text-muted-foreground'
                      : 'border-border bg-card text-foreground hover:border-foreground/50'
                } disabled:cursor-default`}
              >
                {String(day).padStart(2, '0')}
              </button>
              {hoverDay === day && day === 3 && !resolved && (
                <span className="pointer-events-none absolute -top-9 left-1/2 z-10 w-32 -translate-x-1/2 rounded-sm border border-border bg-popover p-1.5 text-center font-mono text-[10px] text-popover-foreground shadow-lg">
                  Это может быть важно.
                </span>
              )}
            </div>
          )
        })}
      </div>

      <div className="flex items-center justify-between font-mono text-[10px] text-muted-foreground">
        <span>Temporal confidence: {resolved ? '100%' : `${30 + (pending ?? 0)}%`}</span>
      </div>

      {message && (
        <p role="status" className="whitespace-pre-line font-mono text-xs text-foreground">
          {message}
        </p>
      )}
      {slowNudge && !resolved && (
        <p role="status" className="whitespace-pre-line font-mono text-xs text-pink-foreground">
          {slowNudge}
        </p>
      )}
    </div>
  )
}
