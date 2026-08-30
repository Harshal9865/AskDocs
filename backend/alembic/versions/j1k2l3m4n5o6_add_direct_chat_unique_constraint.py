"""Add unique constraint for direct chats to prevent duplicates

Revision ID: j1k2l3m4n5o6
Revises: i1j2k3l4m5n6
Create Date: 2026-08-30

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'j1k2l3m4n5o6'
down_revision = 'i1j2k3l4m5n6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add a direct_chat_key column to conversations table for direct chat uniqueness
    # This will store a deterministic hash of the two user IDs (sorted) for direct chats
    op.add_column('conversations', sa.Column('direct_chat_key', sa.String(64), nullable=True))
    
    # Create unique index on direct_chat_key for direct conversations only
    op.execute("""
        CREATE UNIQUE INDEX ux_conversations_direct_chat_key 
        ON conversations (direct_chat_key) 
        WHERE type = 'direct' AND direct_chat_key IS NOT NULL
    """)


def downgrade() -> None:
    op.drop_index('ux_conversations_direct_chat_key', table_name='conversations')
    op.drop_column('conversations', 'direct_chat_key')