"""Add subscription and invoices

Revision ID: l1m2n3o4p5q6
Revises: k1l2m3n4o5p6
Create Date: 2026-09-01
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = 'l1m2n3o4p5q6'
down_revision = 'k1l2m3n4o5p6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Add subscription columns to users table safely
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS billing_interval VARCHAR(20) DEFAULT NULL;")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(30) DEFAULT 'active';")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_renews_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS card_brand VARCHAR(50) DEFAULT NULL;")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS card_last4 VARCHAR(10) DEFAULT NULL;")

    # 2. Create invoices table if not exists
    op.execute("""
    CREATE TABLE IF NOT EXISTS invoices (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        invoice_number VARCHAR(50) UNIQUE NOT NULL,
        amount_cents INTEGER NOT NULL,
        currency VARCHAR(10) NOT NULL DEFAULT 'USD',
        plan VARCHAR(30) NOT NULL,
        billing_interval VARCHAR(20) NOT NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'paid',
        payment_method VARCHAR(50) NOT NULL DEFAULT 'credit_card',
        card_brand VARCHAR(50),
        card_last4 VARCHAR(10),
        paid_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS ix_invoices_user_id ON invoices (user_id);
    CREATE INDEX IF NOT EXISTS ix_invoices_invoice_number ON invoices (invoice_number);
    """)


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS invoices;")
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS card_last4;")
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS card_brand;")
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS subscription_renews_at;")
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS subscription_status;")
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS billing_interval;")
