const express = require('express');
const app = express();
const port = 3000;
// node app.js

let items = [
    {id: 1, name: "item1", cost: 100},
    {id: 2, name: "item2", cost: 200},
    {id: 3, name: "item3", cost: 300},
];

app.use(express.json());

app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    console.log(`Status code: ${res.statusCode}`)
    next();
});

app.get('/', (req, res) => {
    res.send('Practice №2');
});

app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
});

app.post("/items", (req, res) => {
    const { name, cost } = req.body;

    const item = {
        id: Date.now(),
        name,
        cost
    }

    items.push(item);

    res.status(201).json(item);
});

app.get("/items/:id", (req, res) => {
    res.send(items.filter(item => item.id == req.params.id));
});

app.get("/items", (req, res) => {
    res.send(JSON.stringify(items));
});

app.delete("/items/:id", (req, res) => {
    items.splice(items.findIndex(item => item.id == req.params.id), 1);
});

app.patch("/items/:id", (req, res) => {
    const item = items.find(item => item.id == req.params.id);

    if(!item){
        res.status(404).json({message: "Такого товара нет."});
        return;
    }

    const { name, cost } = req.body;
    console.log(name, cost);

    if(name !== undefined) item.name = name;
    if(cost !== undefined) item.cost = cost;

    res.json(item);
});