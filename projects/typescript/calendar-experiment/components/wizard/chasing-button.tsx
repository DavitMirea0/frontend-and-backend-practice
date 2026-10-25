'use client'

import { useRef, useState } from 'react'

const LABELS = ['Подтвердить время', 'Подтвердить время??', 'Точно подтвердить?', 'Ладно, подтвердить']
const MAX_ESCAPES = 4
const CONTAINER_W = 320
const CONTAINER_H = 140
const BUTTON_W = 200
const BUTTON_H = 44

export function ChasingButton({ onConfirm }: { onConfirm: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [attempts, setAttempts] = useState(0)
  const [pos, setPos] = useState({ x: (CONTAINER_W - BUTTON_W) / 2, y: (CONTAINER_H - BUTTON_H) / 2 })

  const settled = attempts >= MAX_ESCAPES
  const label = LABELS[Math.min(attempts, LABELS.length - 1)]

  const handleHover = () => {
    if (settled) return
    // амплитуда побега уменьшается с каждой попыткой
    const amplitude = 1 - attempts / MAX_ESCAPES
    const maxX = CONTAINER_W - BUTTON_W
    const maxY = CONTAINER_H - BUTTON_H
    const nextX = Math.max(0, Math.min(maxX, Math.random() * maxX * amplitude + maxX * (1 - amplitude) * 0.5))
    const nextY = Math.max(0, Math.min(maxY, Math.random() * maxY * amplitude + maxY * (1 - amplitude) * 0.5))
    setPos({ x: nextX, y: nextY })
    setAttempts((a) => a + 1)
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="font-mono text-xs text-muted-foreground">
        {settled
          ? 'Кнопка устала бегать. Теперь можно нажать.'
          : 'Попробуйте навести курсор и нажать на кнопку.'}
      </p>
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-md border border-dashed border-border bg-card"
        style={{ width: '100%', maxWidth: CONTAINER_W, height: CONTAINER_H }}
      >
        <button
          type="button"
          onMouseEnter={handleHover}
          onClick={() => {
            if (settled) onConfirm()
            else handleHover()
          }}
          className="absolute rounded-sm border border-foreground bg-acid font-mono text-xs font-semibold text-acid-foreground transition-all duration-200"
          style={{ left: pos.x, top: pos.y, width: BUTTON_W, height: BUTTON_H }}
        >
          {label}
        </button>
      </div>
      <span className="font-mono text-[10px] text-muted-foreground">Попыток: {attempts}/{MAX_ESCAPES}</span>
    </div>
  )
}
