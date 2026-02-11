import { useState, useCallback } from 'react'
import api from '../lib/api'
import type { InvoiceData, InvoiceRecord, ProcessingResult, OutputFormat, BatchUploadResult } from '../types/invoice'

interface UseInvoiceProcessorReturn {
  uploading: boolean
  processing: boolean
  result: ProcessingResult | null
  error: string | null
  uploadInvoice: (file: File, buyerGstin?: string) => Promise<string | null>
  uploadBatch: (files: File[], buyerGstin?: string) => Promise<BatchUploadResult | null>
  pollStatus: (invoiceId: string) => Promise<ProcessingResult | null>
  downloadInvoice: (invoiceId: string, format: OutputFormat) => Promise<void>
  listInvoices: (page?: number, limit?: number) => Promise<{ invoices: InvoiceRecord[]; total: number }>
  deleteInvoice: (invoiceId: string) => Promise<void>
  reset: () => void
}

function mapInvoiceToResult(invoice: Record<string, unknown>): ProcessingResult {
  const status = invoice.status as ProcessingResult['status']

  let invoiceData: InvoiceData | null = null
  if (status === 'completed' && invoice.seller_name) {
    invoiceData = {
      seller_name: invoice.seller_name as string,
      seller_gstin: invoice.seller_gstin as string,
      buyer_gstin: (invoice.buyer_gstin as string) || null,
      bill_no: invoice.bill_no as string,
      bill_date: invoice.bill_date as string,
      tax_breakup: (invoice.tax_breakup as InvoiceData['tax_breakup']) || [],
      total_taxable_value: invoice.total_taxable_value as number,
      total_cgst: invoice.total_cgst as number,
      total_sgst: invoice.total_sgst as number,
      total_igst: invoice.total_igst as number,
      total_quantity: (invoice.total_quantity as number) || 0,
      total_amount: invoice.total_amount as number,
      validation_passed: invoice.validation_passed as boolean,
      validation_errors: (invoice.validation_errors as string[]) || [],
    }
  }

  let error: ProcessingResult['error'] = null
  if (status === 'failed') {
    const errors = invoice.validation_errors as string[] | null
    error = {
      message: errors?.[0] || 'Processing failed',
      details: errors?.join(', '),
    }
  }

  return {
    invoice_id: invoice.id as string,
    status,
    invoice_data: invoiceData,
    error,
    processing_time_ms: (invoice.processing_time_ms as number) || null,
  }
}

export function useInvoiceProcessor(): UseInvoiceProcessorReturn {
  const [uploading, setUploading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<ProcessingResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const uploadInvoice = useCallback(async (file: File, buyerGstin?: string) => {
    setUploading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      if (buyerGstin) formData.append('buyer_gstin', buyerGstin)

      const response = await api.post('/api/invoices/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setUploading(false)
      setProcessing(true)
      return response.data.invoice_id as string
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: { detail?: string } }; message?: string }
      if (axiosErr.response?.status === 402) {
        setError(axiosErr.response.data?.detail || 'Monthly invoice limit reached. Upgrade to Pro for unlimited invoices.')
      } else {
        setError(axiosErr.message || 'Upload failed')
      }
      setUploading(false)
      return null
    }
  }, [])

  const uploadBatch = useCallback(async (files: File[], buyerGstin?: string): Promise<BatchUploadResult | null> => {
    setUploading(true)
    setError(null)
    try {
      const formData = new FormData()
      files.forEach((file) => formData.append('files', file))
      if (buyerGstin) formData.append('buyer_gstin', buyerGstin)

      const response = await api.post('/api/invoices/upload-batch', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setUploading(false)
      setProcessing(true)
      return response.data as BatchUploadResult
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: { detail?: string } }; message?: string }
      if (axiosErr.response?.status === 402) {
        setError(axiosErr.response.data?.detail || 'Monthly invoice limit reached. Upgrade to Pro for unlimited invoices.')
      } else {
        setError(axiosErr.message || 'Upload failed')
      }
      setUploading(false)
      return null
    }
  }, [])

  const pollStatus = useCallback(async (invoiceId: string) => {
    try {
      const response = await api.get(`/api/invoices/${invoiceId}`)
      // Backend returns { success: true, invoice: { ...dbRecord } }
      const invoice = response.data.invoice as Record<string, unknown>
      const mapped = mapInvoiceToResult(invoice)
      setResult(mapped)
      if (mapped.status === 'completed' || mapped.status === 'failed') {
        setProcessing(false)
      }
      return mapped
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch status'
      setError(message)
      setProcessing(false)
      return null
    }
  }, [])

  const downloadInvoice = useCallback(async (invoiceId: string, format: OutputFormat) => {
    const response = await api.get(`/api/invoices/${invoiceId}/download`, {
      params: { format },
      responseType: 'blob',
    })
    const blob = new Blob([response.data])
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    const ext = format === 'xml' ? 'xml' : format === 'csv' ? 'csv' : 'json'
    link.download = `invoice_${invoiceId}.${ext}`
    link.click()
    window.URL.revokeObjectURL(url)
  }, [])

  const listInvoices = useCallback(async (page = 1, limit = 10) => {
    const response = await api.get('/api/invoices', { params: { page, limit } })
    // Backend returns { success: true, invoices: [...], total: N, page, limit }
    return {
      invoices: response.data.invoices as InvoiceRecord[],
      total: response.data.total as number,
    }
  }, [])

  const deleteInvoice = useCallback(async (invoiceId: string) => {
    await api.delete(`/api/invoices/${invoiceId}`)
  }, [])

  const reset = useCallback(() => {
    setUploading(false)
    setProcessing(false)
    setResult(null)
    setError(null)
  }, [])

  return { uploading, processing, result, error, uploadInvoice, uploadBatch, pollStatus, downloadInvoice, listInvoices, deleteInvoice, reset }
}
