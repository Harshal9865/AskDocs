"""No-op: direct_chat_key constraint was removed (handled in code via retry)

Revision ID: j1k2l3m4n5o6
Revises: i1j2k3l4m5n6
Create Date: 2026-08-30
"""
from alembic import op
import sqlalchemy as sa

revision = 'j1k2l3m4n5o6'
down_revision = 'i1j2k3l4m5n6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # no-op: previously added direct_chat_key, now removed to fix 500 before migration ran
    pass


def downgrade() -> None:
    pass
