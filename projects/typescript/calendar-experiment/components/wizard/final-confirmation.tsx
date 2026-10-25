'use client'

import { MONTH_NAMES } from '../calendar-header'
import { toRoman } from '@/lib/roman'

interface FinalConfirmationProps {
  title: string
  year: number
  month: number
  day: number
  hour: number
  minute: number
  tooFast: boolean
  onReturn: () => void
}

export function FinalConfirmation({
  title,
  year,
  month,
  day,
  hour,
  minute,
  tooFast,
  onReturn,
}: FinalConfirmationProps) {
  return (
    <div className="flex flex-col items-center gap-6 py-4 text-center">
      <span className="font-mono text-xs uppercase tracking-[0.2em] text-cyan-foreground">
        ВСТРЕЧА СОХРАНЕНА
      </span>
      <h2 className="text-3xl font-bold sm:text-4xl">{title}</h2>
      <dl className="grid grid-cols-2 gap-4 font-mono text-sm">
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
      </dl>

      <div className="w-full max-w-xs rounded-md border border-border bg-secondary/40 p-4 font-mono text-xs text-left">
        <p className="mb-3 text-center text-foreground">ВСТРЕЧА СОХРАНЕНА</p>
        <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2">
          <dt className="text-muted-foreground">Дата:</dt>
          <dd>03.09</dd>
          <dt className="text-muted-foreground">Время:</dt>
          <dd>
            {toRoman(hour)}:{toRoman(minute)}
          </dd>
          <dt className="text-muted-foreground">Human verification:</dt>
          <dd>PASSED</dd>
          <dt className="text-muted-foreground">Calendar sanity:</dt>
          <dd>FAILED</dd>
          <dt className="text-muted-foreground">UX quality:</dt>
          <dd>2%</dd>
          <dt className="text-muted-foreground">System reliability:</dt>
          <dd>100%</dd>
        </dl>
      </div>

      <div className="w-full max-w-xs">
        <div className="h-2 w-full overflow-hidden rounded-full border border-border bg-secondary">
          <div className="h-full w-full bg-acid" />
        </div>
        <p className="mt-1 font-mono text-[10px] text-muted-foreground">Статус: 100%</p>
      </div>

      <p className="font-mono text-xs text-muted-foreground">
        Спасибо,
        <br />
        что перевернули календарь.
        <br />
        <br />
        Встреча назначена.
        <br />
        Календарь перевёрнут.
        <br />
        Человек подтверждён.
      </p>

      {tooFast && (
        <p className="font-mono text-xs text-pink-foreground">
          Подозрительно быстро. Вы точно человек?
        </p>
      )}

      <button
        type="button"
        onClick={onReturn}
        className="rounded-sm border border-foreground bg-primary px-6 py-2 font-mono text-sm text-primary-foreground"
      >
        [ Вернуться в календарь ]
      </button>
    </div>
  )
}
