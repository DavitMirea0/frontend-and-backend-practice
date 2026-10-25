'use client'

import { MONTH_NAMES } from './calendar-header'
import type { Meeting } from '@/lib/types'

export function MeetingList({ meetings }: { meetings: Meeting[] }) {
  if (meetings.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border p-4 font-mono text-xs text-muted-foreground">
        Зафиксированных событий не обнаружено. Это нормально. Пока что.
      </div>
    )
  }

  const sorted = [...meetings].sort((a, b) => {
    const da = new Date(a.year, a.month, a.day, a.hour, a.minute).getTime()
    const db = new Date(b.year, b.month, b.day, b.hour, b.minute).getTime()
    return da - db
  })

  return (
    <ul className="flex flex-col gap-2">
      {sorted.map((m) => (
        <li
          key={m.id}
          className="flex flex-col gap-1 rounded-md border border-border bg-card p-3 font-mono text-sm sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex flex-col gap-0.5">
            <span className="font-sans font-semibold text-foreground">{m.title}</span>
            <span className="text-xs text-muted-foreground">
              {m.day} {MONTH_NAMES[m.month].toLowerCase()} {m.year} ·{' '}
              {String(m.hour).padStart(2, '0')}:{String(m.minute).padStart(2, '0')}
            </span>
          </div>
          <div className="flex flex-wrap gap-1">
            {m.participants.map((p) => (
              <span
                key={p}
                className="rounded-full border border-border bg-secondary px-2 py-0.5 text-[10px] text-secondary-foreground"
              >
                {p}
              </span>
            ))}
          </div>
        </li>
      ))}
    </ul>
  )
}
