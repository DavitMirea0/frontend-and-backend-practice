'use client'

import { useState } from 'react'
import { REQUIRED_SEPTEMBER_TOKENS, SEPTEMBER_TOKENS } from '@/lib/september-captcha'

export function TokenSelector({ onPass }: { onPass: (tokens: string[]) => void }) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)

  const toggle = (token: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(token) ? next.delete(token) : next.add(token)
      return next
    })
    setError(null)
  }

  const submit = () => {
    const isValid = REQUIRED_SEPTEMBER_TOKENS.every((t) => selected.has(t))
    if (isValid) {
      onPass([...selected])
      return
    }
    setError('Не то.\nНо мы верим в вас.')
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">
        Выберите элементы, связанные с календарной аномалией сентября.
      </p>
      <div className="flex flex-wrap gap-2">
        {SEPTEMBER_TOKENS.map((token) => {
          const isSelected = selected.has(token)
          return (
            <button
              key={token}
              type="button"
              onClick={() => toggle(token)}
              aria-pressed={isSelected}
              className={`rounded-sm border px-3 py-1.5 font-mono text-xs transition-colors ${
                isSelected
                  ? 'border-foreground bg-acid text-acid-foreground'
                  : 'border-border bg-card text-foreground hover:border-foreground/50'
              }`}
            >
              {token}
            </button>
          )
        })}
      </div>
      {error && (
        <p role="alert" className="whitespace-pre-line font-mono text-xs text-destructive">
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={submit}
        disabled={selected.size === 0}
        className="self-start rounded-sm border border-border bg-primary px-5 py-2 font-mono text-sm text-primary-foreground disabled:cursor-not-allowed disabled:opacity-30"
      >
        Подтвердить выбор
      </button>
    </div>
  )
}
