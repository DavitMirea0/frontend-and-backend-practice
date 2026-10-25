using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Practice4_TouristGuide.Data;

namespace Practice4_TouristGuide.Controllers;

/// <summary>
/// Контроллер для работы с городами
/// </summary>
public class CitiesController : Controller
{
    private readonly TouristGuideDbContext _db;

    public CitiesController(TouristGuideDbContext db)
    {
        _db = db;
    }

    /// <summary>Список всех городов с поиском по названию</summary>
    public async Task<IActionResult> Index(string? search)
    {
        var query = _db.Cities.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(c => c.Name.Contains(search));

        var cities = await query.OrderBy(c => c.Name).ToListAsync();
        ViewBag.Search = search;
        return View(cities);
    }

    /// <summary>Подробная информация о городе</summary>
    public async Task<IActionResult> Details(int id)
    {
        var city = await _db.Cities
            .Include(c => c.Attractions)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (city == null) return NotFound();
        return View(city);
    }
}
