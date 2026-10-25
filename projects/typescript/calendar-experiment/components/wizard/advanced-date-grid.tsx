'use client'

import { useState } from 'react'

interface AdvancedDateGridProps {
  daysInMonth: number
  selectedDay: number
  onSelect: (day: number) => void
}

/**
 * Advanced Date Control: у каждого дня есть radio (реальный выбор), checkbox
 * (декоративный, ничего не решает) и индикатор. Работает только radio.
 */
export function AdvancedDateGrid({ daysInMonth, selectedDay, onSelect }: AdvancedDateGridProps) {
  const [decorativeChecks, setDecorativeChecks] = useState<Set<number>>(new Set())
  const [hoveredDay, setHoveredDay] = useState<number | null>(null)

  const toggleDecorative = (day: number) => {
    setDecorativeChecks((prev) => {
      const next = new Set(prev)
      next.has(day) ? next.delete(day) : next.add(day)
      return next
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">
        Выберите ровно один день. Остальные элементы отреагируют.
      </p>
      <div className="grid grid-cols-7 gap-1.5">
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
          const isSelected = day === selectedDay
          return (
            <div
              key={day}
              onMouseEnter={() => setHoveredDay(day)}
              onMouseLeave={() => setHoveredDay(null)}
              className={`relative flex flex-col items-center gap-1 rounded-sm border p-1.5 font-mono text-[10px] transition-opacity ${
                isSelected
                  ? 'border-foreground bg-secondary opacity-100'
                  : 'border-border opacity-60 hover:opacity-100'
              }`}
            >
              <span className="text-foreground">{String(day).padStart(2, '0')}</span>
              <div className="flex items-center gap-1">
                <input
                  type="radio"
                  name="advanced-date-day"
                  aria-label={`Выбрать день ${day} (основной выбор)`}
                  checked={isSelected}
                  onChange={() => onSelect(day)}
                  className="h-3 w-3 accent-foreground"
                />
                <input
                  type="checkbox"
                  aria-label={`Декоративный индикатор дня ${day} (не влияет на выбор)`}
                  checked={decorativeChecks.has(day)}
                  onChange={() => toggleDecorative(day)}
                  className="h-3 w-3 accent-cyan"
                />
              </div>
              <span
                className={`h-1 w-1 rounded-full ${isSelected ? 'bg-pink' : 'bg-transparent'}`}
                aria-hidden="true"
              />
              {hoveredDay === day && (
                <span className="pointer-events-none absolute -top-9 left-1/2 z-10 w-28 -translate-x-1/2 rounded-sm border border-border bg-popover p-1.5 text-center text-popover-foreground shadow-lg">
                  Radio = выбор.
                  <br />
                  Checkbox ни на что не влияет.
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
