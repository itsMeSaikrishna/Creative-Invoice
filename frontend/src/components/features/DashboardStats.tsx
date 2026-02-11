import { motion } from 'framer-motion'
import { FileText, CheckCircle, Clock, AlertTriangle } from 'lucide-react'

interface StatsProps {
  total: number
  completed: number
  pending: number
  failed: number
}

export function DashboardStats({ total, completed, pending, failed }: StatsProps) {
  const stats = [
    { label: 'Total Invoices', value: total, icon: FileText, color: 'from-primary-500 to-primary-600' },
    { label: 'Completed', value: completed, icon: CheckCircle, color: 'from-emerald-500 to-emerald-600' },
    { label: 'Processing', value: pending, icon: Clock, color: 'from-amber-500 to-amber-600' },
    { label: 'Failed', value: failed, icon: AlertTriangle, color: 'from-red-500 to-red-600' },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, i) => {
        const Icon = stat.icon
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass rounded-2xl p-5"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-white/50">{stat.label}</span>
              <div className={`rounded-lg bg-gradient-to-br ${stat.color} p-2`}>
                <Icon className="h-4 w-4 text-white" />
              </div>
            </div>
            <p className="text-3xl font-bold">{stat.value}</p>
          </motion.div>
        )
      })}
    </div>
  )
}
