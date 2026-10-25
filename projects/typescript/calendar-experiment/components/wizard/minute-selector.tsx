'use client'

const ODD_MINUTES = [0, 7, 13, 22, 30, 38, 45, 52, 59]

export function MinuteSelector({
  minute,
  onChange,
}: {
  minute: number
  onChange: (minute: number) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">
        Минуты (нестандартные интервалы)
      </span>
      <div className="flex flex-wrap gap-1.5">
        {ODD_MINUTES.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => onChange(m)}
            className={`rounded-sm border px-2.5 py-1 font-mono text-xs tabular-nums transition-colors ${
              m === minute
                ? 'border-foreground bg-secondary text-foreground'
                : 'border-border text-muted-foreground hover:border-foreground'
            }`}
          >
            :{String(m).padStart(2, '0')}
          </button>
        ))}
      </div>
    </div>
  )
}
