import { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children: ReactNode
}

// Polaris button tones (styles live in globals.css → .p-btn-*)
const variants = {
  primary: 'p-btn-primary',
  secondary: 'p-btn-secondary',
  danger: 'p-btn-critical',
  ghost: 'p-btn-plain',
}

const sizes = {
  sm: 'min-h-7 px-2.5 py-1 text-xs',
  md: 'min-h-8 px-3 py-1.5 text-sm',
  lg: 'min-h-10 px-4 py-2 text-base',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`p-btn ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading && (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  )
}
