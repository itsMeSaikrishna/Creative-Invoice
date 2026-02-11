import time
import structlog
from app.models.schemas import OCRResult, ProcessingResult
from app.services.ocr_service import extract_text_with_document_ai
from app.services.extraction_service import extract_invoice_data
from app.services.validation_service import validate_invoice_data

logger = structlog.get_logger()


async def process_invoice(
    pdf_bytes: bytes,
    buyer_gstin_hint: str | None = None,
    invoice_id: str | None = None,
) -> ProcessingResult:
    """
    Full invoice processing pipeline:
    1. OCR via Google Document AI
    2. LLM extraction via Groq
    3. Validation
    4. Return structured result
    """
    start_time = time.time()

    try:
        # Step 1: OCR via Google Document AI
        ocr_result = await extract_text_with_document_ai(pdf_bytes)

        if not ocr_result.full_text.strip():
            return ProcessingResult(
                invoice_id=invoice_id,
                status="failed",
                error={
                    "code": "OCR_EMPTY",
                    "message": "OCR returned empty text. The PDF may be unreadable.",
                    "details": {"stage": "ocr", "confidence": ocr_result.confidence},
                },
            )

        # Step 2: LLM Extraction via Groq
        invoice_data = await extract_invoice_data(ocr_result, buyer_gstin_hint)

        # Step 3: Validation
        is_valid, errors = validate_invoice_data(invoice_data)
        invoice_data.validation_passed = is_valid
        invoice_data.validation_errors = errors

        elapsed_ms = int((time.time() - start_time) * 1000)

        logger.info(
            "invoice_processed",
            invoice_id=invoice_id,
            seller=invoice_data.seller_name,
            validation_passed=is_valid,
            processing_time_ms=elapsed_ms,
        )

        return ProcessingResult(
            invoice_id=invoice_id,
            status="completed",
            invoice_data=invoice_data,
            processing_time_ms=elapsed_ms,
        )

    except Exception as e:
        elapsed_ms = int((time.time() - start_time) * 1000)
        logger.error(
            "invoice_processing_failed",
            invoice_id=invoice_id,
            error=str(e),
            error_type=type(e).__name__,
        )
        return ProcessingResult(
            invoice_id=invoice_id,
            status="failed",
            error={
                "code": "PROCESSING_ERROR",
                "message": str(e),
                "details": {"stage": "pipeline", "type": type(e).__name__},
            },
            processing_time_ms=elapsed_ms,
        )


async def process_invoice_from_ocr_text(
    ocr_text: str,
    buyer_gstin_hint: str | None = None,
    invoice_id: str | None = None,
) -> ProcessingResult:
    """
    Process invoice when OCR text is already available (skip OCR step).
    Useful for testing with pre-extracted text.
    """
    start_time = time.time()

    try:
        ocr_result = OCRResult(full_text=ocr_text)

        invoice_data = await extract_invoice_data(ocr_result, buyer_gstin_hint)

        is_valid, errors = validate_invoice_data(invoice_data)
        invoice_data.validation_passed = is_valid
        invoice_data.validation_errors = errors

        elapsed_ms = int((time.time() - start_time) * 1000)

        return ProcessingResult(
            invoice_id=invoice_id,
            status="completed",
            invoice_data=invoice_data,
            processing_time_ms=elapsed_ms,
        )

    except Exception as e:
        elapsed_ms = int((time.time() - start_time) * 1000)
        return ProcessingResult(
            invoice_id=invoice_id,
            status="failed",
            error={
                "code": "EXTRACTION_ERROR",
                "message": str(e),
                "details": {"stage": "extraction", "type": type(e).__name__},
            },
            processing_time_ms=elapsed_ms,
        )
