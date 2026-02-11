from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from app.services.auth_service import sign_up, sign_in, refresh_session, sign_out
from app.api.dependencies import get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])


class AuthRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


@router.post("/signup")
async def signup(req: AuthRequest):
    """Register a new user. Email confirmation is required before login."""
    try:
        result = sign_up(req.email, req.password)
        return {
            "success": True,
            "message": "Account created. Please check your email to confirm before logging in.",
            **result,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login")
async def login(req: AuthRequest):
    """Login with email and password."""
    try:
        result = sign_in(req.email, req.password)
        return {"success": True, **result}
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))


@router.post("/refresh")
async def refresh(req: RefreshRequest):
    """Refresh an expired access token."""
    try:
        result = refresh_session(req.refresh_token)
        return {"success": True, **result}
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))


@router.post("/logout")
async def logout(user: dict = Depends(get_current_user)):
    """Sign out and invalidate session."""
    return {"success": True, "message": "Logged out"}


@router.get("/me")
async def me(user: dict = Depends(get_current_user)):
    """Get current user info from JWT."""
    return {"success": True, **user}
