'use client'

import { useRef, useState } from 'react'
import { AbsurdInstruction } from './absurd-instruction'
import { CalendarFlip } from './calendar-flip'
import { CalendarPlayer } from './calendar-player'
import { DateAnomalyGrid } from './date-anomaly-grid'
import { TokenSelector } from './token-selector'
import { SecretCalendarMode } from '../secret-calendar-mode'
import {
  evaluateSeptemberCaptcha,
  shouldShowSecretBonus,
  type CaptchaState,
} from '@/lib/september-captcha'

type CaptchaPhase = 'date' | 'tokens' | 'flip' | 'instruction' | 'success'

interface StepCaptchaProps {
  alreadyPassed: boolean
  selectedSeptemberDay: number
  usedRomanTime: boolean
  secretClicks: number
  onSecretClick: () => number
  onPass: (elapsedMs: number) => void
  onFail: () => void
  onBack: () => void
}

export function StepCaptcha({
  alreadyPassed,
  selectedSeptemberDay,
  usedRomanTime,
  secretClicks,
  onSecretClick,
  onPass,
  onFail,
  onBack,
}: StepCaptchaProps) {
  const startedAt = useRef(Date.now())
  const [phase, setPhase] = useState<CaptchaPhase>('date')
  const [state, setState] = useState<CaptchaState>('idle')
  const [selectedDate, setSelectedDate] = useState<number | null>(null)
  const [selectedTokens, setSelectedTokens] = useState<string[]>([])
  const [flipCount, setFlipCount] = useState(0)
  const [wrongDateCount, setWrongDateCount] = useState(0)
  const [understandingMessage, setUnderstandingMessage] = useState<string | null>(null)
  const [hasVisitedTwo, setHasVisitedTwo] = useState(selectedSeptemberDay === 2)
  const [fastWarning, setFastWarning] = useState(false)
  const [secretOpen, setSecretOpen] = useState(false)
  const [replaying, setReplaying] = useState(false)

  const complete = () => {
    setState('checking')
    const result = evaluateSeptemberCaptcha({
      selectedDate,
      selectedTokens,
      flipCount,
      understoodInstruction: true,
    })

    if (!result.passed) {
      setState('failed')
      onFail()
      setPhase(result.reason === 'date' ? 'date' : result.reason === 'tokens' ? 'tokens' : 'flip')
      return
    }

    const elapsedMs = Date.now() - startedAt.current
    setState('success')
    setPhase('success')
    setFastWarning(elapsedMs < 5000)
    window.localStorage.setItem('calendar-captcha-passed', 'true')
    setTimeout(() => onPass(elapsedMs), elapsedMs < 5000 ? 1400 : 900)
  }

  const handleSecretClick = () => {
    const nextClicks = onSecretClick()
    if (nextClicks >= 3) setSecretOpen(true)
  }

  const handleWrongDate = () => {
    setWrongDateCount((count) => {
      const next = count + 1
      if (next === 3) {
        setUnderstandingMessage('Я заметил,\nчто вы постоянно выбираете неправильные даты.')
      }
      if (next >= 5) {
        setUnderstandingMessage('Может быть,\nвы просто хотите 3 сентября?')
      }
      return next
    })
    onFail()
  }

  const bonus = shouldShowSecretBonus({
    selectedSeptemberDay,
    usedRomanTime,
    secretClicks,
    captchaPassed: state === 'success',
  })

  if (alreadyPassed && !replaying && state === 'idle') {
    return (
      <div className="flex flex-col gap-5">
        <div className="rounded-md border border-border bg-secondary/40 p-4 font-mono text-xs">
          <p className="text-foreground">
            Human calendar knowledge:
            <br />
            VERIFIED
          </p>
          <p className="mt-2 text-cyan-foreground">September anomaly: detected</p>
          <p className="mt-3 text-muted-foreground">Состояние восстановлено из localStorage.</p>
        </div>
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            className="font-mono text-xs text-muted-foreground underline-offset-2 hover:underline"
          >
            ← назад
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setReplaying(true)}
              className="rounded-sm border border-border px-4 py-2 font-mono text-xs text-foreground hover:bg-accent"
            >
              Повторить CAPTCHA
            </button>
            <button
              type="button"
              onClick={() => onPass(6000)}
              className="rounded-sm border border-border bg-primary px-5 py-2 font-mono text-sm text-primary-foreground"
            >
              Продолжить →
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <p className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">
            ПРОВЕРКА КАЛЕНДАРНОЙ ОСВЕДОМЛЁННОСТИ
          </p>
          <p className="font-mono text-sm text-foreground">
            Мы должны убедиться, что вы готовы пользоваться календарём.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSecretClick}
          aria-label="Скрытая дата 03"
          className="shrink-0 font-mono text-[10px] text-muted-foreground/50 hover:text-pink-foreground"
        >
          03
        </button>
      </div>

      <CalendarPlayer />

      {phase === 'date' && (
        <DateAnomalyGrid
          hasVisitedTwo={hasVisitedTwo}
          onVisitTwo={() => {
            setHasVisitedTwo(true)
          }}
          onWrongDate={handleWrongDate}
          onResolved={() => {
            setSelectedDate(3)
            if (wrongDateCount >= 5) setUnderstandingMessage('Я так и думал.')
            setState('selecting')
            setPhase('tokens')
          }}
        />
      )}

      {understandingMessage && phase === 'date' && (
        <p role="status" className="whitespace-pre-line font-mono text-xs text-pink-foreground">
          {understandingMessage}
        </p>
      )}

      {phase === 'tokens' && (
        <TokenSelector
          onPass={(tokens) => {
            setSelectedTokens(tokens)
            setPhase('flip')
          }}
        />
      )}

      {phase === 'flip' && (
        <CalendarFlip
          onPass={() => {
            setFlipCount(2)
            setPhase('instruction')
          }}
        />
      )}

      {phase === 'instruction' && <AbsurdInstruction onContinue={complete} />}

      {phase === 'success' && (
        <div className="flex flex-col gap-3 rounded-md border border-border bg-secondary/40 p-3 font-mono text-xs">
          <p className="text-foreground">
            Human calendar knowledge:
            <br />
            VERIFIED
          </p>
          <p className="text-cyan-foreground">September anomaly: detected</p>
          {fastWarning && (
            <p className="text-pink-foreground">
              Подозрительно.
              <br />
              Вы слишком хорошо знаете календарь.
              <br />
              Human confidence: 41%
              <br />
              <br />
              Ладно.
              <br />
              На этот раз поверим.
            </p>
          )}
          {bonus && (
            <p className="text-acid-foreground">
              Temporal synchronization: EXCEPTIONAL
              <br />
              Вы сделали это слишком правильно.
            </p>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="font-mono text-xs text-muted-foreground underline-offset-2 hover:underline"
        >
          ← назад
        </button>
        {state === 'failed' && (
          <button
            type="button"
            onClick={() => {
              setState('idle')
              setPhase('date')
              setSelectedDate(null)
              setSelectedTokens([])
              setFlipCount(0)
            }}
            className="rounded-sm border border-border px-4 py-2 font-mono text-xs text-foreground hover:bg-accent"
          >
            Повторить CAPTCHA
          </button>
        )}
      </div>

      {secretOpen && (
        <SecretCalendarMode
          bonus={usedRomanTime && selectedSeptemberDay === 3}
          onClose={() => setSecretOpen(false)}
        />
      )}
    </div>
  )
}
