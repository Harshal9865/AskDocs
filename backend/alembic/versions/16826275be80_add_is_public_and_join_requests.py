"""add is_public and join requests

Revision ID: 16826275be80
Revises: 60bcd01a24d9
Create Date: 2026-08-23 19:06:09.813651

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '16826275be80'
down_revision: Union[str, Sequence[str], None] = '60bcd01a24d9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('workspaces', sa.Column('is_public', sa.Boolean(), server_default='false', nullable=False))
    op.create_index(op.f('ix_workspaces_is_public'), 'workspaces', ['is_public'], unique=False)
    op.create_table('workspace_join_requests',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('workspace_id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=False),
        sa.Column('message', sa.String(length=500), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('reviewed_by', sa.Uuid(), nullable=True),
        sa.Column('reviewed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['reviewed_by'], ['users.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_workspace_join_requests_status'), 'workspace_join_requests', ['status'], unique=False)
    op.create_index(op.f('ix_workspace_join_requests_user_id'), 'workspace_join_requests', ['user_id'], unique=False)
    op.create_index(op.f('ix_workspace_join_requests_workspace_id'), 'workspace_join_requests', ['workspace_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_workspace_join_requests_workspace_id'), table_name='workspace_join_requests')
    op.drop_index(op.f('ix_workspace_join_requests_user_id'), table_name='workspace_join_requests')
    op.drop_index(op.f('ix_workspace_join_requests_status'), table_name='workspace_join_requests')
    op.drop_table('workspace_join_requests')
    op.drop_index(op.f('ix_workspaces_is_public'), table_name='workspaces')
    op.drop_column('workspaces', 'is_public')
