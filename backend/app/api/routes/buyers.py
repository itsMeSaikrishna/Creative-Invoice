from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from app.api.dependencies import get_current_user
from app.database.crud import create_buyer, list_buyers, delete_buyer
from app.services.validation_service import validate_gstin

router = APIRouter(prefix="/api/buyers", tags=["buyers"])


class BuyerCreateRequest(BaseModel):
    gstin: str
    buyer_name: Optional[str] = None
    is_default: bool = False


@router.post("")
async def add_buyer(req: BuyerCreateRequest, user: dict = Depends(get_current_user)):
    """Save a new buyer GSTIN."""
    if not validate_gstin(req.gstin.strip().upper()):
        raise HTTPException(status_code=400, detail="Invalid GSTIN format")

    try:
        result = create_buyer(user["user_id"], req.gstin, req.buyer_name, req.is_default)
        return {"success": True, "buyer": result}
    except Exception as e:
        if "duplicate" in str(e).lower() or "unique" in str(e).lower():
            raise HTTPException(status_code=409, detail="This GSTIN is already saved")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("")
async def get_buyers(user: dict = Depends(get_current_user)):
    """List all saved buyer GSTINs."""
    buyers = list_buyers(user["user_id"])
    return {"success": True, "buyers": buyers}


@router.delete("/{buyer_id}")
async def remove_buyer(buyer_id: str, user: dict = Depends(get_current_user)):
    """Delete a saved buyer GSTIN."""
    deleted = delete_buyer(buyer_id, user["user_id"])
    if not deleted:
        raise HTTPException(status_code=404, detail="Buyer not found")
    return {"success": True, "message": "Buyer deleted"}
