const express = require('express');
const cors = require('cors');
const { nanoid } = require('nanoid');

const app = express();
const port = 3000;

let units = [
    {
        id: nanoid(6),
        name: 'iPhone 15 Pro',
        category: 'Смартфоны',
        description: 'Флагманский смартфон Apple с титановым корпусом и камерой 48 МП',
        cost: 99990,
        quantity: 15
    },
    {
        id: nanoid(6),
        name: 'Samsung Galaxy S24 Ultra',
        category: 'Смартфоны',
        description: 'Смартфон с поддержкой S Pen и 200 МП камерой',
        cost: 89990,
        quantity: 8
    },
    {
        id: nanoid(6),
        name: 'MacBook Pro 14"',
        category: 'Ноутбуки',
        description: 'Ноутбук с чипом M3 Pro, 18 ГБ памяти и 512 ГБ SSD',
        cost: 199990,
        quantity: 5
    },
    {
        id: nanoid(6),
        name: 'Dyson V15 Detect',
        category: 'Бытовая техника',
        description: 'Беспроводной пылесос с лазерной подсветкой и датчиком пыли',
        cost: 69990,
        quantity: 12
    },
    {
        id: nanoid(6),
        name: 'Xiaomi Mi Robot Vacuum S10',
        category: 'Бытовая техника',
        description: 'Робот-пылесос с лазерной навигацией и влажной уборкой',
        cost: 24990,
        quantity: 25
    },
    {
        id: nanoid(6),
        name: 'Sony WH-1000XM5',
        category: 'Аудиотехника',
        description: 'Беспроводные наушники с активным шумоподавлением',
        cost: 29990,
        quantity: 20
    },
    {
        id: nanoid(6),
        name: 'Apple Watch Series 9',
        category: 'Гаджеты',
        description: 'Умные часы с измерением ЭКГ и кислорода в крови',
        cost: 39990,
        quantity: 18
    },
    {
        id: nanoid(6),
        name: 'iPad Air M1',
        category: 'Планшеты',
        description: '11-дюймовый планшет с чипом M1 и поддержкой Apple Pencil',
        cost: 55990,
        quantity: 10
    },
    {
        id: nanoid(6),
        name: 'Nintendo Switch OLED',
        category: 'Игровые консоли',
        description: 'Портативная игровая консоль с OLED-экраном 7"',
        cost: 32990,
        quantity: 7
    },
    {
        id: nanoid(6),
        name: 'Canon EOS R10',
        category: 'Фототехника',
        description: 'Беззеркальный фотоаппарат с 24.2 МП и 4K видео',
        cost: 84990,
        quantity: 4
    }
];

app.use(express.json());

app.use(cors({
    origin: "http://localhost:3001",
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use((req, res, next) => {
    res.on('finish', () => {
        console.log(`[${new Date().toISOString()}] [${req.method}] ${res.statusCode} ${req.path}`);
        
        if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
            console.log('Body:', req.body);
        }
    });
    next();
});

function findUnitOr404(id, res) {
    const unit = units.find(u => u.id == id);

    if (!unit) {
        res.status(404).json({ error: "Unit not found" });
        return null;
    }

    return unit;
}

app.post("/api/units", (req, res) => {
    const { name, category,
        description, cost, quantity } = req.body;

    const newUnit = {
        id: nanoid(6),
        name: name.trim(),
        category: category.trim(),
        description: description.trim(),
        cost: Number(cost),
        quantity: Number(quantity)
    };

    units.push(newUnit);
    res.status(201).json(newUnit);
});

app.get("/api/units", (req, res) => {
    res.json(units);
});


app.get("/api/units/:id", (req, res) => {
    const id = req.params.id;
    const unit = findUnitOr404(id, res);

    if (!unit) return;

    res.json(unit);
});


app.patch("/api/units/:id", (req, res) => {
    const id = req.params.id;
    const unit = findUnitOr404(id, res);


    if (!unit) return;
    
    if (req.body?.name === undefined && 
        req.body?.category === undefined && 
        req.body?.description === undefined &&
        req.body?.cost === undefined && 
        req.body?.quantity === undefined) {
        return res.status(400).json({error: "Nothing to update"});
    }
    
    const { name, category, description, cost, quantity } = req.body;
    
    if (name !== undefined) unit.name = name.trim();
    if (category !== undefined) unit.category = category.trim();
    if (description !== undefined) unit.description = description.trim();
    if (cost !== undefined) unit.cost = Number(cost);
    if (quantity !== undefined) unit.quantity = Number(quantity);
    
    res.json(unit);
});


app.delete("/api/units/:id", (req, res) => {
    const id = req.params.id;
    const exists = units.some((u) => u.id === id);

    if (!exists) return res.status(404).json({ error: "Unit not found" });

    units.splice(units.findIndex(u => u.id == id), 1);

    res.status(204).send();
});


app.use((req, res) => {
    res.status(404).json({ error: "Not found" });
});

app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "Internal server error" });
});


app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
});
