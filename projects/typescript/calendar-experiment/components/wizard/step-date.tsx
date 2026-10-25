'use client'

import { useEffect, useState } from 'react'
import { AdvancedDateGrid } from './advanced-date-grid'

interface StepDateProps {
  year: number
  month: number
  day: number
  onChangeDay: (day: number) => void
  onNext: () => void
  onBack: () => void
}

export function StepDate({ year, month, day, onChangeDay, onNext, onBack }: StepDateProps) {
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const [visitedTwo, setVisitedTwo] = useState(day === 2)
  const [message, setMessage] = useState<string | null>(day === 2 ? 'Интересный выбор.\n\nНо календарь кое-что помнит.' : null)

  useEffect(() => {
    if (!visitedTwo || day !== 2) return
    const timer = setTimeout(() => {
      setMessage('Попробуйте посмотреть на следующий день.')
    }, 1800)
    return () => clearTimeout(timer)
  }, [visitedTwo, day])

  const handleSelect = (nextDay: number) => {
    if (nextDay === 2) {
      setVisitedTwo(true)
      setMessage('Интересный выбор.\n\nНо календарь кое-что помнит.')
    } else if (nextDay === 3 && visitedTwo) {
      setMessage('Теперь понятно.')
    } else {
      setMessage(null)
    }
    onChangeDay(nextDay)
  }

  return (
    <div className="flex flex-col gap-6">
      <AdvancedDateGrid daysInMonth={daysInMonth} selectedDay={day} onSelect={handleSelect} />
      {message && (
        <p role="status" className="whitespace-pre-line font-mono text-xs text-pink-foreground">
          {message}
        </p>
      )}
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
          className="rounded-sm border border-border bg-primary px-5 py-2 font-mono text-sm text-primary-foreground"
        >
          Локализовать →
        </button>
      </div>
    </div>
  )
}
