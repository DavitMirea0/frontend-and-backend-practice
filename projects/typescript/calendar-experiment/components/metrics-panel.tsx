'use client'

import { useMetrics } from '@/lib/metrics-context'

function Bar({
  label,
  value,
  max,
  colorClass,
}: {
  label: string
  value: number
  max: number
  colorClass: string
}) {
  const pct = Math.round((value / max) * 100)
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground font-mono">
          {label}
        </span>
        <span className="text-xs font-mono text-foreground tabular-nums">{pct}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-secondary overflow-hidden border border-border">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${colorClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export function MetricsPanel() {
  const { uxQuality, userComfort, systemReliability, entropy } = useMetrics()

  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-4 rounded-md border border-border bg-card p-4 sm:grid-cols-4">
      <Bar label="UX Quality" value={uxQuality} max={4} colorClass="bg-pink" />
      <Bar label="User comfort" value={userComfort} max={3} colorClass="bg-pink" />
      <Bar label="System reliability" value={systemReliability} max={100} colorClass="bg-acid" />
      <Bar label="Calendar entropy" value={entropy} max={100} colorClass="bg-cyan" />
    </div>
  )
}
