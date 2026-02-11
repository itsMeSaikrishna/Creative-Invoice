from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks, Depends, Query
from fastapi.responses import PlainTextResponse
from typing import Optional, List

from app.api.dependencies import get_current_user
from app.models.schemas import InvoiceData
from app.services.pipeline import process_invoice
from app.services.output_service import generate_output
from app.services.storage_service import upload_pdf, delete_pdf
from app.database.crud import (
    create_invoice_record,
    update_invoice_status,
    save_invoice_data,
    save_invoice_error,
    get_invoice as db_get_invoice,
    list_invoices as db_list_invoices,
    delete_invoice as db_delete_invoice,
    check_invoice_quota,
)
from app.utils.helpers import validate_pdf_upload

router = APIRouter(prefix="/api/invoices", tags=["invoices"])


@router.post("/upload")
async def upload_invoice(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    buyer_gstin: Optional[str] = Form(default=None),
    user: dict = Depends(get_current_user),
):
    """Upload a PDF invoice for processing."""
    file_bytes = await file.read()
    user_id = user["user_id"]

    # Check quota
    quota = check_invoice_quota(user_id)
    if not quota["allowed"]:
        raise HTTPException(
            status_code=402,
            detail=f"Monthly invoice limit reached ({quota['used']}/{quota['limit']}). Upgrade to Pro for unlimited invoices.",
        )

    # Validate PDF
    is_valid, error_msg = validate_pdf_upload(file.filename, file_bytes)
    if not is_valid:
        raise HTTPException(status_code=400, detail=error_msg)

    # Upload to Supabase Storage
    storage_path = upload_pdf(user_id, file.filename, file_bytes)

    # Create DB record
    record = create_invoice_record(
        user_id=user_id,
        original_filename=file.filename,
        file_path=storage_path,
        buyer_gstin=buyer_gstin,
    )
    invoice_id = record["id"]

    # Process in background
    background_tasks.add_task(
        _process_in_background, invoice_id, file_bytes, buyer_gstin
    )

    return {
        "success": True,
        "invoice_id": invoice_id,
        "status": "processing",
    }


@router.post("/upload-batch")
async def upload_batch(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...),
    buyer_gstin: Optional[str] = Form(default=None),
    user: dict = Depends(get_current_user),
):
    """Upload multiple PDF invoices for processing (max 10)."""
    if len(files) > 10:
        raise HTTPException(status_code=400, detail="Maximum 10 files per batch")
    if len(files) == 0:
        raise HTTPException(status_code=400, detail="No files provided")

    user_id = user["user_id"]

    # Check quota for total files
    quota = check_invoice_quota(user_id)
    remaining = quota["limit"] - quota["used"]
    if not quota["allowed"]:
        raise HTTPException(
            status_code=402,
            detail=f"Monthly invoice limit reached ({quota['used']}/{quota['limit']}). Upgrade to Pro for unlimited invoices.",
        )
    if len(files) > remaining:
        raise HTTPException(
            status_code=402,
            detail=f"Not enough quota. {remaining} invoice(s) remaining this month, but {len(files)} files uploaded.",
        )

    results = []
    for f in files:
        file_bytes = await f.read()

        # Validate each PDF individually
        is_valid, error_msg = validate_pdf_upload(f.filename, file_bytes)
        if not is_valid:
            results.append({
                "filename": f.filename,
                "success": False,
                "error": error_msg,
                "invoice_id": None,
            })
            continue

        # Upload to Supabase Storage
        storage_path = upload_pdf(user_id, f.filename, file_bytes)

        # Create DB record
        record = create_invoice_record(
            user_id=user_id,
            original_filename=f.filename,
            file_path=storage_path,
            buyer_gstin=buyer_gstin,
        )
        invoice_id = record["id"]

        # Process in background
        background_tasks.add_task(
            _process_in_background, invoice_id, file_bytes, buyer_gstin
        )

        results.append({
            "filename": f.filename,
            "success": True,
            "error": None,
            "invoice_id": invoice_id,
        })

    accepted = sum(1 for r in results if r["success"])
    return {
        "success": accepted > 0,
        "results": results,
        "total": len(results),
        "accepted": accepted,
    }


async def _process_in_background(
    invoice_id: str, pdf_bytes: bytes, buyer_gstin: Optional[str]
):
    """Background task: OCR → LLM → Validation → save to DB."""
    update_invoice_status(invoice_id, "processing")

    result = await process_invoice(pdf_bytes, buyer_gstin, invoice_id)

    if result.status == "completed" and result.invoice_data:
        save_invoice_data(invoice_id, result.invoice_data, result.processing_time_ms or 0)
    else:
        save_invoice_error(invoice_id, result.error or {}, result.processing_time_ms or 0)


@router.get("")
async def list_invoices(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    status: Optional[str] = Query(default=None),
    from_date: Optional[str] = Query(default=None),
    to_date: Optional[str] = Query(default=None),
    user: dict = Depends(get_current_user),
):
    """List invoices with pagination and filters."""
    result = db_list_invoices(
        user_id=user["user_id"],
        page=page,
        limit=limit,
        status=status,
        from_date=from_date,
        to_date=to_date,
    )
    return {"success": True, **result}


@router.get("/{invoice_id}")
async def get_invoice(invoice_id: str, user: dict = Depends(get_current_user)):
    """Get invoice details and extracted data."""
    record = db_get_invoice(invoice_id, user["user_id"])
    if not record:
        raise HTTPException(status_code=404, detail="Invoice not found")

    return {
        "success": True,
        "invoice": record,
    }


@router.get("/{invoice_id}/download")
async def download_invoice(
    invoice_id: str,
    format: str = Query(default="json"),
    user: dict = Depends(get_current_user),
):
    """Download extracted data in specified format (json, xml, csv)."""
    record = db_get_invoice(invoice_id, user["user_id"])
    if not record:
        raise HTTPException(status_code=404, detail="Invoice not found")

    if record["status"] != "completed":
        raise HTTPException(
            status_code=400,
            detail=f"Invoice not ready. Status: {record['status']}",
        )

    # Reconstruct InvoiceData from DB record
    invoice_data = InvoiceData(
        seller_name=record["seller_name"],
        seller_gstin=record["seller_gstin"],
        buyer_gstin=record.get("buyer_gstin"),
        bill_no=record["bill_no"],
        bill_date=record["bill_date"],
        tax_breakup=record.get("tax_breakup", []),
        total_taxable_value=record["total_taxable_value"],
        total_cgst=record["total_cgst"],
        total_sgst=record["total_sgst"],
        total_igst=record["total_igst"],
        total_quantity=record.get("total_quantity", 0),
        total_amount=record["total_amount"],
        validation_passed=record.get("validation_passed", False),
        validation_errors=record.get("validation_errors", []),
    )

    content_types = {
        "json": "application/json",
        "xml": "application/xml",
        "csv": "text/csv",
    }
    if format not in content_types:
        raise HTTPException(status_code=400, detail="Format must be json, xml, or csv")

    output = generate_output(invoice_data, format)
    return PlainTextResponse(
        content=output,
        media_type=content_types[format],
        headers={
            "Content-Disposition": f'attachment; filename="invoice_{invoice_id}.{format}"'
        },
    )


@router.delete("/{invoice_id}")
async def remove_invoice(invoice_id: str, user: dict = Depends(get_current_user)):
    """Delete an invoice and its stored PDF."""
    record = db_get_invoice(invoice_id, user["user_id"])
    if not record:
        raise HTTPException(status_code=404, detail="Invoice not found")

    # Delete PDF from storage
    if record.get("file_path"):
        try:
            delete_pdf(record["file_path"])
        except Exception:
            pass  # Storage deletion is best-effort

    # Delete DB record
    db_delete_invoice(invoice_id, user["user_id"])
    return {"success": True, "message": "Invoice deleted"}
