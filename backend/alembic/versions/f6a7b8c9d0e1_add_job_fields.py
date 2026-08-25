"""add job_title and job_role to users

Revision ID: f6a7b8c9d0e1
Revises: e5f6a7b8c9d0
Create Date: 2026-08-25 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'f6a7b8c9d0e1'
down_revision: Union[str, Sequence[str], None] = 'e5f6a7b8c9d0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('job_title', sa.String(length=120), nullable=True))
    op.add_column('users', sa.Column('job_role', sa.String(length=120), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'job_role')
    op.drop_column('users', 'job_title')
