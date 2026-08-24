"""add chat attachments, hidden conversations, read states, friendships

Revision ID: a1b2c3d4e5f6
Revises: 16826275be80
Create Date: 2026-08-24 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '16826275be80'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'message_attachments',
        sa.Column('id', sa.Uuid(), primary_key=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('message_id', sa.Uuid(), sa.ForeignKey('messages.id', ondelete='CASCADE'), index=True),
        sa.Column('storage_key', sa.String(500), nullable=False),
        sa.Column('filename', sa.String(300), nullable=False),
        sa.Column('content_type', sa.String(100), nullable=False),
        sa.Column('size_bytes', sa.Integer(), nullable=False),
    )

    op.create_table(
        'conversation_hidden',
        sa.Column('id', sa.Uuid(), primary_key=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('conversation_id', sa.Uuid(), sa.ForeignKey('conversations.id', ondelete='CASCADE'), index=True),
        sa.Column('user_id', sa.Uuid(), sa.ForeignKey('users.id', ondelete='CASCADE'), index=True),
        sa.Column('hidden_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint('conversation_id', 'user_id'),
    )

    op.create_table(
        'conversation_read_states',
        sa.Column('id', sa.Uuid(), primary_key=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('conversation_id', sa.Uuid(), sa.ForeignKey('conversations.id', ondelete='CASCADE'), index=True),
        sa.Column('user_id', sa.Uuid(), sa.ForeignKey('users.id', ondelete='CASCADE'), index=True),
        sa.Column('last_read_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint('conversation_id', 'user_id'),
    )

    op.create_table(
        'friendships',
        sa.Column('id', sa.Uuid(), primary_key=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('requester_id', sa.Uuid(), sa.ForeignKey('users.id', ondelete='CASCADE'), index=True),
        sa.Column('addressee_id', sa.Uuid(), sa.ForeignKey('users.id', ondelete='CASCADE'), index=True),
        sa.Column('status', sa.String(20), server_default='pending', index=True),
        sa.Column('accepted_at', sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint('requester_id', 'addressee_id'),
    )


def downgrade() -> None:
    op.drop_table('friendships')
    op.drop_table('conversation_read_states')
    op.drop_table('conversation_hidden')
    op.drop_table('message_attachments')
