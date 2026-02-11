from fastapi import APIRouter, Depends
from app.api.dependencies import get_current_user
from app.database.crud import get_user_subscription, check_invoice_quota

router = APIRouter(prefix="/api/subscriptions", tags=["subscriptions"])


@router.get("/me")
async def get_my_subscription(user: dict = Depends(get_current_user)):
    """Get current user's subscription plan and usage info."""
    user_id = user["user_id"]
    subscription = get_user_subscription(user_id)
    quota = check_invoice_quota(user_id)

    return {
        "success": True,
        "plan": quota["plan"],
        "usage": {
            "used": quota["used"],
            "limit": quota["limit"],
            "allowed": quota["allowed"],
        },
        "subscription": {
            "status": subscription.get("status", "active"),
            "started_at": subscription.get("started_at"),
            "expires_at": subscription.get("expires_at"),
        },
    }
