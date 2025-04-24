// SolutionElements.tsx
import React, { ReactNode } from "react"

interface SolutionSidebarProps {
  children: ReactNode
}

export const SolutionSidebar: React.FC<SolutionSidebarProps> = ({ children }) => {
  return (
    <div className="w-64 border-r border-white/10 bg-black/40 flex-shrink-0 overflow-y-auto max-h-[70vh]">
      <div className="py-2">
        <h3 className="font-medium text-white/80 text-xs px-4 py-2 uppercase tracking-wider">
          Learning Sections
        </h3>
        {children}
      </div>
    </div>
  )
}

interface SolutionContentProps {
  children: ReactNode
}

export const SolutionContent: React.FC<SolutionContentProps> = ({ children }) => {
  return (
    <div className="flex-1 min-w-0 max-h-[70vh] overflow-y-auto">
      {children}
    </div>
  )
}

interface SolutionSectionProps {
  title: string
  children: ReactNode
}

export const SolutionSection: React.FC<SolutionSectionProps> = ({ title, children }) => {
  return (
    <div className="p-4">
      <h2 className="text-[15px] font-semibold text-white mb-3 pb-2 border-b border-white/10">
        {title}
      </h2>
      <div className="text-[13px] leading-[1.5] text-gray-100">
        {children}
      </div>
    </div>
  )
}

// Additional component for debug solution layout
interface DebugSectionProps {
  title: string
  content: string
  isActive: boolean
  onClick: () => void
}

export const DebugSection: React.FC<DebugSectionProps> = ({ 
  title, 
  content, 
  isActive, 
  onClick 
}) => {
  return (
    <div 
      className={`p-3 mb-2 rounded cursor-pointer transition-all ${
        isActive 
          ? "bg-white/10 border-l-2 border-blue-400" 
          : "bg-black/20 hover:bg-black/30"
      }`}
      onClick={onClick}
    >
      <h3 className="font-medium text-white/90 text-[13px] mb-1">{title}</h3>
      <p className="text-[11px] text-white/60 truncate">
        {content.substring(0, 60)}
        {content.length > 60 ? "..." : ""}
      </p>
    </div>
  )
}