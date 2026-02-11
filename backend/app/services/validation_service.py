import re
from app.models.schemas import InvoiceData

# 15-char GST format: 2 digits + 5 uppercase + 4 digits + 1 uppercase + 1 alphanum + Z + 1 alphanum
GST_PATTERN = re.compile(r"^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$")

# Tolerance for floating point comparison in tax calculations
TOLERANCE = 0.50


def validate_gstin(gstin: str) -> bool:
    """Validate a 15-character Indian GSTIN format."""
    if not gstin or len(gstin) != 15:
        return False
    return bool(GST_PATTERN.match(gstin))


def validate_invoice_data(data: InvoiceData) -> tuple[bool, list[str]]:
    """
    Post-extraction validation of invoice data.

    Returns (is_valid, list_of_errors).
    """
    errors: list[str] = []

    # 1. Required fields check
    if not data.seller_name:
        errors.append("Missing seller name")
    if not data.seller_gstin:
        errors.append("Missing seller GSTIN")
    if not data.bill_no:
        errors.append("Missing bill number")
    if not data.bill_date:
        errors.append("Missing bill date")
    if data.total_amount <= 0:
        errors.append("Total amount must be positive")

    # 2. GSTIN format validation
    if data.seller_gstin and not validate_gstin(data.seller_gstin):
        errors.append(f"Invalid seller GSTIN format: {data.seller_gstin}")

    if data.buyer_gstin and not validate_gstin(data.buyer_gstin):
        errors.append(f"Invalid buyer GSTIN format: {data.buyer_gstin}")

    # 3. Date format validation (YYYY-MM-DD)
    if data.bill_date and not re.match(r"^\d{4}-\d{2}-\d{2}$", data.bill_date):
        errors.append(f"Invalid date format: {data.bill_date}, expected YYYY-MM-DD")

    # 4. Tax type validation: either CGST+SGST or IGST, not both
    has_cgst_sgst = data.total_cgst > 0 or data.total_sgst > 0
    has_igst = data.total_igst > 0

    if has_cgst_sgst and has_igst:
        errors.append("Cannot have both CGST/SGST and IGST non-zero")

    # 5. Intra-state: CGST should equal SGST
    if has_cgst_sgst and not has_igst:
        if abs(data.total_cgst - data.total_sgst) > 0.01:
            errors.append(
                f"CGST ({data.total_cgst}) and SGST ({data.total_sgst}) "
                f"should be equal for intra-state"
            )

    # 6. Total amount validation
    if has_igst:
        calculated = data.total_taxable_value + data.total_igst
        if abs(calculated - data.total_amount) > TOLERANCE:
            errors.append(
                f"Total mismatch (inter-state): "
                f"taxable({data.total_taxable_value}) + igst({data.total_igst}) "
                f"= {calculated}, expected {data.total_amount}"
            )
    else:
        calculated = data.total_taxable_value + data.total_cgst + data.total_sgst
        if abs(calculated - data.total_amount) > TOLERANCE:
            errors.append(
                f"Total mismatch (intra-state): "
                f"taxable({data.total_taxable_value}) + cgst({data.total_cgst}) "
                f"+ sgst({data.total_sgst}) = {calculated}, expected {data.total_amount}"
            )

    # 7. Tax breakup consistency
    if data.tax_breakup:
        sum_taxable = sum(item.taxable_value for item in data.tax_breakup)
        if abs(sum_taxable - data.total_taxable_value) > TOLERANCE:
            errors.append(
                f"Tax breakup taxable sum ({sum_taxable}) doesn't match "
                f"total taxable value ({data.total_taxable_value})"
            )

        sum_cgst = sum(item.cgst_amount for item in data.tax_breakup)
        sum_sgst = sum(item.sgst_amount for item in data.tax_breakup)
        sum_igst = sum(item.igst_amount for item in data.tax_breakup)

        if abs(sum_cgst - data.total_cgst) > TOLERANCE:
            errors.append(
                f"Tax breakup CGST sum ({sum_cgst}) doesn't match "
                f"total CGST ({data.total_cgst})"
            )
        if abs(sum_sgst - data.total_sgst) > TOLERANCE:
            errors.append(
                f"Tax breakup SGST sum ({sum_sgst}) doesn't match "
                f"total SGST ({data.total_sgst})"
            )
        if abs(sum_igst - data.total_igst) > TOLERANCE:
            errors.append(
                f"Tax breakup IGST sum ({sum_igst}) doesn't match "
                f"total IGST ({data.total_igst})"
            )

        # Validate each breakup entry's internal math
        for i, item in enumerate(data.tax_breakup):
            expected_total = (
                item.taxable_value + item.cgst_amount + item.sgst_amount + item.igst_amount
            )
            if abs(expected_total - item.total_with_tax) > TOLERANCE:
                errors.append(
                    f"Tax breakup row {i+1} (rate {item.rate}%): "
                    f"calculated total {expected_total} != {item.total_with_tax}"
                )

    is_valid = len(errors) == 0
    return is_valid, errors
