import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, FileText, LogOut, User } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../ui/Button'

const publicLinks = [
  { to: '/', label: 'Home' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/docs', label: 'Docs' },
  { to: '/contact', label: 'Contact' },
]

export function Navbar() {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  return (
    <nav className="glass-dark fixed top-0 z-40 w-full">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2">
          <FileText className="h-7 w-7 text-accent-500" />
          <span className="text-xl font-bold">
            Creative<span className="text-accent-400">Invoice</span>
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {publicLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`text-sm font-medium transition-colors ${
                location.pathname === link.to ? 'text-accent-400' : 'text-white/70 hover:text-white'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 rounded-xl border border-white/20 px-3 py-2 text-sm text-white/80 hover:bg-white/10 cursor-pointer"
              >
                <User className="h-4 w-4" />
                <span className="max-w-[140px] truncate">{user.email}</span>
              </button>
              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="glass absolute right-0 top-full mt-2 w-48 rounded-xl p-2"
                  >
                    <Link
                      to="/dashboard"
                      onClick={() => setProfileOpen(false)}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/80 hover:bg-white/10"
                    >
                      Dashboard
                    </Link>
                    <button
                      onClick={() => { signOut(); setProfileOpen(false) }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-400 hover:bg-white/10 cursor-pointer"
                    >
                      <LogOut className="h-4 w-4" /> Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">Log In</Button>
              </Link>
              <Link to="/signup">
                <Button size="sm">Get Started</Button>
              </Link>
            </>
          )}
        </div>

        <button
          className="text-white md:hidden cursor-pointer"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="glass-dark overflow-hidden md:hidden"
          >
            <div className="flex flex-col gap-2 px-6 py-4">
              {publicLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm text-white/80 hover:bg-white/10"
                >
                  {link.label}
                </Link>
              ))}
              <hr className="border-white/10" />
              {user ? (
                <>
                  <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2 text-sm text-white/80 hover:bg-white/10">
                    Dashboard
                  </Link>
                  <button onClick={() => { signOut(); setMobileOpen(false) }} className="rounded-lg px-3 py-2 text-left text-sm text-red-400 hover:bg-white/10 cursor-pointer">
                    Sign Out
                  </button>
                </>
              ) : (
                <div className="flex gap-2">
                  <Link to="/login" onClick={() => setMobileOpen(false)} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">Log In</Button>
                  </Link>
                  <Link to="/signup" onClick={() => setMobileOpen(false)} className="flex-1">
                    <Button size="sm" className="w-full">Sign Up</Button>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
