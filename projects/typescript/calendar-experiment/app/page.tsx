import { CalendarScreen } from '@/components/calendar-screen'
import { MetricsProvider } from '@/lib/metrics-context'

export default function Page() {
  return (
    <MetricsProvider>
      <CalendarScreen />
    </MetricsProvider>
  )
}
