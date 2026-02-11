"""Tests for validation_service - GST format, tax calculations, data integrity."""
import json
import os
import pytest
from app.services.validation_service import validate_gstin, validate_invoice_data
from app.models.schemas import InvoiceData, TaxBreakup

EXPECTED_DIR = os.path.join(os.path.dirname(__file__), "expected_outputs")


# --- GSTIN Format Tests ---


class TestGSTINValidation:
    def test_valid_gstin_bhavani(self):
        assert validate_gstin("32AAXFB6381L1ZU") is True

    def test_valid_gstin_brothers(self):
        assert validate_gstin("32ALBPD9642B1ZP") is True

    def test_valid_gstin_spareway(self):
        assert validate_gstin("32AEQFS6273P1Z5") is True

    def test_valid_gstin_buyer(self):
        assert validate_gstin("32BSBPA3464Q1ZQ") is True

    def test_invalid_gstin_too_short(self):
        assert validate_gstin("32AAXFB6381") is False

    def test_invalid_gstin_bad_format(self):
        assert validate_gstin("INVALIDGSTIN123") is False

    def test_invalid_gstin_empty(self):
        assert validate_gstin("") is False

    def test_invalid_gstin_none(self):
        assert validate_gstin(None) is False

    def test_invalid_gstin_lowercase(self):
        assert validate_gstin("32aaxfb6381l1zu") is False


# --- Invoice Data Validation Tests ---


class TestInvoiceValidation:
    def _load_expected(self, filename: str) -> InvoiceData:
        with open(os.path.join(EXPECTED_DIR, filename)) as f:
            return InvoiceData(**json.load(f))

    def test_bhavani_auto_valid(self):
        """Bhavani Auto: 2 tax rates (18% + 28%), intra-state."""
        data = self._load_expected("bhavani_auto.json")
        is_valid, errors = validate_invoice_data(data)
        assert is_valid is True, f"Unexpected errors: {errors}"
        assert errors == []

    def test_brothers_battery_valid(self):
        """Brothers Battery: single tax rate 18%, intra-state."""
        data = self._load_expected("brothers_battery.json")
        is_valid, errors = validate_invoice_data(data)
        assert is_valid is True, f"Unexpected errors: {errors}"
        assert errors == []

    def test_spareway_associates_valid(self):
        """Spareway Associates: single tax rate 18%, intra-state."""
        data = self._load_expected("spareway_associates.json")
        is_valid, errors = validate_invoice_data(data)
        assert is_valid is True, f"Unexpected errors: {errors}"
        assert errors == []

    def test_missing_seller_name(self):
        data = self._load_expected("bhavani_auto.json")
        data.seller_name = ""
        is_valid, errors = validate_invoice_data(data)
        assert is_valid is False
        assert any("seller name" in e.lower() for e in errors)

    def test_invalid_seller_gstin_format(self):
        data = self._load_expected("bhavani_auto.json")
        data.seller_gstin = "INVALID"
        is_valid, errors = validate_invoice_data(data)
        assert is_valid is False
        assert any("seller gstin format" in e.lower() for e in errors)

    def test_cgst_sgst_mismatch(self):
        """CGST and SGST should be equal for intra-state."""
        data = self._load_expected("spareway_associates.json")
        data.total_cgst = 110.59
        data.total_sgst = 99.00  # mismatch
        is_valid, errors = validate_invoice_data(data)
        assert is_valid is False
        assert any("cgst" in e.lower() and "sgst" in e.lower() for e in errors)

    def test_both_cgst_and_igst_fails(self):
        """Cannot have both CGST/SGST and IGST non-zero."""
        data = self._load_expected("spareway_associates.json")
        data.total_igst = 50.0  # force IGST alongside CGST/SGST
        is_valid, errors = validate_invoice_data(data)
        assert is_valid is False
        assert any("both" in e.lower() for e in errors)

    def test_total_amount_mismatch(self):
        data = self._load_expected("spareway_associates.json")
        data.total_amount = 9999.99  # wrong total
        is_valid, errors = validate_invoice_data(data)
        assert is_valid is False
        assert any("total mismatch" in e.lower() for e in errors)

    def test_tax_breakup_sum_mismatch(self):
        data = self._load_expected("bhavani_auto.json")
        data.tax_breakup[0].taxable_value = 999.99  # break the sum
        is_valid, errors = validate_invoice_data(data)
        assert is_valid is False
        assert any("breakup" in e.lower() for e in errors)

    def test_igst_transaction(self):
        """Valid inter-state (IGST only) invoice."""
        data = InvoiceData(
            seller_name="Test Interstate Seller",
            seller_gstin="29AAXFB6381L1ZU",
            buyer_gstin="32BSBPA3464Q1ZQ",
            bill_no="INT-001",
            bill_date="2025-09-15",
            tax_breakup=[
                TaxBreakup(
                    rate=18,
                    taxable_value=1000.00,
                    cgst_amount=0,
                    sgst_amount=0,
                    igst_amount=180.00,
                    total_with_tax=1180.00,
                )
            ],
            total_taxable_value=1000.00,
            total_cgst=0,
            total_sgst=0,
            total_igst=180.00,
            total_quantity=5,
            total_amount=1180.00,
        )
        is_valid, errors = validate_invoice_data(data)
        assert is_valid is True, f"Unexpected errors: {errors}"

    def test_date_format_invalid(self):
        data = self._load_expected("bhavani_auto.json")
        data.bill_date = "01/09/2025"  # not YYYY-MM-DD
        is_valid, errors = validate_invoice_data(data)
        assert is_valid is False
        assert any("date format" in e.lower() for e in errors)
