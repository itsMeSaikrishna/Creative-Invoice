import { Link, Outlet, useLocation } from 'react-router-dom'
import { LayoutDashboard, Upload, FileText, LogOut } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/upload', label: 'Upload', icon: Upload },
]

export function DashboardLayout() {
  const { user, signOut } = useAuth()
  const location = useLocation()

  return (
    <div className="flex min-h-screen flex-col">
      <header className="glass-dark fixed top-0 z-40 w-full">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/dashboard" className="flex items-center gap-2">
            <FileText className="h-7 w-7 text-accent-500" />
            <span className="text-xl font-bold">
              Creative<span className="text-accent-400">Invoice</span>
            </span>
          </Link>

          <div className="hidden items-center gap-6 md:flex">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                    location.pathname === item.to ? 'text-accent-400' : 'text-white/70 hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-white/60 md:block">{user?.email}</span>
            <button
              onClick={signOut}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-white/60 hover:bg-white/10 hover:text-white cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden md:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-6 pt-24 pb-12">
        <Outlet />
      </main>
    </div>
  )
}
