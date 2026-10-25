export function StepHeader({ step, total, title }: { step: number; total: number; title: string }) {
  return (
    <div className="flex flex-col gap-2 border-b border-border pb-4">
      <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
        <span>
          ШАГ {step}/{total}
        </span>
        <div className="flex gap-1" aria-hidden="true">
          {Array.from({ length: total }, (_, i) => (
            <span
              key={i}
              className={`h-1 w-4 rounded-full ${i < step ? 'bg-acid' : 'bg-secondary'}`}
            />
          ))}
        </div>
      </div>
      <h2 className="text-xl font-bold sm:text-2xl">{title}</h2>
    </div>
  )
}
