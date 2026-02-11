import { motion } from 'framer-motion'
import { Upload, ScanLine, CheckCircle, Download } from 'lucide-react'

const steps = [
  { icon: Upload, title: 'Upload PDF', description: 'Drag and drop your GST invoice PDF file.' },
  { icon: ScanLine, title: 'AI Extracts Data', description: 'OCR and LLM extract all invoice fields.' },
  { icon: CheckCircle, title: 'Auto Validation', description: 'GSTIN, tax math, and dates are verified.' },
  { icon: Download, title: 'Export Results', description: 'Download as JSON, XML, or CSV.' },
]

export function HowItWorks() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">
            How It <span className="gradient-text">Works</span>
          </h2>
          <p className="mx-auto max-w-2xl text-white/50">
            Four simple steps from PDF to structured invoice data.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-4">
          {steps.map((step, i) => {
            const Icon = step.icon
            return (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative text-center"
              >
                {i < steps.length - 1 && (
                  <div className="absolute left-1/2 top-8 hidden h-0.5 w-full bg-gradient-to-r from-primary-500/40 to-transparent md:block" />
                )}
                <div className="relative mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500">
                  <Icon className="h-7 w-7 text-white" />
                </div>
                <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-accent-400">
                  Step {i + 1}
                </div>
                <h3 className="mb-2 text-lg font-semibold">{step.title}</h3>
                <p className="text-sm text-white/50">{step.description}</p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
