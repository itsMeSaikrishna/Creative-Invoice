import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { PricingCard } from '../components/features/PricingCard'

const plans = [
  {
    name: 'Free',
    price: '₹0',
    period: 'month',
    description: 'Perfect for getting started',
    features: ['3 invoices/month', 'JSON export', 'Basic validation', 'Email support'],
    cta: 'Get Started',
    ctaLink: '/signup',
  },
  {
    name: 'Pro',
    price: '₹999',
    period: 'month',
    description: 'For growing businesses',
    features: ['Unlimited invoices', 'JSON + XML + CSV export', 'Advanced validation', 'Priority support', 'Tally integration', 'API access'],
    highlighted: true,
    cta: 'Contact Us to Upgrade',
    ctaLink: 'mailto:saikrishnanr141@gmail.com?subject=Creative Invoice - Pro Plan Upgrade',
    external: true,
  },
]

const faqs = [
  {
    q: 'What file formats are supported?',
    a: 'Currently we support PDF files only. The invoice should be a clear scan or digital PDF of a GST invoice.',
  },
  {
    q: 'How accurate is the extraction?',
    a: 'Our AI pipeline uses Google Document AI for OCR and LLM-powered extraction, achieving high accuracy. Each extraction includes automatic validation checks.',
  },
  {
    q: 'What export formats are available?',
    a: 'Free plan includes JSON export. Pro plan adds Tally-compatible XML and CSV spreadsheet formats.',
  },
  {
    q: 'Is my data secure?',
    a: 'Yes. All data is encrypted in transit and at rest. We use Supabase with Row Level Security to ensure data isolation between users.',
  },
]

export function PricingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className="py-16">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-16 text-center">
          <h1 className="mb-4 text-4xl font-bold">
            Simple, Transparent <span className="gradient-text">Pricing</span>
          </h1>
          <p className="mx-auto max-w-2xl text-white/50">
            Start free and upgrade when you need more. No hidden fees.
          </p>
        </div>

        <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
          {plans.map((plan) => (
            <PricingCard key={plan.name} {...plan} />
          ))}
        </div>

        <div className="mx-auto mt-24 max-w-2xl">
          <h2 className="mb-8 text-center text-2xl font-bold">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={false}
                className="glass overflow-hidden rounded-xl"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between p-5 text-left cursor-pointer"
                >
                  <span className="font-medium">{faq.q}</span>
                  <ChevronDown className={`h-5 w-5 shrink-0 text-white/40 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                <motion.div
                  animate={{ height: openFaq === i ? 'auto' : 0, opacity: openFaq === i ? 1 : 0 }}
                  initial={false}
                  className="overflow-hidden"
                >
                  <p className="px-5 pb-5 text-sm text-white/60">{faq.a}</p>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
