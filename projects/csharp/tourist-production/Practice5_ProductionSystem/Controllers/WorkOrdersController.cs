using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Practice5_ProductionSystem.Data;
using Practice5_ProductionSystem.Models;
using Practice5_ProductionSystem.Services;

namespace Practice5_ProductionSystem.Controllers
{
    /// <summary>
    /// Контроллер производственных заказов
    /// </summary>
    public class WorkOrdersController : Controller
    {
        private readonly ProductionDbContext _context;
        private readonly ProductionCalculatorService _calculator;

        public WorkOrdersController(ProductionDbContext context, ProductionCalculatorService calculator)
        {
            _context = context;
            _calculator = calculator;
        }

        // GET: WorkOrders
        public async Task<IActionResult> Index(string? status, bool today = false)
        {
            var query = _context.WorkOrders
                .Include(o => o.Product)
                .Include(o => o.ProductionLine)
                .AsQueryable();

            if (!string.IsNullOrEmpty(status) && status != "all")
                query = query.Where(o => o.Status == status);
            if (today)
                query = query.Where(o => o.StartDate.Date == DateTime.Today);

            ViewBag.Status   = status ?? "all";
            ViewBag.Today    = today;
            ViewBag.AllLines = await _context.ProductionLines.OrderBy(l => l.Name).ToListAsync();
            return View(await query.OrderByDescending(o => o.StartDate).ToListAsync());
        }

        // GET: WorkOrders/Details/5
        public async Task<IActionResult> Details(int? id)
        {
            if (id == null) return NotFound();
            var order = await _context.WorkOrders
                .Include(o => o.Product).ThenInclude(p => p!.ProductMaterials).ThenInclude(pm => pm.Material)
                .Include(o => o.ProductionLine)
                .FirstOrDefaultAsync(o => o.Id == id);
            if (order == null) return NotFound();
            return View(order);
        }

        // GET: WorkOrders/Create
        public async Task<IActionResult> Create()
        {
            ViewBag.Products = await _context.Products.OrderBy(p => p.Name).ToListAsync();
            ViewBag.Lines    = await _context.ProductionLines.Where(l => l.Status == "Active").OrderBy(l => l.Name).ToListAsync();
            return View(new WorkOrder { StartDate = DateTime.Now });
        }

        // POST: WorkOrders/Create
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create(WorkOrder order)
        {
            if (!ModelState.IsValid)
            {
                ViewBag.Products = await _context.Products.OrderBy(p => p.Name).ToListAsync();
                ViewBag.Lines    = await _context.ProductionLines.Where(l => l.Status == "Active").OrderBy(l => l.Name).ToListAsync();
                return View(order);
            }

            var product = await _context.Products
                .Include(p => p.ProductMaterials).ThenInclude(pm => pm.Material)
                .FirstOrDefaultAsync(p => p.Id == order.ProductId);
            if (product == null) return NotFound();

            // ── Проверка наличия материалов ──────────────────────────────
            var shortages = new List<string>();
            foreach (var pm in product.ProductMaterials)
            {
                var needed   = pm.QuantityNeeded * order.Quantity;
                var material = await _context.Materials.FindAsync(pm.MaterialId);
                if (material == null || material.Quantity < needed)
                    shortages.Add($"«{material?.Name}»: нужно {needed:N2}, на складе {material?.Quantity ?? 0:N2} {material?.UnitOfMeasure}");
            }
            if (shortages.Any())
            {
                TempData["Error"] = "Недостаточно материалов:\n" + string.Join("\n", shortages);
                ViewBag.Products = await _context.Products.OrderBy(p => p.Name).ToListAsync();
                ViewBag.Lines    = await _context.ProductionLines.Where(l => l.Status == "Active").OrderBy(l => l.Name).ToListAsync();
                return View(order);
            }

            // Таймер: всегда 2 минуты
            order.EstimatedEndDate = order.StartDate.AddMinutes(2);
            _context.WorkOrders.Add(order);
            await _context.SaveChangesAsync();

            // ── Автоочередь: если линия занята — ставим в очередь ────────
            if (order.ProductionLineId.HasValue)
            {
                var result = await TryLaunchOrQueue(order.Id, order.ProductionLineId.Value);
                TempData["Success"] = result.message;
            }
            else
            {
                TempData["Success"] = $"Заказ #{order.Id} создан.";
            }

            return RedirectToAction(nameof(Index));
        }

        // POST: WorkOrders/Launch/5
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Launch(int id)
        {
            var order = await _context.WorkOrders.FindAsync(id);
            if (order == null) return NotFound();

            if (order.Status != "Pending")
            {
                TempData["Warning"] = "Запустить можно только заказ со статусом «Ожидает».";
                return RedirectToAction(nameof(Index));
            }

            if (!order.ProductionLineId.HasValue)
            {
                TempData["Error"] = "Заказу не назначена линия.";
                return RedirectToAction(nameof(Index));
            }

            var result = await TryLaunchOrQueue(order.Id, order.ProductionLineId.Value);
            TempData[result.queued ? "Warning" : "Success"] = result.message;
            return RedirectToAction(nameof(Index));
        }

        // POST: WorkOrders/Cancel/5
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Cancel(int id)
        {
            var order = await _context.WorkOrders
                .Include(o => o.Product).ThenInclude(p => p!.ProductMaterials).ThenInclude(pm => pm.Material)
                .FirstOrDefaultAsync(o => o.Id == id);

            if (order == null) return NotFound();

            if (order.Status == "Pending")
            {
                // Материалы не списывались — просто отменяем
                order.Status = "Cancelled";

                // Убрать из очереди если был
                var queueEntry = await _context.OrderQueues.FirstOrDefaultAsync(q => q.WorkOrderId == id);
                if (queueEntry != null) _context.OrderQueues.Remove(queueEntry);

                await _context.SaveChangesAsync();
                TempData["Success"] = $"Заказ #{id} отменён. Материалы не списывались.";
            }
            else if (order.Status == "InProgress" && order.MaterialsDeducted)
            {
                // Материалы уже в производстве — считаем прогресс
                var elapsed = (DateTime.Now - order.StartDate).TotalSeconds;
                var total   = (order.EstimatedEndDate - order.StartDate).TotalSeconds;
                double progress = total > 0 ? Math.Min(1.0, elapsed / total) : 0.5;

                var defectLines  = new List<string>();
                var returnLines  = new List<string>();

                foreach (var pm in order.Product!.ProductMaterials)
                {
                    var material     = await _context.Materials.FindAsync(pm.MaterialId);
                    if (material == null) continue;

                    var totalNeeded  = pm.QuantityNeeded * order.Quantity;
                    var usedQty      = Math.Round(totalNeeded * (decimal)progress, 3);
                    var returnQty    = totalNeeded - usedQty;

                    // Использованная часть → брак
                    if (usedQty > 0)
                    {
                        _context.DefectLogs.Add(new DefectLog
                        {
                            WorkOrderId      = order.Id,
                            MaterialId       = pm.MaterialId,
                            QuantityDefected = usedQty,
                            DefectedAt       = DateTime.Now,
                            Reason           = $"Отмена заказа #{order.Id} в процессе производства ({progress:P0} выполнено)"
                        });
                        defectLines.Add($"«{material.Name}»: {usedQty:N3} {material.UnitOfMeasure} → брак");
                    }

                    // Неиспользованная часть → возврат на склад
                    if (returnQty > 0)
                    {
                        material.Quantity += returnQty;
                        returnLines.Add($"«{material.Name}»: {returnQty:N3} {material.UnitOfMeasure} → возврат");
                    }
                }

                order.Status = "Cancelled";

                if (order.ProductionLineId.HasValue)
                {
                    var line = await _context.ProductionLines.FindAsync(order.ProductionLineId);
                    if (line != null && line.CurrentWorkOrderId == order.Id)
                        line.CurrentWorkOrderId = null;
                }

                await _context.SaveChangesAsync();

                // Автозапуск следующего из очереди
                if (order.ProductionLineId.HasValue)
                    await AutoLaunchNext(order.ProductionLineId.Value);

                var msg = $"Заказ #{id} отменён ({progress:P0} выполнено). ";
                if (defectLines.Any()) msg += $"В брак: {string.Join(", ", defectLines)}. ";
                if (returnLines.Any()) msg += $"Возврат на склад: {string.Join(", ", returnLines)}.";
                TempData["Warning"] = msg;
            }

            await _context.SaveChangesAsync();
            return RedirectToAction(nameof(Index));
        }

        // POST: WorkOrders/Complete/5
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Complete(int id)
        {
            var order = await _context.WorkOrders.FindAsync(id);
            if (order == null) return NotFound();

            if (order.Status == "InProgress")
            {
                order.Status = "Completed";
                int? lineId = order.ProductionLineId;

                if (lineId.HasValue)
                {
                    var line = await _context.ProductionLines.FindAsync(lineId);
                    if (line != null) line.CurrentWorkOrderId = null;
                }

                await _context.SaveChangesAsync();

                // Автозапуск следующего из очереди
                string autoMsg = "";
                if (lineId.HasValue)
                {
                    var launched = await AutoLaunchNext(lineId.Value);
                    if (launched != null) autoMsg = $" Автоматически запущен заказ #{launched}.";
                }

                TempData["Success"] = $"Заказ #{id} завершён.{autoMsg}";
            }

            return RedirectToAction(nameof(Index));
        }

        // GET: WorkOrders/MaterialAnalysis/5
        [HttpGet]
        public async Task<IActionResult> MaterialAnalysis(int id)
        {
            var order = await _context.WorkOrders
                .Include(o => o.Product).ThenInclude(p => p!.ProductMaterials).ThenInclude(pm => pm.Material)
                .FirstOrDefaultAsync(o => o.Id == id);
            if (order == null) return NotFound();

            double progress = 0;
            if (order.Status == "InProgress" && order.MaterialsDeducted)
            {
                var elapsed = (DateTime.Now - order.StartDate).TotalSeconds;
                var total   = (order.EstimatedEndDate - order.StartDate).TotalSeconds;
                progress = total > 0 ? Math.Min(1.0, elapsed / total) : 0.5;
            }

            var result = order.Product?.ProductMaterials?.Select(pm => new
            {
                name        = pm.Material?.Name ?? "—",
                totalNeeded = pm.QuantityNeeded * order.Quantity,
                usedQty     = Math.Round(pm.QuantityNeeded * order.Quantity * (decimal)progress, 3),
                returnQty   = Math.Round(pm.QuantityNeeded * order.Quantity * (decimal)(1 - progress), 3),
                unit        = pm.Material?.UnitOfMeasure ?? "",
                action      = order.MaterialsDeducted ? "split" : "none"
            }).ToList();

            return Json(new { status = order.Status, progress = Math.Round(progress * 100), materials = result });
        }

        // GET: WorkOrders/Defects
        public async Task<IActionResult> Defects()
        {
            var logs = await _context.DefectLogs
                .Include(d => d.WorkOrder).ThenInclude(o => o!.Product)
                .Include(d => d.Material)
                .OrderByDescending(d => d.DefectedAt)
                .ToListAsync();
            return View(logs);
        }

        // API: GET /api/calculate/production
        [HttpGet("/api/calculate/production")]
        public async Task<IActionResult> Calculate([FromQuery] int product_id, [FromQuery] int quantity,
                                                    [FromQuery] float efficiency = 1.0f)
        {
            var product = await _context.Products.FindAsync(product_id);
            if (product == null) return NotFound();
            return Ok(new
            {
                product_id, quantity, efficiency,
                timerSeconds = 120,
                formatted    = "2мин 0сек (фиксированный таймер)"
            });
        }

        // ── Вспомогательные методы ────────────────────────────────────────────

        /// <summary>
        /// Пытается запустить заказ. Если линия занята — ставит в очередь.
        /// Возвращает сообщение и флаг queued.
        /// </summary>
        private async Task<(string message, bool queued)> TryLaunchOrQueue(int orderId, int lineId)
        {
            var order = await _context.WorkOrders
                .Include(o => o.Product).ThenInclude(p => p!.ProductMaterials)
                .FirstOrDefaultAsync(o => o.Id == orderId);

            var line = await _context.ProductionLines
                .Include(l => l.WorkOrders.Where(w => w.Status == "InProgress"))
                .FirstOrDefaultAsync(l => l.Id == lineId);

            if (order == null || line == null)
                return ("Заказ или линия не найдены.", false);

            bool lineIsBusy = line.WorkOrders.Any(w => w.Status == "InProgress")
                           || line.CurrentWorkOrderId.HasValue;

            if (lineIsBusy || line.Status != "Active")
            {
                // Линия занята или остановлена — ставим в очередь
                bool alreadyQueued = await _context.OrderQueues.AnyAsync(q => q.WorkOrderId == orderId);
                if (!alreadyQueued)
                {
                    var maxPos = await _context.OrderQueues
                        .Where(q => q.ProductionLineId == lineId)
                        .Select(q => (int?)q.Position).MaxAsync() ?? 0;

                    order.ProductionLineId = lineId;
                    _context.OrderQueues.Add(new OrderQueue
                    {
                        ProductionLineId = lineId,
                        WorkOrderId      = orderId,
                        Position         = maxPos + 1,
                        QueuedAt         = DateTime.Now
                    });
                    await _context.SaveChangesAsync();
                    return ($"Заказ #{orderId} добавлен в очередь линии «{line.Name}» (позиция {maxPos + 1}) — линия занята.", true);
                }
                return ($"Заказ #{orderId} уже в очереди.", true);
            }

            // Линия свободна — запускаем
            return (await DoLaunch(order, line), false);
        }

        /// <summary>Запустить заказ немедленно (линия свободна)</summary>
        private async Task<string> DoLaunch(WorkOrder order, ProductionLine line)
        {
            // Списываем материалы
            foreach (var pm in order.Product!.ProductMaterials)
            {
                var material = await _context.Materials.FindAsync(pm.MaterialId);
                if (material != null)
                    material.Quantity -= pm.QuantityNeeded * order.Quantity;
            }

            order.Status           = "InProgress";
            order.StartDate        = DateTime.Now;
            order.MaterialsDeducted = true;
            // Таймер: ровно 2 минуты
            order.EstimatedEndDate = order.StartDate.AddMinutes(2);
            line.CurrentWorkOrderId = order.Id;

            await _context.SaveChangesAsync();
            return $"Заказ #{order.Id} запущен на линии «{line.Name}». Таймер: 2 минуты.";
        }

        /// <summary>Автоматически запустить следующий из очереди</summary>
        private async Task<int?> AutoLaunchNext(int lineId)
        {
            var next = await _context.OrderQueues
                .Include(q => q.WorkOrder)
                    .ThenInclude(o => o!.Product)
                        .ThenInclude(p => p!.ProductMaterials)
                .Where(q => q.ProductionLineId == lineId && q.WorkOrder!.Status == "Pending")
                .OrderBy(q => q.Position)
                .FirstOrDefaultAsync();

            if (next == null) return null;

            var line = await _context.ProductionLines.FindAsync(lineId);
            if (line == null || line.Status != "Active") return null;

            var msg = await DoLaunch(next.WorkOrder!, line);
            _context.OrderQueues.Remove(next);
            await _context.SaveChangesAsync();

            // Перенумеруем
            var remaining = await _context.OrderQueues
                .Where(q => q.ProductionLineId == lineId).OrderBy(q => q.Position).ToListAsync();
            for (int i = 0; i < remaining.Count; i++) remaining[i].Position = i + 1;
            await _context.SaveChangesAsync();

            return next.WorkOrderId;
        }
    }
}
