import json
from groq import Groq
from app.config import get_settings
from app.models.schemas import InvoiceData, OCRResult


EXTRACTION_PROMPT = """You are an expert invoice data extraction system. Extract the following information from the OCR text of an Indian GST invoice.

OCR TEXT:
{ocr_full_text}

BUYER GSTIN HINT (if provided): {buyer_gstin_hint}

EXTRACTION REQUIREMENTS:

1. seller_name: Company name at the top of invoice (from header/letterhead)
2. seller_gstin: 15-character GST number (format: ##AAAAA####A#Z#)
3. buyer_gstin: Customer's GST number (look for "To:", "Customer:", "Bill To:", "Buyer")
   - If hint provided above, verify it matches what's on the invoice
   - If not found, return null
4. bill_no: Invoice/Bill number (look for "Bill #", "Invoice No", "Inv. No.", "B2B-", etc.)
5. bill_date: Date in YYYY-MM-DD format (convert from any format like DD/MM/YYYY, DD-Mon-YY, etc.)
6. tax_breakup: Array of tax rate groups. For EACH distinct GST rate on the invoice, create an entry:
   [
     {{
       "rate": 18,
       "taxable_value": 3587.04,
       "cgst_amount": 322.83,
       "sgst_amount": 322.83,
       "igst_amount": 0,
       "total_with_tax": 4232.70
     }}
   ]
   Note: total_with_tax = taxable_value + cgst_amount + sgst_amount + igst_amount
7. total_taxable_value: Sum of all taxable values (before tax)
8. total_cgst: Total CGST amount
9. total_sgst: Total SGST amount (should equal CGST for intra-state)
10. total_igst: Total IGST amount (for inter-state, mutually exclusive with CGST/SGST)
11. total_quantity: Sum of all item quantities
12. total_amount: Final invoice amount (net amount payable)

VALIDATION RULES (apply these checks):
- Verify: total_taxable_value + total_cgst + total_sgst = total_amount (if intra-state, i.e. IGST=0)
- Verify: total_taxable_value + total_igst = total_amount (if inter-state)
- Verify: total_cgst == total_sgst (for intra-state transactions)
- Never have both (CGST+SGST) and IGST non-zero
- Small rounding differences (<=0.10) are acceptable

Return ONLY valid JSON matching this exact schema. No explanation, no markdown, just the JSON:
{{
  "seller_name": "string",
  "seller_gstin": "string",
  "buyer_gstin": "string or null",
  "bill_no": "string",
  "bill_date": "YYYY-MM-DD",
  "tax_breakup": [
    {{
      "rate": float,
      "taxable_value": float,
      "cgst_amount": float,
      "sgst_amount": float,
      "igst_amount": float,
      "total_with_tax": float
    }}
  ],
  "total_taxable_value": float,
  "total_cgst": float,
  "total_sgst": float,
  "total_igst": float,
  "total_quantity": float,
  "total_amount": float,
  "validation_passed": boolean,
  "validation_errors": ["string"]
}}"""


async def extract_invoice_data(
    ocr_output: OCRResult,
    buyer_gstin_hint: str | None = None,
) -> InvoiceData:
    """
    Send OCR text to Groq LLM for structured data extraction.
    Uses llama-3.1-70b-versatile with low temperature for consistency.
    """
    settings = get_settings()

    client = Groq(api_key=settings.groq_api_key)

    prompt = EXTRACTION_PROMPT.format(
        ocr_full_text=ocr_output.full_text,
        buyer_gstin_hint=buyer_gstin_hint or "Not provided",
    )

    chat_completion = client.chat.completions.create(
        messages=[
            {
                "role": "system",
                "content": "You are a precise invoice data extraction assistant. Always return valid JSON only.",
            },
            {
                "role": "user",
                "content": prompt,
            },
        ],
        model=settings.groq_model,
        temperature=settings.groq_temperature,
        max_tokens=settings.groq_max_tokens,
        response_format={"type": "json_object"},
    )

    response_text = chat_completion.choices[0].message.content

    raw_data = json.loads(response_text)

    invoice = InvoiceData(**raw_data)

    return invoice
