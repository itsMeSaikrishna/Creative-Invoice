import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'

interface ToastProps {
  message: string
  type?: ToastType
  visible: boolean
  onClose: () => void
  duration?: number
}

const icons: Record<ToastType, typeof CheckCircle> = {
  success: CheckCircle,
  error: XCircle,
  info: AlertCircle,
}

const colorClasses: Record<ToastType, string> = {
  success: 'border-emerald-500/30 text-emerald-400',
  error: 'border-red-500/30 text-red-400',
  info: 'border-accent-500/30 text-accent-400',
}

export function Toast({ message, type = 'info', visible, onClose, duration = 4000 }: ToastProps) {
  useEffect(() => {
    if (visible && duration > 0) {
      const timer = setTimeout(onClose, duration)
      return () => clearTimeout(timer)
    }
  }, [visible, duration, onClose])

  const Icon = icons[type]

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`glass fixed right-4 top-4 z-50 flex items-center gap-3 rounded-xl border px-4 py-3 ${colorClasses[type]}`}
        >
          <Icon className="h-5 w-5 shrink-0" />
          <p className="text-sm text-white">{message}</p>
          <button onClick={onClose} className="ml-2 text-white/40 hover:text-white cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
