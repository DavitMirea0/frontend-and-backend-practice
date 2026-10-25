namespace Practice5_ProductionSystem.Services
{
    /// <summary>
    /// Сервис расчёта производственного времени.
    /// Таймер фиксирован: 2 минуты (120 секунд) на любой заказ.
    /// </summary>
    public class ProductionCalculatorService
    {
        /// <summary>Фиксированная длительность таймера — 2 минуты</summary>
        public static readonly TimeSpan TimerDuration = TimeSpan.FromMinutes(2);

        /// <summary>
        /// Возвращает длительность производства.
        /// Формула: Время = (Количество × ВремяНаЕдиницу) / КоэффЭффективности
        /// но для таймера всегда используется 2 минуты.
        /// </summary>
        public TimeSpan CalculateProductionTime(int quantity, int timePerUnit, float efficiency)
        {
            // Теоретическое время (для отображения в расчётах)
            if (efficiency <= 0) efficiency = 1.0f;
            double totalMinutes = (quantity * timePerUnit) / efficiency;
            return TimeSpan.FromMinutes(totalMinutes);
        }

        /// <summary>
        /// Расчётная дата завершения — всегда StartDate + 2 минуты.
        /// </summary>
        public DateTime CalculateEndDate(DateTime startDate, int quantity, int timePerUnit, float efficiency)
        {
            return startDate.Add(TimerDuration);
        }
    }
}
