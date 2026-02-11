import { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { useInvoiceProcessor } from '../hooks/useInvoiceProcessor'
import { useSubscription } from '../hooks/useSubscription'
import { FileUploader } from '../components/features/FileUploader'
import { ProcessingStatus } from '../components/features/ProcessingStatus'
import { ExtractionResults } from '../components/features/ExtractionResults'
import { UpgradeModal } from '../components/features/UpgradeModal'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import type { OutputFormat, ProcessingResult } from '../types/invoice'

export function UploadPage() {
  const { uploading, processing, result, error, uploadInvoice, uploadBatch, pollStatus, downloadInvoice, reset } = useInvoiceProcessor()
  const { subscription } = useSubscription()
  const [files, setFiles] = useState<File[]>([])
  const [buyerGstin, setBuyerGstin] = useState('')
  const [showUpgrade, setShowUpgrade] = useState(false)

  // Single file mode
  const [invoiceId, setInvoiceId] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Batch mode
  const [processingIds, setProcessingIds] = useState<string[]>([])
  const [completedResults, setCompletedResults] = useState<Map<string, ProcessingResult>>(new Map())
  const batchPollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const isBatch = files.length > 1

  const handleUpload = async () => {
    if (files.length === 0) return

    // Check quota on frontend before uploading
    if (subscription && !subscription.usage.allowed) {
      setShowUpgrade(true)
      return
    }

    if (files.length === 1) {
      // Single file - existing endpoint
      const id = await uploadInvoice(files[0], buyerGstin || undefined)
      if (id) setInvoiceId(id)
    } else {
      // Batch upload
      const batchResult = await uploadBatch(files, buyerGstin || undefined)
      if (batchResult) {
        const ids = batchResult.results
          .filter((r) => r.success && r.invoice_id)
          .map((r) => r.invoice_id!)
        setProcessingIds(ids)
      }
    }
  }

  // Single file polling
  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }, [])

  useEffect(() => {
    if (processing && invoiceId && !isBatch) {
      pollRef.current = setInterval(() => pollStatus(invoiceId), 2000)
    }
    return stopPolling
  }, [processing, invoiceId, isBatch, pollStatus, stopPolling])

  useEffect(() => {
    if (result?.status === 'completed' || result?.status === 'failed') {
      stopPolling()
    }
  }, [result, stopPolling])

  // Batch polling
  const stopBatchPolling = useCallback(() => {
    if (batchPollRef.current) {
      clearInterval(batchPollRef.current)
      batchPollRef.current = null
    }
  }, [])

  useEffect(() => {
    if (processingIds.length === 0) {
      stopBatchPolling()
      return
    }

    batchPollRef.current = setInterval(async () => {
      const stillProcessing: string[] = []

      for (const id of processingIds) {
        if (completedResults.has(id)) continue
        try {
          const res = await pollStatus(id)
          if (res && (res.status === 'completed' || res.status === 'failed')) {
            setCompletedResults((prev) => new Map(prev).set(id, res))
          } else {
            stillProcessing.push(id)
          }
        } catch {
          stillProcessing.push(id)
        }
      }

      if (stillProcessing.length === 0) {
        setProcessingIds([])
      }
    }, 2500)

    return stopBatchPolling
  }, [processingIds, completedResults, pollStatus, stopBatchPolling])

  const handleDownload = (id: string) => (format: OutputFormat) => {
    downloadInvoice(id, format)
  }

  const handleReset = () => {
    stopPolling()
    stopBatchPolling()
    reset()
    setFiles([])
    setBuyerGstin('')
    setInvoiceId(null)
    setProcessingIds([])
    setCompletedResults(new Map())
  }

  const isProcessing = uploading || processing || processingIds.length > 0
  const hasResults = result || completedResults.size > 0 || error
  const batchDone = isBatch && processingIds.length === 0 && completedResults.size > 0

  return (
    <div className="mx-auto max-w-3xl space-y-8 py-8">
      <div>
        <h1 className="text-2xl font-bold">Upload Invoice</h1>
        <p className="text-white/50">Upload GST invoice PDFs for AI-powered data extraction.</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <FileUploader
          files={files}
          onFilesSelect={setFiles}
          onFileRemove={(index) => setFiles((prev) => prev.filter((_, i) => i !== index))}
          onFilesClear={() => setFiles([])}
          disabled={isProcessing}
        />

        <Input
          label="Buyer GSTIN (optional)"
          placeholder="e.g. 33AABCB1234F1Z5"
          value={buyerGstin}
          onChange={(e) => setBuyerGstin(e.target.value)}
          disabled={isProcessing}
        />

        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <Button
            onClick={handleUpload}
            loading={uploading}
            disabled={files.length === 0 || isProcessing}
            size="lg"
          >
            {uploading
              ? 'Uploading...'
              : files.length > 1
                ? `Extract ${files.length} Invoices`
                : 'Extract Invoice Data'}
          </Button>
          {hasResults && (
            <Button variant="outline" size="lg" onClick={handleReset}>
              Upload Another
            </Button>
          )}
        </div>
      </motion.div>

      {/* Single file processing status */}
      {!isBatch && (processing || result) && (
        <ProcessingStatus
          status={result?.status ?? 'processing'}
          processingTimeMs={result?.processing_time_ms}
        />
      )}

      {/* Single file result */}
      {!isBatch && result?.status === 'completed' && result.invoice_data && invoiceId && (
        <ExtractionResults
          data={result.invoice_data}
          invoiceId={invoiceId}
          onDownload={handleDownload(invoiceId)}
        />
      )}

      {!isBatch && result?.status === 'failed' && result.error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6"
        >
          <h3 className="mb-2 font-semibold text-red-400">Processing Failed</h3>
          <p className="text-sm text-red-300/80">{result.error.message}</p>
          {result.error.details && (
            <pre className="mt-3 max-h-40 overflow-auto rounded-lg bg-black/30 p-3 font-mono text-xs text-red-300/60">
              {result.error.details}
            </pre>
          )}
        </motion.div>
      )}

      {/* Batch processing status */}
      {isBatch && processingIds.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6"
        >
          <h3 className="mb-3 font-semibold">Processing {processingIds.length} invoice{processingIds.length !== 1 ? 's' : ''}...</h3>
          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(completedResults.size / (completedResults.size + processingIds.length)) * 100}%` }}
              className="h-full rounded-full bg-accent-500"
            />
          </div>
          <p className="mt-2 text-sm text-white/50">
            {completedResults.size} of {completedResults.size + processingIds.length} completed
          </p>
        </motion.div>
      )}

      {/* Batch results */}
      {batchDone && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">
            Results ({completedResults.size} invoice{completedResults.size !== 1 ? 's' : ''})
          </h3>
          {Array.from(completedResults.entries()).map(([id, res]) => (
            <div key={id}>
              {res.status === 'completed' && res.invoice_data && (
                <ExtractionResults
                  data={res.invoice_data}
                  invoiceId={id}
                  onDownload={handleDownload(id)}
                />
              )}
              {res.status === 'failed' && res.error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6"
                >
                  <h3 className="mb-2 font-semibold text-red-400">Processing Failed (#{id.slice(0, 8)})</h3>
                  <p className="text-sm text-red-300/80">{res.error.message}</p>
                </motion.div>
              )}
            </div>
          ))}
        </div>
      )}

      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </div>
  )
}
