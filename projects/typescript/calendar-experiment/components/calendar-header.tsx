const MONTH_NAMES = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь',
]

export function CalendarHeader({ year, month }: { year: number; month: number }) {
  return (
    <header className="flex flex-col gap-3">
      <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
        <span className="h-2 w-2 rounded-full bg-acid" aria-hidden="true" />
        Worst UX Lab · Календарный модуль
      </div>
      <h1 className="text-balance text-3xl font-bold leading-[1.05] sm:text-5xl">
        Календарь, который{' '}
        <span className="bg-acid px-1 text-acid-foreground">не хотел</span>, чтобы вы встречались
      </h1>
      <p className="max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
        Интерфейс ужасен. Приложение — надёжно. Выберите день, чтобы начать процедуру фиксации
        временного события.
      </p>
      <div className="flex items-center gap-3 font-mono text-sm">
        <span className="text-xl font-bold sm:text-2xl">{MONTH_NAMES[month]}</span>
        <span className="text-muted-foreground">{year}</span>
      </div>
    </header>
  )
}

export { MONTH_NAMES }
