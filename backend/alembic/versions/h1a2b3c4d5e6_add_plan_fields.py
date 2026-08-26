"""add plan fields to users

Revision ID: h1a2b3c4d5e6
Revises: g7a8b9c0d1e2
Create Date: 2026-08-25 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = "h1a2b3c4d5e6"
down_revision = "g7a8b9c0d1e2"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("plan", sa.String(20), server_default="free", nullable=False))
    op.add_column("users", sa.Column("documents_used", sa.Integer(), server_default="0", nullable=False))
    op.add_column("users", sa.Column("questions_used", sa.Integer(), server_default="0", nullable=False))
    op.add_column("users", sa.Column("plan_reset_at", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "plan_reset_at")
    op.drop_column("users", "questions_used")
    op.drop_column("users", "documents_used")
    op.drop_column("users", "plan")
