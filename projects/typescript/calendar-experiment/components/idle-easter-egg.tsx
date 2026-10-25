'use client'

import { useEffect, useState } from 'react'

const IDLE_MS = 20_000

export function IdleEasterEgg() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>

    const reset = () => {
      setVisible(false)
      clearTimeout(timer)
      timer = setTimeout(() => setVisible(true), IDLE_MS)
    }

    reset()
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'] as const
    events.forEach((e) => window.addEventListener(e, reset))

    return () => {
      clearTimeout(timer)
      events.forEach((e) => window.removeEventListener(e, reset))
    }
  }, [])

  if (!visible) return null

  return (
    <div
      role="status"
      className="fixed bottom-4 left-1/2 z-30 -translate-x-1/2 rounded-md border border-border bg-popover px-4 py-2 text-center font-mono text-xs text-popover-foreground shadow-lg"
    >
      Вы всё ещё здесь? Календарь тоже удивлён.
    </div>
  )
}
