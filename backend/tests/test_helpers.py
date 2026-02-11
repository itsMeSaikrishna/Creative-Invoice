"""Tests for utility helpers - PDF validation, hashing."""
import os
import pytest
from app.utils.helpers import validate_pdf_upload, file_hash

FIXTURES_DIR = os.path.join(os.path.dirname(__file__), "fixtures")


class TestPDFValidation:
    def test_valid_pdf(self):
        pdf_path = os.path.join(FIXTURES_DIR, "bhavani_auto.pdf")
        with open(pdf_path, "rb") as f:
            content = f.read()
        is_valid, error = validate_pdf_upload("invoice.pdf", content)
        assert is_valid is True
        assert error is None

    def test_wrong_extension(self):
        is_valid, error = validate_pdf_upload("invoice.docx", b"%PDF-1.4")
        assert is_valid is False
        assert "PDF" in error

    def test_empty_file(self):
        is_valid, error = validate_pdf_upload("invoice.pdf", b"")
        assert is_valid is False
        assert "header" in error.lower()

    def test_non_pdf_content(self):
        is_valid, error = validate_pdf_upload("invoice.pdf", b"NOT A PDF")
        assert is_valid is False
        assert "header" in error.lower()

    def test_file_too_large(self):
        # Create bytes just over 10MB
        large_bytes = b"%PDF" + b"\x00" * (10 * 1024 * 1024 + 1)
        is_valid, error = validate_pdf_upload("invoice.pdf", large_bytes)
        assert is_valid is False
        assert "large" in error.lower()


class TestFileHash:
    def test_same_content_same_hash(self):
        content = b"test content"
        assert file_hash(content) == file_hash(content)

    def test_different_content_different_hash(self):
        assert file_hash(b"content a") != file_hash(b"content b")

    def test_hash_is_hex_string(self):
        h = file_hash(b"test")
        assert len(h) == 64  # SHA-256 hex
        assert all(c in "0123456789abcdef" for c in h)
