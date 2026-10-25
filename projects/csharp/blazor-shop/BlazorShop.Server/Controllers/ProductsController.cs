using BlazorShop.Server.Data;
using BlazorShop.Shared;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BlazorShop.Server.Controllers;

/// <summary>
/// REST API для управления товарами интернет-магазина.
/// Реализует все требуемые методы: GET, POST, PUT, DELETE по адресу /api/products.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ILogger<ProductsController> _logger;

    public ProductsController(AppDbContext db, ILogger<ProductsController> logger)
    {
        _db = db;
        _logger = logger;
    }

    /// <summary>
    /// GET /api/products — возвращает полный список товаров,
    /// отсортированный по дате добавления (новые сверху).
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Product>>> GetAll()
    {
        var products = await _db.Products
            .AsNoTracking()
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();

        _logger.LogInformation("Возвращено товаров: {Count}", products.Count);
        return Ok(products);
    }

    /// <summary>
    /// GET /api/products/{id} — возвращает один товар по идентификатору.
    /// </summary>
    [HttpGet("{id:int}")]
    public async Task<ActionResult<Product>> GetById(int id)
    {
        var product = await _db.Products.FindAsync(id);
        if (product is null)
        {
            return NotFound($"Товар с Id={id} не найден");
        }
        return Ok(product);
    }

    /// <summary>
    /// POST /api/products — добавляет новый товар.
    /// Идентификатор присваивается автоматически базой данных.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<Product>> Create([FromBody] Product product)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        // Игнорируем переданный Id и дату — присваиваем их сами
        product.Id = 0;
        product.CreatedAt = DateTime.UtcNow;

        _db.Products.Add(product);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Создан товар Id={Id}, Name={Name}", product.Id, product.Name);
        return CreatedAtAction(nameof(GetById), new { id = product.Id }, product);
    }

    /// <summary>
    /// PUT /api/products/{id} — изменяет существующий товар.
    /// </summary>
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] Product updated)
    {
        if (id != updated.Id)
        {
            return BadRequest("Id в URL и теле запроса не совпадают");
        }

        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var existing = await _db.Products.FindAsync(id);
        if (existing is null)
        {
            return NotFound($"Товар с Id={id} не найден");
        }

        // Обновляем только редактируемые поля, CreatedAt не трогаем
        existing.Name = updated.Name;
        existing.Description = updated.Description;
        existing.Category = updated.Category;
        existing.Price = updated.Price;
        existing.Stock = updated.Stock;

        await _db.SaveChangesAsync();
        _logger.LogInformation("Обновлён товар Id={Id}", id);

        return NoContent();
    }

    /// <summary>
    /// DELETE /api/products/{id} — удаляет товар по идентификатору.
    /// </summary>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var product = await _db.Products.FindAsync(id);
        if (product is null)
        {
            return NotFound($"Товар с Id={id} не найден");
        }

        _db.Products.Remove(product);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Удалён товар Id={Id}, Name={Name}", id, product.Name);
        return NoContent();
    }
}
