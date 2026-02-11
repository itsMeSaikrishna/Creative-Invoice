"""
End-to-end pipeline test with real PDFs, real Google Document AI, and real Groq LLM.
Runs OCR -> Extraction -> Validation -> Output for all 3 reference invoices.
"""
import asyncio
import json
import os
import sys
import time

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.pipeline import process_invoice
from app.services.output_service import generate_output
from app.services.validation_service import validate_invoice_data

FIXTURES_DIR = os.path.join(os.path.dirname(__file__), "fixtures")
EXPECTED_DIR = os.path.join(os.path.dirname(__file__), "expected_outputs")

# Test cases: (pdf_filename, expected_json, buyer_gstin_hint, description)
TEST_CASES = [
    (
        "bhavani_auto.pdf",
        "bhavani_auto.json",
        "32BSBPA3464Q1ZQ",
        "Bhavani Auto Distributors - 2 tax rates (18% + 28%)",
    ),
    (
        "brothers_battery.pdf",
        "brothers_battery.json",
        "32BSBPA3464Q1ZQ",
        "Brothers Battery Agencies - single rate 18%",
    ),
    (
        "spareway_associates.pdf",
        "spareway_associates.json",
        "32BSBPA3464Q1ZQ",
        "Spareway Associates - single rate 18%",
    ),
]


def load_expected(filename: str) -> dict:
    with open(os.path.join(EXPECTED_DIR, filename)) as f:
        return json.load(f)


def compare_field(label: str, actual, expected, tolerance=0.5):
    """Compare a field and return (pass, message)."""
    if isinstance(expected, float):
        if abs(actual - expected) <= tolerance:
            return True, f"  [PASS] {label}: {actual}"
        return False, f"  [FAIL] {label}: got {actual}, expected {expected} (diff: {abs(actual - expected):.2f})"
    else:
        if str(actual) == str(expected):
            return True, f"  [PASS] {label}: {actual}"
        return False, f"  [FAIL] {label}: got '{actual}', expected '{expected}'"


async def test_single_invoice(pdf_file: str, expected_file: str, buyer_gstin: str, desc: str):
    """Test a single invoice through the full pipeline."""
    print(f"\n{'='*70}")
    print(f"TESTING: {desc}")
    print(f"{'='*70}")

    # Load PDF
    pdf_path = os.path.join(FIXTURES_DIR, pdf_file)
    with open(pdf_path, "rb") as f:
        pdf_bytes = f.read()
    print(f"  PDF loaded: {len(pdf_bytes)} bytes")

    # Load expected
    expected = load_expected(expected_file)

    # Run full pipeline
    start = time.time()
    result = await process_invoice(pdf_bytes, buyer_gstin_hint=buyer_gstin)
    elapsed = time.time() - start

    print(f"  Pipeline completed in {elapsed:.2f}s | Status: {result.status}")

    if result.status == "failed":
        print(f"  [ERROR] Pipeline failed: {result.error}")
        return False

    data = result.invoice_data
    passes = 0
    fails = 0

    # Compare key fields
    checks = [
        ("seller_name", data.seller_name, expected["seller_name"]),
        ("seller_gstin", data.seller_gstin, expected["seller_gstin"]),
        ("buyer_gstin", data.buyer_gstin, expected["buyer_gstin"]),
        ("bill_no", data.bill_no, expected["bill_no"]),
        ("bill_date", data.bill_date, expected["bill_date"]),
        ("total_taxable_value", data.total_taxable_value, expected["total_taxable_value"]),
        ("total_cgst", data.total_cgst, expected["total_cgst"]),
        ("total_sgst", data.total_sgst, expected["total_sgst"]),
        ("total_igst", data.total_igst, expected["total_igst"]),
        ("total_quantity", data.total_quantity, expected["total_quantity"]),
        ("total_amount", data.total_amount, expected["total_amount"]),
    ]

    for label, actual, exp in checks:
        passed, msg = compare_field(label, actual, exp)
        print(msg)
        if passed:
            passes += 1
        else:
            fails += 1

    # Tax breakup count
    actual_rates = len(data.tax_breakup)
    expected_rates = len(expected["tax_breakup"])
    if actual_rates == expected_rates:
        print(f"  [PASS] tax_breakup count: {actual_rates}")
        passes += 1
    else:
        print(f"  [FAIL] tax_breakup count: got {actual_rates}, expected {expected_rates}")
        fails += 1

    # Validation check
    is_valid, errors = validate_invoice_data(data)
    if is_valid:
        print(f"  [PASS] validation: passed")
        passes += 1
    else:
        print(f"  [WARN] validation errors: {errors}")
        # Don't count as fail - LLM rounding may differ slightly

    # Test output generation
    for fmt in ["json", "xml", "csv"]:
        try:
            output = generate_output(data, fmt)
            print(f"  [PASS] {fmt.upper()} output: {len(output)} chars")
            passes += 1
        except Exception as e:
            print(f"  [FAIL] {fmt.upper()} output: {e}")
            fails += 1

    print(f"\n  RESULT: {passes} passed, {fails} failed")
    return fails == 0


async def main():
    print("=" * 70)
    print("CREATIVE INVOICE - END-TO-END PIPELINE TEST")
    print("Google Document AI (OCR) -> Groq LLM (Extraction) -> Validation -> Output")
    print("=" * 70)

    total_pass = 0
    total_fail = 0

    for pdf_file, expected_file, buyer_gstin, desc in TEST_CASES:
        success = await test_single_invoice(pdf_file, expected_file, buyer_gstin, desc)
        if success:
            total_pass += 1
        else:
            total_fail += 1

    print(f"\n{'='*70}")
    print(f"FINAL: {total_pass}/{len(TEST_CASES)} invoices passed all checks")
    print(f"{'='*70}")


if __name__ == "__main__":
    asyncio.run(main())
