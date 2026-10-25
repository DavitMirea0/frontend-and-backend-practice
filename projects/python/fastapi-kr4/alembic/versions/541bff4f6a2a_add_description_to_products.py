"""add description to products

Revision ID: 541bff4f6a2a
Revises: 4b210ba16f4f
Create Date: 2026-05-18 08:34:13.847062

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '541bff4f6a2a'
down_revision: Union[str, None] = '4b210ba16f4f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Поле description обязательное (NOT NULL). Чтобы миграция корректно
    # отрабатывала на непустой таблице (см. задание 9.1, шаг 5 — мы вставляем
    # 2 записи между миграциями), сначала добавляем колонку с server_default,
    # а затем убираем default.
    with op.batch_alter_table('products', schema=None) as batch_op:
        batch_op.add_column(
            sa.Column(
                'description',
                sa.String(length=1000),
                nullable=False,
                server_default='',
            )
        )

    with op.batch_alter_table('products', schema=None) as batch_op:
        batch_op.alter_column('description', server_default=None)


def downgrade() -> None:
    with op.batch_alter_table('products', schema=None) as batch_op:
        batch_op.drop_column('description')
