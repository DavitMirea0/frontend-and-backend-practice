using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Practice5_ProductionSystem.Data;
using Practice5_ProductionSystem.Models;

namespace Practice5_ProductionSystem.Controllers;

/// <summary>
/// Контроллер управления продуктами
/// </summary>
public class ProductsController : Controller
{
    private readonly ProductionDbContext _db;
    public ProductsController(ProductionDbContext db) => _db = db;

    public async Task<IActionResult> Index(string? category, string? search)
    {
        var query = _db.Products.AsQueryable();
        if (!string.IsNullOrWhiteSpace(category)) query = query.Where(p => p.Category == category);
        if (!string.IsNullOrWhiteSpace(search)) query = query.Where(p => p.Name.Contains(search));

        ViewBag.Categories = await _db.Products.Select(p => p.Category).Distinct().ToListAsync();
        ViewBag.Category = category;
        ViewBag.Search = search;
        return View(await query.ToListAsync());
    }

    public async Task<IActionResult> Details(int id)
    {
        var product = await _db.Products
            .Include(p => p.ProductMaterials).ThenInclude(pm => pm.Material)
            .FirstOrDefaultAsync(p => p.Id == id);
        if (product == null) return NotFound();
        return View(product);
    }

    public async Task<IActionResult> Create()
    {
        ViewBag.Materials = await _db.Materials.OrderBy(m => m.Name).ToListAsync();
        return View(new Product());
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> Create(Product product, int[] materialIds, decimal[] quantities)
    {
        if (!ModelState.IsValid)
        {
            ViewBag.Materials = await _db.Materials.OrderBy(m => m.Name).ToListAsync();
            return View(product);
        }
        _db.Products.Add(product);
        await _db.SaveChangesAsync();

        for (int i = 0; i < materialIds.Length; i++)
        {
            _db.ProductMaterials.Add(new ProductMaterial
            {
                ProductId = product.Id,
                MaterialId = materialIds[i],
                QuantityNeeded = quantities[i]
            });
        }
        await _db.SaveChangesAsync();
        TempData["Success"] = "Продукт создан.";
        return RedirectToAction(nameof(Index));
    }

    // API: GET /api/products?category=X
    [HttpGet("api/products")]
    public async Task<IActionResult> ApiList(string? category)
    {
        var query = _db.Products.AsQueryable();
        if (!string.IsNullOrEmpty(category)) query = query.Where(p => p.Category == category);
        return Ok(await query.ToListAsync());
    }

    // API: GET /api/products/{id}/materials
    [HttpGet("api/products/{id}/materials")]
    public async Task<IActionResult> ApiMaterials(int id)
    {
        var items = await _db.ProductMaterials
            .Where(pm => pm.ProductId == id)
            .Include(pm => pm.Material)
            .ToListAsync();
        return Ok(items.Select(pm => new { pm.Material.Name, pm.Material.UnitOfMeasure, pm.QuantityNeeded }));
    }

    // API: POST /api/products
    [HttpPost("api/products")]
    public async Task<IActionResult> ApiCreate([FromBody] Product product)
    {
        _db.Products.Add(product);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(ApiList), new { id = product.Id }, product);
    }
}
