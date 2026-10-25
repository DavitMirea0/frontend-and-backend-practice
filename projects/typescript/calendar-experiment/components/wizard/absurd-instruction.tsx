'use client'

import { useEffect, useState } from 'react'

const PROGRESS_SEQUENCE = [47, 46, 100]

export function AbsurdInstruction({ onContinue }: { onContinue: () => void }) {
  const [checking, setChecking] = useState(false)
  const [progressIndex, setProgressIndex] = useState(0)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!checking || done) return
    if (progressIndex >= PROGRESS_SEQUENCE.length - 1) {
      setDone(true)
      return
    }
    const timer = setTimeout(() => setProgressIndex((i) => i + 1), 600)
    return () => clearTimeout(timer)
  }, [checking, progressIndex, done])

  return (
    <div className="flex flex-col gap-4">
      <p className="whitespace-pre-line font-mono text-xs leading-relaxed text-muted-foreground">
        {`Для продолжения необходимо подтвердить,
что вы понимаете календарную природу
третьего дня девятого месяца.

Не выбирайте дату, если вы её не выбрали.

Если выбрали — переверните календарь.

Если календарь уже перевёрнут —
ничего не переворачивайте.`}
      </p>

      {!checking && (
        <button
          type="button"
          onClick={() => setChecking(true)}
          className="self-start rounded-sm border border-border bg-primary px-5 py-2 font-mono text-sm text-primary-foreground"
        >
          [ Я всё понял ]
        </button>
      )}

      {checking && !done && (
        <p role="status" className="font-mono text-xs text-muted-foreground">
          Проверка понимания...
          <br />
          {PROGRESS_SEQUENCE[progressIndex]}%
        </p>
      )}

      {done && (
        <div className="flex flex-col gap-3">
          <p className="font-mono text-xs text-foreground">Понимание подтверждено.</p>
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-cyan-foreground">
            Human calendar knowledge: VERIFIED
            <br />
            September anomaly: detected
          </p>
          <button
            type="button"
            onClick={onContinue}
            className="self-start rounded-sm border border-foreground bg-acid px-5 py-2 font-mono text-sm font-bold text-acid-foreground"
          >
            Продолжить →
          </button>
        </div>
      )}
    </div>
  )
}
