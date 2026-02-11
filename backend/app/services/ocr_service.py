from google.cloud import documentai_v1 as documentai
from app.config import get_settings
from app.models.schemas import OCRResult


async def extract_text_with_document_ai(pdf_bytes: bytes) -> OCRResult:
    """
    Send PDF to Google Document AI for OCR + structure analysis.
    Returns structured OCR output with full text, tables, and key-value pairs.
    """
    settings = get_settings()

    client = documentai.DocumentProcessorServiceClient()

    resource_name = client.processor_path(
        settings.google_project_id,
        settings.google_location,
        settings.google_processor_id,
    )

    raw_document = documentai.RawDocument(
        content=pdf_bytes,
        mime_type="application/pdf",
    )

    request = documentai.ProcessRequest(
        name=resource_name,
        raw_document=raw_document,
    )

    result = client.process_document(request=request)
    document = result.document

    # Extract full text
    full_text = document.text

    # Extract text blocks with bounding boxes
    blocks = []
    for page in document.pages:
        for block in page.blocks:
            block_text = _get_text_from_layout(block.layout, document.text)
            blocks.append({
                "text": block_text,
                "confidence": block.layout.confidence,
            })

    # Extract tables
    tables = []
    for page in document.pages:
        for table in page.tables:
            header_rows = []
            for header_row in table.header_rows:
                cells = []
                for cell in header_row.cells:
                    cell_text = _get_text_from_layout(cell.layout, document.text)
                    cells.append(cell_text.strip())
                header_rows.append(cells)

            body_rows = []
            for body_row in table.body_rows:
                cells = []
                for cell in body_row.cells:
                    cell_text = _get_text_from_layout(cell.layout, document.text)
                    cells.append(cell_text.strip())
                body_rows.append(cells)

            tables.append({
                "headers": header_rows,
                "rows": body_rows,
            })

    # Extract key-value pairs (form fields)
    key_value_pairs = []
    for page in document.pages:
        for field in page.form_fields:
            field_name = _get_text_from_layout(field.field_name, document.text)
            field_value = _get_text_from_layout(field.field_value, document.text)
            key_value_pairs.append({
                "key": field_name.strip(),
                "value": field_value.strip(),
                "confidence": field.field_name.confidence,
            })

    # Average confidence across pages
    avg_confidence = 0.0
    if document.pages:
        confidences = []
        for page in document.pages:
            for block in page.blocks:
                if block.layout.confidence:
                    confidences.append(block.layout.confidence)
        if confidences:
            avg_confidence = sum(confidences) / len(confidences)

    return OCRResult(
        full_text=full_text,
        blocks=blocks,
        tables=tables,
        key_value_pairs=key_value_pairs,
        confidence=avg_confidence,
    )


def _get_text_from_layout(layout, full_text: str) -> str:
    """Extract text from a Document AI layout element using text anchors."""
    if not layout.text_anchor or not layout.text_anchor.text_segments:
        return ""
    text = ""
    for segment in layout.text_anchor.text_segments:
        start = int(segment.start_index) if segment.start_index else 0
        end = int(segment.end_index)
        text += full_text[start:end]
    return text
