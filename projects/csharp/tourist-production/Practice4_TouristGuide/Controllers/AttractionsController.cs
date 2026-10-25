using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Practice4_TouristGuide.Data;

namespace Practice4_TouristGuide.Controllers;

/// <summary>
/// Контроллер для работы с достопримечательностями
/// </summary>
public class AttractionsController : Controller
{
    private readonly TouristGuideDbContext _db;

    public AttractionsController(TouristGuideDbContext db)
    {
        _db = db;
    }

    /// <summary>Подробная информация о достопримечательности</summary>
    public async Task<IActionResult> Details(int id)
    {
        var attraction = await _db.Attractions
            .Include(a => a.City)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (attraction == null) return NotFound();
        return View(attraction);
    }
}
