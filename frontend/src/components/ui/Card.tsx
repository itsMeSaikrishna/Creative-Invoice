import type { HTMLAttributes, ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  hoverable?: boolean
  gradient?: boolean
}

export function Card({ children, hoverable = false, gradient = false, className = '', ...props }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-white/10 ${gradient ? 'gradient-pro' : 'bg-white/5'} p-6 ${hoverable ? 'transition-all duration-300 hover:scale-[1.02] hover:shadow-float hover:border-white/20' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
