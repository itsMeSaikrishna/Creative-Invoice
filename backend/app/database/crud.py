from datetime import datetime
from typing import Optional
from app.database.supabase_client import get_supabase_admin
from app.models.schemas import InvoiceData


# ─── Invoice CRUD ────────────────────────────────────────────────────────────


def create_invoice_record(
    user_id: str,
    original_filename: str,
    file_path: str | None = None,
    buyer_gstin: str | None = None,
) -> dict:
    """Create a new invoice record with status='pending'."""
    db = get_supabase_admin()
    data = {
        "user_id": user_id,
        "original_filename": original_filename,
        "file_path": file_path,
        "buyer_gstin": buyer_gstin,
        "status": "pending",
    }
    result = db.table("invoices").insert(data).execute()
    return result.data[0]


def update_invoice_status(invoice_id: str, status: str) -> dict:
    """Update invoice processing status."""
    db = get_supabase_admin()
    result = (
        db.table("invoices")
        .update({"status": status, "updated_at": datetime.utcnow().isoformat()})
        .eq("id", invoice_id)
        .execute()
    )
    return result.data[0] if result.data else {}


def save_invoice_data(invoice_id: str, data: InvoiceData, processing_time_ms: int) -> dict:
    """Save extracted invoice data after successful processing."""
    db = get_supabase_admin()
    update = {
        "seller_name": data.seller_name,
        "seller_gstin": data.seller_gstin,
        "buyer_gstin": data.buyer_gstin,
        "bill_no": data.bill_no,
        "bill_date": data.bill_date,
        "total_taxable_value": float(data.total_taxable_value),
        "total_cgst": float(data.total_cgst),
        "total_sgst": float(data.total_sgst),
        "total_igst": float(data.total_igst),
        "total_quantity": float(data.total_quantity),
        "total_amount": float(data.total_amount),
        "tax_breakup": [item.model_dump() for item in data.tax_breakup],
        "validation_passed": data.validation_passed,
        "validation_errors": data.validation_errors,
        "processing_time_ms": processing_time_ms,
        "status": "completed",
        "updated_at": datetime.utcnow().isoformat(),
    }
    result = db.table("invoices").update(update).eq("id", invoice_id).execute()
    return result.data[0] if result.data else {}


def save_invoice_error(invoice_id: str, error: dict, processing_time_ms: int) -> dict:
    """Save error details when processing fails."""
    db = get_supabase_admin()
    update = {
        "status": "failed",
        "validation_errors": [error.get("message", "Unknown error")],
        "processing_time_ms": processing_time_ms,
        "updated_at": datetime.utcnow().isoformat(),
    }
    result = db.table("invoices").update(update).eq("id", invoice_id).execute()
    return result.data[0] if result.data else {}


def get_invoice(invoice_id: str, user_id: str) -> dict | None:
    """Fetch a single invoice by ID (scoped to user, excludes soft-deleted)."""
    db = get_supabase_admin()
    result = (
        db.table("invoices")
        .select("*")
        .eq("id", invoice_id)
        .eq("user_id", user_id)
        .is_("deleted_at", "null")
        .execute()
    )
    return result.data[0] if result.data else None


def list_invoices(
    user_id: str,
    page: int = 1,
    limit: int = 20,
    status: str | None = None,
    from_date: str | None = None,
    to_date: str | None = None,
) -> dict:
    """List invoices with pagination and filters."""
    db = get_supabase_admin()
    offset = (page - 1) * limit

    query = db.table("invoices").select("*", count="exact").eq("user_id", user_id).is_("deleted_at", "null")

    if status:
        query = query.eq("status", status)
    if from_date:
        query = query.gte("bill_date", from_date)
    if to_date:
        query = query.lte("bill_date", to_date)

    result = query.order("created_at", desc=True).range(offset, offset + limit - 1).execute()

    return {
        "invoices": result.data,
        "total": result.count,
        "page": page,
        "limit": limit,
    }


def delete_invoice(invoice_id: str, user_id: str) -> bool:
    """Soft-delete an invoice (scoped to user). Returns True if updated."""
    db = get_supabase_admin()
    result = (
        db.table("invoices")
        .update({"deleted_at": datetime.utcnow().isoformat()})
        .eq("id", invoice_id)
        .eq("user_id", user_id)
        .is_("deleted_at", "null")
        .execute()
    )
    return len(result.data) > 0


# ─── Buyer GSTIN CRUD ────────────────────────────────────────────────────────


def create_buyer(user_id: str, gstin: str, buyer_name: str | None = None, is_default: bool = False) -> dict:
    """Save a buyer GSTIN for the user."""
    db = get_supabase_admin()
    data = {
        "user_id": user_id,
        "gstin": gstin.strip().upper(),
        "buyer_name": buyer_name,
        "is_default": is_default,
    }
    result = db.table("buyer_gstins").insert(data).execute()
    return result.data[0]


def list_buyers(user_id: str) -> list[dict]:
    """List all saved buyer GSTINs for a user."""
    db = get_supabase_admin()
    result = (
        db.table("buyer_gstins")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data


def get_default_buyer(user_id: str) -> dict | None:
    """Get the default buyer GSTIN for a user."""
    db = get_supabase_admin()
    result = (
        db.table("buyer_gstins")
        .select("*")
        .eq("user_id", user_id)
        .eq("is_default", True)
        .limit(1)
        .execute()
    )
    return result.data[0] if result.data else None


def delete_buyer(buyer_id: str, user_id: str) -> bool:
    """Delete a buyer GSTIN."""
    db = get_supabase_admin()
    result = (
        db.table("buyer_gstins")
        .delete()
        .eq("id", buyer_id)
        .eq("user_id", user_id)
        .execute()
    )
    return len(result.data) > 0


# ─── Subscription CRUD ──────────────────────────────────────────────────────

PLAN_LIMITS = {
    "free": 3,
    "pro": 999999,  # effectively unlimited
}


def _default_free_subscription(user_id: str) -> dict:
    return {
        "user_id": user_id,
        "plan": "free",
        "status": "active",
        "started_at": None,
        "expires_at": None,
    }


def get_user_subscription(user_id: str) -> dict:
    """Fetch the user's subscription. Returns free defaults if none exists or table is missing."""
    try:
        db = get_supabase_admin()
        result = (
            db.table("user_subscriptions")
            .select("*")
            .eq("user_id", user_id)
            .limit(1)
            .execute()
        )
        if result.data:
            return result.data[0]
    except Exception:
        pass
    return _default_free_subscription(user_id)


def get_monthly_invoice_count(user_id: str) -> int:
    """Count invoices created by the user in the current calendar month."""
    db = get_supabase_admin()
    now = datetime.utcnow()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0).isoformat()
    result = (
        db.table("invoices")
        .select("id", count="exact")
        .eq("user_id", user_id)
        .gte("created_at", month_start)
        .execute()
    )
    return result.count or 0


def check_invoice_quota(user_id: str) -> dict:
    """Check if the user can upload more invoices this month."""
    sub = get_user_subscription(user_id)
    plan = sub.get("plan", "free")
    limit = PLAN_LIMITS.get(plan, PLAN_LIMITS["free"])
    used = get_monthly_invoice_count(user_id)
    return {
        "allowed": used < limit,
        "used": used,
        "limit": limit,
        "plan": plan,
    }
