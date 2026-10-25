'use client'

import { useEffect, useState } from 'react'
import { PseudoError } from './pseudo-error'

type Phase = 'idle' | 'registered' | 'checking' | 'looks-good' | 'saved'
const SAVE_LABELS = ['ОК', 'Точно?', 'Сохранить?', 'Ну пожалуйста', 'ЗАВЕРШИТЬ ПРОЦЕДУРУ']

const PHASE_DELAY: Record<Phase, number> = {
  idle: 0,
  registered: 1200,
  checking: 900,
  'looks-good': 700,
  saved: 0,
}

export function StepSave({ onSave, onBack }: { onSave: () => void; onBack: () => void }) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [decoyError, setDecoyError] = useState(false)
  const [labelIndex, setLabelIndex] = useState(0)
  const [watchingSave, setWatchingSave] = useState(false)

  useEffect(() => {
    if (phase === 'idle' || phase === 'saved') return
    const timer = setTimeout(() => {
      if (phase === 'registered') setPhase('checking')
      else if (phase === 'checking') setPhase('looks-good')
      else if (phase === 'looks-good') {
        setPhase('saved')
        onSave()
      }
    }, PHASE_DELAY[phase])
    return () => clearTimeout(timer)
  }, [phase, onSave])

  useEffect(() => {
    if (phase !== 'idle' || !watchingSave) return
    if (labelIndex >= SAVE_LABELS.length - 1) return
    const timer = setTimeout(() => setLabelIndex((i) => i + 1), 1300)
    return () => clearTimeout(timer)
  }, [labelIndex, phase, watchingSave])

  const start = () => {
    setDecoyError(false)
    setPhase('registered')
  }

  const startWatchingSave = () => {
    setLabelIndex(0)
    setWatchingSave(true)
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="font-mono text-sm text-foreground">
        Финальный этап. Выберите действие для завершения процедуры.
      </p>

      {decoyError && (
        <PseudoError
          code="500"
          message="Не удалось определить намерение пользователя. Это не настоящая ошибка."
          onRetry={() => setDecoyError(false)}
        />
      )}

      {phase === 'idle' && !decoyError && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => setDecoyError(true)}
            className="rounded-sm border border-border bg-secondary px-4 py-2 font-mono text-xs text-secondary-foreground hover:bg-accent"
          >
            Завершить процедуру фиксации временного события
          </button>
          <div className="group relative inline-flex">
            <button
              type="button"
              onClick={start}
              onMouseEnter={startWatchingSave}
              onMouseLeave={() => setWatchingSave(false)}
              onFocus={startWatchingSave}
              onBlur={() => setWatchingSave(false)}
              className="rounded-sm border border-foreground bg-acid px-8 py-2 font-mono text-sm font-bold text-acid-foreground"
            >
              [ {SAVE_LABELS[labelIndex]} ]
            </button>
            <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-1 w-48 -translate-x-1/2 rounded-sm border border-border bg-popover p-2 text-center text-[10px] text-popover-foreground opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
              Не нажимайте сюда, если хотите сохранить.
            </span>
          </div>
        </div>
      )}

      {phase === 'registered' && (
        <div className="rounded-md border border-border bg-secondary/40 p-3 font-mono text-xs text-muted-foreground">
          Изменения зарегистрированы.
          <br />
          Вероятность успешного сохранения: 87%.
          <br />
          Не закрывайте страницу.
        </div>
      )}
      {phase === 'checking' && (
        <div className="rounded-md border border-border bg-secondary/40 p-3 font-mono text-xs text-muted-foreground">
          Проверяем...
        </div>
      )}
      {(phase === 'looks-good' || phase === 'saved') && (
        <div className="rounded-md border border-border bg-secondary/40 p-3 font-mono text-xs text-muted-foreground">
          Похоже, всё хорошо.
        </div>
      )}

      {phase === 'idle' && (
        <button
          type="button"
          onClick={onBack}
          className="self-start font-mono text-xs text-muted-foreground underline-offset-2 hover:underline"
        >
          ← назад
        </button>
      )}
    </div>
  )
}
