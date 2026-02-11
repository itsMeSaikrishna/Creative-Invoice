import os
import hashlib

ALLOWED_EXTENSIONS = {".pdf"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
PDF_MAGIC = b"%PDF"


def validate_pdf_upload(filename: str, file_bytes: bytes) -> tuple[bool, str | None]:
    """
    Validate an uploaded file:
    - Check extension is .pdf
    - Check file size <= 10MB
    - Check PDF magic number header
    Returns (is_valid, error_message).
    """
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        return False, "Only PDF files are allowed"

    if len(file_bytes) > MAX_FILE_SIZE:
        return False, f"File too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)}MB"

    if not file_bytes[:4] == PDF_MAGIC:
        return False, "Invalid PDF file (bad header)"

    return True, None


def file_hash(file_bytes: bytes) -> str:
    """Generate SHA-256 hash of file content for caching."""
    return hashlib.sha256(file_bytes).hexdigest()
