"""drop invitations unique constraint

Revision ID: aeb8151a1de2
Revises: fedfe8240ff1
Create Date: 2026-08-22 17:00:24.360190

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'aeb8151a1de2'
down_revision: Union[str, Sequence[str], None] = 'fedfe8240ff1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute("ALTER TABLE invitations DROP CONSTRAINT IF EXISTS invitations_workspace_id_email_key")


def downgrade() -> None:
    """Downgrade schema."""
    op.execute("ALTER TABLE invitations DROP CONSTRAINT IF EXISTS invitations_workspace_id_email_key")

