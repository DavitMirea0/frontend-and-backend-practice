namespace NetworkAnalyzer.Models
{
    /// <summary>
    /// Модель данных для хранения информации о сетевом интерфейсе.
    /// 
    /// ПОЯСНЕНИЕ:
    /// Эта модель представляет собой POCO-класс (Plain Old CLR Object),
    /// который хранит данные о каждом сетевом адаптере компьютера.
    /// Используется для привязки данных (Data Binding) к элементам UI в WPF.
    /// 
    /// Каждый сетевой интерфейс (Wi-Fi, Ethernet, Loopback и т.д.)
    /// описывается набором свойств: имя, IP-адрес, маска, MAC и др.
    /// </summary>
    public class NetworkInterfaceInfo
    {
        /// <summary>
        /// Имя сетевого интерфейса (например, "Wi-Fi", "Ethernet")
        /// </summary>
        public string Name { get; set; } = string.Empty;

        /// <summary>
        /// Описание интерфейса (название драйвера/адаптера)
        /// </summary>
        public string Description { get; set; } = string.Empty;

        /// <summary>
        /// IP-адрес интерфейса (IPv4)
        /// </summary>
        public string IpAddress { get; set; } = "Не назначен";

        /// <summary>
        /// Маска подсети — определяет, какая часть IP-адреса относится к сети,
        /// а какая — к конкретному устройству.
        /// Например, 255.255.255.0 означает, что первые 3 октета — адрес сети.
        /// </summary>
        public string SubnetMask { get; set; } = "Не назначена";

        /// <summary>
        /// MAC-адрес — уникальный физический адрес сетевого адаптера.
        /// Формат: XX-XX-XX-XX-XX-XX (6 байт в шестнадцатеричной системе).
        /// Используется на канальном уровне модели OSI.
        /// </summary>
        public string MacAddress { get; set; } = string.Empty;

        /// <summary>
        /// Текущее состояние подключения интерфейса (Up, Down и т.д.)
        /// </summary>
        public string Status { get; set; } = string.Empty;

        /// <summary>
        /// Скорость соединения в мегабитах в секунду (Мбит/с).
        /// Для неактивных интерфейсов может быть 0 или -1.
        /// </summary>
        public string Speed { get; set; } = string.Empty;

        /// <summary>
        /// Тип интерфейса: Ethernet, Wireless80211 (Wi-Fi), Loopback и др.
        /// Определяется перечислением NetworkInterfaceType из .NET.
        /// </summary>
        public string InterfaceType { get; set; } = string.Empty;

        /// <summary>
        /// Переопределение ToString() для отображения в ListBox.
        /// WPF вызывает этот метод, когда нужно показать объект в виде строки.
        /// </summary>
        public override string ToString() => $"{Name} ({Status})";
    }
}
