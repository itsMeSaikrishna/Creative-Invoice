from app.database.supabase_client import get_supabase


def sign_up(email: str, password: str) -> dict:
    """Register a new user with Supabase Auth."""
    sb = get_supabase()
    result = sb.auth.sign_up({"email": email, "password": password})

    if result.user is None:
        raise ValueError("Signup failed. Email may already be registered.")

    return {
        "user_id": result.user.id,
        "email": result.user.email,
        "access_token": result.session.access_token if result.session else None,
        "refresh_token": result.session.refresh_token if result.session else None,
    }


def sign_in(email: str, password: str) -> dict:
    """Login with email and password."""
    sb = get_supabase()
    result = sb.auth.sign_in_with_password({"email": email, "password": password})

    if result.user is None:
        raise ValueError("Invalid email or password.")

    return {
        "user_id": result.user.id,
        "email": result.user.email,
        "access_token": result.session.access_token,
        "refresh_token": result.session.refresh_token,
    }


def refresh_session(refresh_token: str) -> dict:
    """Refresh an expired access token."""
    sb = get_supabase()
    result = sb.auth.refresh_session(refresh_token)

    return {
        "access_token": result.session.access_token,
        "refresh_token": result.session.refresh_token,
    }


def get_user_from_token(access_token: str) -> dict:
    """Verify JWT and return user info. Raises on invalid token."""
    sb = get_supabase()
    result = sb.auth.get_user(access_token)

    if result.user is None:
        raise ValueError("Invalid or expired token.")

    return {
        "user_id": result.user.id,
        "email": result.user.email,
    }


def sign_out(access_token: str):
    """Sign out user and invalidate their session."""
    sb = get_supabase()
    sb.auth.sign_out(access_token)
