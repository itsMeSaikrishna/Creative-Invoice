import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Upload, Trash2, Zap } from 'lucide-react'
import { useInvoiceProcessor } from '../hooks/useInvoiceProcessor'
import { useSubscription } from '../hooks/useSubscription'
import { DashboardStats } from '../components/features/DashboardStats'
import { UpgradeModal } from '../components/features/UpgradeModal'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import type { InvoiceRecord } from '../types/invoice'

export function DashboardPage() {
  const { listInvoices, deleteInvoice } = useInvoiceProcessor()
  const { subscription } = useSubscription()
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showUpgrade, setShowUpgrade] = useState(false)

  const fetchInvoices = async () => {
    try {
      const data = await listInvoices(1, 20)
      setInvoices(data.invoices)
      setTotal(data.total)
    } catch {
      // handle silently
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchInvoices() }, [])

  const handleDelete = async (id: string) => {
    await deleteInvoice(id)
    fetchInvoices()
  }

  const stats = {
    total,
    completed: invoices.filter((i) => i.status === 'completed').length,
    pending: invoices.filter((i) => i.status === 'pending' || i.status === 'processing').length,
    failed: invoices.filter((i) => i.status === 'failed').length,
  }

  const statusBadge = (status: string) => {
    const map: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
      completed: 'success',
      processing: 'info',
      pending: 'warning',
      failed: 'error',
    }
    return <Badge variant={map[status] || 'default'}>{status}</Badge>
  }

  const usage = subscription?.usage
  const usagePercent = usage ? Math.min((usage.used / usage.limit) * 100, 100) : 0

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-white/50">Manage your extracted invoices.</p>
        </div>
        <Link to="/upload">
          <Button><Upload className="h-4 w-4" /> Upload Invoice</Button>
        </Link>
      </div>

      {usage && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-medium text-white/60">Monthly Usage</p>
              <p className="text-lg font-bold">
                {usage.used}/{usage.limit} invoices
                <span className="ml-2 text-sm font-normal text-white/40">
                  ({subscription.plan === 'free' ? 'Free' : 'Pro'} plan)
                </span>
              </p>
            </div>
            {subscription.plan === 'free' && (
              <button
                onClick={() => setShowUpgrade(true)}
                className="flex items-center gap-1.5 rounded-lg bg-accent-500/20 px-3 py-1.5 text-sm font-medium text-accent-400 hover:bg-accent-500/30 transition-colors cursor-pointer"
              >
                <Zap className="h-3.5 w-3.5" /> Upgrade
              </button>
            )}
          </div>
          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${usagePercent}%` }}
              transition={{ duration: 0.5 }}
              className={`h-full rounded-full ${
                usagePercent >= 100 ? 'bg-red-500' : usagePercent >= 80 ? 'bg-amber-500' : 'bg-accent-500'
              }`}
            />
          </div>
          {!usage.allowed && (
            <p className="mt-2 text-sm text-red-400">
              Monthly limit reached. <button onClick={() => setShowUpgrade(true)} className="underline hover:text-red-300 cursor-pointer">Upgrade to Pro</button> for unlimited invoices.
            </p>
          )}
        </motion.div>
      )}

      <DashboardStats {...stats} />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass overflow-hidden rounded-2xl"
      >
        <div className="p-6 pb-0">
          <h2 className="text-lg font-semibold">Recent Invoices</h2>
        </div>

        {loading ? (
          <div className="p-12 text-center text-white/40">Loading...</div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center">
            <p className="mb-4 text-white/40">No invoices yet.</p>
            <Link to="/upload">
              <Button size="sm">Upload Your First Invoice</Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-white/50">
                  <th className="px-6 py-3">Seller</th>
                  <th className="px-6 py-3">Bill No</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Amount</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-6 py-4 font-medium">{inv.seller_name || '-'}</td>
                    <td className="px-6 py-4 font-mono text-xs">{inv.bill_no || '-'}</td>
                    <td className="px-6 py-4">{inv.bill_date || '-'}</td>
                    <td className="px-6 py-4">
                      {inv.total_amount ? `₹${inv.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'}
                    </td>
                    <td className="px-6 py-4">{statusBadge(inv.status)}</td>
                    <td className="px-6 py-4">
                      <button onClick={() => handleDelete(inv.id)} className="rounded-lg p-1.5 text-white/40 hover:bg-red-500/20 hover:text-red-400 cursor-pointer">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </div>
  )
}
