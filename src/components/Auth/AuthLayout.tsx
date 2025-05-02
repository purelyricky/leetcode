import React, { ReactNode } from 'react'

interface AuthLayoutProps {
  children: ReactNode
  title: string
  subtitle: string
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <div className="bg-black flex items-center justify-center">
      <div className="max-w-md w-full bg-black/80 border border-amber-500/10 rounded-xl overflow-hidden shadow-xl">
        <div className="px-8 pt-8 pb-6">
          <h1 className="text-2xl font-bold text-white mb-1">{title}</h1>
          <p className="text-amber-400/80 text-sm mb-6">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  )
}