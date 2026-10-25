using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Practice5_ProductionSystem.Data;
using Practice5_ProductionSystem.Models;
using Practice5_ProductionSystem.Services;

namespace Practice5_ProductionSystem.Controllers
{
    /// <summary>
    /// Контроллер управления очередью заказов
    /// </summary>
    public class QueueController : Controller
    {
        private readonly ProductionDbContext _context;
        private readonly ProductionCalculatorService _calculator;

        public QueueController(ProductionDbContext context, ProductionCalculatorService calculator)
        {
            _context = context;
            _calculator = calculator;
        }

        // GET: Queue — обзор очередей по всем линиям
        public async Task<IActionResult> Index()
        {
            var lines = await _context.ProductionLines
                .Include(l => l.WorkOrders.Where(o => o.Status == "InProgress"))
                    .ThenInclude(o => o.Product)
                .ToListAsync();

            var queues = await _context.OrderQueues
                .Include(q => q.WorkOrder).ThenInclude(o => o!.Product)
                .Include(q => q.ProductionLine)
                .Where(q => q.WorkOrder!.Status == "Pending")
                .OrderBy(q => q.ProductionLineId)
                .ThenBy(q => q.Position)
                .ToListAsync();

            ViewBag.Lines = lines;
            return View(queues);
        }

        // POST: Queue/Add — добавить заказ в очередь на линию
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Add(int workOrderId, int productionLineId)
        {
            var order = await _context.WorkOrders.FindAsync(workOrderId);
            var line  = await _context.ProductionLines.FindAsync(productionLineId);

            if (order == null || line == null)
                return NotFound();

            if (order.Status != "Pending")
            {
                TempData["Error"] = "Добавить в очередь можно только заказы со статусом «Ожидает».";
                return RedirectToAction("Index", "WorkOrders");
            }

            // Проверяем, не в очереди ли уже
            var alreadyQueued = await _context.OrderQueues
                .AnyAsync(q => q.WorkOrderId == workOrderId);
            if (alreadyQueued)
            {
                TempData["Warning"] = "Этот заказ уже находится в очереди.";
                return RedirectToAction(nameof(Index));
            }

            // Определяем следующую позицию
            var maxPos = await _context.OrderQueues
                .Where(q => q.ProductionLineId == productionLineId)
                .Select(q => (int?)q.Position)
                .MaxAsync() ?? 0;

            // Привязываем заказ к линии
            order.ProductionLineId = productionLineId;

            _context.OrderQueues.Add(new OrderQueue
            {
                ProductionLineId = productionLineId,
                WorkOrderId      = workOrderId,
                Position         = maxPos + 1,
                QueuedAt         = DateTime.Now
            });

            await _context.SaveChangesAsync();

            // Если линия свободна — автоматически запускаем первый в очереди
            await TryAutoLaunchNext(productionLineId);

            TempData["Success"] = $"Заказ #{workOrderId} добавлен в очередь линии «{line.Name}».";
            return RedirectToAction(nameof(Index));
        }

        // POST: Queue/Remove — убрать из очереди
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Remove(int queueId)
        {
            var entry = await _context.OrderQueues.FindAsync(queueId);
            if (entry == null) return NotFound();

            int lineId = entry.ProductionLineId;
            _context.OrderQueues.Remove(entry);
            await _context.SaveChangesAsync();

            // Перенумеруем позиции
            await RenumberQueue(lineId);

            TempData["Success"] = "Заказ удалён из очереди.";
            return RedirectToAction(nameof(Index));
        }

        // POST: Queue/MoveUp — поднять в очереди
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> MoveUp(int queueId)
        {
            var entry = await _context.OrderQueues.FindAsync(queueId);
            if (entry == null) return NotFound();

            var prev = await _context.OrderQueues
                .Where(q => q.ProductionLineId == entry.ProductionLineId && q.Position < entry.Position)
                .OrderByDescending(q => q.Position)
                .FirstOrDefaultAsync();

            if (prev != null)
            {
                (entry.Position, prev.Position) = (prev.Position, entry.Position);
                await _context.SaveChangesAsync();
            }

            return RedirectToAction(nameof(Index));
        }

        // POST: Queue/MoveDown — опустить в очереди
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> MoveDown(int queueId)
        {
            var entry = await _context.OrderQueues.FindAsync(queueId);
            if (entry == null) return NotFound();

            var next = await _context.OrderQueues
                .Where(q => q.ProductionLineId == entry.ProductionLineId && q.Position > entry.Position)
                .OrderBy(q => q.Position)
                .FirstOrDefaultAsync();

            if (next != null)
            {
                (entry.Position, next.Position) = (next.Position, entry.Position);
                await _context.SaveChangesAsync();
            }

            return RedirectToAction(nameof(Index));
        }

        // POST: Queue/Reorder — перетаскивание (drag & drop, AJAX)
        [HttpPost]
        public async Task<IActionResult> Reorder([FromBody] ReorderDto dto)
        {
            var entries = await _context.OrderQueues
                .Where(q => q.ProductionLineId == dto.LineId)
                .ToListAsync();

            for (int i = 0; i < dto.OrderedIds.Count; i++)
            {
                var entry = entries.FirstOrDefault(e => e.Id == dto.OrderedIds[i]);
                if (entry != null) entry.Position = i + 1;
            }

            await _context.SaveChangesAsync();
            return Json(new { success = true });
        }

        // POST: Queue/LaunchNext — вручную запустить следующий в очереди
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> LaunchNext(int lineId)
        {
            var launched = await TryAutoLaunchNext(lineId);
            TempData[launched ? "Success" : "Warning"] = launched
                ? "Следующий заказ из очереди запущен в производство."
                : "Линия занята или очередь пуста.";
            return RedirectToAction(nameof(Index));
        }

        // ── Вспомогательные методы ─────────────────────────────────────

        /// <summary>
        /// Автоматически запускает следующий заказ из очереди если линия свободна
        /// </summary>
        private async Task<bool> TryAutoLaunchNext(int lineId)
        {
            var line = await _context.ProductionLines
                .Include(l => l.WorkOrders.Where(o => o.Status == "InProgress"))
                .FirstOrDefaultAsync(l => l.Id == lineId);

            if (line == null || line.Status != "Active") return false;
            if (line.WorkOrders.Any(o => o.Status == "InProgress")) return false; // линия занята

            var next = await _context.OrderQueues
                .Include(q => q.WorkOrder).ThenInclude(o => o!.Product)
                    .ThenInclude(p => p!.ProductMaterials)
                .Where(q => q.ProductionLineId == lineId && q.WorkOrder!.Status == "Pending")
                .OrderBy(q => q.Position)
                .FirstOrDefaultAsync();

            if (next == null) return false;

            var order = next.WorkOrder!;

            // Списываем материалы
            foreach (var pm in order.Product!.ProductMaterials)
            {
                var material = await _context.Materials.FindAsync(pm.MaterialId);
                if (material != null)
                    material.Quantity -= pm.QuantityNeeded * order.Quantity;
            }

            // Пересчитываем время с текущей эффективностью линии
            order.Status    = "InProgress";
            order.StartDate = DateTime.Now;
            order.EstimatedEndDate = _calculator.CalculateEndDate(
                order.StartDate, order.Quantity,
                order.Product.ProductionTimePerUnit, line.EfficiencyFactor);

            line.CurrentWorkOrderId = order.Id;

            // Удаляем из очереди
            _context.OrderQueues.Remove(next);
            await _context.SaveChangesAsync();

            // Перенумеруем оставшиеся
            await RenumberQueue(lineId);

            return true;
        }

        /// <summary>Перенумеровать позиции после удаления</summary>
        private async Task RenumberQueue(int lineId)
        {
            var remaining = await _context.OrderQueues
                .Where(q => q.ProductionLineId == lineId)
                .OrderBy(q => q.Position)
                .ToListAsync();

            for (int i = 0; i < remaining.Count; i++)
                remaining[i].Position = i + 1;

            await _context.SaveChangesAsync();
        }
    }

    /// <summary>DTO для drag-and-drop перестановки</summary>
    public class ReorderDto
    {
        public int LineId { get; set; }
        public List<int> OrderedIds { get; set; } = new();
    }
}
