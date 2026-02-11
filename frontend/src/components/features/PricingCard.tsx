import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '../ui/Button'

interface PricingCardProps {
  name: string
  price: string
  period: string
  description: string
  features: string[]
  highlighted?: boolean
  cta: string
  ctaLink: string
  external?: boolean
}

export function PricingCard({ name, price, period, description, features, highlighted, cta, ctaLink, external }: PricingCardProps) {
  const buttonContent = (
    <Button variant={highlighted ? 'primary' : 'outline'} className="w-full">
      {cta}
    </Button>
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ scale: 1.03 }}
      className={`relative rounded-2xl border p-8 ${
        highlighted
          ? 'gradient-pro border-white/20 shadow-glow-cyan'
          : 'border-white/10 bg-white/5'
      }`}
    >
      {highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent-500 px-4 py-1 text-xs font-bold text-white">
          POPULAR
        </div>
      )}
      <h3 className="mb-1 text-xl font-bold">{name}</h3>
      <p className="mb-4 text-sm text-white/50">{description}</p>
      <div className="mb-6">
        <span className="text-4xl font-extrabold">{price}</span>
        <span className="text-white/50">/{period}</span>
      </div>
      <ul className="mb-8 space-y-3">
        {features.map((feature) => (
          <li key={feature} className="flex items-center gap-2 text-sm text-white/70">
            <Check className="h-4 w-4 shrink-0 text-accent-400" />
            {feature}
          </li>
        ))}
      </ul>
      {external ? (
        <a href={ctaLink}>
          {buttonContent}
        </a>
      ) : (
        <Link to={ctaLink}>
          {buttonContent}
        </Link>
      )}
    </motion.div>
  )
}
