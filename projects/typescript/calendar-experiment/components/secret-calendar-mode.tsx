'use client'

interface SecretCalendarModeProps {
  onClose: () => void
  bonus?: boolean
}

export function SecretCalendarMode({ onClose, bonus }: SecretCalendarModeProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Секретный режим календаря"
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/60 p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-w-sm flex-col items-center gap-4 rounded-md border border-foreground bg-background p-6 text-center shadow-2xl"
      >
        <pre className="font-mono text-[11px] leading-relaxed text-acid-foreground">
{`╔══════════════════════════╗
║ SECRET CALENDAR MODE     ║
║                          ║
║ SEPTEMBER PROTOCOL: ON   ║
╚══════════════════════════╝`}
        </pre>
        <div className="flex gap-1" aria-hidden="true">
          {Array.from({ length: 5 }, (_, i) => (
            <span
              key={i}
              className="h-6 w-4 rounded-sm border border-border bg-secondary [animation:flip-page_1.6s_ease-in-out_infinite]"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
        <p className="font-mono text-xs text-muted-foreground">
          Вы нашли то,
          <br />
          что большинство пользователей даже не искало.
        </p>
        {bonus && (
          <p className="font-mono text-xs text-pink-foreground">
            Temporal synchronization: EXCEPTIONAL
            <br />
            Вы сделали это слишком правильно.
          </p>
        )}
        <p className="font-mono text-xs text-foreground">
          Награда:
          <br />
          ничего.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="rounded-sm border border-border bg-primary px-5 py-2 font-mono text-xs text-primary-foreground"
        >
          [ Закрыть ]
        </button>
      </div>
      <style>{`
        @keyframes flip-page {
          0%, 100% { transform: rotateX(0deg); }
          50% { transform: rotateX(180deg); }
        }
      `}</style>
    </div>
  )
}
