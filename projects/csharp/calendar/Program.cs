using Microsoft.Extensions.Logging;

namespace CalendarApp;

public static class Program
{
    [STAThread]
    public static void Main()
    {
        // Оптимизация для быстрого запуска
        Application.SetHighDpiMode(HighDpiMode.SystemAware);
        Application.EnableVisualStyles();
        Application.SetCompatibleTextRenderingDefault(false);

        // Упрощенное создание логгера без DI контейнера
        using var loggerFactory = LoggerFactory.Create(builder =>
        {
            builder.AddConsole();
            builder.SetMinimumLevel(LogLevel.Warning); // Только важные сообщения
        });

        var logger = loggerFactory.CreateLogger<MainCalendarForm>();

        try
        {
            // Предварительная настройка для производительности
            System.GC.Collect();
            System.GC.WaitForPendingFinalizers();
            System.GC.Collect();

            Application.Run(new MainCalendarForm(logger));
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Критическая ошибка");
            MessageBox.Show($"Критическая ошибка: {ex.Message}", "Ошибка",
                          MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
    }
}