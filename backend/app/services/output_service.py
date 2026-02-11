import json
import csv
from io import StringIO
from xml.sax.saxutils import escape
from app.models.schemas import InvoiceData


def generate_json_output(data: InvoiceData) -> str:
    """Generate clean JSON format for API consumption."""
    output = {
        "invoice_metadata": {
            "seller_name": data.seller_name,
            "seller_gstin": data.seller_gstin,
            "buyer_gstin": data.buyer_gstin,
            "bill_no": data.bill_no,
            "bill_date": data.bill_date,
        },
        "amounts": {
            "total_taxable_value": data.total_taxable_value,
            "total_cgst": data.total_cgst,
            "total_sgst": data.total_sgst,
            "total_igst": data.total_igst,
            "total_quantity": data.total_quantity,
            "total_amount": data.total_amount,
        },
        "tax_breakup": [item.model_dump() for item in data.tax_breakup],
        "validation": {
            "passed": data.validation_passed,
            "errors": data.validation_errors,
        },
    }
    return json.dumps(output, indent=2, ensure_ascii=False)


def generate_tally_xml(data: InvoiceData) -> str:
    """Generate Tally-compatible XML for purchase voucher import."""
    # Format date as YYYYMMDD for Tally
    tally_date = data.bill_date.replace("-", "")

    # Build tax ledger entries
    tax_entries = ""
    for item in data.tax_breakup:
        if item.cgst_amount > 0:
            tax_entries += f"""
                        <ALLLEDGERENTRIES.LIST>
                            <LEDGERNAME>Input CGST @ {item.rate / 2:.0f}%</LEDGERNAME>
                            <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                            <AMOUNT>-{item.cgst_amount:.2f}</AMOUNT>
                        </ALLLEDGERENTRIES.LIST>
                        <ALLLEDGERENTRIES.LIST>
                            <LEDGERNAME>Input SGST @ {item.rate / 2:.0f}%</LEDGERNAME>
                            <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                            <AMOUNT>-{item.sgst_amount:.2f}</AMOUNT>
                        </ALLLEDGERENTRIES.LIST>"""
        if item.igst_amount > 0:
            tax_entries += f"""
                        <ALLLEDGERENTRIES.LIST>
                            <LEDGERNAME>Input IGST @ {item.rate:.0f}%</LEDGERNAME>
                            <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                            <AMOUNT>-{item.igst_amount:.2f}</AMOUNT>
                        </ALLLEDGERENTRIES.LIST>"""

    xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
    <HEADER>
        <TALLYREQUEST>Import Data</TALLYREQUEST>
    </HEADER>
    <BODY>
        <IMPORTDATA>
            <REQUESTDESC>
                <REPORTNAME>Vouchers</REPORTNAME>
            </REQUESTDESC>
            <REQUESTDATA>
                <TALLYMESSAGE xmlns:UDF="TallyUDF">
                    <VOUCHER VCHTYPE="Purchase" ACTION="Create">
                        <DATE>{tally_date}</DATE>
                        <VOUCHERTYPENAME>Purchase</VOUCHERTYPENAME>
                        <VOUCHERNUMBER>{escape(data.bill_no)}</VOUCHERNUMBER>
                        <PARTYLEDGERNAME>{escape(data.seller_name)}</PARTYLEDGERNAME>
                        <PARTYGSTIN>{escape(data.seller_gstin)}</PARTYGSTIN>
                        <ALLLEDGERENTRIES.LIST>
                            <LEDGERNAME>{escape(data.seller_name)}</LEDGERNAME>
                            <GSTCLASS/>
                            <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                            <AMOUNT>{data.total_amount:.2f}</AMOUNT>
                        </ALLLEDGERENTRIES.LIST>{tax_entries}
                        <ALLLEDGERENTRIES.LIST>
                            <LEDGERNAME>Purchase</LEDGERNAME>
                            <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                            <AMOUNT>-{data.total_taxable_value:.2f}</AMOUNT>
                        </ALLLEDGERENTRIES.LIST>
                    </VOUCHER>
                </TALLYMESSAGE>
            </REQUESTDATA>
        </IMPORTDATA>
    </BODY>
</ENVELOPE>"""
    return xml


def generate_csv_output(data: InvoiceData) -> str:
    """Generate flat CSV format for spreadsheet import."""
    output = StringIO()
    writer = csv.writer(output)

    # Main invoice row
    writer.writerow([
        "Bill No", "Bill Date", "Seller Name", "Seller GSTIN",
        "Buyer GSTIN", "Total Taxable Value", "Total CGST",
        "Total SGST", "Total IGST", "Total Quantity", "Total Amount",
    ])
    writer.writerow([
        data.bill_no,
        data.bill_date,
        data.seller_name,
        data.seller_gstin,
        data.buyer_gstin or "",
        data.total_taxable_value,
        data.total_cgst,
        data.total_sgst,
        data.total_igst,
        data.total_quantity,
        data.total_amount,
    ])

    # Tax breakup section
    writer.writerow([])
    writer.writerow(["Tax Breakup"])
    writer.writerow(["Rate %", "Taxable Value", "CGST", "SGST", "IGST", "Total with Tax"])
    for item in data.tax_breakup:
        writer.writerow([
            item.rate,
            item.taxable_value,
            item.cgst_amount,
            item.sgst_amount,
            item.igst_amount,
            item.total_with_tax,
        ])

    return output.getvalue()


def generate_output(data: InvoiceData, format: str = "json") -> str:
    """Generate output in the requested format."""
    formatters = {
        "json": generate_json_output,
        "xml": generate_tally_xml,
        "csv": generate_csv_output,
    }
    formatter = formatters.get(format.lower())
    if not formatter:
        raise ValueError(f"Unsupported format: {format}. Use json, xml, or csv.")
    return formatter(data)
