from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import date
import re


class TaxBreakup(BaseModel):
    rate: float = Field(..., description="Tax rate percentage (e.g., 18, 28)")
    taxable_value: float = Field(..., description="Taxable amount for this rate group")
    cgst_amount: float = Field(default=0.0, description="CGST amount")
    sgst_amount: float = Field(default=0.0, description="SGST amount")
    igst_amount: float = Field(default=0.0, description="IGST amount")
    total_with_tax: float = Field(..., description="Total including tax for this group")


class InvoiceData(BaseModel):
    seller_name: str = Field(..., description="Company name from invoice header")
    seller_gstin: str = Field(..., description="Seller's 15-char GST number")
    buyer_gstin: Optional[str] = Field(default=None, description="Buyer's GST number")
    bill_no: str = Field(..., description="Invoice/Bill number")
    bill_date: str = Field(..., description="Bill date in YYYY-MM-DD format")
    tax_breakup: list[TaxBreakup] = Field(default_factory=list)
    total_taxable_value: float = Field(..., description="Sum before tax")
    total_cgst: float = Field(default=0.0)
    total_sgst: float = Field(default=0.0)
    total_igst: float = Field(default=0.0)
    total_quantity: float = Field(default=0.0)
    total_amount: float = Field(..., description="Final invoice amount")
    validation_passed: bool = Field(default=False)
    validation_errors: list[str] = Field(default_factory=list)

    @field_validator("seller_gstin", "buyer_gstin", mode="before")
    @classmethod
    def clean_gstin(cls, v: Optional[str]) -> Optional[str]:
        if v is None or v == "":
            return None
        return v.strip().upper()

    @field_validator("bill_date", mode="before")
    @classmethod
    def normalize_date(cls, v: str) -> str:
        if not v:
            return v
        v = v.strip()
        # Already YYYY-MM-DD
        if re.match(r"^\d{4}-\d{2}-\d{2}$", v):
            return v
        # DD/MM/YYYY or DD-MM-YYYY
        m = re.match(r"^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$", v)
        if m:
            day, month, year = m.groups()
            return f"{year}-{month.zfill(2)}-{day.zfill(2)}"
        return v


class OCRResult(BaseModel):
    full_text: str = ""
    blocks: list[dict] = Field(default_factory=list)
    tables: list[dict] = Field(default_factory=list)
    key_value_pairs: list[dict] = Field(default_factory=list)
    confidence: float = 0.0


class ProcessingResult(BaseModel):
    invoice_id: Optional[str] = None
    status: str = "pending"  # pending, processing, completed, failed
    invoice_data: Optional[InvoiceData] = None
    error: Optional[dict] = None
    processing_time_ms: Optional[int] = None


class InvoiceUploadRequest(BaseModel):
    buyer_gstin: Optional[str] = None


class InvoiceResponse(BaseModel):
    success: bool
    invoice_id: Optional[str] = None
    status: str = "processing"
    data: Optional[dict] = None
    error: Optional[dict] = None


class ErrorResponse(BaseModel):
    success: bool = False
    error: dict
    invoice_id: Optional[str] = None
    partial_data: Optional[dict] = None
