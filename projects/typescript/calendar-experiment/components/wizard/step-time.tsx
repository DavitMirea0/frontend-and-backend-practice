'use client'

import { useMemo } from 'react'
import { ReverseClock } from './reverse-clock'
import { MinuteSelector } from './minute-selector'
import { RomanTimeInput } from './roman-time-input'

interface StepTimeProps {
  hour: number
  minute: number
  onChangeHour: (hour: number) => void
  onChangeMinute: (minute: number) => void
  onRomanAccepted: () => void
  onNext: () => void
  onBack: () => void
}

const OVERLOAD_LABELS = [
  'Precision mode',
  'Temporal alignment',
  'UX compatibility',
  'Meeting confidence',
]

export function StepTime({
  hour,
  minute,
  onChangeHour,
  onChangeMinute,
  onRomanAccepted,
  onNext,
  onBack,
}: StepTimeProps) {
  const overloadValues = useMemo(
    () => OVERLOAD_LABELS.map(() => Math.round(40 + Math.random() * 59)),
    [hour, minute],
  )

  return (
    <div className="flex flex-col gap-6">
      <ReverseClock hour={hour} onChange={onChangeHour} />
      <MinuteSelector minute={minute} onChange={onChangeMinute} />
      <RomanTimeInput hour={hour} onChange={onChangeHour} onRomanAccepted={onRomanAccepted} />

      <div className="rounded-md border border-border bg-secondary/40 p-3">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
          Служебные показатели (не влияют на сохранение)
        </p>
        <div className="grid grid-cols-2 gap-2 font-mono text-[10px] text-muted-foreground sm:grid-cols-4">
          {OVERLOAD_LABELS.map((label, i) => (
            <div key={label} className="flex flex-col gap-0.5">
              <span>{label}</span>
              <span className="text-foreground">{overloadValues[i]}%</span>
            </div>
          ))}
        </div>
        <p className="mt-2 font-mono text-[10px] text-muted-foreground">
          Precision: 0.0001 temporal units
        </p>
      </div>

      <div className="flex items-center justify-between font-mono text-sm">
        <span className="text-muted-foreground">
          Выбрано: {String(hour).padStart(2, '0')}:{String(minute).padStart(2, '0')}
        </span>
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
          className="rounded-sm border border-border bg-primary px-5 py-2 font-mono text-sm text-primary-foreground"
        >
          Калибровать →
        </button>
      </div>
    </div>
  )
}
