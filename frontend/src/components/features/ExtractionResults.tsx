import { motion } from 'framer-motion'
import { Download, CheckCircle, AlertTriangle } from 'lucide-react'
import type { InvoiceData, OutputFormat } from '../../types/invoice'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'

interface ExtractionResultsProps {
  data: InvoiceData
  invoiceId: string
  onDownload: (format: OutputFormat) => void
}

export function ExtractionResults({ data, invoiceId, onDownload }: ExtractionResultsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="glass rounded-2xl p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">Extracted Data</h3>
          <Badge variant={data.validation_passed ? 'success' : 'warning'}>
            {data.validation_passed ? (
              <><CheckCircle className="mr-1 inline h-3 w-3" /> Valid</>
            ) : (
              <><AlertTriangle className="mr-1 inline h-3 w-3" /> Issues Found</>
            )}
          </Badge>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Seller Name" value={data.seller_name} />
          <Field label="Seller GSTIN" value={data.seller_gstin} mono />
          <Field label="Buyer GSTIN" value={data.buyer_gstin || 'N/A'} mono />
          <Field label="Bill Number" value={data.bill_no} />
          <Field label="Bill Date" value={data.bill_date} />
          <Field label="Total Quantity" value={data.total_quantity?.toString() ?? '0'} />
          <Field label="Total Amount" value={`₹${data.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`} highlight />
        </div>

        <div className="mt-6">
          <h4 className="mb-3 text-sm font-semibold text-white/60">Tax Summary</h4>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <SummaryCard label="Taxable Value" value={data.total_taxable_value} />
            {data.total_cgst > 0 && <SummaryCard label="Total CGST" value={data.total_cgst} />}
            {data.total_sgst > 0 && <SummaryCard label="Total SGST" value={data.total_sgst} />}
            {data.total_igst > 0 && <SummaryCard label="Total IGST" value={data.total_igst} />}
            <SummaryCard label="Total Amount" value={data.total_amount} accent />
          </div>
        </div>

        {data.tax_breakup.length > 0 && (
          <div className="mt-6">
            <h4 className="mb-3 text-sm font-semibold text-white/60">Tax Breakup</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-white/50">
                    <th className="pb-2 pr-4">Rate</th>
                    <th className="pb-2 pr-4">Taxable</th>
                    <th className="pb-2 pr-4">CGST</th>
                    <th className="pb-2 pr-4">SGST</th>
                    <th className="pb-2 pr-4">IGST</th>
                    <th className="pb-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.tax_breakup.map((row, i) => (
                    <tr key={i} className="border-b border-white/5">
                      <td className="py-2 pr-4">{row.rate}%</td>
                      <td className="py-2 pr-4">₹{row.taxable_value.toFixed(2)}</td>
                      <td className="py-2 pr-4">₹{row.cgst_amount.toFixed(2)}</td>
                      <td className="py-2 pr-4">₹{row.sgst_amount.toFixed(2)}</td>
                      <td className="py-2 pr-4">₹{row.igst_amount.toFixed(2)}</td>
                      <td className="py-2">₹{row.total_with_tax.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {data.validation_errors.length > 0 && (
          <div className="mt-4 rounded-xl bg-red-500/10 border border-red-500/20 p-4">
            <p className="mb-2 text-sm font-semibold text-red-400">Validation Issues:</p>
            <ul className="list-disc pl-4 text-sm text-red-300/80">
              {data.validation_errors.map((err, i) => <li key={i}>{err}</li>)}
            </ul>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button onClick={() => onDownload('json')} variant="outline" size="sm">
          <Download className="h-4 w-4" /> JSON
        </Button>
        <Button onClick={() => onDownload('xml')} variant="outline" size="sm">
          <Download className="h-4 w-4" /> Tally XML
        </Button>
        <Button onClick={() => onDownload('csv')} variant="outline" size="sm">
          <Download className="h-4 w-4" /> CSV
        </Button>
      </div>

      <details className="glass rounded-2xl">
        <summary className="cursor-pointer p-4 text-sm font-medium text-white/60 hover:text-white/80">
          View Raw JSON (Invoice #{invoiceId.slice(0, 8)})
        </summary>
        <pre className="max-h-80 overflow-auto p-4 pt-0 font-mono text-xs text-white/60">
          {JSON.stringify(data, null, 2)}
        </pre>
      </details>
    </motion.div>
  )
}

function SummaryCard({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className={`rounded-xl p-3 ${accent ? 'bg-accent-500/10 border border-accent-500/20' : 'bg-white/5'}`}>
      <p className="text-xs text-white/40">{label}</p>
      <p className={`mt-0.5 font-mono text-sm font-semibold ${accent ? 'text-accent-400' : ''}`}>
        ₹{value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
      </p>
    </div>
  )
}

function Field({ label, value, mono, highlight }: { label: string; value: string; mono?: boolean; highlight?: boolean }) {
  return (
    <div>
      <p className="text-xs font-medium text-white/40">{label}</p>
      <p className={`mt-0.5 ${mono ? 'font-mono text-sm' : 'text-sm'} ${highlight ? 'text-lg font-bold text-accent-400' : ''}`}>
        {value}
      </p>
    </div>
  )
}
