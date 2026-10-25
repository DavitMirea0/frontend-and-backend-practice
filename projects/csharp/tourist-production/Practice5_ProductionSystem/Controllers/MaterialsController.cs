using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Practice5_ProductionSystem.Data;
using Practice5_ProductionSystem.Models;

namespace Practice5_ProductionSystem.Controllers;

/// <summary>
/// Контроллер управления материалами
/// </summary>
public class MaterialsController : Controller
{
    private readonly ProductionDbContext _db;
    public MaterialsController(ProductionDbContext db) => _db = db;

    // GET /Materials  или  GET /api/materials?low_stock=true
    public async Task<IActionResult> Index(bool lowStock = false)
    {
        var query = _db.Materials.AsQueryable();
        if (lowStock) query = query.Where(m => m.Quantity <= m.MinimalStock);
        ViewBag.LowStockFilter = lowStock;
        return View(await query.OrderBy(m => m.Name).ToListAsync());
    }

    // GET /Materials/Create
    public IActionResult Create() => View(new Material());

    // POST /Materials/Create
    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> Create(Material material)
    {
        if (!ModelState.IsValid) return View(material);
        _db.Materials.Add(material);
        await _db.SaveChangesAsync();
        TempData["Success"] = "Материал добавлен.";
        return RedirectToAction(nameof(Index));
    }

    // GET /Materials/Edit/5
    public async Task<IActionResult> Edit(int id)
    {
        var m = await _db.Materials.FindAsync(id);
        if (m == null) return NotFound();
        return View(m);
    }

    // POST /Materials/Edit/5
    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> Edit(Material material)
    {
        if (!ModelState.IsValid) return View(material);
        _db.Materials.Update(material);
        await _db.SaveChangesAsync();
        TempData["Success"] = "Материал обновлён.";
        return RedirectToAction(nameof(Index));
    }

    // POST /Materials/Replenish/5  — быстрое пополнение
    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> Replenish(int id, decimal amount)
    {
        var m = await _db.Materials.FindAsync(id);
        if (m == null) return NotFound();
        m.Quantity += amount;
        await _db.SaveChangesAsync();
        TempData["Success"] = $"Пополнено на {amount} {m.UnitOfMeasure}.";
        return RedirectToAction(nameof(Index));
    }

    // API: PUT /api/materials/{id}/stock
    [HttpPut("api/materials/{id}/stock")]
    public async Task<IActionResult> UpdateStock(int id, [FromBody] decimal amount)
    {
        var m = await _db.Materials.FindAsync(id);
        if (m == null) return NotFound();
        m.Quantity = amount;
        await _db.SaveChangesAsync();
        return Ok(m);
    }

    // API: GET /api/materials
    [HttpGet("api/materials")]
    public async Task<IActionResult> ApiList(bool low_stock = false)
    {
        var query = _db.Materials.AsQueryable();
        if (low_stock) query = query.Where(m => m.Quantity <= m.MinimalStock);
        return Ok(await query.ToListAsync());
    }

    // API: POST /api/materials
    [HttpPost("api/materials")]
    public async Task<IActionResult> ApiCreate([FromBody] Material material)
    {
        _db.Materials.Add(material);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(ApiList), new { id = material.Id }, material);
    }
}
