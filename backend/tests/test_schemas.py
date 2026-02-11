"""Tests for Pydantic schemas - data models, validators, date normalization."""
import pytest
from app.models.schemas import InvoiceData, TaxBreakup


class TestDateNormalization:
    def test_iso_format_passthrough(self):
        data = InvoiceData(
            seller_name="Test", seller_gstin="32AAXFB6381L1ZU",
            bill_no="001", bill_date="2025-09-01",
            total_taxable_value=100, total_amount=118,
        )
        assert data.bill_date == "2025-09-01"

    def test_dd_mm_yyyy_slash(self):
        data = InvoiceData(
            seller_name="Test", seller_gstin="32AAXFB6381L1ZU",
            bill_no="001", bill_date="01/09/2025",
            total_taxable_value=100, total_amount=118,
        )
        assert data.bill_date == "2025-09-01"

    def test_dd_mm_yyyy_dash(self):
        data = InvoiceData(
            seller_name="Test", seller_gstin="32AAXFB6381L1ZU",
            bill_no="001", bill_date="21-08-2025",
            total_taxable_value=100, total_amount=118,
        )
        assert data.bill_date == "2025-08-21"

    def test_dd_mm_yyyy_dot(self):
        data = InvoiceData(
            seller_name="Test", seller_gstin="32AAXFB6381L1ZU",
            bill_no="001", bill_date="10.09.2025",
            total_taxable_value=100, total_amount=118,
        )
        assert data.bill_date == "2025-09-10"


class TestGSTINCleaning:
    def test_uppercase_conversion(self):
        data = InvoiceData(
            seller_name="Test", seller_gstin="32aaxfb6381l1zu",
            bill_no="001", bill_date="2025-09-01",
            total_taxable_value=100, total_amount=118,
        )
        assert data.seller_gstin == "32AAXFB6381L1ZU"

    def test_strip_whitespace(self):
        data = InvoiceData(
            seller_name="Test", seller_gstin="  32AAXFB6381L1ZU  ",
            bill_no="001", bill_date="2025-09-01",
            total_taxable_value=100, total_amount=118,
        )
        assert data.seller_gstin == "32AAXFB6381L1ZU"

    def test_empty_buyer_gstin_becomes_none(self):
        data = InvoiceData(
            seller_name="Test", seller_gstin="32AAXFB6381L1ZU",
            buyer_gstin="", bill_no="001", bill_date="2025-09-01",
            total_taxable_value=100, total_amount=118,
        )
        assert data.buyer_gstin is None

    def test_none_buyer_gstin(self):
        data = InvoiceData(
            seller_name="Test", seller_gstin="32AAXFB6381L1ZU",
            buyer_gstin=None, bill_no="001", bill_date="2025-09-01",
            total_taxable_value=100, total_amount=118,
        )
        assert data.buyer_gstin is None


class TestTaxBreakup:
    def test_tax_breakup_creation(self):
        tb = TaxBreakup(
            rate=18, taxable_value=1000.00,
            cgst_amount=90.00, sgst_amount=90.00,
            igst_amount=0, total_with_tax=1180.00,
        )
        assert tb.rate == 18
        assert tb.total_with_tax == 1180.00

    def test_defaults(self):
        tb = TaxBreakup(rate=5, taxable_value=200, total_with_tax=210)
        assert tb.cgst_amount == 0.0
        assert tb.sgst_amount == 0.0
        assert tb.igst_amount == 0.0
