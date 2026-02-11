export interface TaxBreakup {
  rate: number
  taxable_value: number
  cgst_amount: number
  sgst_amount: number
  igst_amount: number
  total_with_tax: number
}

export interface InvoiceData {
  seller_name: string
  seller_gstin: string
  buyer_gstin: string | null
  bill_no: string
  bill_date: string
  tax_breakup: TaxBreakup[]
  total_taxable_value: number
  total_cgst: number
  total_sgst: number
  total_igst: number
  total_quantity: number
  total_amount: number
  validation_passed: boolean
  validation_errors: string[]
}

export interface ProcessingResult {
  invoice_id: string | null
  status: 'pending' | 'processing' | 'completed' | 'failed'
  invoice_data: InvoiceData | null
  error: { message: string; details?: string } | null
  processing_time_ms: number | null
}

export interface InvoiceRecord {
  id: string
  user_id: string
  original_filename: string
  storage_path: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  seller_name: string | null
  seller_gstin: string | null
  buyer_gstin: string | null
  bill_no: string | null
  bill_date: string | null
  total_amount: number | null
  validation_passed: boolean | null
  created_at: string
  updated_at: string
}

export type OutputFormat = 'json' | 'xml' | 'csv'

export interface SubscriptionInfo {
  plan: 'free' | 'pro'
  usage: {
    used: number
    limit: number
    allowed: boolean
  }
  subscription: {
    status: 'active' | 'cancelled' | 'expired'
    started_at: string | null
    expires_at: string | null
  }
}

export interface BatchUploadResult {
  success: boolean
  results: {
    filename: string
    success: boolean
    error: string | null
    invoice_id: string | null
  }[]
  total: number
  accepted: number
}
