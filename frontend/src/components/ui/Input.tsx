import { type InputHTMLAttributes, forwardRef, type ReactNode } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="mb-1.5 block text-sm font-medium text-white/80">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/40">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`w-full rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-white placeholder-white/40 transition-all focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/20 ${icon ? 'pl-10' : ''} ${error ? 'border-red-400' : ''} ${className}`}
            {...props}
          />
        </div>
        {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
      </div>
    )
  },
)

Input.displayName = 'Input'
