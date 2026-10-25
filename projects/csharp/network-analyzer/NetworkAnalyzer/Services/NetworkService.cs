using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.NetworkInformation;
using System.Net.Sockets;
using System.Threading.Tasks;
using NetworkAnalyzer.Models;

namespace NetworkAnalyzer.Services
{
    /// <summary>
    /// Сервисный класс, содержащий всю бизнес-логику работы с сетью.
    /// 
    /// ПОЯСНЕНИЕ:
    /// Этот класс инкапсулирует (скрывает) всю работу с сетевыми API .NET.
    /// Он использует пространства имён:
    ///   - System.Net.NetworkInformation — информация о сетевых интерфейсах, Ping
    ///   - System.Net — классы Dns, IPAddress
    ///   - System.Net.Sockets — AddressFamily (IPv4/IPv6)
    /// 
    /// Разделение логики и UI — это принцип Separation of Concerns (разделение ответственности).
    /// Благодаря этому код легче тестировать и поддерживать.
    /// </summary>
    public class NetworkService
    {
        // ========================== СЕТЕВЫЕ ИНТЕРФЕЙСЫ ==========================

        /// <summary>
        /// Получает список всех сетевых интерфейсов компьютера.
        /// 
        /// КАК ЭТО РАБОТАЕТ:
        /// 1. NetworkInterface.GetAllNetworkInterfaces() — статический метод .NET,
        ///    который возвращает массив объектов NetworkInterface.
        ///    Каждый объект представляет один сетевой адаптер (Wi-Fi, Ethernet, Loopback...).
        /// 
        /// 2. Для каждого интерфейса мы получаем IP-свойства через GetIPProperties().
        ///    Это даёт нам доступ к IP-адресам (UnicastAddresses) и маскам подсети.
        /// 
        /// 3. Мы фильтруем адреса по AddressFamily.InterNetwork — это IPv4-адреса.
        ///    (AddressFamily.InterNetworkV6 — это IPv6.)
        /// 
        /// 4. LINQ-метод Select() преобразует каждый NetworkInterface в нашу модель
        ///    NetworkInterfaceInfo, а ToList() превращает результат в список.
        /// </summary>
        public List<NetworkInterfaceInfo> GetAllInterfaces()
        {
            // Получаем все сетевые интерфейсы через системный API
            var interfaces = NetworkInterface.GetAllNetworkInterfaces();

            return interfaces.Select(ni =>
            {
                // Получаем IP-свойства интерфейса
                var ipProps = ni.GetIPProperties();

                // Ищем первый IPv4-адрес среди одноадресных (unicast) адресов.
                // FirstOrDefault вернёт null, если IPv4-адреса нет.
                var ipv4Address = ipProps.UnicastAddresses
                    .FirstOrDefault(a => a.Address.AddressFamily == AddressFamily.InterNetwork);

                return new NetworkInterfaceInfo
                {
                    Name = ni.Name,                          // Имя адаптера
                    Description = ni.Description,            // Описание (драйвер)
                    IpAddress = ipv4Address?.Address.ToString() ?? "Не назначен",
                    SubnetMask = ipv4Address?.IPv4Mask.ToString() ?? "Не назначена",
                    MacAddress = FormatMacAddress(ni.GetPhysicalAddress()),
                    Status = TranslateStatus(ni.OperationalStatus),
                    Speed = FormatSpeed(ni.Speed),
                    InterfaceType = TranslateInterfaceType(ni.NetworkInterfaceType)
                };
            }).ToList();
        }

        // ========================== ПАРСИНГ URL/URI ==========================

        /// <summary>
        /// Парсит (разбирает) URL на составные компоненты.
        /// 
        /// КАК ЭТО РАБОТАЕТ:
        /// Класс Uri в .NET разбирает строку URL по стандарту RFC 3986.
        /// Структура URL:  схема://хост:порт/путь?запрос#фрагмент
        /// Пример:         https://example.com:443/api/data?id=1&name=test#section
        /// 
        /// Uri.TryCreate — безопасный способ создания Uri: возвращает false,
        /// если строка не является валидным URL (вместо выброса исключения).
        /// UriKind.Absolute — мы ожидаем полный URL (с протоколом).
        /// </summary>
        public Dictionary<string, string> ParseUrl(string url)
        {
            var result = new Dictionary<string, string>();

            // Пробуем создать объект Uri из строки
            if (Uri.TryCreate(url, UriKind.Absolute, out Uri? uri))
            {
                result["Схема (протокол)"] = uri.Scheme;         // http, https, ftp...
                result["Хост"] = uri.Host;                        // доменное имя или IP
                result["Порт"] = uri.Port.ToString();             // 80, 443, 8080...
                result["Путь"] = uri.AbsolutePath;                // /api/data
                result["Параметры запроса"] = uri.Query;          // ?id=1&name=test
                result["Фрагмент"] = uri.Fragment;                // #section
                result["Тип адреса"] = DetermineAddressType(uri.Host);
            }
            else
            {
                result["Ошибка"] = "Невалидный URL. Убедитесь, что указан протокол (http:// или https://)";
            }

            return result;
        }

        // ========================== PING (ПРОВЕРКА ДОСТУПНОСТИ) ==========================

        /// <summary>
        /// Проверяет доступность хоста с помощью ICMP-запроса (ping).
        /// 
        /// КАК ЭТО РАБОТАЕТ:
        /// 1. Класс Ping отправляет ICMP Echo Request пакет на указанный хост.
        /// 2. Если хост доступен, он отвечает ICMP Echo Reply.
        /// 3. PingReply содержит статус ответа и время прохождения (RoundtripTime).
        /// 
        /// async/await — асинхронное выполнение. Ping может занять несколько секунд,
        /// и мы не хотим "замораживать" интерфейс приложения на это время.
        /// Таймаут 3000 мс = 3 секунды — максимальное время ожидания ответа.
        /// </summary>
        public async Task<string> PingHostAsync(string host)
        {
            try
            {
                using var ping = new Ping();  // using — автоматическое освобождение ресурсов

                // Отправляем асинхронный ping с таймаутом 3 секунды
                PingReply reply = await ping.SendPingAsync(host, 3000);

                if (reply.Status == IPStatus.Success)
                {
                    return $"✅ Хост {host} доступен\n" +
                           $"   Время ответа: {reply.RoundtripTime} мс\n" +
                           $"   IP-адрес: {reply.Address}\n" +
                           $"   TTL: {reply.Options?.Ttl ?? 0}";
                    // TTL (Time To Live) — количество маршрутизаторов, через которые
                    // пакет может пройти, прежде чем будет отброшен.
                }
                else
                {
                    return $"❌ Хост {host} недоступен. Статус: {reply.Status}";
                }
            }
            catch (PingException ex)
            {
                return $"❌ Ошибка ping: {ex.InnerException?.Message ?? ex.Message}";
            }
            catch (Exception ex)
            {
                return $"❌ Ошибка: {ex.Message}";
            }
        }

        // ========================== DNS-ИНФОРМАЦИЯ ==========================

        /// <summary>
        /// Получает DNS-информацию о хосте.
        /// 
        /// КАК ЭТО РАБОТАЕТ:
        /// DNS (Domain Name System) — система, которая преобразует доменные имена
        /// в IP-адреса и обратно.
        /// 
        /// Dns.GetHostEntryAsync(host) выполняет DNS-запрос:
        ///   - Прямой (Forward) DNS: домен → IP-адрес(а)
        ///   - Может вернуть несколько IP-адресов (балансировка нагрузки)
        /// 
        /// HostEntry содержит:
        ///   - HostName — каноническое имя хоста
        ///   - AddressList — массив всех IP-адресов, связанных с доменом
        ///   - Aliases — альтернативные имена хоста (алиасы)
        /// </summary>
        public async Task<string> GetDnsInfoAsync(string host)
        {
            try
            {
                IPHostEntry hostEntry = await Dns.GetHostEntryAsync(host);

                var result = $"🔍 DNS-информация для: {host}\n";
                result += $"   Каноническое имя: {hostEntry.HostName}\n";
                result += $"   IP-адреса:\n";

                foreach (var address in hostEntry.AddressList)
                {
                    // Определяем тип адреса (IPv4 или IPv6)
                    string type = address.AddressFamily == AddressFamily.InterNetwork
                        ? "IPv4" : "IPv6";
                    result += $"      [{type}] {address}\n";
                }

                if (hostEntry.Aliases.Length > 0)
                {
                    result += $"   Алиасы:\n";
                    foreach (var alias in hostEntry.Aliases)
                    {
                        result += $"      {alias}\n";
                    }
                }

                return result;
            }
            catch (SocketException ex)
            {
                return $"❌ DNS-ошибка: {ex.Message}\n   (Возможно, домен не существует)";
            }
            catch (Exception ex)
            {
                return $"❌ Ошибка: {ex.Message}";
            }
        }

        // ========================== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ==========================

        /// <summary>
        /// Определяет тип IP-адреса: локальный, публичный, loopback.
        /// 
        /// ПОЯСНЕНИЕ:
        /// - Loopback (127.x.x.x / localhost) — адрес обратной петли, 
        ///   используется для обращения к самому себе.
        /// - Приватные (локальные) адреса — не маршрутизируются в интернете:
        ///     10.0.0.0/8        — класс A (одна сеть на 16 млн хостов)
        ///     172.16.0.0/12     — класс B (16 сетей по 65K хостов)
        ///     192.168.0.0/16    — класс C (256 сетей по 254 хоста)
        ///     169.254.0.0/16    — link-local (автоконфигурация при отсутствии DHCP)
        /// - Всё остальное — публичные адреса (маршрутизируются в интернете).
        /// </summary>
        public string DetermineAddressType(string host)
        {
            // Пытаемся распарсить строку как IP-адрес
            if (IPAddress.TryParse(host, out IPAddress? ip))
            {
                if (IPAddress.IsLoopback(ip))
                    return "🔄 Loopback (обратная петля)";

                byte[] bytes = ip.GetAddressBytes();

                // Проверяем приватные диапазоны IPv4
                if (bytes[0] == 10 ||                                              // 10.x.x.x
                    (bytes[0] == 172 && bytes[1] >= 16 && bytes[1] <= 31) ||       // 172.16-31.x.x
                    (bytes[0] == 192 && bytes[1] == 168) ||                        // 192.168.x.x
                    (bytes[0] == 169 && bytes[1] == 254))                          // 169.254.x.x
                {
                    return "🏠 Локальный (приватный) адрес";
                }

                return "🌐 Публичный адрес";
            }

            // Если это не IP, а доменное имя
            return "📛 Доменное имя (требуется DNS-разрешение)";
        }

        /// <summary>
        /// Форматирует MAC-адрес в читаемый вид (XX-XX-XX-XX-XX-XX).
        /// PhysicalAddress.ToString() возвращает строку без разделителей: "AABBCCDDEEFF".
        /// Мы вставляем дефисы каждые 2 символа для стандартного отображения.
        /// </summary>
        private string FormatMacAddress(PhysicalAddress mac)
        {
            string raw = mac.ToString();
            if (string.IsNullOrEmpty(raw)) return "Отсутствует";

            // Вставляем дефис каждые 2 символа: AABBCC → AA-BB-CC
            return string.Join("-",
                Enumerable.Range(0, raw.Length / 2)
                    .Select(i => raw.Substring(i * 2, 2)));
        }

        /// <summary>
        /// Форматирует скорость соединения из бит/с в удобный формат.
        /// API возвращает скорость в битах в секунду (long).
        /// Мы конвертируем в Мбит/с или Гбит/с для удобства чтения.
        /// </summary>
        private string FormatSpeed(long speedBps)
        {
            if (speedBps <= 0) return "Неизвестно";
            if (speedBps >= 1_000_000_000) return $"{speedBps / 1_000_000_000.0:F1} Гбит/с";
            if (speedBps >= 1_000_000) return $"{speedBps / 1_000_000.0:F0} Мбит/с";
            if (speedBps >= 1_000) return $"{speedBps / 1_000.0:F0} Кбит/с";
            return $"{speedBps} бит/с";
        }

        /// <summary>
        /// Переводит статус интерфейса на русский язык.
        /// OperationalStatus — перечисление (enum) с возможными состояниями адаптера.
        /// </summary>
        private string TranslateStatus(OperationalStatus status)
        {
            return status switch
            {
                OperationalStatus.Up => "✅ Активен",
                OperationalStatus.Down => "❌ Отключен",
                OperationalStatus.Testing => "🔧 Тестирование",
                OperationalStatus.Unknown => "❓ Неизвестно",
                OperationalStatus.Dormant => "💤 Спящий режим",
                OperationalStatus.NotPresent => "⛔ Не найден",
                OperationalStatus.LowerLayerDown => "⬇️ Нижний уровень отключен",
                _ => status.ToString()
            };
        }

        /// <summary>
        /// Переводит тип интерфейса на русский язык.
        /// NetworkInterfaceType — перечисление с типами сетевых адаптеров.
        /// </summary>
        private string TranslateInterfaceType(NetworkInterfaceType type)
        {
            return type switch
            {
                NetworkInterfaceType.Ethernet => "Ethernet (проводной)",
                NetworkInterfaceType.Wireless80211 => "Wi-Fi (беспроводной)",
                NetworkInterfaceType.Loopback => "Loopback (обратная петля)",
                NetworkInterfaceType.Tunnel => "Туннель (VPN)",
                NetworkInterfaceType.Ppp => "PPP (модемное)",
                NetworkInterfaceType.Unknown => "Неизвестный",
                _ => type.ToString()
            };
        }
    }
}
