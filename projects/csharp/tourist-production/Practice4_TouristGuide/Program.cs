using Microsoft.EntityFrameworkCore;
using Practice4_TouristGuide.Data;

var builder = WebApplication.CreateBuilder(args);

// Подключение MVC
builder.Services.AddControllersWithViews();

// Подключение EF Core с SQLite
builder.Services.AddDbContext<TouristGuideDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

var app = builder.Build();

// Автоматическое применение миграций и seed-данных
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<TouristGuideDbContext>();
    db.Database.EnsureCreated();
}

app.UseStaticFiles();
app.UseRouting();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Cities}/{action=Index}/{id?}");

app.Run();
