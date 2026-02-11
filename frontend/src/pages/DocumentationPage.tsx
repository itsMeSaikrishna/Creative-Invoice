import { useState } from 'react'
import { motion } from 'framer-motion'

const sections = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    content: `
## Getting Started

Creative Invoice is an AI-powered GST invoice data extraction tool. Upload a PDF invoice and get structured data in seconds.

### Quick Start
1. **Sign up** for a free account
2. **Upload** a GST invoice PDF
3. **Review** the extracted data
4. **Download** in your preferred format (JSON, XML, CSV)

### Supported Invoices
- Indian GST invoices (B2B)
- PDF format (scanned or digital)
- Maximum file size: 10MB
    `.trim(),
  },
  {
    id: 'api-reference',
    title: 'API Reference',
    content: `
## API Reference

### Authentication
All API requests require a Bearer token in the Authorization header.

\`\`\`
Authorization: Bearer <your-access-token>
\`\`\`

### Endpoints

#### Upload Invoice
\`\`\`
POST /api/invoices/upload
Content-Type: multipart/form-data

Parameters:
- file: PDF file (required)
- buyer_gstin: string (optional)
\`\`\`

#### List Invoices
\`\`\`
GET /api/invoices?page=1&limit=10
\`\`\`

#### Get Invoice
\`\`\`
GET /api/invoices/{invoice_id}
\`\`\`

#### Download Invoice
\`\`\`
GET /api/invoices/{invoice_id}/download?format=json
Formats: json, xml, csv
\`\`\`

#### Delete Invoice
\`\`\`
DELETE /api/invoices/{invoice_id}
\`\`\`
    `.trim(),
  },
  {
    id: 'data-format',
    title: 'Data Format',
    content: `
## Data Format

### Extracted Fields

| Field | Type | Description |
|-------|------|-------------|
| seller_name | string | Name of the seller |
| seller_gstin | string | 15-character GSTIN |
| buyer_gstin | string | Buyer's GSTIN (if found) |
| bill_no | string | Invoice number |
| bill_date | string | Date in YYYY-MM-DD format |
| tax_breakup | array | Tax details per rate |
| total_amount | number | Grand total |
| validation_passed | boolean | Whether validation checks passed |

### Tax Breakup Object
Each entry in the tax_breakup array contains:
- **rate**: Tax rate percentage (e.g., 18)
- **taxable_value**: Taxable amount for this rate
- **cgst_amount**: CGST amount
- **sgst_amount**: SGST amount
- **igst_amount**: IGST amount
- **total_with_tax**: Total including tax

### Export Formats

**JSON** — Structured JSON with metadata, amounts, and tax breakup.

**Tally XML** — Purchase voucher format compatible with Tally ERP import.

**CSV** — Flat format with header row and one row per tax rate breakup.
    `.trim(),
  },
  {
    id: 'validation',
    title: 'Validation Rules',
    content: `
## Validation Rules

The system automatically validates extracted data against these rules:

### Required Fields
- Seller name must not be empty
- Seller GSTIN must be present and valid
- Bill number must not be empty
- Bill date must be in YYYY-MM-DD format
- Total amount must be greater than 0

### GSTIN Validation
- Must be exactly 15 characters
- Format: 2 digits + 5 chars + 4 digits + 1 char + 1 digit + 1 char + 1 alphanum

### Tax Validation
- CGST/SGST and IGST are mutually exclusive
- For intra-state: CGST must equal SGST (within ₹0.01)
- Total = Taxable Value + CGST + SGST + IGST (within ₹0.50)
- Tax breakup rows must sum to invoice totals
    `.trim(),
  },
]

export function DocumentationPage() {
  const [activeSection, setActiveSection] = useState(sections[0].id)

  const currentSection = sections.find((s) => s.id === activeSection) ?? sections[0]

  return (
    <div className="py-16">
      <div className="mx-auto max-w-7xl px-6">
        <h1 className="mb-12 text-3xl font-bold">Documentation</h1>

        <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
          <nav className="space-y-1">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full rounded-lg px-4 py-2 text-left text-sm font-medium transition-colors cursor-pointer ${
                  activeSection === section.id
                    ? 'bg-primary-500/20 text-primary-400'
                    : 'text-white/50 hover:bg-white/5 hover:text-white/80'
                }`}
              >
                {section.title}
              </button>
            ))}
          </nav>

          <motion.div
            key={activeSection}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass rounded-2xl p-8"
          >
            <div className="prose prose-invert max-w-none">
              {currentSection.content.split('\n').map((line, i) => {
                if (line.startsWith('## ')) return <h2 key={i} className="mb-4 text-2xl font-bold">{line.slice(3)}</h2>
                if (line.startsWith('### ')) return <h3 key={i} className="mb-3 mt-6 text-lg font-semibold text-white/90">{line.slice(4)}</h3>
                if (line.startsWith('#### ')) return <h4 key={i} className="mb-2 mt-4 font-semibold text-accent-400">{line.slice(5)}</h4>
                if (line.startsWith('```')) return null
                if (line.startsWith('|')) {
                  return <div key={i} className="font-mono text-xs text-white/60">{line}</div>
                }
                if (line.startsWith('- ')) return <li key={i} className="ml-4 text-sm text-white/60">{line.slice(2)}</li>
                if (line.match(/^\d+\./)) return <li key={i} className="ml-4 text-sm text-white/60">{line}</li>
                if (line.trim() === '') return <br key={i} />
                return <p key={i} className="mb-2 text-sm text-white/60">{line}</p>
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
