// Solutions.tsx
import React, { useState, useEffect, useRef } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { dracula } from "react-syntax-highlighter/dist/esm/styles/prism"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import 'katex/dist/katex.min.css'

import ScreenshotQueue from "../components/Queue/ScreenshotQueue"
import SolutionCommands from "../components/Solutions/SolutionCommands"
import Debug from "./Debug"
import { useToast } from "../contexts/toast"
import { COMMAND_KEY } from "../utils/platform"

// Components for DSA Solution sections
import {
  SolutionSidebar,
  SolutionContent,
  SolutionSection
} from "../components/Solutions/SolutionElements"

export interface SolutionsProps {
  setView: (view: "queue" | "solutions" | "debug") => void
  credits: number
  currentLanguage: string
  setLanguage: (language: string) => void
}

// Interface for structured educational solution
interface EducationalSolution {
  problem_restatement: string;
  inputs_outputs_constraints: string;
  edge_cases: string;
  pattern_recognition: string;
  approaches: string; 
  pseudocode: string;
  code: string;
  complexity: {
    time: string;
    space: string;
  };
  walkthrough: string;
  visual_aid: string;
  further_practice: string;
}

const Solutions: React.FC<SolutionsProps> = ({
  setView,
  credits,
  currentLanguage,
  setLanguage
}) => {
  const queryClient = useQueryClient()
  const contentRef = useRef<HTMLDivElement>(null)

  const [debugProcessing, setDebugProcessing] = useState(false)
  const [problemInfo, setProblemInfo] = useState<any>(null)
  const [solutionData, setSolutionData] = useState<EducationalSolution | null>(null)
  const [activeSection, setActiveSection] = useState<string>("problem_restatement")

  // UI state
  const [isTooltipVisible, setIsTooltipVisible] = useState(false)
  const [tooltipHeight, setTooltipHeight] = useState(0)
  const [isResetting, setIsResetting] = useState(false)
  const [extraScreenshots, setExtraScreenshots] = useState<any[]>([])

  const { showToast } = useToast()

  useEffect(() => {
    // Load problem statement and solution data from cache
    setProblemInfo(queryClient.getQueryData(["problem_statement"]) || null)
    setSolutionData(queryClient.getQueryData(["solution"]) || null)

    // Subscribe to query cache updates
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event?.query.queryKey[0] === "problem_statement") {
        setProblemInfo(queryClient.getQueryData(["problem_statement"]) || null)
      }
      if (event?.query.queryKey[0] === "solution") {
        setSolutionData(queryClient.getQueryData(["solution"]) || null)
      }
    })

    // Load screenshots
    const fetchScreenshots = async () => {
      try {
        const existing = await window.electronAPI.getScreenshots()
        const screenshots = (Array.isArray(existing) ? existing : []).map((p) => ({
          id: p.path,
          path: p.path,
          preview: p.preview,
          timestamp: Date.now()
        }))
        setExtraScreenshots(screenshots)
      } catch (error) {
        console.error("Error loading extra screenshots:", error)
        setExtraScreenshots([])
      }
    }
    fetchScreenshots()

    return () => unsubscribe()
  }, [queryClient])

  // Set up window height updates and event listeners
  useEffect(() => {
    // Height update logic
    const updateDimensions = () => {
      if (contentRef.current) {
        let contentHeight = contentRef.current.scrollHeight
        const contentWidth = contentRef.current.scrollWidth
        if (isTooltipVisible) {
          contentHeight += tooltipHeight
        }
        window.electronAPI.updateContentDimensions({
          width: contentWidth,
          height: contentHeight
        })
      }
    }

    // Initialize resize observer
    const resizeObserver = new ResizeObserver(updateDimensions)
    if (contentRef.current) {
      resizeObserver.observe(contentRef.current)
    }
    updateDimensions()

    // Set up event listeners
    const cleanupFunctions = [
      window.electronAPI.onScreenshotTaken(async () => {
        try {
          const existing = await window.electronAPI.getScreenshots()
          const screenshots = (Array.isArray(existing) ? existing : []).map(
            (p) => ({
              id: p.path,
              path: p.path,
              preview: p.preview,
              timestamp: Date.now()
            })
          )
          setExtraScreenshots(screenshots)
        } catch (error) {
          console.error("Error loading extra screenshots:", error)
        }
      }),
      window.electronAPI.onResetView(() => {
        // Set resetting state first
        setIsResetting(true)

        // Remove queries
        queryClient.removeQueries({
          queryKey: ["solution"]
        })
        queryClient.removeQueries({
          queryKey: ["new_solution"]
        })

        // Reset screenshots
        setExtraScreenshots([])

        // After a small delay, clear the resetting state
        setTimeout(() => {
          setIsResetting(false)
        }, 0)
      }),
      window.electronAPI.onSolutionStart(() => {
        // Reset states when processing starts
        setSolutionData(null)
      }),
      window.electronAPI.onProblemExtracted((data) => {
        queryClient.setQueryData(["problem_statement"], data)
        setProblemInfo(data)
      }),
      window.electronAPI.onSolutionError((error: string) => {
        showToast("Processing Failed", error, "error")
        // Reset to previous state if available
        const solution = queryClient.getQueryData(["solution"]) as EducationalSolution | null
        if (!solution) {
          setView("queue")
        }
        setSolutionData(solution)
      }),
      window.electronAPI.onSolutionSuccess((data) => {
        if (!data) {
          console.warn("Received empty or invalid solution data")
          return
        }
        console.log("Solution data received:", data)
        
        // Store solution data in query cache
        queryClient.setQueryData(["solution"], data)
        setSolutionData(data)
        
        // Always start with the first section active
        setActiveSection("problem_restatement")

        // Fetch latest screenshots
        const fetchScreenshots = async () => {
          try {
            const existing = await window.electronAPI.getScreenshots()
            const screenshots = (Array.isArray(existing) ? existing : []).map((p) => ({
              id: p.path,
              path: p.path,
              preview: p.preview,
              timestamp: Date.now()
            }))
            setExtraScreenshots(screenshots)
          } catch (error) {
            console.error("Error loading extra screenshots:", error)
            setExtraScreenshots([])
          }
        }
        fetchScreenshots()
      }),

      // Debug events
      window.electronAPI.onDebugStart(() => {
        setDebugProcessing(true)
      }),
      window.electronAPI.onDebugSuccess((data) => {
        queryClient.setQueryData(["new_solution"], data)
        setDebugProcessing(false)
      }),
      window.electronAPI.onDebugError(() => {
        showToast(
          "Processing Failed",
          "There was an error debugging your code.",
          "error"
        )
        setDebugProcessing(false)
      }),
      window.electronAPI.onProcessingNoScreenshots(() => {
        showToast(
          "No Screenshots",
          "There are no extra screenshots to process.",
          "neutral"
        )
      }),
    ]

    return () => {
      resizeObserver.disconnect()
      cleanupFunctions.forEach((cleanup) => cleanup())
    }
  }, [isTooltipVisible, tooltipHeight, showToast, queryClient, setView])

  const handleTooltipVisibilityChange = (visible: boolean, height: number) => {
    setIsTooltipVisible(visible)
    setTooltipHeight(height)
  }

  const handleDeleteExtraScreenshot = async (index: number) => {
    const screenshotToDelete = extraScreenshots[index]

    try {
      const response = await window.electronAPI.deleteScreenshot(
        screenshotToDelete.path
      )

      if (response.success) {
        // Fetch and update screenshots after successful deletion
        const existing = await window.electronAPI.getScreenshots()
        const screenshots = (Array.isArray(existing) ? existing : []).map(
          (p) => ({
            id: p.path,
            path: p.path,
            preview: p.preview,
            timestamp: Date.now()
          })
        )
        setExtraScreenshots(screenshots)
      } else {
        console.error("Failed to delete extra screenshot:", response.error)
        showToast("Error", "Failed to delete the screenshot", "error")
      }
    } catch (error) {
      console.error("Error deleting extra screenshot:", error)
      showToast("Error", "Failed to delete the screenshot", "error")
    }
  }

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

  // Define the sections with their display titles
  const sections = [
    { id: "problem_restatement", title: "1. Problem Restatement" },
    { id: "inputs_outputs_constraints", title: "2. Inputs, Outputs & Constraints" },
    { id: "edge_cases", title: "3. Edge Cases" },
    { id: "pattern_recognition", title: "4. Pattern Recognition" },
    { id: "approaches", title: "5. Solution Approaches" },
    { id: "pseudocode", title: "6. Pseudocode" },
    { id: "code", title: "7. Code Solution" },
    { id: "complexity", title: "8. Complexity Analysis" },
    { id: "walkthrough", title: "9. Example Walkthrough" },
    { id: "visual_aid", title: "10. Visual Aid" },
    { id: "further_practice", title: "11. Further Practice" },
  ]

  // Get content for the active section
  const getActiveContent = () => {
    if (!solutionData) return "Loading solution..."

    switch (activeSection) {
      case "problem_restatement":
        return solutionData.problem_restatement || "No problem restatement available"
      case "inputs_outputs_constraints":
        return solutionData.inputs_outputs_constraints || "No inputs/outputs analysis available"
      case "edge_cases":
        return solutionData.edge_cases || "No edge cases identified"
      case "pattern_recognition":
        return solutionData.pattern_recognition || "No pattern recognition available"
      case "approaches":
        return solutionData.approaches || "No approaches described"
      case "pseudocode":
        return solutionData.pseudocode || "No pseudocode available"
      case "code":
        // For code, we'll return it directly to be handled by the code renderer
        return solutionData.code || "// No code solution available"
      case "complexity":
        const timeComplexity = solutionData.complexity?.time || "Not analyzed";
        const spaceComplexity = solutionData.complexity?.space || "Not analyzed";
        return `### Time Complexity\n${timeComplexity}\n\n### Space Complexity\n${spaceComplexity}`;
      case "walkthrough":
        return solutionData.walkthrough || "No walkthrough available"
      case "visual_aid":
        return solutionData.visual_aid || "No visual aid available"
      case "further_practice":
        return solutionData.further_practice || "No further practice suggested"
      default:
        return "Select a section from the sidebar"
    }
  }

  return (
    <>
      {!isResetting && queryClient.getQueryData(["new_solution"]) ? (
        <Debug
          isProcessing={debugProcessing}
          setIsProcessing={setDebugProcessing}
          currentLanguage={currentLanguage}
          setLanguage={setLanguage}
        />
      ) : (
        <div ref={contentRef} className="relative">
          <div className="space-y-3 px-4 py-3">
          {/* Conditionally render the screenshot queue if solutionData is available */}
          {solutionData && (
            <div className="bg-transparent w-fit">
              <div className="pb-3">
                <div className="space-y-3 w-fit">
                  <ScreenshotQueue
                    isLoading={debugProcessing}
                    screenshots={extraScreenshots}
                    onDeleteScreenshot={handleDeleteExtraScreenshot}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Navbar of commands with the SolutionsHelper */}
          <SolutionCommands
            onTooltipVisibilityChange={handleTooltipVisibilityChange}
            isProcessing={!problemInfo || !solutionData}
            extraScreenshots={extraScreenshots}
            credits={credits}
            currentLanguage={currentLanguage}
            setLanguage={setLanguage}
          />

          {/* Main Content - New Layout Structure */}
          <div className="w-full text-sm text-black bg-black/60 rounded-md">
            <div className="rounded-lg overflow-hidden">
              {!solutionData && (
                <div className="px-4 py-3 space-y-4 max-w-full">
                  <div className="space-y-2">
                    <h2 className="text-[13px] font-medium text-white tracking-wide">
                      Problem Statement
                    </h2>
                    {!problemInfo ? (
                      <div className="mt-4 flex">
                        <p className="text-xs bg-gradient-to-r from-gray-300 via-gray-100 to-gray-300 bg-clip-text text-transparent animate-pulse">
                          Extracting problem statement...
                        </p>
                      </div>
                    ) : (
                      <div className="text-[13px] leading-[1.4] text-gray-100 max-w-[600px]">
                        {problemInfo.problem_statement}
                      </div>
                    )}
                  </div>
                  
                  {problemInfo && (
                    <div className="mt-4 flex">
                      <p className="text-xs bg-gradient-to-r from-gray-300 via-gray-100 to-gray-300 bg-clip-text text-transparent animate-pulse">
                        Generating educational solution...
                      </p>
                    </div>
                  )}
                </div>
              )}

              {solutionData && (
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
              )}
            </div>
          </div>
        </div>
      </div>
      )}
    </>
  )
}

export default Solutions