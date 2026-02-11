import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { HeroSection } from '../components/features/HeroSection'
import { FeaturesSection } from '../components/features/FeaturesSection'
import { HowItWorks } from '../components/features/HowItWorks'
import { Button } from '../components/ui/Button'

export function LandingPage() {
  return (
    <div>
      <HeroSection />
      <FeaturesSection />
      <HowItWorks />

      {/* CTA Section */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="gradient-hero relative overflow-hidden rounded-3xl p-12 text-center md:p-16"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(6,182,212,0.2),transparent_60%)]" />
            <div className="relative">
              <h2 className="mb-4 text-3xl font-bold md:text-4xl">
                Ready to Automate Invoice Processing?
              </h2>
              <p className="mx-auto mb-8 max-w-xl text-white/70">
                Start extracting GST invoice data in seconds. No credit card required.
              </p>
              <Link to="/signup">
                <Button size="lg" className="bg-white text-primary-700 hover:bg-white/90 shadow-float">
                  Get Started Free <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
