using BlazorShop.Server.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// --- Регистрация сервисов ---

// EF Core с SQLite
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

// MVC-контроллеры (наш ProductsController)
builder.Services.AddControllers();

// Swagger для удобной проверки API
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "BlazorShop API", Version = "v1" });
});

// Серверная часть Razor Pages — нужна, чтобы хостить Blazor WASM
builder.Services.AddRazorPages();

var app = builder.Build();

// --- Конвейер запросов ---

if (app.Environment.IsDevelopment())
{
    app.UseWebAssemblyDebugging();
    app.UseSwagger();
    app.UseSwaggerUI();
}
else
{
    app.UseExceptionHandler("/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();

// Раздача файлов клиента Blazor WebAssembly
app.UseBlazorFrameworkFiles();
app.UseStaticFiles();

app.UseRouting();

app.MapRazorPages();
app.MapControllers();
// SPA fallback — любой неизвестный путь отдаёт index.html клиента
app.MapFallbackToFile("index.html");

// --- Автоматическое создание БД и применение миграций ---
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();
}

app.Run();
