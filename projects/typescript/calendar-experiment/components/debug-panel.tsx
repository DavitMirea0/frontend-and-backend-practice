'use client'

import { useState } from 'react'
import { useMetrics } from '@/lib/metrics-context'

export function DebugPanel({ captchaPassed }: { captchaPassed: boolean }) {
  const { uxQuality, userComfort, systemReliability, entropy } = useMetrics()
  const [open, setOpen] = useState(false)
  const [impossibleError, setImpossibleError] = useState(false)

  return (
    <div className="fixed bottom-3 right-3 z-20 flex flex-col items-end gap-2">
      {open && (
        <div className="w-64 rounded-md border border-border bg-popover p-3 font-mono text-[10px] leading-relaxed text-popover-foreground shadow-lg">
          <p className="mb-2 uppercase tracking-[0.15em] text-muted-foreground">CALENDAR DEBUG</p>
          <dl className="grid grid-cols-2 gap-x-2 gap-y-1">
            <dt className="text-muted-foreground">dateEntropy</dt>
            <dd className="text-right tabular-nums">{entropy}%</dd>
            <dt className="text-muted-foreground">temporalConfidence</dt>
            <dd className="text-right tabular-nums">{Math.max(41, 100 - entropy)}%</dd>
            <dt className="text-muted-foreground">humanProbability</dt>
            <dd className="text-right tabular-nums">{Math.round((userComfort / 3) * 84) + 16}%</dd>
            <dt className="text-muted-foreground">UXQuality</dt>
            <dd className="text-right tabular-nums">{Math.round((uxQuality / 4) * 100)}%</dd>
            <dt className="text-muted-foreground">userComfort</dt>
            <dd className="text-right tabular-nums">{Math.round((userComfort / 3) * 100)}%</dd>
            <dt className="text-muted-foreground">systemReliability</dt>
            <dd className="text-right tabular-nums">{systemReliability}%</dd>
            <dt className="text-muted-foreground">septemberDetected</dt>
            <dd className="text-right">true</dd>
            <dt className="text-muted-foreground">captcha</dt>
            <dd className="text-right">{captchaPassed ? 'passed' : 'pending'}</dd>
          </dl>

          <button
            type="button"
            onClick={() => setImpossibleError(true)}
            className="mt-2 w-full rounded-sm border border-dashed border-border px-2 py-1 text-left text-muted-foreground hover:border-foreground/50"
          >
            31 сентября
          </button>
          {impossibleError && (
            <p role="alert" className="mt-1 text-destructive">
              31 сентября
              <br />
              ERROR:
              <br />
              DATE_NOT_FOUND
              <br />
              <span className="text-muted-foreground">Но вы старались.</span>
            </p>
          )}
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Панель отладки календаря"
        className="rounded-sm border border-border/50 bg-background/60 px-2 py-1 font-mono text-[10px] text-muted-foreground/50 hover:text-muted-foreground"
      >
        [ DEBUG ]
      </button>
    </div>
  )
}
