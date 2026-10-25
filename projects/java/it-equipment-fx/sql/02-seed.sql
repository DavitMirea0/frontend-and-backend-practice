BEGIN;
INSERT INTO users(full_name,email,department) VALUES
('Анна Иванова','anna@example.org','Разработка'),
('Иван Петров','ivan@example.org','Поддержка'),
('Мария Соколова','maria@example.org','Бухгалтерия'),
('Алексей Смирнов','alex@example.org','Разработка'),
('Елена Орлова','elena@example.org','Кадры');
INSERT INTO equipment_requests(user_id,equipment_type,quantity,reason,status,created_at) VALUES
(1,'LAPTOP',1,'Ноутбук для разработки','NEW','2026-09-01 10:00:00'),
(2,'MONITOR',2,'Мониторы для поддержки','APPROVED','2026-09-02 10:00:00'),
(3,'KEYBOARD',1,'Замена неисправной клавиатуры','ISSUED','2026-09-03 10:00:00'),
(4,'MOUSE',3,'Оснащение рабочих мест','NEW','2026-09-04 10:00:00'),
(5,'HEADSET',1,'Гарнитура для собеседований','REJECTED','2026-09-05 10:00:00'),
(1,'MONITOR',2,'Мониторы для тестирования','ISSUED','2026-09-06 10:00:00'),
(2,'HEADSET',2,'Приём обращений сотрудников','NEW','2026-09-07 10:00:00'),
(3,'LAPTOP',1,'Работа с отчётами','CANCELLED','2026-09-08 10:00:00'),
(4,'LAPTOP',2,'Ноутбуки для разработчиков','APPROVED','2026-09-09 10:00:00'),
(5,'KEYBOARD',2,'Обновление рабочих мест','NEW','2026-09-10 10:00:00');
COMMIT;
