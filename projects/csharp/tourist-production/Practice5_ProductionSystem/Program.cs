using Microsoft.EntityFrameworkCore;
using Practice5_ProductionSystem.Data;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllersWithViews();
builder.Services.AddSingleton<Practice5_ProductionSystem.Services.ProductionCalculatorService>();

builder.Services.AddDbContext<ProductionDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

var app = builder.Build();

// Автоматическое создание БД и применение seed-данных
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ProductionDbContext>();
    db.Database.EnsureCreated();

    // Исправить старые заказы: EstimatedEndDate = StartDate + 2 минуты
    var inProgressOrders = db.WorkOrders
        .Where(o => o.Status == "InProgress")
        .ToList();
    var oldOrders = inProgressOrders
        .Where(o => (o.EstimatedEndDate - o.StartDate).TotalMinutes > 3)
        .ToList();
    foreach (var o in oldOrders)
        o.EstimatedEndDate = DateTime.Now.AddMinutes(2);
    if (oldOrders.Any()) db.SaveChanges();
}

app.UseStaticFiles();
app.UseRouting();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=WorkOrders}/{action=Index}/{id?}");

app.Run();
