'use client'

import { useId, useState } from 'react'
import { PARTICIPANT_POOL } from '@/lib/types'

interface StepIntentProps {
  title: string
  participants: string[]
  onChange: (patch: { title?: string; participants?: string[] }) => void
  onNext: () => void
}

export function StepIntent({ title, participants, onChange, onNext }: StepIntentProps) {
  const titleId = useId()
  const [touched, setTouched] = useState(false)

  const toggleParticipant = (name: string) => {
    const next = participants.includes(name)
      ? participants.filter((p) => p !== name)
      : [...participants, name]
    onChange({ participants: next })
  }

  const canProceed = title.trim().length > 1 && participants.length > 0

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <label htmlFor={titleId} className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">
          Формулировка события
        </label>
        <input
          id={titleId}
          type="text"
          value={title}
          onChange={(e) => onChange({ title: e.target.value })}
          onBlur={() => setTouched(true)}
          placeholder="Встреча с командой"
          className="rounded-sm border border-border bg-input/40 px-3 py-2 font-mono text-sm text-foreground outline-none focus-visible:border-foreground"
        />
        {touched && title.trim().length <= 1 && (
          <p className="font-mono text-xs text-destructive">
            Намерение слишком неопределённое. Уточните формулировку.
          </p>
        )}
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">
          Участники (выберите хотя бы одного — индикатор проявится при наведении)
        </legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {PARTICIPANT_POOL.map((name) => {
            const checked = participants.includes(name)
            return (
              <label
                key={name}
                className="group flex cursor-pointer items-center gap-2 rounded-sm border border-border p-2 font-mono text-xs"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleParticipant(name)}
                  className="peer sr-only"
                />
                <span
                  className={`h-2 w-2 shrink-0 rounded-full border border-border transition-colors ${
                    checked ? 'bg-cyan' : 'bg-transparent group-hover:border-foreground'
                  }`}
                  aria-hidden="true"
                />
                <span className={checked ? 'text-foreground' : 'text-muted-foreground'}>{name}</span>
              </label>
            )
          })}
        </div>
      </fieldset>

      <button
        type="button"
        disabled={!canProceed}
        onClick={onNext}
        className="self-end rounded-sm border border-border bg-primary px-5 py-2 font-mono text-sm text-primary-foreground transition-opacity disabled:cursor-not-allowed disabled:opacity-30"
      >
        Зафиксировать намерение →
      </button>
    </div>
  )
}
