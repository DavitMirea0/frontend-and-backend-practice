using BlazorShop.Client;
using BlazorShop.Client.Services;
using Blazored.LocalStorage;
using Microsoft.AspNetCore.Components.Web;
using Microsoft.AspNetCore.Components.WebAssembly.Hosting;

var builder = WebAssemblyHostBuilder.CreateDefault(args);
builder.RootComponents.Add<App>("#app");
builder.RootComponents.Add<HeadOutlet>("head::after");

// HttpClient указывает на наш же хост (BlazorShop.Server)
builder.Services.AddScoped(sp => new HttpClient
{
    BaseAddress = new Uri(builder.HostEnvironment.BaseAddress)
});

// Сервис обращения к API
builder.Services.AddScoped<ProductService>();

// LocalStorage для сохранения выбранной темы между сессиями
builder.Services.AddBlazoredLocalStorage();

// Сервис управления темой оформления
builder.Services.AddScoped<ThemeService>();

await builder.Build().RunAsync();
