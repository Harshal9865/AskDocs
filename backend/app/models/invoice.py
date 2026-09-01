import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel


class Invoice(BaseModel):
    __tablename__ = "invoices"

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), index=True)
    invoice_number: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    amount_cents: Mapped[int] = mapped_column(Integer)
    currency: Mapped[str] = mapped_column(String(10), default="USD")
    plan: Mapped[str] = mapped_column(String(30))  # premium | ultra_premium
    billing_interval: Mapped[str] = mapped_column(String(20))  # monthly | annual
    status: Mapped[str] = mapped_column(String(30), default="paid")  # paid | refunded
    payment_method: Mapped[str] = mapped_column(String(50), default="credit_card")  # credit_card | apple_pay | google_pay | paypal
    card_brand: Mapped[str | None] = mapped_column(String(50), nullable=True)
    card_last4: Mapped[str | None] = mapped_column(String(10), nullable=True)
    paid_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
