using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Practice5_ProductionSystem.Models
{
    /// <summary>
    /// Продукт производства
    /// </summary>
    public class Product
    {
        public int Id { get; set; }

        [Required(ErrorMessage = "Наименование обязательно")]
        [Display(Name = "Наименование")]
        public string Name { get; set; } = string.Empty;

        [Display(Name = "Описание")]
        public string Description { get; set; } = string.Empty;

        [Display(Name = "Характеристики (JSON)")]
        public string Specifications { get; set; } = string.Empty;

        [Display(Name = "Категория")]
        public string Category { get; set; } = string.Empty;

        [Display(Name = "Минимальный запас")]
        public int MinimalStock { get; set; }

        [Display(Name = "Время производства (мин/шт)")]
        public int ProductionTimePerUnit { get; set; }

        // Навигация
        public List<ProductMaterial> ProductMaterials { get; set; } = new();
        public List<WorkOrder> WorkOrders { get; set; } = new();
    }

    /// <summary>
    /// Производственная линия
    /// </summary>
    public class ProductionLine
    {
        public int Id { get; set; }

        [Required]
        [Display(Name = "Название линии")]
        public string Name { get; set; } = string.Empty;

        [Display(Name = "Статус")]
        public string Status { get; set; } = "Stopped"; // Active / Stopped

        [Display(Name = "Коэффициент эффективности")]
        [Range(0.5, 2.0, ErrorMessage = "Значение должно быть от 0.5 до 2.0")]
        [Column(TypeName = "real")]
        public float EfficiencyFactor { get; set; } = 1.0f;

        [Display(Name = "Текущий заказ")]
        public int? CurrentWorkOrderId { get; set; }

        // Навигация
        public List<WorkOrder> WorkOrders { get; set; } = new();
    }

    /// <summary>
    /// Материал на складе
    /// </summary>
    public class Material
    {
        public int Id { get; set; }

        [Required]
        [Display(Name = "Наименование")]
        public string Name { get; set; } = string.Empty;

        [Display(Name = "Количество")]
        [Column(TypeName = "decimal(18,3)")]
        public decimal Quantity { get; set; }

        [Display(Name = "Единица измерения")]
        public string UnitOfMeasure { get; set; } = "шт";

        [Display(Name = "Минимальный запас")]
        [Column(TypeName = "decimal(18,3)")]
        public decimal MinimalStock { get; set; }

        // Навигация
        public List<ProductMaterial> ProductMaterials { get; set; } = new();

        [NotMapped]
        public bool IsLowStock => Quantity <= MinimalStock;
    }

    /// <summary>
    /// Связь продукта и материала (сколько материала нужно на 1 ед. продукта)
    /// </summary>
    public class ProductMaterial
    {
        public int ProductId { get; set; }
        public Product? Product { get; set; }

        public int MaterialId { get; set; }
        public Material? Material { get; set; }

        [Display(Name = "Необходимое количество на 1 ед.")]
        [Column(TypeName = "decimal(18,3)")]
        public decimal QuantityNeeded { get; set; }
    }

    /// <summary>
    /// Производственный заказ
    /// </summary>
    public class WorkOrder
    {
        public int Id { get; set; }

        [Display(Name = "Продукт")]
        public int ProductId { get; set; }
        public Product? Product { get; set; }

        [Display(Name = "Производственная линия")]
        public int? ProductionLineId { get; set; }
        public ProductionLine? ProductionLine { get; set; }

        [Display(Name = "Количество единиц")]
        [Range(1, int.MaxValue, ErrorMessage = "Количество должно быть больше 0")]
        public int Quantity { get; set; }

        [Display(Name = "Дата начала")]
        [DataType(DataType.DateTime)]
        public DateTime StartDate { get; set; } = DateTime.Now;

        [Display(Name = "Расчётная дата завершения")]
        [DataType(DataType.DateTime)]
        public DateTime EstimatedEndDate { get; set; }

        [Display(Name = "Статус")]
        public string Status { get; set; } = "Pending"; // Pending / InProgress / Completed / Cancelled

        /// <summary>Флаг: материалы уже списаны со склада при запуске</summary>
        public bool MaterialsDeducted { get; set; } = false;

        [NotMapped]
        public int ProgressPercent
        {
            get
            {
                if (Status != "InProgress") return Status == "Completed" ? 100 : 0;
                // Реальный прогресс по времени (таймер 2 мин = 120 сек)
                var elapsed = (DateTime.Now - StartDate).TotalSeconds;
                var total   = (EstimatedEndDate - StartDate).TotalSeconds;
                if (total <= 0) return 0;
                return (int)Math.Min(100, elapsed / total * 100);
            }
        }
    }

    /// <summary>
    /// Журнал брака — списание материалов при отмене заказа в процессе производства
    /// </summary>
    public class DefectLog
    {
        public int Id { get; set; }

        [Display(Name = "Заказ")]
        public int WorkOrderId { get; set; }
        public WorkOrder? WorkOrder { get; set; }

        [Display(Name = "Материал")]
        public int MaterialId { get; set; }
        public Material? Material { get; set; }

        [Display(Name = "Списано (брак)")]
        [Column(TypeName = "decimal(18,3)")]
        public decimal QuantityDefected { get; set; }

        [Display(Name = "Дата списания")]
        public DateTime DefectedAt { get; set; } = DateTime.Now;

        [Display(Name = "Причина")]
        public string Reason { get; set; } = "Отмена заказа в процессе производства";
    }

    /// <summary>
    /// Позиция заказа в очереди на производственную линию
    /// </summary>
    public class OrderQueue
    {
        public int Id { get; set; }

        [Display(Name = "Линия")]
        public int ProductionLineId { get; set; }
        public ProductionLine? ProductionLine { get; set; }

        [Display(Name = "Заказ")]
        public int WorkOrderId { get; set; }
        public WorkOrder? WorkOrder { get; set; }

        [Display(Name = "Позиция в очереди")]
        public int Position { get; set; }

        [Display(Name = "Добавлен в очередь")]
        public DateTime QueuedAt { get; set; } = DateTime.Now;
    }
}
