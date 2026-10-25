using System.Net.Http.Json;
using BlazorShop.Shared;

namespace BlazorShop.Client.Services;

/// <summary>
/// Сервис обращения к серверному API /api/products.
/// Инкапсулирует все HTTP-запросы (GET/POST/PUT/DELETE) и обработку ошибок.
/// </summary>
public class ProductService
{
    private readonly HttpClient _http;
    private const string BaseUrl = "api/products";

    public ProductService(HttpClient http)
    {
        _http = http;
    }

    /// <summary>Получить полный список товаров.</summary>
    public async Task<List<Product>> GetAllAsync()
    {
        var result = await _http.GetFromJsonAsync<List<Product>>(BaseUrl);
        return result ?? new List<Product>();
    }

    /// <summary>Добавить новый товар.</summary>
    public async Task<Product?> CreateAsync(Product product)
    {
        var response = await _http.PostAsJsonAsync(BaseUrl, product);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<Product>();
    }

    /// <summary>Изменить существующий товар.</summary>
    public async Task UpdateAsync(Product product)
    {
        var response = await _http.PutAsJsonAsync($"{BaseUrl}/{product.Id}", product);
        response.EnsureSuccessStatusCode();
    }

    /// <summary>Удалить товар по идентификатору.</summary>
    public async Task DeleteAsync(int id)
    {
        var response = await _http.DeleteAsync($"{BaseUrl}/{id}");
        response.EnsureSuccessStatusCode();
    }
}
