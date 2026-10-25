import sqlite3
from pathlib import Path
BASE = Path(__file__).resolve().parent
path = BASE / 'data' / 'deliveries.db'
path.parent.mkdir(exist_ok=True)
with sqlite3.connect(path) as con:
    con.execute('PRAGMA foreign_keys=ON')
    con.executescript((BASE / 'sql' / 'schema.sql').read_text(encoding='utf-8'))
    if con.execute('SELECT COUNT(*) FROM zones').fetchone()[0] == 0:
        con.executemany('INSERT INTO zones VALUES (?, ?, ?, ?)', [(1,'Центральный район',100,'городская'),(2,'Северный район',70,'городская'),(3,'Зелёный пригород',40,'пригород'),(4,'Дальний посёлок',15,'удалённая')])
    if con.execute('SELECT COUNT(*) FROM deliveries').fetchone()[0] == 0:
        con.executemany('INSERT INTO deliveries VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [
        (1,'Продуктовый набор','food-box','продукты','2026-10-21 10:00:00',30,3,'принят',1),
        (2,'Договоры для офиса','office-documents','документы','2026-10-21 11:30:00',25,1,'в пути',2),
        (3,'Компьютеры для учебного класса','classroom-computers','техника','2026-10-22 09:00:00',60,12,'принят',3),
        (4,'Овощи для кафе','cafe-vegetables','продукты','2026-10-20 15:00:00',40,20,'доставлен',1),
        (5,'Архивные документы','archive-documents','документы','2026-10-23 14:00:00',90,15,'принят',4),
        (6,'Бытовая техника','home-appliances','техника','2026-10-21 17:00:00',55,7,'в пути',3),
        (7,'Наборы свежих фруктов','fresh-fruits','продукты','2026-10-19 12:00:00',35,10,'доставлен',2),
        (8,'Мониторы для офиса','office-monitors','техника','2026-10-24 16:00:00',75,25,'принят',4)])
print('Database ready: data/deliveries.db')
