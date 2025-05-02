// Debug.tsx
import { useQuery, useQueryClient } from "@tanstack/react-query"
import React, { useEffect, useRef, useState } from "react"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { dracula } from "react-syntax-highlighter/dist/esm/styles/prism"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import 'katex/dist/katex.min.css'
import { User } from "@supabase/supabase-js"

import ScreenshotQueue from "../components/Queue/ScreenshotQueue"
import SolutionCommands from "../components/Solutions/SolutionCommands"
import { Screenshot } from "../types/screenshots"
import { useToast } from "../contexts/toast"
import { SolutionSidebar, SolutionContent, SolutionSection } from "../components/Solutions/SolutionElements"

// Interface for structured debug solution
interface DebugSolution {
  issues_identified: string;
  specific_improvements: string;
  educational_concepts: string;
  optimizations: string;
  explanation: string;
  key_learning: string;
  code: string;
  debug_analysis: string;
}

async function fetchScreenshots(): Promise<Screenshot[]> {
  try {
    const existing = await window.electronAPI.getScreenshots()
    console.log("Raw screenshot data in Debug:", existing)
    return (Array.isArray(existing) ? existing : []).map((p) => ({
      id: p.path,
      path: p.path,
      preview: p.preview,
      timestamp: Date.now()
    }))
  } catch (error) {
    console.error("Error loading screenshots:", error)
    throw error
  }
}

interface DebugProps {
  isProcessing: boolean
  setIsProcessing: (isProcessing: boolean) => void
  currentLanguage: string
  setLanguage: (language: string) => void
  user: User  // New prop
}

const Debug: React.FC<DebugProps> = ({
  isProcessing,
  setIsProcessing,
  currentLanguage,
  setLanguage,
  user
}) => {
  const [tooltipVisible, setTooltipVisible] = useState(false)
  const [tooltipHeight, setTooltipHeight] = useState(0)
  const [activeSection, setActiveSection] = useState<string>("issues_identified")
  const { showToast } = useToast()

  const { data: screenshots = [], refetch } = useQuery<Screenshot[]>({
    queryKey: ["screenshots"],
    queryFn: fetchScreenshots,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false
  })

  const [debugSolution, setDebugSolution] = useState<DebugSolution | null>(null)

  const queryClient = useQueryClient()
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Try to get the debug solution data from cache first
    const cachedSolution = queryClient.getQueryData(["new_solution"]) as DebugSolution | null

    // If we have cached data, set the debug solution
    if (cachedSolution) {
      console.log("Found cached debug solution:", cachedSolution)
      setDebugSolution(cachedSolution)
      setIsProcessing(false)
    }

    // Set up event listeners
    const cleanupFunctions = [
      window.electronAPI.onScreenshotTaken(() => refetch()),
      window.electronAPI.onResetView(() => refetch()),
      window.electronAPI.onDebugSuccess((data: unknown) => {
        console.log("Debug success event received with data:", data)
        queryClient.setQueryData(["new_solution"], data)
        
        // Also update local state for immediate rendering
        setDebugSolution(data)
        setIsProcessing(false)
      }),
      
      window.electronAPI.onDebugStart(() => {
        setIsProcessing(true)
      }),
      window.electronAPI.onDebugError((error: string) => {
        showToast(
          "Processing Failed",
          "There was an error debugging your code.",
          "error"
        )
        setIsProcessing(false)
        console.error("Processing error:", error)
      })
    ]

    // Set up resize observer
    const updateDimensions = () => {
      if (contentRef.current) {
        let contentHeight = contentRef.current.scrollHeight
        const contentWidth = contentRef.current.scrollWidth
        if (tooltipVisible) {
          contentHeight += tooltipHeight
        }
        window.electronAPI.updateContentDimensions({
          width: contentWidth,
          height: contentHeight
        })
      }
    }

    const resizeObserver = new ResizeObserver(updateDimensions)
    if (contentRef.current) {
      resizeObserver.observe(contentRef.current)
    }
    updateDimensions()

    return () => {
      resizeObserver.disconnect()
      cleanupFunctions.forEach((cleanup) => cleanup())
    }
  }, [queryClient, setIsProcessing, refetch, tooltipVisible, tooltipHeight, showToast])

  const handleTooltipVisibilityChange = (visible: boolean, height: number) => {
    setTooltipVisible(visible)
    setTooltipHeight(height)
  }

  const handleDeleteExtraScreenshot = async (index: number) => {
    const screenshotToDelete = screenshots[index]

    try {
      const response = await window.electronAPI.deleteScreenshot(
        screenshotToDelete.path
      )

      if (response.success) {
        refetch()
      } else {
        console.error("Failed to delete extra screenshot:", response.error)
      }
    } catch (error) {
      console.error("Error deleting extra screenshot:", error)
    }
  }

  // Define the sections with their display titles
  const sections = [
    { id: "issues_identified", title: "1. Issues Identified" },
    { id: "specific_improvements", title: "2. Specific Improvements" },
    { id: "educational_concepts", title: "3. Educational Concepts" },
    { id: "optimizations", title: "4. Optimizations" },
    { id: "explanation", title: "5. Explanation of Changes" },
    { id: "key_learning", title: "6. Key Learning Points" },
    { id: "code", title: "7. Corrected Code" },
  ]

  // Render the markdown content with syntax highlighting for code blocks
  const renderMarkdown = (content: string) => {
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          code({node, inline, className, children, ...props}) {
            const match = /language-(\w+)/.exec(className || '')
            return !inline && match ? (
              <SyntaxHighlighter
                style={dracula}
                language={match[1]}
                PreTag="div"
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            )
          }
        }}
      >
        {content}
      </ReactMarkdown>
    )
  }

  // Get content for the active section
  const getActiveContent = () => {
    if (!debugSolution) return "Loading debug solution..."

    switch (activeSection) {
      case "issues_identified":
        return debugSolution.issues_identified || "No issues identified"
      case "specific_improvements":
        return debugSolution.specific_improvements || "No specific improvements suggested"
      case "educational_concepts":
        return debugSolution.educational_concepts || "No educational concepts discussed"
      case "optimizations":
        return debugSolution.optimizations || "No optimizations suggested"
      case "explanation":
        return debugSolution.explanation || "No explanation provided"
      case "key_learning":
        return debugSolution.key_learning || "No key learning points highlighted"
      case "code":
        return debugSolution.code || "// No corrected code provided"
      default:
        return "Select a section from the sidebar"
    }
  }

  return (
    <div ref={contentRef} className="relative">
      <div className="space-y-3 px-4 py-3">
      {/* Conditionally render the screenshot queue */}
      <div className="bg-transparent w-fit">
        <div className="pb-3">
          <div className="space-y-3 w-fit">
            <ScreenshotQueue
              screenshots={screenshots}
              onDeleteScreenshot={handleDeleteExtraScreenshot}
              isLoading={isProcessing}
            />
          </div>
        </div>
      </div>

      {/* Navbar of commands with the tooltip */}
      <SolutionCommands
        screenshots={screenshots}
        onTooltipVisibilityChange={handleTooltipVisibilityChange}
        isProcessing={isProcessing}
        extraScreenshots={screenshots}
        credits={window.__CREDITS__}
        currentLanguage={currentLanguage}
        setLanguage={setLanguage}
        user={user}
      />

      {/* Main Content - New Layout Structure */}
      <div className="w-full text-sm text-black bg-black/60 rounded-md">
        <div className="rounded-lg overflow-hidden">
          {isProcessing ? (
            <div className="p-4 text-center">
              <div className="w-6 h-6 border-2 border-white/20 border-t-white/80 rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-white/70 text-sm">Analyzing your code and generating educational feedback...</p>
            </div>
          ) : debugSolution ? (
            <div className="flex flex-row">
              {/* Sidebar with section links */}
              <SolutionSidebar>
                {sections.map(section => (
                  <button
                    key={section.id}
                    className={`w-full text-left px-4 py-2 text-sm ${
                      activeSection === section.id
                        ? "bg-white/10 text-white font-medium"
                        : "text-white/70 hover:bg-white/5 hover:text-white/90"
                    }`}
                    onClick={() => setActiveSection(section.id)}
                  >
                    {section.title}
                  </button>
                ))}
              </SolutionSidebar>

              {/* Main content area */}
              <SolutionContent>
                <SolutionSection
                  title={sections.find(s => s.id === activeSection)?.title || ""}
                >
                  {activeSection === "code" ? (
                    <SyntaxHighlighter
                      showLineNumbers
                      language={currentLanguage === "golang" ? "go" : currentLanguage}
                      style={dracula}
                      customStyle={{
                        maxWidth: "100%",
                        margin: 0,
                        padding: "1rem",
                        backgroundColor: "rgba(22, 27, 34, 0.5)",
                        borderRadius: "4px"
                      }}
                      wrapLongLines={true}
                    >
                      {getActiveContent()}
                    </SyntaxHighlighter>
                  ) : (
                    <div className="prose prose-invert prose-sm max-w-none">
                      {renderMarkdown(getActiveContent())}
                    </div>
                  )}
                </SolutionSection>
              </SolutionContent>
            </div>
          ) : (
            <div className="p-4 text-center">
              <p className="text-white/70 text-sm">No debug solution available yet. Take screenshots of your code issues and press the Debug button.</p>
            </div>
          )}
        </div>
      </div>
    </div>
    </div>
  )
}

export default Debug