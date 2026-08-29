"""Add image file types to file_type enum

Revision ID: i1j2k3l4m5n6
Revises: h1a2b3c4d5e6
Create Date: 2026-08-29
"""
from alembic import op
import sqlalchemy as sa

revision = "i1j2k3l4m5n6"
down_revision = "h1a2b3c4d5e6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add new values to the existing file_type enum
    op.execute("ALTER TYPE file_type ADD VALUE IF NOT EXISTS 'png'")
    op.execute("ALTER TYPE file_type ADD VALUE IF NOT EXISTS 'jpg'")
    op.execute("ALTER TYPE file_type ADD VALUE IF NOT EXISTS 'jpeg'")
    op.execute("ALTER TYPE file_type ADD VALUE IF NOT EXISTS 'webp'")
    op.execute("ALTER TYPE file_type ADD VALUE IF NOT EXISTS 'gif'")


def downgrade() -> None:
    # PostgreSQL does not support removing values from an enum type
    # A full migration would require creating a new enum, migrating data, and dropping the old one
    pass
