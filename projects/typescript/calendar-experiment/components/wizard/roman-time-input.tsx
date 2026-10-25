'use client'

import { useId, useRef, useState } from 'react'
import { fromRoman, toRoman } from '@/lib/roman'

export function RomanTimeInput({
  hour,
  onChange,
  onRomanAccepted,
}: {
  hour: number
  onChange: (hour: number) => void
  onRomanAccepted?: () => void
}) {
  const id = useId()
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [hintRevealed, setHintRevealed] = useState(false)
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const handleHoverStart = () => {
    hoverTimer.current = setTimeout(() => setHintRevealed(true), 1800)
  }
  const handleHoverEnd = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current)
  }

  const submit = () => {
    const parsed = fromRoman(value)
    if (parsed === null || parsed < 1 || parsed > 23) {
      setError('Нераспознанное значение времени. Используйте римские цифры от I до XXIII.')
      return
    }
    setError(null)
    onChange(parsed)
    onRomanAccepted?.()
    setValue('')
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border border-dashed border-border p-3">
      <label htmlFor={id} className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">
        Альтернативный ввод часа
      </label>
      <div
        className="flex items-center gap-2"
        onMouseEnter={handleHoverStart}
        onMouseLeave={handleHoverEnd}
      >
        <input
          id={id}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit()
          }}
          placeholder="формат: ███"
          className="w-32 rounded-sm border border-border bg-input/40 px-3 py-1.5 font-mono text-sm uppercase tracking-widest outline-none focus-visible:border-foreground"
        />
        <button
          type="button"
          onClick={submit}
          className="rounded-sm border border-border px-3 py-1.5 font-mono text-xs text-foreground hover:bg-accent"
        >
          Применить
        </button>
        <span className="font-mono text-[10px] text-muted-foreground">
          {hintRevealed ? 'римские цифры' : ''}
        </span>
      </div>
      {error && <p className="font-mono text-xs text-destructive">{error}</p>}
      <p className="font-mono text-[10px] text-muted-foreground">
        Текущий час эквивалентен: {toRoman(hour === 0 ? 24 : hour)}
      </p>
    </div>
  )
}
