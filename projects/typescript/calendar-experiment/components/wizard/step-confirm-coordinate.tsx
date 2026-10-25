'use client'

import { ChasingButton } from './chasing-button'

export function StepConfirmCoordinate({
  hour,
  minute,
  onConfirm,
  onBack,
}: {
  hour: number
  minute: number
  onConfirm: () => void
  onBack: () => void
}) {
  return (
    <div className="flex flex-col gap-6">
      <p className="font-mono text-sm text-foreground">
        Временная координата: {String(hour).padStart(2, '0')}:{String(minute).padStart(2, '0')}
      </p>
      <ChasingButton onConfirm={onConfirm} />
      <button
        type="button"
        onClick={onBack}
        className="self-start font-mono text-xs text-muted-foreground underline-offset-2 hover:underline"
      >
        ← назад
      </button>
    </div>
  )
}
