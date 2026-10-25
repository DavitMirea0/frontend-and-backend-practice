from contextlib import asynccontextmanager

import asyncpg
from fastapi import FastAPI, Header, HTTPException, Response

from app.config import settings
from app.pg import PgRepository
from app.schemas import CreateOrderRequest, OrderItem, OrderResponse
from app.service import OrderService


@asynccontextmanager
async def lifespan(app: FastAPI):
    pool = await asyncpg.create_pool(settings.database_url)
    app.state.repo = PgRepository(pool)
    app.state.service = OrderService(app.state.repo)
    yield
    await pool.close()


app = FastAPI(title="Order Processing Service", lifespan=lifespan)


def _to_response(order) -> OrderResponse:
    return OrderResponse(
        id=order.id,
        customer_id=order.customer_id,
        items=[OrderItem(**i) for i in order.items],
        total_cents=order.total_cents,
        status=order.status.value,
    )


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/orders", response_model=OrderResponse, status_code=201)
async def create_order(
    req: CreateOrderRequest,
    response: Response,
    idempotency_key: str | None = Header(default=None, alias="Idempotency-Key"),
):
    order, created = await app.state.service.create_order(req, idempotency_key)
    if not created:
        response.status_code = 200
    return _to_response(order)


@app.get("/orders/{order_id}", response_model=OrderResponse)
async def get_order(order_id: str):
    try:
        order = await app.state.repo.get_order(order_id)
    except Exception:
        order = None  # malformed uuid
    if not order:
        raise HTTPException(status_code=404, detail="order not found")
    return _to_response(order)
