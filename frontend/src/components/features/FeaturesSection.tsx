import { motion } from 'framer-motion'
import { ScanLine, Shield, Download, Zap, Brain, FileCheck } from 'lucide-react'

const features = [
  {
    icon: ScanLine,
    title: 'OCR Extraction',
    description: 'Google Document AI powers precise text extraction from any GST invoice PDF.',
  },
  {
    icon: Brain,
    title: 'AI Understanding',
    description: 'LLM-powered field extraction identifies seller info, tax breakups, and totals.',
  },
  {
    icon: Shield,
    title: 'Validation Engine',
    description: 'Automatic GSTIN format checks, tax math verification, and data consistency.',
  },
  {
    icon: Download,
    title: 'Multi-Format Export',
    description: 'Download extracted data as JSON, Tally-compatible XML, or CSV spreadsheet.',
  },
  {
    icon: Zap,
    title: 'Fast Processing',
    description: 'Upload to results in seconds. Background processing with real-time status updates.',
  },
  {
    icon: FileCheck,
    title: 'Tally Integration',
    description: 'Export directly to Tally XML voucher format for seamless accounting import.',
  },
]

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

export function FeaturesSection() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">
            Everything You Need for <span className="gradient-text">Invoice Processing</span>
          </h2>
          <p className="mx-auto max-w-2xl text-white/50">
            From PDF upload to structured data export, our pipeline handles every step with precision.
          </p>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-50px' }}
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={feature.title}
                variants={item}
                className="group rounded-2xl border border-white/10 bg-white/5 p-6 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.08] hover:shadow-float"
              >
                <div className="mb-4 inline-flex rounded-xl bg-primary-500/20 p-3">
                  <Icon className="h-6 w-6 text-primary-400" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                <p className="text-sm text-white/50">{feature.description}</p>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
