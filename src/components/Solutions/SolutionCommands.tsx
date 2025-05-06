import React, { useState, useEffect, useRef } from "react"
import { useToast } from "../../contexts/toast"
import { Screenshot } from "../../types/screenshots"
import { supabase } from "../../lib/supabase"
import { LanguageSelector } from "../shared/LanguageSelector"
import { COMMAND_KEY } from "../../utils/platform"
import { User } from "@supabase/supabase-js"
import { BrainCircuit } from "lucide-react"

export interface SolutionCommandsProps {
  onTooltipVisibilityChange: (visible: boolean, height: number) => void
  isProcessing: boolean
  screenshots?: Screenshot[]
  extraScreenshots?: Screenshot[]
  credits: number
  currentLanguage: string
  setLanguage: (language: string) => void
  user: User  // New prop
  showDashboard: () => void  // Add this prop to the interface
}

const SolutionCommands: React.FC<SolutionCommandsProps> = ({
  onTooltipVisibilityChange,
  isProcessing,
  extraScreenshots = [],
  credits,
  currentLanguage,
  setLanguage,
  user,
  showDashboard  // Add this to the destructured props
}) => {
  const [isTooltipVisible, setIsTooltipVisible] = useState(false)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const { showToast } = useToast()

  // Extract user's first name for profile display 
  const getUserFullName = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return "User";
  };

  const getInitial = () => {
    const name = getUserFullName();
    return name.charAt(0).toUpperCase();
  };

  useEffect(() => {
    if (onTooltipVisibilityChange) {
      let tooltipHeight = 0
      if (tooltipRef.current && isTooltipVisible) {
        tooltipHeight = tooltipRef.current.offsetHeight + 10 // Adjust if necessary
      }
      onTooltipVisibilityChange(isTooltipVisible, tooltipHeight)
    }
  }, [isTooltipVisible, onTooltipVisibilityChange])

  const handleSignOut = async () => {
    try {
      // Call Supabase sign out
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Clear any local storage or electron-specific data
      localStorage.clear();
      sessionStorage.clear();

      // Clear the API key in the configuration
      await window.electronAPI.updateConfig({
        apiKey: '',
      });

      showToast('Success', 'Logged out successfully', 'success');

      // Reload the app after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      console.error("Error logging out:", err);
      showToast('Error', 'Failed to log out', 'error');
    }
  };

  const handleMouseEnter = () => {
    setIsTooltipVisible(true)
  }

  const handleMouseLeave = () => {
    setIsTooltipVisible(false)
  }

  return (
    <div>
      <div className="pt-2 w-fit">
        <div className="text-xs text-white/90 backdrop-blur-md bg-black/60 rounded-lg py-2 px-4 flex items-center justify-center gap-4">
          {/* Logo and Title */}
          <div className="flex items-center gap-2 mr-3">
            <div className="w-7 h-7">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                {/* Rounded square background */}
                <rect width="100%" height="100%" rx="100" ry="100" fill="#ffdd00" />

                {/* Subtle glow effect */}
                <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="5" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>

                {/* Code brackets and elements - centered, bold, popping design */}
                <g transform="translate(16, 0)" filter="url(#glow)">
                  {/* Left bracket - bolder, centered */}
                  <path d="M130,256 L190,186 M130,256 L190,326" fill="none" stroke="#000000" stroke-width="20" stroke-linecap="round" stroke-linejoin="round" />

                  {/* Right bracket - bolder, centered */}
                  <path d="M362,256 L302,186 M362,256 L302,326" fill="none" stroke="#000000" stroke-width="20" stroke-linecap="round" stroke-linejoin="round" />

                  {/* Slash - bolder, centered */}
                  <path d="M230,156 L290,356" fill="none" stroke="#000000" stroke-width="20" stroke-linecap="round" stroke-linejoin="round" />

                  {/* Dot/connection point - larger */}
                  <circle cx="290" cy="290" r="15" fill="#000000" />
                </g>

                {/* Adding depth with subtle shadow */}
                <rect x="2" y="2" width="508" height="508" rx="100" ry="100" fill="none" stroke="#F5F5F5" stroke-width="1" opacity="0.3" />
              </svg>
            </div>
            <span className="text-[14px] font-medium text-white/90 whitespace-nowrap">Leetcode Helper</span>
          </div>

          {/* Show/Hide - Always visible */}
          <div
            className="flex items-center gap-2 cursor-pointer rounded px-2 py-1.5 hover:bg-white/10 transition-colors"
            onClick={async () => {
              try {
                const result = await window.electronAPI.toggleMainWindow()
                if (!result.success) {
                  console.error("Failed to toggle window:", result.error)
                  showToast("Error", "Failed to toggle window", "error")
                }
              } catch (error) {
                console.error("Error toggling window:", error)
                showToast("Error", "Failed to toggle window", "error")
              }
            }}
          >
            <span className="text-[11px] leading-none">Show/Hide</span>
            <div className="flex gap-1">
              <button className="bg-white/10 rounded-md px-1.5 py-1 text-[11px] leading-none text-white/70">
                {COMMAND_KEY}
              </button>
              <button className="bg-white/10 rounded-md px-1.5 py-1 text-[11px] leading-none text-white/70">
                B
              </button>
            </div>
          </div>

          {/* Screenshot and Debug commands - Only show if not processing */}
          {!isProcessing && (
            <>
              <div
                className="flex items-center gap-2 cursor-pointer rounded px-2 py-1.5 hover:bg-white/10 transition-colors"
                onClick={async () => {
                  try {
                    const result = await window.electronAPI.triggerScreenshot()
                    if (!result.success) {
                      console.error("Failed to take screenshot:", result.error)
                      showToast("Error", "Failed to take screenshot", "error")
                    }
                  } catch (error) {
                    console.error("Error taking screenshot:", error)
                    showToast("Error", "Failed to take screenshot", "error")
                  }
                }}
              >
                <span className="text-[11px] leading-none truncate">
                  {extraScreenshots.length === 0
                    ? "Screenshot your code"
                    : "Screenshot"}
                </span>
                <div className="flex gap-1">
                  <button className="bg-white/10 rounded-md px-1.5 py-1 text-[11px] leading-none text-white/70">
                    {COMMAND_KEY}
                  </button>
                  <button className="bg-white/10 rounded-md px-1.5 py-1 text-[11px] leading-none text-white/70">
                    H
                  </button>
                </div>
              </div>

              {extraScreenshots.length > 0 && (
                <div
                  className="flex items-center gap-2 cursor-pointer rounded px-2 py-1.5 hover:bg-white/10 transition-colors"
                  onClick={async () => {
                    try {
                      const result =
                        await window.electronAPI.triggerProcessScreenshots()
                      if (!result.success) {
                        console.error(
                          "Failed to process screenshots:",
                          result.error
                        )
                        showToast(
                          "Error",
                          "Failed to process screenshots",
                          "error"
                        )
                      }
                    } catch (error) {
                      console.error("Error processing screenshots:", error)
                      showToast(
                        "Error",
                        "Failed to process screenshots",
                        "error"
                      )
                    }
                  }}
                >
                  <span className="text-[11px] leading-none">Debug</span>
                  <div className="flex gap-1">
                    <button className="bg-white/10 rounded-md px-1.5 py-1 text-[11px] leading-none text-white/70">
                      {COMMAND_KEY}
                    </button>
                    <button className="bg-white/10 rounded-md px-1.5 py-1 text-[11px] leading-none text-white/70">
                      ↵
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Start Over - Always visible */}
          <div
            className="flex items-center gap-2 cursor-pointer rounded px-2 py-1.5 hover:bg-white/10 transition-colors"
            onClick={async () => {
              try {
                const result = await window.electronAPI.triggerReset()
                if (!result.success) {
                  console.error("Failed to reset:", result.error)
                  showToast("Error", "Failed to reset", "error")
                }
              } catch (error) {
                console.error("Error resetting:", error)
                showToast("Error", "Failed to reset", "error")
              }
            }}
          >
            <span className="text-[11px] leading-none">Start Over</span>
            <div className="flex gap-1">
              <button className="bg-white/10 rounded-md px-1.5 py-1 text-[11px] leading-none text-white/70">
                {COMMAND_KEY}
              </button>
              <button className="bg-white/10 rounded-md px-1.5 py-1 text-[11px] leading-none text-white/70">
                R
              </button>
            </div>
          </div>

          {/* Settings with Tooltip */}
          <div
            className="relative inline-block"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {/* Gear icon */}
            <div className="w-4 h-4 flex items-center justify-center cursor-pointer text-white/70 hover:text-white/90 transition-colors">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-3.5 h-3.5"
              >
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l-.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </div>

            {/* Tooltip Content */}
            {isTooltipVisible && (
              <div
                ref={tooltipRef}
                className="absolute top-full right-0 mt-2 w-80"
                style={{ zIndex: 100 }}
              >
                {/* Add transparent bridge */}
                <div className="absolute -top-2 right-0 w-full h-2" />
                <div className="p-3 text-xs bg-black/80 backdrop-blur-md rounded-lg border border-white/10 text-white/90 shadow-lg">
                  <div className="space-y-4">
                    <h3 className="font-medium whitespace-nowrap">
                      Keyboard Shortcuts
                    </h3>
                    <div className="space-y-3">
                      {/* Show/Hide - Always visible */}
                      <div
                        className="cursor-pointer rounded px-2 py-1.5 hover:bg-white/10 transition-colors"
                        onClick={async () => {
                          try {
                            const result =
                              await window.electronAPI.toggleMainWindow()
                            if (!result.success) {
                              console.error(
                                "Failed to toggle window:",
                                result.error
                              )
                              showToast(
                                "Error",
                                "Failed to toggle window",
                                "error"
                              )
                            }
                          } catch (error) {
                            console.error("Error toggling window:", error)
                            showToast(
                              "Error",
                              "Failed to toggle window",
                              "error"
                            )
                          }
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="truncate">Toggle Window</span>
                          <div className="flex gap-1 flex-shrink-0">
                            <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px] leading-none">
                              {COMMAND_KEY}
                            </span>
                            <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px] leading-none">
                              B
                            </span>
                          </div>
                        </div>
                        <p className="text-[10px] leading-relaxed text-white/70 truncate mt-1">
                          Show or hide this window.
                        </p>
                      </div>

                      {/* Screenshot and Debug commands - Only show if not processing */}
                      {!isProcessing && (
                        <>
                          <div
                            className="cursor-pointer rounded px-2 py-1.5 hover:bg-white/10 transition-colors"
                            onClick={async () => {
                              try {
                                const result =
                                  await window.electronAPI.triggerScreenshot()
                                if (!result.success) {
                                  console.error(
                                    "Failed to take screenshot:",
                                    result.error
                                  )
                                  showToast(
                                    "Error",
                                    "Failed to take screenshot",
                                    "error"
                                  )
                                }
                              } catch (error) {
                                console.error("Error taking screenshot:", error)
                                showToast(
                                  "Error",
                                  "Failed to take screenshot",
                                  "error"
                                )
                              }
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <span className="truncate">Take Screenshot</span>
                              <div className="flex gap-1 flex-shrink-0">
                                <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px] leading-none">
                                  {COMMAND_KEY}
                                </span>
                                <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px] leading-none">
                                  H
                                </span>
                              </div>
                            </div>
                            <p className="text-[10px] leading-relaxed text-white/70 truncate mt-1">
                              Capture additional parts of the question or your
                              solution for debugging help.
                            </p>
                          </div>

                          {extraScreenshots.length > 0 && (
                            <div
                              className="cursor-pointer rounded px-2 py-1.5 hover:bg-white/10 transition-colors"
                              onClick={async () => {
                                try {
                                  const result =
                                    await window.electronAPI.triggerProcessScreenshots()
                                  if (!result.success) {
                                    console.error(
                                      "Failed to process screenshots:",
                                      result.error
                                    )
                                    showToast(
                                      "Error",
                                      "Failed to process screenshots",
                                      "error"
                                    )
                                  }
                                } catch (error) {
                                  console.error(
                                    "Error processing screenshots:",
                                    error
                                  )
                                  showToast(
                                    "Error",
                                    "Failed to process screenshots",
                                    "error"
                                  )
                                }
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <span className="truncate">Debug</span>
                                <div className="flex gap-1 flex-shrink-0">
                                  <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px] leading-none">
                                    {COMMAND_KEY}
                                  </span>
                                  <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px] leading-none">
                                    ↵
                                  </span>
                                </div>
                              </div>
                              <p className="text-[10px] leading-relaxed text-white/70 truncate mt-1">
                                Generate new solutions based on all previous and
                                newly added screenshots.
                              </p>
                            </div>
                          )}
                        </>
                      )}

                      {/* Click Through Command */}
                      <div
                        className="cursor-pointer rounded px-2 py-1.5 hover:bg-white/10 transition-colors"
                        onClick={async () => {
                          try {
                            const result = await window.electronAPI.toggleClickThrough()
                            if (!result.success) {
                              console.error("Failed to toggle click-through mode:", result.error)
                              showToast("Error", "Failed to toggle click-through mode use CTR + T instead", "error")
                            }
                          } catch (error) {
                            console.error("Error toggling click-through mode:", error)
                            showToast("Error", "Failed to toggle click-through mode use CTR + T instead", "error")
                          }
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="truncate">Click Through (Enable/Disable)</span>
                          <div className="flex gap-1 flex-shrink-0">
                            <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px] leading-none">
                              {COMMAND_KEY}
                            </span>
                            <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px] leading-none">
                              T
                            </span>
                          </div>
                        </div>
                        <p className="text-[10px] leading-relaxed text-white/70 truncate mt-1">
                          Enable or disable click-through mode for the window.
                        </p>
                      </div>
                      {/* Reset Command */}
                      <div
                        className="cursor-pointer rounded px-2 py-1.5 hover:bg-white/10 transition-colors"
                        onClick={async () => {
                          try {
                            const result = await window.electronAPI.triggerReset()
                            if (!result.success) {
                              console.error("Failed to reset:", result.error)
                              showToast("Error", "Failed to reset", "error")
                            }
                          } catch (error) {
                            console.error("Error resetting:", error)
                            showToast("Error", "Failed to reset", "error")
                          }
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="truncate">Start Over</span>
                          <div className="flex gap-1 flex-shrink-0">
                            <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px] leading-none">
                              {COMMAND_KEY}
                            </span>
                            <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px] leading-none">
                              R
                            </span>
                          </div>
                        </div>
                        <p className="text-[10px] leading-relaxed text-white/70 truncate mt-1">
                          Start fresh with a new question.
                        </p>
                      </div>
                    </div>

                    {/* Separator and Log Out */}
                    <div className="pt-3 mt-3 border-t border-white/10">
                      <LanguageSelector
                        currentLanguage={currentLanguage}
                        setLanguage={setLanguage}
                      />

                      {/* API Key Settings */}
                      <div className="mb-3 px-2 space-y-1">
                        <div className="flex items-center justify-between text-[13px] font-medium text-white/90">
                          <span>API Settings</span>
                          <button
                            className="bg-white/10 hover:bg-white/20 px-2 py-1 rounded text-[11px]"
                            onClick={() => window.electronAPI.openSettingsPortal()}
                          >
                            Settings
                          </button>
                        </div>
                      </div>
                      {/* Creator Section with Social Links */}
                    <div className="flex items-center justify-between gap-2 px-2 py-1.5">
                      <span className="text-[11px] leading-none text-white/70">Follow App's Creator:</span>
                      <div className="flex items-center gap-4">
                        {/* GitHub Link */}
                        <a 
                          href="#" 
                          onClick={(e) => {
                            e.preventDefault();
                            window.electronAPI.openExternal("https://github.com/purelyricky/");
                          }}
                          className="text-white/70 hover:text-white/90 transition-colors"
                          title="GitHub Profile"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                          </svg>
                        </a>
                        
                        {/* LinkedIn Link */}
                        <a 
                          href="#" 
                          onClick={(e) => {
                            e.preventDefault();
                            window.electronAPI.openExternal("https://www.linkedin.com/in/purelyricky/");
                          }}
                          className="text-white/70 hover:text-white/90 transition-colors"
                          title="LinkedIn Profile"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                            <rect x="2" y="9" width="4" height="12"></rect>
                            <circle cx="4" cy="4" r="2"></circle>
                          </svg>
                        </a>
                      </div>
                    </div>


                      {/* Add dashboard button */}
                      <div
                        className="flex items-center gap-2 cursor-pointer rounded px-2 py-1.5 hover:bg-white/10 transition-colors"
                        onClick={showDashboard}  // Use showDashboard instead of setView 
                      >
                        <span className="text-[11px] leading-none">Dashboard</span>
                        <div className="flex gap-1">
                          <button className="bg-white/10 rounded-md px-1.5 py-1 text-[11px] leading-none text-white/70">
                            <BrainCircuit className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Separator */}
                      <div className="h-px w-full bg-white/10" />

                      {/* User Profile with Sign Out */}
                      <div
                        className="flex items-center justify-between gap-4 cursor-pointer rounded px-2 py-1.5 hover:bg-white/10 transition-colors w-full"
                        onClick={handleSignOut}
                        title="Click to sign out"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-medium">
                            {getInitial()}
                          </div>
                          <span className="text-[11px] leading-none truncate max-w-[80px]">
                            {getUserFullName()}
                          </span>
                        </div>
                        <span className="text-[11px] leading-none text-red-400">
                          Sign Out
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SolutionCommands
