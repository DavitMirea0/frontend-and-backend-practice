"""Pydantic-схемы для Product (задание 9.1)."""
from pydantic import BaseModel, ConfigDict, Field


class ProductBase(BaseModel):
    title: str = Field(..., max_length=255)
    price: float = Field(..., ge=0)
    count: int = Field(..., ge=0)
    description: str = Field(..., max_length=1000)


class ProductCreate(ProductBase):
    pass


class ProductOut(ProductBase):
    id: int

    model_config = ConfigDict(from_attributes=True)
