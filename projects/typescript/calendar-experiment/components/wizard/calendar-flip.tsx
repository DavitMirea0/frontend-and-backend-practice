'use client'

import { useState } from 'react'

export function CalendarFlip({ onPass }: { onPass: () => void }) {
  const [flipCount, setFlipCount] = useState(0)
  const [message, setMessage] = useState<string | null>(null)

  const backLabel = flipCount === 1 ? '02.09' : flipCount >= 2 ? '03.09' : ''

  const handleFlip = () => {
    if (flipCount >= 2) {
      setMessage('Очень хорошо.\n\nВы ничего не перевернули.')
      setTimeout(onPass, 1100)
      return
    }
    setFlipCount((c) => c + 1)
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">
        Переверните календарь, чтобы продолжить.
      </p>

      <div className="relative h-32 w-48 [perspective:800px]">
        <div
          className="absolute inset-0 rounded-md border border-border bg-card shadow-md transition-transform duration-500 [transform-style:preserve-3d]"
          style={{ transform: `rotateY(${flipCount * 180}deg)` }}
        >
          <div className="absolute inset-0 flex items-center justify-center font-mono text-sm text-muted-foreground [backface-visibility:hidden]">
            СЕНТЯБРЬ
          </div>
          <div
            className="absolute inset-0 flex items-center justify-center font-mono text-2xl font-bold text-foreground [backface-visibility:hidden]"
            style={{ transform: 'rotateY(180deg)' }}
          >
            {backLabel}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleFlip}
        className="rounded-sm border border-foreground bg-primary px-6 py-2 font-mono text-sm text-primary-foreground"
      >
        {flipCount >= 2 ? '[ НЕ ПЕРЕВОРАЧИВАТЬ ]' : '[ ПЕРЕВЕРНУТЬ КАЛЕНДАРЬ ]'}
      </button>

      {message && (
        <p role="status" className="whitespace-pre-line text-center font-mono text-xs text-foreground">
          {message}
        </p>
      )}
    </div>
  )
}
