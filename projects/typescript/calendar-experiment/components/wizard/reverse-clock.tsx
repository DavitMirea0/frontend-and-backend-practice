'use client'

import { useEffect, useRef, useState } from 'react'

interface ReverseClockProps {
  hour: number
  onChange: (hour: number) => void
}

const SIZE = 220
const CENTER = SIZE / 2
const RADIUS = 88

function angleForHour(hour: number) {
  // Реверс: 0 часов — сверху, движение по часовой стрелке уменьшает значение,
  // поэтому визуально час растёт против часовой стрелки.
  return ((24 - hour) / 24) * Math.PI * 2 - Math.PI / 2
}

function pointToHour(x: number, y: number) {
  const dx = x - CENTER
  const dy = y - CENTER
  let angle = Math.atan2(dy, dx) + Math.PI / 2
  if (angle < 0) angle += Math.PI * 2
  const raw = 24 - (angle / (Math.PI * 2)) * 24
  return ((Math.round(raw) % 24) + 24) % 24
}

export function ReverseClock({ hour, onChange }: ReverseClockProps) {
  const dialRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)
  const [pending, setPending] = useState<number | null>(null)
  const commitTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const commitWithDelay = (value: number) => {
    setPending(value)
    if (commitTimer.current) clearTimeout(commitTimer.current)
    commitTimer.current = setTimeout(() => {
      onChange(value)
      setPending(null)
    }, 250)
  }

  useEffect(() => {
    if (!dragging) return
    const handleMove = (e: PointerEvent) => {
      const rect = dialRef.current?.getBoundingClientRect()
      if (!rect) return
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      commitWithDelay(pointToHour(x, y))
    }
    const handleUp = () => setDragging(false)
    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
    return () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
    }
  }, [dragging])

  const displayHour = pending ?? hour
  const knobAngle = angleForHour(displayHour)
  const knobX = CENTER + Math.cos(knobAngle) * RADIUS
  const knobY = CENTER + Math.sin(knobAngle) * RADIUS

  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:gap-6">
      <div
        ref={dialRef}
        onPointerDown={() => setDragging(true)}
        className="relative shrink-0 touch-none select-none rounded-full border border-border bg-card"
        style={{ width: SIZE, height: SIZE }}
        role="slider"
        aria-label="Выбор часа (вращение по часовой стрелке уменьшает значение)"
        aria-valuemin={0}
        aria-valuemax={23}
        aria-valuenow={hour}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') onChange((hour + 1) % 24)
          if (e.key === 'ArrowLeft') onChange((hour + 23) % 24)
        }}
      >
        {Array.from({ length: 24 }, (_, i) => {
          const a = angleForHour(i)
          const x = CENTER + Math.cos(a) * (RADIUS + 16)
          const y = CENTER + Math.sin(a) * (RADIUS + 16)
          const labeled = i % 4 === 0
          return (
            <button
              key={i}
              type="button"
              onClick={() => onChange(i)}
              aria-label={`${i} часов`}
              className={`absolute flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full font-mono text-[10px] transition-colors ${
                i === hour ? 'text-pink-foreground font-bold' : 'text-muted-foreground hover:text-foreground'
              }`}
              style={{ left: x, top: y }}
            >
              {labeled ? i : '·'}
            </button>
          )
        })}
        <div
          className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-pink"
          style={{ left: knobX, top: knobY }}
          aria-hidden="true"
        />
        <div className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground" />
      </div>
      <div className="flex flex-col gap-1 font-mono text-sm">
        <span className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Текущий час</span>
        <span className="text-3xl font-bold tabular-nums">
          {pending !== null ? '···' : String(hour).padStart(2, '0')}
        </span>
        <span className="text-[10px] text-muted-foreground">
          По часовой стрелке = меньше. Против часовой = больше.
        </span>
      </div>
    </div>
  )
}
