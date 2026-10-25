"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-09-09

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

member_role = sa.Enum("owner", "admin", "member", name="memberrole")
participation_status = sa.Enum("going", "maybe", "declined", name="participationstatus")


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("telegram_id", sa.BigInteger(), nullable=False),
        sa.Column("username", sa.String(64), nullable=True),
        sa.Column("full_name", sa.String(256), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_users_telegram_id", "users", ["telegram_id"], unique=True)

    op.create_table(
        "communities",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(128), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("telegram_chat_id", sa.BigInteger(), nullable=True),
        sa.Column("owner_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )

    op.create_table(
        "community_members",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("community_id", sa.Integer(), sa.ForeignKey("communities.id"), nullable=False),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("role", member_role, nullable=False, server_default="member"),
        sa.Column("joined_at", sa.DateTime(), nullable=False),
        sa.UniqueConstraint("community_id", "user_id", name="uq_community_user"),
    )

    op.create_table(
        "publications",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("community_id", sa.Integer(), sa.ForeignKey("communities.id"), nullable=False),
        sa.Column("author_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("photo_file_id", sa.String(256), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )

    op.create_table(
        "events",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("community_id", sa.Integer(), sa.ForeignKey("communities.id"), nullable=False),
        sa.Column("title", sa.String(256), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("event_date", sa.DateTime(), nullable=False),
        sa.Column("location", sa.String(256), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )

    op.create_table(
        "event_participants",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("event_id", sa.Integer(), sa.ForeignKey("events.id"), nullable=False),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("status", participation_status, nullable=False, server_default="going"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.UniqueConstraint("event_id", "user_id", name="uq_event_user"),
    )


def downgrade() -> None:
    op.drop_table("event_participants")
    op.drop_table("events")
    op.drop_table("publications")
    op.drop_table("community_members")
    op.drop_table("communities")
    op.drop_index("ix_users_telegram_id", table_name="users")
    op.drop_table("users")
    participation_status.drop(op.get_bind(), checkfirst=True)
    member_role.drop(op.get_bind(), checkfirst=True)
