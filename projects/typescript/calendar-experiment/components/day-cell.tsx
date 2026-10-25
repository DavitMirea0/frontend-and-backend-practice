'use client'

import { useState } from 'react'
import type { Meeting } from '@/lib/types'

interface DayCellProps {
  day: number
  isSelected: boolean
  meetings: Meeting[]
  onSelect: (day: number) => void
}

// Псевдослучайный, но детерминированный "показатель" ячейки — не значит ничего,
// но выглядит важным.
function pseudoScore(day: number) {
  return (day * 37) % 100
}

export function DayCell({ day, isSelected, meetings, onSelect }: DayCellProps) {
  const [hovered, setHovered] = useState(false)
  const score = pseudoScore(day)

  return (
    <button
      type="button"
      onClick={() => onSelect(day)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label={`День ${day}${meetings.length > 0 ? `, встреч: ${meetings.length}` : ''}${
        isSelected ? ', выбран' : ''
      }`}
      aria-pressed={isSelected}
      className="group relative flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-sm border border-transparent bg-transparent p-1 font-mono text-foreground transition-colors focus-visible:border-foreground focus-visible:outline-none"
    >
      <span
        className={`text-sm leading-none transition-colors ${
          hovered ? 'text-cyan-foreground' : 'text-muted-foreground'
        } ${isSelected ? 'font-bold' : 'font-normal'}`}
      >
        {String(day).padStart(2, '0')}
      </span>
      <span
        className={`h-1 w-1 rounded-full transition-all ${
          isSelected
            ? 'w-3 bg-pink'
            : meetings.length > 0
              ? 'bg-acid'
              : 'bg-transparent'
        }`}
      />
      {hovered && (
        <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-1 w-40 -translate-x-1/2 rounded-sm border border-border bg-popover p-2 text-left text-[10px] leading-relaxed text-popover-foreground shadow-lg font-mono">
          День: {day}
          <br />
          Локальный индекс комфорта: {score}%
          <br />
          Встреч сегодня: {meetings.length}
          <br />
          Календарное трение: {(100 - score).toString().padStart(2, '0')} ед.
        </span>
      )}
    </button>
  )
}
