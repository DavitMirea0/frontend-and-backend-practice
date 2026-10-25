from pydantic import BaseModel, Field


class OrderItem(BaseModel):
    sku: str = Field(min_length=1)
    quantity: int = Field(gt=0)
    price_cents: int = Field(ge=0)


class CreateOrderRequest(BaseModel):
    customer_id: str = Field(min_length=1)
    items: list[OrderItem] = Field(min_length=1)


class OrderResponse(BaseModel):
    id: str
    customer_id: str
    items: list[OrderItem]
    total_cents: int
    status: str
