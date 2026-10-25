using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Practice5_ProductionSystem.Data;
using Practice5_ProductionSystem.Models;

namespace Practice5_ProductionSystem.Controllers
{
    /// <summary>
    /// Контроллер производственных линий
    /// </summary>
    public class ProductionLinesController : Controller
    {
        private readonly ProductionDbContext _context;

        public ProductionLinesController(ProductionDbContext context)
        {
            _context = context;
        }

        // GET: ProductionLines
        public async Task<IActionResult> Index(bool available = false)
        {
            var query = _context.ProductionLines
                .Include(l => l.WorkOrders.Where(o => o.Status == "InProgress" || o.Status == "Pending"))
                .ThenInclude(o => o.Product)
                .AsQueryable();

            if (available) query = query.Where(l => l.Status == "Active");

            ViewBag.Available = available;
            return View(await query.ToListAsync());
        }

        // POST: ProductionLines/ToggleStatus
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> ToggleStatus(int id)
        {
            var line = await _context.ProductionLines.FindAsync(id);
            if (line == null) return NotFound();
            line.Status = line.Status == "Active" ? "Stopped" : "Active";
            await _context.SaveChangesAsync();
            return RedirectToAction(nameof(Index));
        }

        // POST: ProductionLines/UpdateEfficiency (форма)
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> UpdateEfficiency(int id, float efficiency)
        {
            var line = await _context.ProductionLines.FindAsync(id);
            if (line == null) return NotFound();
            line.EfficiencyFactor = Math.Clamp(efficiency, 0.5f, 2.0f);
            await _context.SaveChangesAsync();
            return RedirectToAction(nameof(Index));
        }

        // POST: ProductionLines/UpdateEfficiencyAjax — изменение на лету (слайдер)
        [HttpPost]
        public async Task<IActionResult> UpdateEfficiencyAjax([FromBody] EfficiencyUpdateDto dto)
        {
            var line = await _context.ProductionLines.FindAsync(dto.Id);
            if (line == null) return Json(new { success = false });
            line.EfficiencyFactor = Math.Clamp(dto.Efficiency, 0.5f, 2.0f);
            await _context.SaveChangesAsync();
            return Json(new { success = true, efficiency = line.EfficiencyFactor });
        }

        // GET: ProductionLines/Schedule/5
        public async Task<IActionResult> Schedule(int id)
        {
            var line = await _context.ProductionLines.FindAsync(id);
            if (line == null) return NotFound();

            var orders = await _context.WorkOrders
                .Include(o => o.Product)
                .Where(o => o.ProductionLineId == id && o.Status != "Cancelled")
                .OrderBy(o => o.StartDate)
                .ToListAsync();

            ViewBag.Line = line;
            return View(orders);
        }

        // POST: ProductionLines/RescheduleOrder
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> RescheduleOrder(int orderId, DateTime newStartDate)
        {
            var order = await _context.WorkOrders
                .Include(o => o.Product)
                .FirstOrDefaultAsync(o => o.Id == orderId);
            if (order == null) return NotFound();

            float efficiency = 1.0f;
            if (order.ProductionLineId.HasValue)
            {
                var line = await _context.ProductionLines.FindAsync(order.ProductionLineId);
                efficiency = line?.EfficiencyFactor ?? 1.0f;
            }

            order.StartDate = newStartDate;
            double totalMinutes = (order.Quantity * order.Product!.ProductionTimePerUnit) / efficiency;
            order.EstimatedEndDate = newStartDate.AddMinutes(totalMinutes);
            await _context.SaveChangesAsync();
            return RedirectToAction(nameof(Schedule), new { id = order.ProductionLineId });
        }

        // API: GET /api/lines
        [HttpGet("/api/lines")]
        public async Task<IActionResult> ApiList([FromQuery] bool available = false)
        {
            var query = _context.ProductionLines.AsQueryable();
            if (available) query = query.Where(l => l.Status == "Active");
            return Ok(await query.ToListAsync());
        }
    }

    /// <summary>DTO для обновления эффективности линии через AJAX</summary>
    public class EfficiencyUpdateDto
    {
        public int Id { get; set; }
        public float Efficiency { get; set; }
    }
}
