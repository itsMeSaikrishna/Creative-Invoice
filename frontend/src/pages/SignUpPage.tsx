import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

export function SignUpPage() {
  const { signUp, signInWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [needsConfirmation, setNeedsConfirmation] = useState(false)

  const passwordStrength = () => {
    let score = 0
    if (password.length >= 8) score++
    if (/[A-Z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[^A-Za-z0-9]/.test(password)) score++
    return score
  }

  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong']
  const strengthColors = ['bg-red-500', 'bg-amber-500', 'bg-emerald-400', 'bg-emerald-500']
  const strength = passwordStrength()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)
    const result = await signUp(email, password)
    setLoading(false)

    if (result.error) {
      setError(result.error)
    } else if (result.needsConfirmation) {
      setNeedsConfirmation(true)
    } else {
      // Auto-confirmed — session created, redirect to dashboard
      navigate('/dashboard')
    }
  }

  if (needsConfirmation) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass w-full max-w-md rounded-2xl p-8 text-center"
        >
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
            <Mail className="h-8 w-8 text-emerald-400" />
          </div>
          <h2 className="mb-2 text-2xl font-bold">Check Your Email</h2>
          <p className="mb-6 text-white/60">
            We've sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.
          </p>
          <Link to="/login">
            <Button variant="outline" className="w-full">Go to Login</Button>
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass w-full max-w-md rounded-2xl p-8"
      >
        <h2 className="mb-2 text-2xl font-bold">Create Account</h2>
        <p className="mb-6 text-white/50">Start extracting invoice data for free.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            icon={<Mail className="h-4 w-4" />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Min 8 characters"
              icon={<Lock className="h-4 w-4" />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-9 text-white/40 hover:text-white cursor-pointer">
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
            {password && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex flex-1 gap-1">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className={`h-1 flex-1 rounded-full ${i < strength ? strengthColors[strength - 1] : 'bg-white/10'}`} />
                  ))}
                </div>
                <span className="text-xs text-white/50">{strength > 0 ? strengthLabels[strength - 1] : ''}</span>
              </div>
            )}
          </div>
          <Input
            label="Confirm Password"
            type="password"
            placeholder="Re-enter password"
            icon={<Lock className="h-4 w-4" />}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          {error && <p className="text-sm text-red-400">{error}</p>}

          <Button type="submit" loading={loading} className="w-full">Create Account</Button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-[#1a1a2e] px-4 text-white/40">or continue with</span>
          </div>
        </div>

        <button
          onClick={async () => {
            setGoogleLoading(true)
            setError(null)
            const { error: googleError } = await signInWithGoogle()
            if (googleError) {
              setError(googleError)
              setGoogleLoading(false)
            }
          }}
          disabled={googleLoading}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-medium transition-colors hover:bg-white/10 disabled:opacity-50 cursor-pointer"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          {googleLoading ? 'Redirecting...' : 'Sign up with Google'}
        </button>

        <p className="mt-6 text-center text-sm text-white/50">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-accent-400 hover:underline">Log in</Link>
        </p>
      </motion.div>
    </div>
  )
}
