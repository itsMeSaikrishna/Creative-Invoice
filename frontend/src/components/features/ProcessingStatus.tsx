import { motion } from 'framer-motion'
import { Loader2, CheckCircle, XCircle, Clock } from 'lucide-react'
import { ProgressBar } from '../ui/ProgressBar'

interface ProcessingStatusProps {
  status: 'pending' | 'processing' | 'completed' | 'failed'
  processingTimeMs?: number | null
}

const statusConfig = {
  pending: { icon: Clock, label: 'Queued', color: 'text-amber-400', progress: 10 },
  processing: { icon: Loader2, label: 'Processing...', color: 'text-accent-400', progress: 60 },
  completed: { icon: CheckCircle, label: 'Completed', color: 'text-emerald-400', progress: 100 },
  failed: { icon: XCircle, label: 'Failed', color: 'text-red-400', progress: 100 },
}

export function ProcessingStatus({ status, processingTimeMs }: ProcessingStatusProps) {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-6"
    >
      <div className="mb-4 flex items-center gap-3">
        <Icon className={`h-6 w-6 ${config.color} ${status === 'processing' ? 'animate-spin' : ''}`} />
        <span className={`font-semibold ${config.color}`}>{config.label}</span>
        {processingTimeMs && (
          <span className="ml-auto text-sm text-white/40">
            {(processingTimeMs / 1000).toFixed(1)}s
          </span>
        )}
      </div>
      <ProgressBar value={config.progress} />
    </motion.div>
  )
}
