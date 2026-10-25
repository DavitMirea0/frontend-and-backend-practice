'use client'

import { useEffect, useState } from 'react'
import { MONTH_NAMES } from '../calendar-header'

interface StepReviewProps {
  title: string
  participants: string[]
  year: number
  month: number
  day: number
  hour: number
  minute: number
  captchaPassed: boolean
  onNext: () => void
  onBack: () => void
}

// Флуктуирующий прогресс синхронизации — никогда не идёт линейно.
const PROGRESS_SEQUENCE = [83, 91, 82, 96, 89, 100]

export function StepReview({
  title,
  participants,
  year,
  month,
  day,
  hour,
  minute,
  captchaPassed,
  onNext,
  onBack,
}: StepReviewProps) {
  const [progressIndex, setProgressIndex] = useState(0)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (progressIndex >= PROGRESS_SEQUENCE.length - 1) {
      setDone(true)
      return
    }
    const delay = 300 + Math.random() * 700
    const timer = setTimeout(() => setProgressIndex((i) => i + 1), delay)
    return () => clearTimeout(timer)
  }, [progressIndex])

  return (
    <div className="flex flex-col gap-6">
      <dl className="grid grid-cols-1 gap-3 rounded-md border border-border bg-card p-4 font-mono text-sm sm:grid-cols-2">
        <div>
          <dt className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Название</dt>
          <dd className="font-sans font-semibold text-foreground">{title}</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Дата</dt>
          <dd>
            {day} {MONTH_NAMES[month].toLowerCase()} {year}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Время</dt>
          <dd>
            {String(hour).padStart(2, '0')}:{String(minute).padStart(2, '0')}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Участники</dt>
          <dd>{participants.join(', ')}</dd>
        </div>
      </dl>

      <div className="rounded-md border border-border bg-secondary/40 p-3 font-mono text-xs">
        <p className="mb-2 text-muted-foreground">Синхронизация календаря...</p>
        <div className="h-2 w-full overflow-hidden rounded-full border border-border bg-card">
          <div
            className="h-full bg-cyan transition-all duration-300"
            style={{ width: `${PROGRESS_SEQUENCE[progressIndex]}%` }}
          />
        </div>
        <p className="mt-1 tabular-nums text-muted-foreground">{PROGRESS_SEQUENCE[progressIndex]}%</p>
      </div>

      <div className="rounded-md border border-dashed border-border bg-card p-3 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
        Human calendar knowledge: {captchaPassed ? 'VERIFIED' : 'PENDING'}
        <br />
        September anomaly: {captchaPassed ? 'detected' : 'not yet detected'}
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="font-mono text-xs text-muted-foreground underline-offset-2 hover:underline"
        >
          ← назад
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!done || !captchaPassed}
          className="rounded-sm border border-border bg-primary px-5 py-2 font-mono text-sm text-primary-foreground disabled:cursor-not-allowed disabled:opacity-30"
        >
          Перейти к сохранению →
        </button>
      </div>
    </div>
  )
}
