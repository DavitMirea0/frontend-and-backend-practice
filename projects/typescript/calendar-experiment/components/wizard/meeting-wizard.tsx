'use client'

import { useEffect, useRef, useState } from 'react'
import { StepHeader } from './step-header'
import { StepIntent } from './step-intent'
import { StepDate } from './step-date'
import { StepTime } from './step-time'
import { StepCaptcha } from './step-captcha'
import { StepConfirmCoordinate } from './step-confirm-coordinate'
import { StepReview } from './step-review'
import { StepSave } from './step-save'
import { FinalConfirmation } from './final-confirmation'
import { LocalStorageService } from '@/lib/storage'
import { useMetrics } from '@/lib/metrics-context'
import { SEPTEMBER_CAPTCHA_STORAGE_KEY } from '@/lib/september-captcha'
import type { Meeting } from '@/lib/types'

const TOTAL_STEPS = 7
const STEP_TITLES = [
  'Определение намерения',
  'Календарная локализация',
  'Темпоральная калибровка',
  'Подтверждение человеческого фактора',
  'Выбор временной координаты',
  'Проверка',
  'Сохранение',
]

interface MeetingWizardProps {
  year: number
  month: number
  day: number
  onClose: () => void
  onSaved: (meeting: Meeting) => void
  onCaptchaPassed: () => void
}

export function MeetingWizard({ year, month, day, onClose, onSaved, onCaptchaPassed }: MeetingWizardProps) {
  const { bump, registerError } = useMetrics()
  const startedAt = useRef(Date.now())

  const [step, setStep] = useState(1)
  const [title, setTitle] = useState('')
  const [participants, setParticipants] = useState<string[]>([])
  const [selectedDay, setSelectedDay] = useState(day)
  const [hour, setHour] = useState(18)
  const [minute, setMinute] = useState(30)
  const [captchaErrors, setCaptchaErrors] = useState(0)
  const [captchaPassed, setCaptchaPassed] = useState(false)
  const [usedRomanTime, setUsedRomanTime] = useState(false)
  const [secretClicks, setSecretClicks] = useState(0)
  const [captchaElapsedMs, setCaptchaElapsedMs] = useState<number | null>(null)
  const [savedMeeting, setSavedMeeting] = useState<Meeting | null>(null)

  useEffect(() => {
    setCaptchaPassed(window.localStorage.getItem(SEPTEMBER_CAPTCHA_STORAGE_KEY) === 'true')
  }, [])

  const goTo = (next: number) => {
    setStep(next)
    bump()
  }

  const handleFail = () => {
    setCaptchaErrors((c) => c + 1)
    registerError()
  }

  const handleCaptchaPass = (elapsedMs: number) => {
    setCaptchaPassed(true)
    setCaptchaElapsedMs(elapsedMs)
    window.localStorage.setItem(SEPTEMBER_CAPTCHA_STORAGE_KEY, 'true')
    onCaptchaPassed()
    goTo(5)
  }

  const handleSecretClick = () => {
    const next = secretClicks + 1
    setSecretClicks(next)
    return next
  }

  const handleSave = () => {
    if (!captchaPassed) {
      setStep(4)
      registerError()
      return
    }
    const meeting: Meeting = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: title.trim(),
      participants,
      year,
      month,
      day: selectedDay,
      hour,
      minute,
      createdAt: Date.now(),
    }
    LocalStorageService.save(meeting)
    setSavedMeeting(meeting)
    onSaved(meeting)
  }

  const tooFast = (captchaElapsedMs ?? Date.now() - startedAt.current) < 20_000

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Процедура фиксации встречи"
      className="fixed inset-0 z-40 flex items-end justify-center bg-foreground/40 p-0 sm:items-center sm:p-4"
    >
      <div className="flex max-h-[92vh] w-full max-w-xl flex-col overflow-y-auto rounded-t-lg border border-border bg-background p-5 shadow-2xl sm:rounded-lg sm:p-6">
        {savedMeeting ? (
          <FinalConfirmation
            title={savedMeeting.title}
            year={savedMeeting.year}
            month={savedMeeting.month}
            day={savedMeeting.day}
            hour={savedMeeting.hour}
            minute={savedMeeting.minute}
            tooFast={tooFast}
            onReturn={onClose}
          />
        ) : (
          <div className="flex flex-col gap-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <StepHeader step={step} total={TOTAL_STEPS} title={STEP_TITLES[step - 1]} />
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Закрыть процедуру"
                className="shrink-0 font-mono text-xs text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            {step === 1 && (
              <StepIntent
                title={title}
                participants={participants}
                onChange={(patch) => {
                  if (patch.title !== undefined) setTitle(patch.title)
                  if (patch.participants !== undefined) setParticipants(patch.participants)
                }}
                onNext={() => goTo(2)}
              />
            )}
            {step === 2 && (
              <StepDate
                year={year}
                month={month}
                day={selectedDay}
                onChangeDay={setSelectedDay}
                onNext={() => goTo(3)}
                onBack={() => goTo(1)}
              />
            )}
            {step === 3 && (
              <StepTime
                hour={hour}
                minute={minute}
                onChangeHour={setHour}
                onChangeMinute={setMinute}
                onRomanAccepted={() => setUsedRomanTime(true)}
                onNext={() => goTo(4)}
                onBack={() => goTo(2)}
              />
            )}
            {step === 4 && (
              <StepCaptcha
                alreadyPassed={captchaPassed}
                selectedSeptemberDay={selectedDay}
                usedRomanTime={usedRomanTime}
                secretClicks={secretClicks}
                onSecretClick={handleSecretClick}
                onPass={handleCaptchaPass}
                onFail={handleFail}
                onBack={() => goTo(3)}
              />
            )}
            {step === 5 && (
              <StepConfirmCoordinate
                hour={hour}
                minute={minute}
                onConfirm={() => goTo(6)}
                onBack={() => goTo(4)}
              />
            )}
            {step === 6 && (
              <StepReview
                title={title}
                participants={participants}
                year={year}
                month={month}
                day={selectedDay}
                hour={hour}
                minute={minute}
                captchaPassed={captchaPassed}
                onNext={() => goTo(7)}
                onBack={() => goTo(5)}
              />
            )}
            {step === 7 && <StepSave onSave={handleSave} onBack={() => goTo(6)} />}
          </div>
        )}
      </div>
    </div>
  )
}
