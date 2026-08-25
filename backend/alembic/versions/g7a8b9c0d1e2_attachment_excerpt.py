"""attachment text_excerpt for chat uploads

Revision ID: g7a8b9c0d1e2
Revises: f6a7b8c9d0e1
Create Date: 2026-08-25 14:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'g7a8b9c0d1e2'
down_revision: Union[str, Sequence[str], None] = 'f6a7b8c9d0e1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('message_attachments', sa.Column('text_excerpt', sa.Text(), nullable=True))
    # Attachments are uploaded before the message exists — make message_id nullable
    op.alter_column('message_attachments', 'message_id', existing_type=sa.Uuid(), nullable=True)


def downgrade() -> None:
    op.alter_column('message_attachments', 'message_id', existing_type=sa.Uuid(), nullable=False)
    op.drop_column('message_attachments', 'text_excerpt')
