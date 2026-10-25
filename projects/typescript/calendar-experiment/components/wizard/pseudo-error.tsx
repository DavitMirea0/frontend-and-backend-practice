'use client'

interface PseudoErrorProps {
  code: string
  message: string
  onRetry: () => void
}

/**
 * Безопасная псевдо-ошибка. Ничего не сломано — это часть шутки.
 * Всегда даёт пользователю понятный путь продолжения.
 */
export function PseudoError({ code, message, onRetry }: PseudoErrorProps) {
  return (
    <div
      role="alert"
      className="flex flex-col gap-3 rounded-md border border-destructive/40 bg-destructive/5 p-4 font-mono text-sm"
    >
      <div className="flex items-center gap-2 text-destructive">
        <span className="font-bold">ERROR {code}</span>
      </div>
      <p className="text-foreground/80">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="self-start rounded-sm border border-border bg-secondary px-3 py-1.5 text-xs text-secondary-foreground transition-colors hover:bg-accent"
      >
        [ Попробовать ещё раз ]
      </button>
    </div>
  )
}
