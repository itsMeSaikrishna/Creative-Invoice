import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, MessageSquare, Send } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

export function ContactPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <div className="py-16">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl">
          <div className="mb-12 text-center">
            <h1 className="mb-4 text-4xl font-bold">
              Get in <span className="gradient-text">Touch</span>
            </h1>
            <p className="text-white/50">
              Have questions or feedback? We'd love to hear from you.
            </p>
          </div>

          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass rounded-2xl p-12 text-center"
            >
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
                <Send className="h-8 w-8 text-emerald-400" />
              </div>
              <h2 className="mb-2 text-2xl font-bold">Message Sent!</h2>
              <p className="text-white/60">Thanks for reaching out. We'll get back to you soon.</p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-2xl p-8"
            >
              <form onSubmit={handleSubmit} className="space-y-5">
                <Input
                  label="Name"
                  placeholder="Your name"
                  icon={<MessageSquare className="h-4 w-4" />}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <Input
                  label="Email"
                  type="email"
                  placeholder="you@example.com"
                  icon={<Mail className="h-4 w-4" />}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-white/80">Message</label>
                  <textarea
                    rows={5}
                    placeholder="How can we help?"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-white placeholder-white/40 transition-all focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/20"
                  />
                </div>
                <Button type="submit" size="lg" className="w-full">
                  Send Message <Send className="h-4 w-4" />
                </Button>
              </form>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
