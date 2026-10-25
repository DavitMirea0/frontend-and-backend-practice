"""make tag_name nullable

Revision ID: 0002_tag_name_nullable
Revises: 0001_create_vacancies
Create Date: 2026-07-30 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa

revision = "0002_tag_name_nullable"
down_revision = "0001_create_vacancies"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column(
        "vacancies",
        "tag_name",
        existing_type=sa.String(),
        nullable=True,
    )


def downgrade() -> None:
    op.alter_column(
        "vacancies",
        "tag_name",
        existing_type=sa.String(),
        nullable=False,
    )
