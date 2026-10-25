'use client'

import type { Meeting } from '@/lib/types'
import { DayCell } from './day-cell'

const WEEKDAYS = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'НД']

interface MonthGridProps {
  year: number
  month: number
  selectedDay: number | null
  meetings: Meeting[]
  onSelectDay: (day: number) => void
}

export function MonthGrid({ year, month, selectedDay, meetings, onSelectDay }: MonthGridProps) {
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7 // 0 = понедельник

  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const meetingsByDay = new Map<number, Meeting[]>()
  for (const m of meetings) {
    if (m.year === year && m.month === month) {
      meetingsByDay.set(m.day, [...(meetingsByDay.get(m.day) ?? []), m])
    }
  }

  return (
    <div className="rounded-md border border-border bg-card p-3 sm:p-4">
      <div className="mb-2 grid grid-cols-7 gap-1">
        {WEEKDAYS.map((wd) => (
          <div
            key={wd}
            className="text-center text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground"
          >
            {wd}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, idx) =>
          day === null ? (
            <div key={`empty-${idx}`} />
          ) : (
            <DayCell
              key={day}
              day={day}
              isSelected={selectedDay === day}
              meetings={meetingsByDay.get(day) ?? []}
              onSelect={onSelectDay}
            />
          ),
        )}
      </div>
    </div>
  )
}
