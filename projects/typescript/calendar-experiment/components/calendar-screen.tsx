'use client'

import { useEffect, useState } from 'react'
import { CalendarHeader } from './calendar-header'
import { MonthGrid } from './month-grid'
import { MeetingList } from './meeting-list'
import { MetricsPanel } from './metrics-panel'
import { IdleEasterEgg } from './idle-easter-egg'
import { DebugPanel } from './debug-panel'
import { MeetingWizard } from './wizard/meeting-wizard'
import { LocalStorageService } from '@/lib/storage'
import { useMetrics } from '@/lib/metrics-context'
import type { Meeting } from '@/lib/types'

const TODAY = new Date()

export function CalendarScreen() {
  const [year] = useState(TODAY.getFullYear())
  const [month] = useState(TODAY.getMonth())
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [wizardOpen, setWizardOpen] = useState(false)
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [captchaPassed, setCaptchaPassed] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const { bump } = useMetrics()

  useEffect(() => {
    setMeetings(LocalStorageService.getAll())
    setCaptchaPassed(window.localStorage.getItem('calendar-captcha-passed') === 'true')
    setHydrated(true)
  }, [])

  const handleSelectDay = (day: number) => {
    setSelectedDay(day)
    bump()
    setWizardOpen(true)
  }

  const handleWizardClose = () => {
    setWizardOpen(false)
    bump()
  }

  const handleSaved = (meeting: Meeting) => {
    setMeetings((prev) => [...prev, meeting])
    bump()
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8 sm:py-14">
      <CalendarHeader year={year} month={month} />
      <p className="max-w-sm font-mono text-xs leading-relaxed text-muted-foreground">
        КАЛЕНДАРЬ
        <br />
        Мы не можем сделать вашу встречу проще.
        <br />
        Но можем сделать её интереснее.
      </p>
      <MetricsPanel />
      <MonthGrid
        year={year}
        month={month}
        selectedDay={selectedDay}
        meetings={meetings}
        onSelectDay={handleSelectDay}
      />
      <section aria-labelledby="meetings-heading" className="flex flex-col gap-3">
        <h2 id="meetings-heading" className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Зафиксированные события {hydrated ? `(${meetings.length})` : ''}
        </h2>
        <MeetingList meetings={meetings} />
      </section>
      <p className="font-mono text-[10px] leading-relaxed text-muted-foreground">
        Данные хранятся локально в вашем браузере (localStorage). Backend отсутствует.
      </p>
      <IdleEasterEgg />
      <DebugPanel captchaPassed={captchaPassed} />
      {wizardOpen && selectedDay !== null && (
        <MeetingWizard
          year={year}
          month={month}
          day={selectedDay}
          onClose={handleWizardClose}
          onSaved={handleSaved}
          onCaptchaPassed={() => setCaptchaPassed(true)}
        />
      )}
    </main>
  )
}
