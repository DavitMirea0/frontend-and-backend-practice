using Blazored.LocalStorage;

namespace BlazorShop.Client.Services;

/// <summary>
/// Сервис управления темой оформления (светлая / тёмная).
/// Сохраняет выбор пользователя в LocalStorage браузера.
/// </summary>
public class ThemeService
{
    private const string StorageKey = "blazorshop-theme";

    private readonly ILocalStorageService _localStorage;

    public ThemeService(ILocalStorageService localStorage)
    {
        _localStorage = localStorage;
    }

    /// <summary>Текущая активная тема ("light" или "dark").</summary>
    public string CurrentTheme { get; private set; } = "light";

    /// <summary>Событие смены темы — на него подписывается MainLayout для перерисовки.</summary>
    public event Action? ThemeChanged;

    /// <summary>
    /// Загрузить тему из LocalStorage при старте приложения.
    /// Вызывается из MainLayout.OnInitializedAsync().
    /// </summary>
    public async Task InitializeAsync()
    {
        var saved = await _localStorage.GetItemAsync<string>(StorageKey);
        if (!string.IsNullOrWhiteSpace(saved))
        {
            CurrentTheme = saved;
        }
    }

    /// <summary>Переключить тему на противоположную.</summary>
    public async Task ToggleAsync()
    {
        CurrentTheme = CurrentTheme == "light" ? "dark" : "light";
        await _localStorage.SetItemAsync(StorageKey, CurrentTheme);
        ThemeChanged?.Invoke();
    }
}
