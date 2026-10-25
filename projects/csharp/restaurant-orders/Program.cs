using System;
using System.Collections.Generic;
using System.Linq;

namespace RestaurantSystem
{
    // ==================== СИСТЕМА ЗАКАЗОВ ====================

    //Категория
    public enum Category
    {
        Напитки,
        Салаты,
        Холодные_закуски,
        Горячие_закуски,
        Супы,
        Горячие_блюда,
        Десерты
    }

    public class Dish //Блюдо
    {
        private static int nextID = 1;
        public int ID
        {
            get; private set;
        }
        public string Name //Имя
        {
            get; set;
        }
        public string Composition { get; set; }
        public string Weight { get; set; }
        public double Price { get; set; }
        public Category Category { get; set; }
        public int CookingTime { get; set; }
        public string[] Types { get; set; }

        // Конструктор для создания блюда
        public Dish(string name, string composition, string weight, double price,
                    Category category, int cookingTime, params string[] types)
        {
            ID = nextID++;
            Name = name;
            Composition = composition;
            Weight = weight;
            Price = price;
            Category = category;
            CookingTime = cookingTime;
            Types = types;
        }

        // Метод редактирования блюда
        public void Edit(string name = null, string composition = null, string weight = null,
                         double? price = null, Category? category = null, int? cookingTime = null,
                         string[] types = null)
        {
            if (name != null) Name = name;
            if (composition != null) Composition = composition;
            if (weight != null) Weight = weight;
            if (price.HasValue) Price = price.Value;
            if (category.HasValue) Category = category.Value;
            if (cookingTime.HasValue) CookingTime = cookingTime.Value;
            if (types != null) Types = types;
        }

        // Метод вывода информации о блюде
        public void DisplayInfo()
        {
            Console.WriteLine($"\n--- ID блюдо: {ID} ---");
            Console.WriteLine($"Название: {Name}");
            Console.WriteLine($"Состав: {Composition}");
            Console.WriteLine($"Вес: {Weight}");
            Console.WriteLine($"Цена: {Price:F2} руб.");
            Console.WriteLine($"Категория: {Category}");
            Console.WriteLine($"Время готовки: {CookingTime} мин.");
            Console.WriteLine($"Типы: {string.Join(", ", Types)}");
        }

        // Статический метод удаления блюда (используется ref для передачи массива)
        public static void DeleteDish(ref Dish[] dishes, int dishId)
        {
            int index = Array.FindIndex(dishes, d => d != null && d.ID == dishId);

            if (index >= 0)
            {
                dishes[index] = null;
                Console.WriteLine($"Блюдо с ID {dishId} удалено.");
            }
            else
            {
                Console.WriteLine($"Блюдо с ID {dishId} не найдено.");
            }
        }
    }

    // Класс Заказ
    public class Order
    {
        private static int nextId = 1;

        public int Id { get; private set; }
        public int TableId { get; set; }
        public List<(Dish dish, int quantity)> Dishes { get; set; }
        public string Comment { get; set; }
        public DateTime OrderTime { get; private set; }
        public int WaiterId { get; set; }
        public DateTime? CloseTime { get; private set; }
        public double TotalCost { get; private set; }
        public bool IsClosed { get; private set; }

        // Создание заказа
        public Order(int tableId, int waiterId, string comment = "")
        {
            Id = nextId++;
            TableId = tableId;
            WaiterId = waiterId;
            Comment = comment;
            OrderTime = DateTime.Now;
            Dishes = new List<(Dish, int)>();
            IsClosed = false;
        }

        // Добавление блюд в заказ (используется params для переменного количества блюд)
        public void AddDishes(params (Dish dish, int quantity)[] dishItems)
        {
            if (IsClosed)
            {
                Console.WriteLine("Невозможно изменить закрытый заказ.");
                return;
            }

            foreach (var item in dishItems)
            {
                var existing = Dishes.FirstOrDefault(d => d.dish.ID == item.dish.ID);

                if (existing.dish != null)
                {
                    int index = Dishes.IndexOf(existing);
                    Dishes[index] = (existing.dish, existing.quantity + item.quantity);
                }
                else
                {
                    Dishes.Add(item);
                }
            }

            CalculateTotalCost();
        }

        // Изменение заказа (использует in для входного параметра comment)
        public void ModifyOrder(int? tableId, int? waiterId, in string comment)
        {
            if (IsClosed)
            {
                Console.WriteLine("Невозможно изменить закрытый заказ.");
                return;
            }

            if (tableId.HasValue) TableId = tableId.Value;
            if (waiterId.HasValue) WaiterId = waiterId.Value;
            if (comment != null) Comment = comment;
        }

        // Подсчет итоговой стоимости
        private void CalculateTotalCost()
        {
            TotalCost = 0;
            foreach (var item in Dishes)
            {
                TotalCost += item.dish.Price * item.quantity;
            }
        }

        // Вывод информации о заказе
        public void DisplayInfo()
        {
            Console.WriteLine($"\n=== Заказ ID: {Id} ===");
            Console.WriteLine($"Столик: {TableId}");
            Console.WriteLine($"Официант: {WaiterId}");
            Console.WriteLine($"Время заказа: {OrderTime:dd.MM.yyyy HH:mm}");
            Console.WriteLine($"Комментарий: {Comment}");
            Console.WriteLine($"Статус: {(IsClosed ? "Закрыт" : "Открыт")}");

            if (IsClosed && CloseTime.HasValue)
            {
                Console.WriteLine($"Время закрытия: {CloseTime:dd.MM.yyyy HH:mm}");
            }

            Console.WriteLine("\nБлюда в заказе:");
            foreach (var item in Dishes)
            {
                Console.WriteLine($"  {item.dish.Name} x{item.quantity} = {item.dish.Price * item.quantity:F2} руб.");
            }
            Console.WriteLine($"\nИтоговая стоимость: {TotalCost:F2} руб.");
        }

        // Закрытие заказа (использует out для возврата результата)
        public void CloseOrder(out bool success, out string message)
        {
            if (IsClosed)
            {
                success = false;
                message = "Заказ уже закрыт.";
                return;
            }

            if (Dishes.Count == 0)
            {
                success = false;
                message = "Невозможно закрыть пустой заказ.";
                return;
            }

            IsClosed = true;
            CloseTime = DateTime.Now;
            success = true;
            message = $"Заказ {Id} успешно закрыт.";
        }

        // Вывод чека (только для закрытых заказов)
        public void PrintReceipt()
        {
            if (!IsClosed)
            {
                Console.WriteLine("Чек можно распечатать только для закрытых заказов.");
                return;
            }

            Console.WriteLine("\n*************************************************");
            Console.WriteLine($"Столик: {TableId}");
            Console.WriteLine($"Официант: {WaiterId}");
            Console.WriteLine($"Период обслуживания: с {OrderTime:HH:mm} по {CloseTime:HH:mm}");
            Console.WriteLine();

            // Группировка блюд по категориям
            var groupedDishes = Dishes.GroupBy(d => d.dish.Category);

            foreach (var group in groupedDishes.OrderBy(g => g.Key))
            {
                Console.WriteLine($"Категория {group.Key}:");
                double categoryTotal = 0;

                foreach (var item in group)
                {
                    double itemTotal = item.dish.Price * item.quantity;
                    categoryTotal += itemTotal;
                    Console.WriteLine($"  {item.dish.Name,-30} {item.quantity}x{item.dish.Price:F2}={itemTotal:F2} руб.");
                }

                Console.WriteLine($"  Под_итог категории: {categoryTotal:F2} руб.\n");
            }

            Console.WriteLine($"Итог счета: {TotalCost:F2} руб.");
            Console.WriteLine("*************************************************\n");
        }
    }

    // ==================== СИСТЕМА БРОНИРОВАНИЯ ====================

    class Table
    {
        public int Id { get; set; }
        public string Location { get; set; }
        public int Seats { get; set; }
        public Dictionary<string, string> Schedule { get; set; }

        public Table(int id, string location, int seats)
        {
            Id = id;
            Location = location;
            Seats = seats;
            Schedule = new Dictionary<string, string>();
            InitializeSchedule();
        }

        private void InitializeSchedule()
        {
            for (int hour = 9; hour < 18; hour++)
            {
                Schedule.Add($"{hour}:00-{hour + 1}:00", "");
            }
        }

        public void UpdateTable(string location, int seats)
        {
            Location = location;
            Seats = seats;
        }

        public void PrintInfo()
        {
            Console.WriteLine($"\n***************************************************************");
            Console.WriteLine($"ID: {Id}");
            Console.WriteLine($"Расположение: {Location}");
            Console.WriteLine($"Количество мест: {Seats}");
            Console.WriteLine("Расписание:");
            foreach (var slot in Schedule)
            {
                if (string.IsNullOrEmpty(slot.Value))
                    Console.WriteLine($"{slot.Key} -----------------------------------------------------");
                else
                    Console.WriteLine($"{slot.Key} ---- {slot.Value}");
            }
            Console.WriteLine("***************************************************************\n");
        }
    }

    class Booking
    {
        public int ClientId { get; set; }
        public string ClientName { get; set; }
        public string PhoneNumber { get; set; }
        public int TableId { get; set; }
        public int StartHour { get; set; }
        public int EndHour { get; set; }
        public string Comment { get; set; }

        public Booking(int clientId, string name, string phone, int tableId, int startHour, int endHour, string comment)
        {
            ClientId = clientId;
            ClientName = name;
            PhoneNumber = phone;
            TableId = tableId;
            StartHour = startHour;
            EndHour = endHour;
            Comment = comment;
        }

        public void ApplyBooking(Table table)
        {
            for (int hour = StartHour; hour < EndHour; hour++)
            {
                string slot = $"{hour}:00-{hour + 1}:00";
                if (table.Schedule.ContainsKey(slot))
                {
                    table.Schedule[slot] = $"ID {ClientId}, {ClientName}, {PhoneNumber}";
                }
            }
        }

        public void CancelBooking(Table table)
        {
            for (int hour = StartHour; hour < EndHour; hour++)
            {
                string slot = $"{hour}:00-{hour + 1}:00";
                if (table.Schedule.ContainsKey(slot))
                {
                    table.Schedule[slot] = "";
                }
            }
        }

        public void PrintBooking()
        {
            Console.WriteLine($"ID клиента: {ClientId}");
            Console.WriteLine($"Имя: {ClientName}");
            Console.WriteLine($"Телефон: {PhoneNumber}");
            Console.WriteLine($"Стол: {TableId}");
            Console.WriteLine($"Время: {StartHour}:00 - {EndHour}:00");
            Console.WriteLine($"Комментарий: {Comment}");
            Console.WriteLine("------------------------------");
        }
    }

    // ==================== ГЛАВНАЯ ПРОГРАММА ====================

    class Program
    {
        static Dish[] menu;
        static List<Order> orders;
        static List<Table> tables;
        static List<Booking> bookings;

        static void Main()
        {
            Console.OutputEncoding = System.Text.Encoding.UTF8;

            // Инициализация данных
            InitializeData();

            // Главное меню
            while (true)
            {
                Console.Clear();
                Console.WriteLine("╔════════════════════════════════════════════════╗");
                Console.WriteLine("║       СИСТЕМА РЕСТОРАНА «RestoBuilder's»       ║");
                Console.WriteLine("╠════════════════════════════════════════════════╣");
                Console.WriteLine("║ 1. Система заказов                             ║");
                Console.WriteLine("║ 2. Система бронирования                        ║");
                Console.WriteLine("║ 0. Выход                                       ║");
                Console.WriteLine("╚════════════════════════════════════════════════╝");
                Console.Write("Ваш выбор: ");

                string choice = Console.ReadLine();

                switch (choice)
                {
                    case "1":
                        OrderSystemMenu();
                        break;
                    case "2":
                        BookingSystemMenu();
                        break;
                    case "0":
                        Console.WriteLine("Выход из программы...");
                        return;
                    default:
                        Console.WriteLine("Неверный выбор! Нажмите любую клавишу для продолжения...");
                        Console.ReadKey();
                        break;
                }
            }
        }

        static void InitializeData()
        {
            // Инициализация меню
            menu = new Dish[10];
            menu[0] = new Dish("Цезарь", "Салат, курица, сыр, соус", "250/0/50", 450,
                              Category.Салаты, 15, "кошерное");
            menu[1] = new Dish("Пиканья", "Говядина, специи", "300/0/0", 3500,
                              Category.Горячие_блюда, 20);
            menu[2] = new Dish("Стейк Филе миньон", "Говядина, специи", "200/0/50", 7000,
                              Category.Горячие_блюда, 25, "халяль");
            menu[3] = new Dish("Тирамису", "Маскарпоне, кофе, какао", "150/0/0", 320,
                              Category.Десерты, 5, "веганское");
            menu[4] = new Dish("Том Ям", "Креветки, кокос, специи", "400/0/0", 580,
                              Category.Супы, 30, "острое");
            menu[5] = new Dish("Греческий салат", "Огурцы, помидоры, фета", "200/0/30", 380,
                              Category.Салаты, 10);
            menu[6] = new Dish("Раф", "Кофе", "200/0/0", 800,
                              Category.Напитки, 3);
            menu[7] = new Dish("Стейк Нью-Йорк", "Говядина, специи", "150/0/0", 2900,
                              Category.Горячие_блюда, 10, "веганское");

            // Инициализация заказов
            orders = new List<Order>();
            Order order1 = new Order(5, 101, "Без лука");
            order1.AddDishes((menu[0], 2), (menu[1], 1), (menu[3], 1));
            orders.Add(order1);

            Order order2 = new Order(3, 102);
            order2.AddDishes((menu[2], 1), (menu[4], 1), (menu[6], 2));
            orders.Add(order2);

            Order order3 = new Order(7, 101, "Без соли");
            order3.AddDishes((menu[5], 1), (menu[7], 2));
            orders.Add(order3);

            // Инициализация столов и бронирований
            tables = new List<Table>();
            bookings = new List<Booking>();

            tables.Add(new Table(1, "у окна", 4));
            tables.Add(new Table(2, "у прохода", 2));
            tables.Add(new Table(3, "в глубине", 6));

            Booking booking1 = new Booking(3, "Макс", "88005553535", 1, 12, 15, "День рождения");
            booking1.ApplyBooking(tables[0]);
            bookings.Add(booking1);

            Booking booking2 = new Booking(7, "Анна", "5745552377", 1, 16, 17, "Встреча");
            booking2.ApplyBooking(tables[0]);
            bookings.Add(booking2);
        }

        static void OrderSystemMenu()
        {
            while (true)
            {
                Console.Clear();
                Console.WriteLine("╔════════════════════════════════════════════════╗");
                Console.WriteLine("║              СИСТЕМА ЗАКАЗОВ                   ║");
                Console.WriteLine("╠════════════════════════════════════════════════╣");
                Console.WriteLine("║ 1. Просмотр меню                               ║");
                Console.WriteLine("║ 2. Просмотр всех заказов                       ║");
                Console.WriteLine("║ 3. Создать новый заказ                         ║");
                Console.WriteLine("║ 4. Закрыть заказ                               ║");
                Console.WriteLine("║ 5. Печать чека                                 ║");
                Console.WriteLine("║ 6. Статистика                                  ║");
                Console.WriteLine("║ 0. Назад                                       ║");
                Console.WriteLine("╚════════════════════════════════════════════════╝");
                Console.Write("Ваш выбор: ");

                string choice = Console.ReadLine();

                switch (choice)
                {
                    case "1":
                        PrintMenu(menu);
                        break;
                    case "2":
                        Console.WriteLine("\n--- Информация о заказах ---");
                        foreach (var order in orders)
                        {
                            order.DisplayInfo();
                        }
                        break;
                    case "3":
                        CreateNewOrder();
                        break;
                    case "4":
                        CloseOrder();
                        break;
                    case "5":
                        PrintReceipt();
                        break;
                    case "6":
                        ShowStatistics();
                        break;
                    case "0":
                        return;
                    default:
                        Console.WriteLine("Неверный выбор!");
                        break;
                }

                Console.WriteLine("\nНажмите любую клавишу для продолжения...");
                Console.ReadKey();
            }
        }

        static void BookingSystemMenu()
        {
            while (true)
            {
                Console.Clear();
                Console.WriteLine("╔════════════════════════════════════════════════╗");
                Console.WriteLine("║             СИСТЕМА БРОНИРОВАНИЯ               ║");
                Console.WriteLine("╠════════════════════════════════════════════════╣");
                Console.WriteLine("║ 1. Просмотр всех столов                        ║");
                Console.WriteLine("║ 2. Просмотр всех бронирований                  ║");
                Console.WriteLine("║ 3. Вывод информации о столе по ID              ║");
                Console.WriteLine("║ 4. Добавить бронирование                       ║");
                Console.WriteLine("║ 5. Поиск бронирования                          ║");
                Console.WriteLine("║ 0. Назад                                       ║");
                Console.WriteLine("╚════════════════════════════════════════════════╝");
                Console.Write("Ваш выбор: ");

                string choice = Console.ReadLine();

                switch (choice)
                {
                    case "1":
                        foreach (var t in tables)
                            Console.WriteLine($"ID {t.Id}: {t.Location}, мест: {t.Seats}");
                        break;
                    case "2":
                        foreach (var b in bookings)
                            b.PrintBooking();
                        break;
                    case "3":
                        Console.Write("Введите ID стола: ");
                        int id = int.Parse(Console.ReadLine());
                        Table table = tables.Find(t => t.Id == id);
                        if (table != null)
                            table.PrintInfo();
                        else
                            Console.WriteLine("Стол не найден!");
                        break;
                    case "4":
                        AddBooking();
                        break;
                    case "5":
                        SearchBooking();
                        break;
                    case "0":
                        return;
                    default:
                        Console.WriteLine("Неверный выбор!");
                        break;
                }

                Console.WriteLine("\nНажмите любую клавишу для продолжения...");
                Console.ReadKey();
            }
        }

        // Методы для системы заказов
        static void CreateNewOrder()
        {
            Console.Write("Введите номер стола: ");
            int tableId = int.Parse(Console.ReadLine());
            Console.Write("Введите ID официанта: ");
            int waiterId = int.Parse(Console.ReadLine());
            Console.Write("Введите комментарий: ");
            string comment = Console.ReadLine();

            Order newOrder = new Order(tableId, waiterId, comment);
            orders.Add(newOrder);
            Console.WriteLine("Заказ создан! ID: " + newOrder.Id);
        }

        static void CloseOrder()
        {
            Console.Write("Введите ID заказа для закрытия: ");
            int orderId = int.Parse(Console.ReadLine());
            Order order = orders.Find(o => o.Id == orderId);

            if (order != null)
            {
                order.CloseOrder(out bool success, out string message);
                Console.WriteLine(message);
            }
            else
            {
                Console.WriteLine("Заказ не найден!");
            }
        }

        static void PrintReceipt()
        {
            Console.Write("Введите ID заказа для печати чека: ");
            int orderId = int.Parse(Console.ReadLine());
            Order order = orders.Find(o => o.Id == orderId);

            if (order != null)
            {
                order.PrintReceipt();
            }
            else
            {
                Console.WriteLine("Заказ не найден!");
            }
        }

        static void ShowStatistics()
        {
            double totalRevenue = CalculateTotalRevenue(orders);
            Console.WriteLine($"\n*** Общая выручка по закрытым заказам: {totalRevenue:F2} руб. ***");

            int waiterOrdersCount = CountWaiterOrders(orders, 101);
            Console.WriteLine($"*** Количество закрытых заказов официанта 101: {waiterOrdersCount} ***");

            CollectDishStatistics(orders, out Dictionary<string, int> statistics);
            Console.WriteLine("\n*** Статистика заказанных блюд: ***");
            foreach (var stat in statistics.OrderByDescending(s => s.Value))
            {
                Console.WriteLine($"  {stat.Key}: {stat.Value} шт.");
            }

            bool closedOnly = true;
            double avgCheck = CalculateAverageCheck(in orders, in closedOnly);
            Console.WriteLine($"\n*** Средний чек по закрытым заказам: {avgCheck:F2} руб. ***");
        }

        // Методы для системы бронирования
        static void AddBooking()
        {
            Console.Write("Введите ID клиента: ");
            int cid = int.Parse(Console.ReadLine());
            Console.Write("Введите имя: ");
            string name = Console.ReadLine();
            Console.Write("Введите телефон: ");
            string phone = Console.ReadLine();
            Console.Write("Введите ID стола: ");
            int tid = int.Parse(Console.ReadLine());
            Console.Write("Введите час начала (9–17): ");
            int start = int.Parse(Console.ReadLine());
            Console.Write("Введите час окончания (10–18): ");
            int end = int.Parse(Console.ReadLine());
            Console.Write("Введите комментарий: ");
            string comment = Console.ReadLine();

            Table bookTable = tables.Find(t => t.Id == tid);
            if (bookTable != null)
            {
                Booking newBooking = new Booking(cid, name, phone, tid, start, end, comment);
                newBooking.ApplyBooking(bookTable);
                bookings.Add(newBooking);
                Console.WriteLine("Бронирование успешно добавлено!");
            }
            else
            {
                Console.WriteLine("Стол не найден!");
            }
        }

        static void SearchBooking()
        {
            Console.Write("Введите имя клиента: ");
            string searchName = Console.ReadLine();
            Console.Write("Введите последние 4 цифры телефона: ");
            string suffix = Console.ReadLine();
            FindBooking(bookings, searchName, suffix);
        }

        // Вспомогательные методы
        static void PrintMenu(params Dish[] dishes)
        {
            Console.WriteLine("╔════════════════════════════════════════════════╗");
            Console.WriteLine("║              МЕНЮ РЕСТОРАНА                    ║");
            Console.WriteLine("╚════════════════════════════════════════════════╝");

            var groupedDishes = dishes.Where(d => d != null).GroupBy(d => d.Category);

            foreach (var group in groupedDishes.OrderBy(g => g.Key))
            {
                Console.WriteLine($"┌─ {group.Key} ─────────────────────────────┐");
                foreach (var dish in group)
                {
                    Console.WriteLine($"│ {dish.Name,-25} {dish.Weight,-12} {dish.Price,6:F2} руб. │");
                    Console.WriteLine($"│   {dish.Composition,-44} │");
                    if (dish.Types.Length > 0)
                        Console.WriteLine($"│   [{string.Join(", ", dish.Types)}]");
                    Console.WriteLine("│");
                }
                Console.WriteLine("└───────────────────────────────────────────────┘\n");
            }
        }

        static double CalculateTotalRevenue(List<Order> orders)
        {
            double total = 0;
            foreach (var order in orders)
            {
                if (order.IsClosed)
                {
                    total += order.TotalCost;
                }
            }
            return total;
        }

        static int CountWaiterOrders(List<Order> orders, int waiterID)
        {
            return orders.Count(o => o.IsClosed && o.WaiterId == waiterID);
        }

        static double CalculateAverageCheck(in List<Order> orders, in bool onlyClosedOrders)
        {
            var relevantOrders = onlyClosedOrders
                ? orders.Where(o => o.IsClosed).ToList()
                : orders;

            if (relevantOrders.Count == 0) return 0;

            return relevantOrders.Sum(o => o.TotalCost) / relevantOrders.Count;
        }

        static void CollectDishStatistics(List<Order> orders, out Dictionary<string, int> statistics)
        {
            statistics = new Dictionary<string, int>();

            foreach (var order in orders)
            {
                foreach (var item in order.Dishes)
                {
                    if (statistics.ContainsKey(item.dish.Name))
                    {
                        statistics[item.dish.Name] += item.quantity;
                    }
                    else
                    {
                        statistics[item.dish.Name] = item.quantity;
                    }
                }
            }
        }

        static void FindBooking(List<Booking> bookings, string name, string phoneSuffix)
        {
            bool found = false;
            foreach (var b in bookings)
            {
                if (b.ClientName.Equals(name, StringComparison.OrdinalIgnoreCase) &&
                    b.PhoneNumber.EndsWith(phoneSuffix))
                {
                    b.PrintBooking();
                    found = true;
                }
            }
            if (!found)
                Console.WriteLine("Бронирование не найдено.");
        }
    }
}