import secrets
from datetime import datetime, timedelta
from typing import List, Optional
import uuid

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import desc, select

from app.core.deps import CurrentUser, DbSession
from app.models.invoice import Invoice
from app.models.user import User
from app.services.plan_enforcement import get_plan_limits

router = APIRouter()


class SubscriptionOut(BaseModel):
    plan: str
    plan_name: str
    billing_interval: Optional[str] = "monthly"
    subscription_status: str = "active"
    subscription_renews_at: Optional[datetime] = None
    card_brand: Optional[str] = None
    card_last4: Optional[str] = None
    documents_used: int = 0
    questions_used: int = 0
    documents_limit: int = 100
    questions_limit: int = 200
    workspaces_limit: int = 3
    max_file_size_mb: int = 15


class CheckoutRequest(BaseModel):
    plan: str  # "premium" | "ultra_premium"
    billing_interval: str = "monthly"  # "monthly" | "annual"
    payment_method: str = "credit_card"  # "credit_card" | "apple_pay" | "google_pay" | "paypal"
    card_number: Optional[str] = None
    card_exp: Optional[str] = None
    card_cvc: Optional[str] = None
    cardholder_name: Optional[str] = None


class InvoiceOut(BaseModel):
    id: uuid.UUID
    invoice_number: str
    amount_cents: int
    currency: str
    plan: str
    billing_interval: str
    status: str
    payment_method: str
    card_brand: Optional[str] = None
    card_last4: Optional[str] = None
    paid_at: datetime


@router.get("/subscription", response_model=SubscriptionOut)
async def get_subscription(user: CurrentUser):
    limits = get_plan_limits(user.plan)
    return SubscriptionOut(
        plan=user.plan,
        plan_name=limits.get("name", "Free"),
        billing_interval=user.billing_interval or "monthly",
        subscription_status=user.subscription_status or "active",
        subscription_renews_at=user.subscription_renews_at,
        card_brand=user.card_brand,
        card_last4=user.card_last4,
        documents_used=user.documents_used or 0,
        questions_used=user.questions_used or 0,
        documents_limit=limits["documents"],
        questions_limit=limits["questions"],
        workspaces_limit=limits["workspaces"],
        max_file_size_mb=limits.get("max_file_size_mb", 15),
    )


@router.post("/checkout", response_model=SubscriptionOut)
async def simulated_checkout(payload: CheckoutRequest, db: DbSession, user: CurrentUser):
    target_plan = payload.plan.lower()
    if target_plan not in ("premium", "ultra_premium"):
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "Invalid plan. Supported paid tiers are 'premium' and 'ultra_premium'."
        )

    # Simulated Card Decline check
    clean_card = (payload.card_number or "").replace(" ", "")
    if clean_card.endswith("0002") or payload.card_cvc == "000":
        raise HTTPException(
            status.HTTP_402_PAYMENT_REQUIRED,
            "Your simulated card was declined: Insufficient funds or test decline."
        )

    # Pricing calculation
    is_annual = payload.billing_interval == "annual"
    if target_plan == "premium":
        amount_cents = 19000 if is_annual else 1900  # $190/yr or $19/mo
        plan_name = "Premium"
    else:
        amount_cents = 49000 if is_annual else 4900  # $490/yr or $49/mo
        plan_name = "Ultra Premium"

    # Card brand detection
    card_brand = "Visa"
    if clean_card.startswith("5"):
        card_brand = "Mastercard"
    elif clean_card.startswith("3"):
        card_brand = "Amex"
    elif payload.payment_method == "apple_pay":
        card_brand = "Apple Pay"
    elif payload.payment_method == "google_pay":
        card_brand = "Google Pay"
    elif payload.payment_method == "paypal":
        card_brand = "PayPal"

    card_last4 = clean_card[-4:] if len(clean_card) >= 4 else "4242"
    if payload.payment_method in ("apple_pay", "google_pay", "paypal"):
        card_last4 = "Pass"

    # Generate Invoice
    inv_num = f"INV-{datetime.utcnow().year}-{secrets.randbelow(90000) + 10000}"
    invoice = Invoice(
        user_id=user.id,
        invoice_number=inv_num,
        amount_cents=amount_cents,
        currency="USD",
        plan=target_plan,
        billing_interval=payload.billing_interval,
        status="paid",
        payment_method=payload.payment_method,
        card_brand=card_brand,
        card_last4=card_last4,
        paid_at=datetime.utcnow(),
    )
    db.add(invoice)

    # Upgrade User
    user.plan = target_plan
    user.billing_interval = payload.billing_interval
    user.subscription_status = "active"
    user.subscription_renews_at = datetime.utcnow() + (timedelta(days=365) if is_annual else timedelta(days=30))
    user.card_brand = card_brand
    user.card_last4 = card_last4

    await db.commit()
    await db.refresh(user)

    limits = get_plan_limits(user.plan)
    return SubscriptionOut(
        plan=user.plan,
        plan_name=limits.get("name", plan_name),
        billing_interval=user.billing_interval,
        subscription_status=user.subscription_status,
        subscription_renews_at=user.subscription_renews_at,
        card_brand=user.card_brand,
        card_last4=user.card_last4,
        documents_used=user.documents_used or 0,
        questions_used=user.questions_used or 0,
        documents_limit=limits["documents"],
        questions_limit=limits["questions"],
        workspaces_limit=limits["workspaces"],
        max_file_size_mb=limits.get("max_file_size_mb", 50),
    )


@router.post("/cancel", response_model=SubscriptionOut)
async def cancel_subscription(db: DbSession, user: CurrentUser):
    """Cancel subscription and downgrade to Free tier."""
    user.plan = "free"
    user.subscription_status = "canceled"
    user.subscription_renews_at = None
    user.billing_interval = None
    await db.commit()
    await db.refresh(user)

    limits = get_plan_limits(user.plan)
    return SubscriptionOut(
        plan=user.plan,
        plan_name="Free",
        billing_interval="monthly",
        subscription_status="canceled",
        subscription_renews_at=None,
        card_brand=user.card_brand,
        card_last4=user.card_last4,
        documents_used=user.documents_used or 0,
        questions_used=user.questions_used or 0,
        documents_limit=limits["documents"],
        questions_limit=limits["questions"],
        workspaces_limit=limits["workspaces"],
        max_file_size_mb=limits.get("max_file_size_mb", 15),
    )


@router.get("/invoices", response_model=List[InvoiceOut])
async def list_invoices(db: DbSession, user: CurrentUser):
    """List all billing receipts and invoices for the current user."""
    result = await db.execute(
        select(Invoice)
        .where(Invoice.user_id == user.id)
        .order_by(desc(Invoice.paid_at))
    )
    return result.scalars().all()
