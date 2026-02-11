import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Sparkles } from 'lucide-react'
import { Button } from '../ui/Button'

export function HeroSection() {
  return (
    <section className="relative overflow-hidden py-24 md:py-32">
      <div className="absolute inset-0 gradient-hero opacity-20" />
      <div className="absolute inset-0">
        <div className="absolute left-1/4 top-1/4 h-72 w-72 rounded-full bg-primary-500/20 blur-[100px]" />
        <div className="absolute right-1/4 bottom-1/4 h-72 w-72 rounded-full bg-accent-500/20 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent-500/30 bg-accent-500/10 px-4 py-1.5 text-sm text-accent-400">
              <Sparkles className="h-4 w-4" />
              AI-Powered Invoice Extraction
            </div>
            <h1 className="mb-6 text-4xl font-extrabold leading-tight tracking-tight md:text-6xl">
              Extract GST Data{' '}
              <span className="gradient-text">in Seconds</span>
            </h1>
            <p className="mb-8 max-w-lg text-lg text-white/60">
              Upload your GST invoices and let AI extract seller details, tax breakups, and totals automatically. Export to JSON, Tally XML, or CSV.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/signup">
                <Button size="lg">
                  Start Free <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link to="/docs">
                <Button variant="outline" size="lg">View Docs</Button>
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative hidden lg:block"
          >
            <motion.div
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              className="glass rounded-2xl p-6 shadow-float"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-red-400" />
                <div className="h-3 w-3 rounded-full bg-amber-400" />
                <div className="h-3 w-3 rounded-full bg-emerald-400" />
              </div>
              <div className="space-y-3 font-mono text-sm">
                <div className="text-white/40">{'// Extracted Invoice Data'}</div>
                <div>
                  <span className="text-primary-400">"seller_name"</span>
                  <span className="text-white/60">: </span>
                  <span className="text-emerald-400">"XXXXXXXX"</span>
                </div>
                <div>
                  <span className="text-primary-400">"seller_gstin"</span>
                  <span className="text-white/60">: </span>
                  <span className="text-emerald-400">"3XXXXXXXXX5"</span>
                </div>
                <div>
                  <span className="text-primary-400">"total_amount"</span>
                  <span className="text-white/60">: </span>
                  <span className="text-accent-400">5676.00</span>
                </div>
                <div>
                  <span className="text-primary-400">"validation_passed"</span>
                  <span className="text-white/60">: </span>
                  <span className="text-emerald-400">true</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
