import uuid
from app.database.supabase_client import get_supabase_admin

BUCKET_NAME = "invoices"


def upload_pdf(user_id: str, filename: str, file_bytes: bytes) -> str:
    """
    Upload PDF to Supabase Storage.
    Stores under: invoices/{user_id}/{unique_id}.pdf
    Returns the storage path.
    """
    sb = get_supabase_admin()
    file_id = str(uuid.uuid4())
    storage_path = f"{user_id}/{file_id}.pdf"

    sb.storage.from_(BUCKET_NAME).upload(
        path=storage_path,
        file=file_bytes,
        file_options={"content-type": "application/pdf"},
    )

    return storage_path


def download_pdf(storage_path: str) -> bytes:
    """Download PDF bytes from Supabase Storage."""
    sb = get_supabase_admin()
    result = sb.storage.from_(BUCKET_NAME).download(storage_path)
    return result


def delete_pdf(storage_path: str):
    """Delete a PDF from Supabase Storage."""
    sb = get_supabase_admin()
    sb.storage.from_(BUCKET_NAME).remove([storage_path])


def get_signed_url(storage_path: str, expires_in: int = 3600) -> str:
    """Get a temporary signed URL for PDF download."""
    sb = get_supabase_admin()
    result = sb.storage.from_(BUCKET_NAME).create_signed_url(storage_path, expires_in)
    return result["signedURL"]
