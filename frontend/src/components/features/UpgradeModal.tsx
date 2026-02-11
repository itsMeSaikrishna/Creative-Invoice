import { Zap, Mail } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'

interface UpgradeModalProps {
  open: boolean
  onClose: () => void
}

export function UpgradeModal({ open, onClose }: UpgradeModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Upgrade to Pro">
      <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-xl bg-accent-500/10 border border-accent-500/20 p-4">
          <Zap className="h-8 w-8 shrink-0 text-accent-400" />
          <div>
            <p className="font-semibold">Unlock Unlimited Invoices</p>
            <p className="text-sm text-white/60">
              Pro plan includes unlimited invoices, all export formats, and priority support.
            </p>
          </div>
        </div>

        <div className="rounded-xl bg-white/5 p-4">
          <p className="mb-1 text-sm font-medium">Pro Plan</p>
          <p className="text-2xl font-bold">
            ₹999<span className="text-sm font-normal text-white/50">/month</span>
          </p>
        </div>

        <a
          href="mailto:saikrishnanr141@gmail.com?subject=Creative Invoice - Pro Plan Upgrade"
          className="block"
        >
          <Button className="w-full">
            <Mail className="h-4 w-4" /> Contact Us to Upgrade
          </Button>
        </a>

        <p className="text-center text-xs text-white/40">
          We'll get back to you within 24 hours.
        </p>
      </div>
    </Modal>
  )
}
