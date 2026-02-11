"""Tests for output_service - JSON, XML (Tally), and CSV generation."""
import json
import csv
import os
from io import StringIO
import pytest
from xml.etree import ElementTree

from app.models.schemas import InvoiceData
from app.services.output_service import (
    generate_json_output,
    generate_tally_xml,
    generate_csv_output,
    generate_output,
)

EXPECTED_DIR = os.path.join(os.path.dirname(__file__), "expected_outputs")


def _load_invoice(filename: str) -> InvoiceData:
    with open(os.path.join(EXPECTED_DIR, filename)) as f:
        return InvoiceData(**json.load(f))


# --- JSON Output Tests ---


class TestJSONOutput:
    def test_bhavani_json_structure(self):
        data = _load_invoice("bhavani_auto.json")
        result = json.loads(generate_json_output(data))

        assert "invoice_metadata" in result
        assert "amounts" in result
        assert "tax_breakup" in result
        assert "validation" in result

    def test_bhavani_json_metadata(self):
        data = _load_invoice("bhavani_auto.json")
        result = json.loads(generate_json_output(data))
        meta = result["invoice_metadata"]

        assert meta["seller_name"] == "Bhavani Auto Distributors"
        assert meta["seller_gstin"] == "32AAXFB6381L1ZU"
        assert meta["buyer_gstin"] == "32BSBPA3464Q1ZQ"
        assert meta["bill_no"] == "EBW2526006189"
        assert meta["bill_date"] == "2025-09-01"

    def test_bhavani_json_amounts(self):
        data = _load_invoice("bhavani_auto.json")
        result = json.loads(generate_json_output(data))
        amounts = result["amounts"]

        assert amounts["total_taxable_value"] == 4714.61
        assert amounts["total_cgst"] == 480.70
        assert amounts["total_sgst"] == 480.70
        assert amounts["total_igst"] == 0
        assert amounts["total_amount"] == 5676.00

    def test_bhavani_json_tax_breakup_count(self):
        data = _load_invoice("bhavani_auto.json")
        result = json.loads(generate_json_output(data))
        assert len(result["tax_breakup"]) == 2

    def test_spareway_json_single_tax_rate(self):
        data = _load_invoice("spareway_associates.json")
        result = json.loads(generate_json_output(data))
        assert len(result["tax_breakup"]) == 1
        assert result["tax_breakup"][0]["rate"] == 18


# --- XML (Tally) Output Tests ---


class TestTallyXML:
    def test_bhavani_xml_valid_structure(self):
        data = _load_invoice("bhavani_auto.json")
        xml_str = generate_tally_xml(data)
        root = ElementTree.fromstring(xml_str)

        assert root.tag == "ENVELOPE"
        assert root.find(".//HEADER/TALLYREQUEST").text == "Import Data"
        assert root.find(".//REQUESTDESC/REPORTNAME").text == "Vouchers"

    def test_bhavani_xml_voucher_fields(self):
        data = _load_invoice("bhavani_auto.json")
        xml_str = generate_tally_xml(data)
        root = ElementTree.fromstring(xml_str)
        voucher = root.find(".//VOUCHER")

        assert voucher.get("VCHTYPE") == "Purchase"
        assert voucher.get("ACTION") == "Create"
        assert voucher.find("DATE").text == "20250901"
        assert voucher.find("VOUCHERNUMBER").text == "EBW2526006189"
        assert voucher.find("PARTYLEDGERNAME").text == "Bhavani Auto Distributors"

    def test_bhavani_xml_has_tax_entries(self):
        """Should have CGST+SGST entries for both 18% and 28% rates."""
        data = _load_invoice("bhavani_auto.json")
        xml_str = generate_tally_xml(data)
        root = ElementTree.fromstring(xml_str)

        ledger_entries = root.findall(".//ALLLEDGERENTRIES.LIST")
        # 1 party + 2 CGST + 2 SGST + 1 purchase = 6
        assert len(ledger_entries) == 6

    def test_spareway_xml_single_rate(self):
        data = _load_invoice("spareway_associates.json")
        xml_str = generate_tally_xml(data)
        root = ElementTree.fromstring(xml_str)

        ledger_entries = root.findall(".//ALLLEDGERENTRIES.LIST")
        # 1 party + 1 CGST + 1 SGST + 1 purchase = 4
        assert len(ledger_entries) == 4


# --- CSV Output Tests ---


class TestCSVOutput:
    def test_bhavani_csv_header_row(self):
        data = _load_invoice("bhavani_auto.json")
        csv_str = generate_csv_output(data)
        reader = csv.reader(StringIO(csv_str))
        rows = list(reader)

        header = rows[0]
        assert "Bill No" in header
        assert "Seller GSTIN" in header
        assert "Total Amount" in header

    def test_bhavani_csv_data_row(self):
        data = _load_invoice("bhavani_auto.json")
        csv_str = generate_csv_output(data)
        reader = csv.reader(StringIO(csv_str))
        rows = list(reader)

        data_row = rows[1]
        assert data_row[0] == "EBW2526006189"  # bill_no
        assert data_row[2] == "Bhavani Auto Distributors"  # seller_name
        assert float(data_row[10]) == 5676.00  # total_amount

    def test_bhavani_csv_tax_breakup_rows(self):
        data = _load_invoice("bhavani_auto.json")
        csv_str = generate_csv_output(data)
        reader = csv.reader(StringIO(csv_str))
        rows = list(reader)

        # Find tax breakup header
        breakup_header_idx = None
        for i, row in enumerate(rows):
            if row and row[0] == "Rate %":
                breakup_header_idx = i
                break

        assert breakup_header_idx is not None
        # 2 tax rate rows after the header
        assert float(rows[breakup_header_idx + 1][0]) == 18
        assert float(rows[breakup_header_idx + 2][0]) == 28


# --- Format Router Tests ---


class TestGenerateOutput:
    def test_json_format(self):
        data = _load_invoice("bhavani_auto.json")
        result = generate_output(data, "json")
        parsed = json.loads(result)
        assert "invoice_metadata" in parsed

    def test_xml_format(self):
        data = _load_invoice("bhavani_auto.json")
        result = generate_output(data, "xml")
        assert result.startswith("<?xml")

    def test_csv_format(self):
        data = _load_invoice("bhavani_auto.json")
        result = generate_output(data, "csv")
        assert "Bill No" in result

    def test_invalid_format_raises(self):
        data = _load_invoice("bhavani_auto.json")
        with pytest.raises(ValueError, match="Unsupported format"):
            generate_output(data, "xlsx")
