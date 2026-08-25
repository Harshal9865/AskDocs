"""extended profile: bio, phone, status, location, pronouns

Revision ID: e5f6a7b8c9d0
Revises: a1b2c3d4e5f6
Create Date: 2026-08-25 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'e5f6a7b8c9d0'
down_revision: Union[str, Sequence[str], None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('bio', sa.String(length=500), nullable=True))
    op.add_column('users', sa.Column('phone', sa.String(length=32), nullable=True))
    op.add_column('users', sa.Column('status', sa.String(length=120), nullable=True))
    op.add_column('users', sa.Column('location', sa.String(length=120), nullable=True))
    op.add_column('users', sa.Column('pronouns', sa.String(length=50), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'pronouns')
    op.drop_column('users', 'location')
    op.drop_column('users', 'status')
    op.drop_column('users', 'phone')
    op.drop_column('users', 'bio')
