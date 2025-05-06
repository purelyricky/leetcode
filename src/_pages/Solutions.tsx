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
import { User } from "@supabase/supabase-js"
import { CheckCircle, Loader2 } from "lucide-react"

import ScreenshotQueue from "../components/Queue/ScreenshotQueue"
import SolutionCommands from "../components/Solutions/SolutionCommands"
import UserExplanation from "../components/Solutions/UserExplanation"
import BlurredCodeSection from "../components/Solutions/BlurredCodeSection"
import Debug from "./Debug"
import { useToast } from "../contexts/toast"
import { useUser } from "../contexts/userContext"
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
  hasApiKey: boolean
  user: User
  showDashboard: () => void
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

// Flow steps
type SolutionStep = 
  | "extracting" 
  | "user_explanation" 
  | "generating_solution" 
  | "solution_ready"
  | "debug";

const Solutions: React.FC<SolutionsProps> = ({
  setView,
  credits,
  currentLanguage,
  setLanguage,
  hasApiKey,
  user,
  showDashboard
}) => {
  // Main state
  const queryClient = useQueryClient()
  const contentRef = useRef<HTMLDivElement>(null)
  const [currentStep, setCurrentStep] = useState<SolutionStep>("extracting")
  const [problemInfo, setProblemInfo] = useState<any>(null)
  const [solutionData, setSolutionData] = useState<EducationalSolution | null>(null)
  const [activeSection, setActiveSection] = useState<string>("problem_restatement")
  const [debugProcessing, setDebugProcessing] = useState(false)
  const [hasSubmittedExplanation, setHasSubmittedExplanation] = useState(false)
  const [userExplanationText, setUserExplanationText] = useState("")
  const [currentProblemId, setCurrentProblemId] = useState<string>("")

  // UI state
  const [isTooltipVisible, setIsTooltipVisible] = useState(false)
  const [tooltipHeight, setTooltipHeight] = useState(0)
  const [isResetting, setIsResetting] = useState(false)
  const [extraScreenshots, setExtraScreenshots] = useState<any[]>([])

  const { showToast } = useToast()
  const { userProfile } = useUser()

  useEffect(() => {
    // Add a flag to prevent unwanted transitions
    let shouldUpdateStep = true;
    
    // Load problem statement and solution data from cache
    const cachedProblemInfo = queryClient.getQueryData(["problem_statement"]);
    if (cachedProblemInfo && shouldUpdateStep) {
      setProblemInfo(cachedProblemInfo);
      // Only transition if we're in the extracting step
      if (currentStep === "extracting") {
        setCurrentStep("user_explanation");
      }
    }
    
    const cachedSolution = queryClient.getQueryData(["solution"]) as EducationalSolution | null;
    if (cachedSolution && shouldUpdateStep) {
      setSolutionData(cachedSolution);
      // If we already have solution, move to solution ready step
      if (currentStep === "generating_solution") {
        setCurrentStep("solution_ready");
      }
    }

    // Prevent other state changing operations from modifying the currentStep
    // if we're in the user_explanation phase and haven't submitted yet
    if (currentStep === "user_explanation" && !hasSubmittedExplanation) {
      shouldUpdateStep = false;
    }
    
    // Load debug solution if it exists
    const debugSolution = queryClient.getQueryData(["new_solution"]);
    if (debugSolution && shouldUpdateStep) {
      setCurrentStep("debug");
    }

    // Subscribe to query cache updates
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event?.query.queryKey[0] === "problem_statement" && shouldUpdateStep) {
        setProblemInfo(queryClient.getQueryData(["problem_statement"]) || null)
        // When problem statement is extracted, move to user explanation
        if (currentStep === "extracting") {
          setCurrentStep("user_explanation");
        }
      }
      if (event?.query.queryKey[0] === "solution" && shouldUpdateStep) {
        setSolutionData(queryClient.getQueryData(["solution"]) || null)
        // When solution is generated, move to solution ready
        if (currentStep === "generating_solution") {
          setCurrentStep("solution_ready");
        }
      }
      if (event?.query.queryKey[0] === "new_solution" && shouldUpdateStep) {
        setCurrentStep("debug");
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
  }, [queryClient, currentStep, hasSubmittedExplanation])

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
        setCurrentStep("extracting")
        setHasSubmittedExplanation(false)
        setUserExplanationText("")
        setCurrentProblemId("")

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
        setCurrentStep("extracting")
        setHasSubmittedExplanation(false)
      }),
      window.electronAPI.onProblemExtracted((data) => {
        queryClient.setQueryData(["problem_statement"], data)
        setProblemInfo(data)
        setCurrentStep("user_explanation")
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
        
        // Update step state
        setCurrentStep("solution_ready")

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
        setCurrentStep("debug")
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

  // Handle user explanation completion
  const handleExplanationComplete = (
    explanationSubmitted: boolean, 
    explanationText: string,
    problemId: string
  ) => {
    setHasSubmittedExplanation(true);
    setUserExplanationText(explanationText);
    setCurrentProblemId(problemId);
    
    // Move to generating solution step
    setCurrentStep("generating_solution");
    
    if (!explanationSubmitted) {
      showToast(
        "Skipping explanation", 
        "Please try to provide your own solution next time, it helps your learning!",
        "neutral"
      );
    } else {
      showToast(
        "Explanation submitted",
        "Generating a personalized solution for you...",
        "success"
      );
    }
  };

  // Render the markdown content with syntax highlighting for code blocks
  const renderMarkdown = (content: string) => {
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          code({ node, inline, className, children, ...props }) {
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
    { id: "problem_restatement", title: "1. Problem Restatement & Thinking Process" },
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
        // For code, we'll return it directly to be handled by BlurredCodeSection
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

  // Render based on current step
  const renderCurrentStep = () => {
    // If debug view is active
    if (currentStep === "debug") {
      return (
        <Debug
          isProcessing={debugProcessing}
          setIsProcessing={setDebugProcessing}
          currentLanguage={currentLanguage}
          setLanguage={setLanguage}
          user={user}
        />
      );
    }

    // Extracting problem step
    if (currentStep === "extracting") {
      return (
        <div className="px-4 py-3 space-y-4 max-w-full">
          <div className="space-y-2">
            <h2 className="text-[13px] font-medium text-white tracking-wide">
              Problem Extraction
            </h2>
            <div className="flex items-center space-x-3 text-white/70">
              <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
              <p className="text-sm">Analyzing screenshots and extracting problem details...</p>
            </div>
          </div>
        </div>
      );
    }

    // User explanation step
    if (currentStep === "user_explanation") {
      return (
        <div className="px-4 py-3 space-y-4 max-w-full">
          {problemInfo && (
            <div className="space-y-4">
              <div className="space-y-2">
                <h2 className="text-[13px] font-medium text-white tracking-wide">
                  Problem Statement
                </h2>
                <div className="text-[13px] leading-[1.4] text-gray-100 max-w-[600px] p-4 bg-black/40 rounded-md border border-white/10">
                  {problemInfo.problem_statement}
                </div>
              </div>
              
              <UserExplanation
                problemInfo={problemInfo}
                onComplete={handleExplanationComplete}
              />
            </div>
          )}
        </div>
      );
    }

    // Generating solution step
    if (currentStep === "generating_solution") {
      return (
        <div className="px-4 py-3 space-y-4 max-w-full">
          <div className="space-y-2">
            <h2 className="text-[13px] font-medium text-white tracking-wide mb-4">
              Problem Statement
            </h2>
            {problemInfo && (
              <div className="text-[13px] leading-[1.4] text-gray-100 max-w-[600px] p-4 bg-black/40 rounded-md border border-white/10 mb-8">
                {problemInfo.problem_statement}
              </div>
            )}
            
            <div className="flex items-center space-x-3 text-white/70 bg-black/40 rounded-md p-4 border border-white/10">
              <div className="flex flex-col items-center space-y-2">
                <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <p className="text-sm text-white/90">Problem extracted successfully</p>
                </div>
                <div className="flex items-center gap-2">
                  {hasSubmittedExplanation ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <p className="text-sm text-white/90">Your explanation recorded</p>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 text-yellow-500" />
                      <p className="text-sm text-white/90">Explanation skipped</p>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                  <p className="text-sm">Generating educational solution...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Solution ready
    if (currentStep === "solution_ready" && solutionData) {
      return (
        <div className="flex flex-row">
          {/* Sidebar with section links */}
          <SolutionSidebar>
            {sections.map(section => (
              <button
                key={section.id}
                className={`w-full text-left px-4 py-2 text-sm ${activeSection === section.id
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
                <BlurredCodeSection
                  code={solutionData.code}
                  language={currentLanguage === "golang" ? "go" : currentLanguage}
                  title="Complete Code Solution"
                  sectionIndex={0}
                  problemId={currentProblemId}
                  hintType="code"
                />
              ) : (
                <div className="prose prose-invert prose-sm max-w-none">
                  {renderMarkdown(getActiveContent())}
                </div>
              )}
            </SolutionSection>
          </SolutionContent>
        </div>
      );
    }

    // Default/fallback view
    return (
      <div className="p-4 text-center">
        <p className="text-white/70 text-sm">Loading solution data...</p>
      </div>
    );
  };

  return (
    <>
      {!isResetting && queryClient.getQueryData(["new_solution"]) ? (
        <Debug
          isProcessing={debugProcessing}
          setIsProcessing={setDebugProcessing}
          currentLanguage={currentLanguage}
          setLanguage={setLanguage}
          user={user}
        />
      ) : (
        <div ref={contentRef} className="relative">
          <div className="space-y-3 px-4 py-3">

            {/* API Key Warning Message */}
            {!hasApiKey && (
              <div className="mb-4 p-3 bg-amber-500 border border-amber-500/30 rounded-md">
                <p className="text-sm text-black-900">
                  You have no API Key saved, please add one from settings
                </p>
              </div>
            )}

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
              isProcessing={currentStep === "extracting" || currentStep === "generating_solution"}
              extraScreenshots={extraScreenshots}
              credits={credits}
              currentLanguage={currentLanguage}
              setLanguage={setLanguage}
              user={user}
              showDashboard={showDashboard}
            />

            {/* Main Content Area */}
            <div className="w-full text-sm text-black bg-black/60 rounded-md">
              <div className="rounded-lg overflow-hidden">
                {renderCurrentStep()}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Solutions