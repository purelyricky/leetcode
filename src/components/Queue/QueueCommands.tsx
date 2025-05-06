import React, { useState, useEffect, useRef } from "react"
import { createRoot } from "react-dom/client"
import { useToast } from "../../contexts/toast"
import { LanguageSelector } from "../shared/LanguageSelector"
import { COMMAND_KEY } from "../../utils/platform"
import { supabase } from "../../lib/supabase"
import { User } from "@supabase/supabase-js"
import { BrainCircuit } from "lucide-react"

interface QueueCommandsProps {
  onTooltipVisibilityChange: (visible: boolean, height: number) => void
  screenshotCount?: number
  credits: number
  currentLanguage: string
  setLanguage: (language: string) => void
  user: User  // New prop
  showDashboard: () => void  // Add this prop to the interface
}

const QueueCommands: React.FC<QueueCommandsProps> = ({
  onTooltipVisibilityChange,
  screenshotCount = 0,
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

  // Extract the repeated language selection logic into a separate function
  const extractLanguagesAndUpdate = (direction?: 'next' | 'prev') => {
    // Create a hidden instance of LanguageSelector to extract languages
    const hiddenRenderContainer = document.createElement('div');
    hiddenRenderContainer.style.position = 'absolute';
    hiddenRenderContainer.style.left = '-9999px';
    document.body.appendChild(hiddenRenderContainer);

    // Create a root and render the LanguageSelector temporarily
    const root = createRoot(hiddenRenderContainer);
    root.render(
      <LanguageSelector
        currentLanguage={currentLanguage}
        setLanguage={() => { }}
      />
    );

    // Use a small delay to ensure the component has rendered
    // 50ms is generally enough for React to complete a render cycle
    setTimeout(() => {
      // Extract options from the rendered select element
      const selectElement = hiddenRenderContainer.querySelector('select');
      if (selectElement) {
        const options = Array.from(selectElement.options);
        const values = options.map(opt => opt.value);

        // Find current language index
        const currentIndex = values.indexOf(currentLanguage);
        let newIndex = currentIndex;

        if (direction === 'prev') {
          // Go to previous language
          newIndex = (currentIndex - 1 + values.length) % values.length;
        } else {
          // Default to next language
          newIndex = (currentIndex + 1) % values.length;
        }

        if (newIndex !== currentIndex) {
          setLanguage(values[newIndex]);
          window.electronAPI.updateConfig({ language: values[newIndex] });
        }
      }

      // Clean up
      root.unmount();
      document.body.removeChild(hiddenRenderContainer);
    }, 50);
  };

  useEffect(() => {
    let tooltipHeight = 0
    if (tooltipRef.current && isTooltipVisible) {
      tooltipHeight = tooltipRef.current.offsetHeight + 10
    }
    onTooltipVisibilityChange(isTooltipVisible, tooltipHeight)
  }, [isTooltipVisible])

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

  // Handle language change
  const handleLanguageChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = e.target.value

    try {
      // Save language preference to electron store
      await window.electronAPI.updateConfig({ language: newLanguage })

      // Update global language variable
      window.__LANGUAGE__ = newLanguage

      // Update state in React
      setLanguage(newLanguage)

      console.log(`Language changed to ${newLanguage}`);
    } catch (error) {
      console.error("Error updating language:", error)
      showToast("Error", "Failed to update language", "error")
    }
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

          {/* Screenshot */}
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
              {screenshotCount === 0
                ? "Take first screenshot"
                : screenshotCount === 1
                  ? "Take second screenshot"
                  : screenshotCount === 2
                    ? "Take third screenshot"
                    : screenshotCount === 3
                      ? "Take fourth screenshot"
                      : screenshotCount === 4
                        ? "Take fifth screenshot"
                        : "Next will replace first screenshot"}
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

          {/* Solve Command */}
          {screenshotCount > 0 && (
            <div
              className={`flex flex-col cursor-pointer rounded px-2 py-1.5 hover:bg-white/10 transition-colors ${credits <= 0 ? "opacity-50 cursor-not-allowed" : ""
                }`}
              onClick={async () => {

                try {
                  const result =
                    await window.electronAPI.triggerProcessScreenshots()
                  if (!result.success) {
                    console.error(
                      "Failed to process screenshots:",
                      result.error
                    )
                    showToast("Error", "Failed to process screenshots", "error")
                  }
                } catch (error) {
                  console.error("Error processing screenshots:", error)
                  showToast("Error", "Failed to process screenshots", "error")
                }
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] leading-none">Solve </span>
                <div className="flex gap-1 ml-2">
                  <button className="bg-white/10 rounded-md px-1.5 py-1 text-[11px] leading-none text-white/70">
                    {COMMAND_KEY}
                  </button>
                  <button className="bg-white/10 rounded-md px-1.5 py-1 text-[11px] leading-none text-white/70">
                    ↵
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Separator */}
          <div className="mx-2 h-4 w-px bg-white/20" />

          {/* Language Selector - Added before the gear icon */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] leading-none whitespace-nowrap">Language:</span>
            <select
              value={currentLanguage}
              onChange={handleLanguageChange}
              className="bg-black/80 text-white/90 rounded px-2 py-1 text-[11px] outline-none border border-white/10 focus:border-white/20 cursor-pointer"
              style={{ WebkitAppearance: 'menulist' }}
            >
              <option value="python" className="bg-black text-white">Python</option>
              <option value="javascript" className="bg-black text-white">JavaScript</option>
              <option value="java" className="bg-black text-white">Java</option>
              <option value="golang" className="bg-black text-white">Go</option>
              <option value="cpp" className="bg-black text-white">C++</option>
              <option value="swift" className="bg-black text-white">Swift</option>
              <option value="kotlin" className="bg-black text-white">Kotlin</option>
              <option value="ruby" className="bg-black text-white">Ruby</option>
              <option value="r" className="bg-black text-white">R</option>
            </select>
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
                className="absolute top-full left-0 mt-2 w-80 transform -translate-x-[calc(50%-12px)]"
                style={{ zIndex: 100 }}
              >
                {/* Add transparent bridge */}
                <div className="absolute -top-2 right-0 w-full h-2" />
                <div className="p-3 text-xs bg-black/80 backdrop-blur-md rounded-lg border border-white/10 text-white/90 shadow-lg">
                  <div className="space-y-4">
                    <h3 className="font-medium truncate">Keyboard Shortcuts</h3>
                    <div className="space-y-3">
                      {/* Toggle Command */}
                      <div
                        className="cursor-pointer rounded px-2 py-1.5 hover:bg-white/10 transition-colors"
                        onClick={async () => {
                          try {
                            const result =
                              await window.electronAPI.toggleMainWindow()
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
                        <div className="flex items-center justify-between">
                          <span>Show/Hide Window</span>
                          <div className="flex gap-1">
                            <button className="bg-white/10 rounded-md px-1.5 py-1 text-[11px] leading-none text-white/70">
                              {COMMAND_KEY}
                            </button>
                            <button className="bg-white/10 rounded-md px-1.5 py-1 text-[11px] leading-none text-white/70">
                              B
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Screenshot Command */}
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
                          <span>Take Screenshot</span>
                          <div className="flex gap-1">
                            <button className="bg-white/10 rounded-md px-1.5 py-1 text-[11px] leading-none text-white/70">
                              {COMMAND_KEY}
                            </button>
                            <button className="bg-white/10 rounded-md px-1.5 py-1 text-[11px] leading-none text-white/70">
                              H
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Delete Last Screenshot Command */}
                      <div
                        className="cursor-pointer rounded px-2 py-1.5 hover:bg-white/10 transition-colors"
                        onClick={async () => {
                          try {
                            const result =
                              await window.electronAPI.deleteLastScreenshot()
                            if (!result.success) {
                              console.error(
                                "Failed to delete last screenshot:",
                                result.error
                              )
                              showToast(
                                "Error",
                                "Failed to delete last screenshot",
                                "error"
                              )
                            }
                          } catch (error) {
                            console.error(
                              "Error deleting last screenshot:",
                              error
                            )
                            showToast(
                              "Error",
                              "Failed to delete last screenshot",
                              "error"
                            )
                          }
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span>Delete Last Screenshot</span>
                          <div className="flex gap-1">
                            <button className="bg-white/10 rounded-md px-1.5 py-1 text-[11px] leading-none text-white/70">
                              {COMMAND_KEY}
                            </button>
                            <button className="bg-white/10 rounded-md px-1.5 py-1 text-[11px] leading-none text-white/70">
                              L
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Process Screenshots Command */}
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
                          <span>Process Screenshots</span>
                          <div className="flex gap-1">
                            <button className="bg-white/10 rounded-md px-1.5 py-1 text-[11px] leading-none text-white/70">
                              {COMMAND_KEY}
                            </button>
                            <button className="bg-white/10 rounded-md px-1.5 py-1 text-[11px] leading-none text-white/70">
                              ↵
                            </button>
                          </div>
                        </div>
                      </div>

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
                            const result =
                              await window.electronAPI.triggerReset()
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
                          <span>Reset View</span>
                          <div className="flex gap-1">
                            <button className="bg-white/10 rounded-md px-1.5 py-1 text-[11px] leading-none text-white/70">
                              {COMMAND_KEY}
                            </button>
                            <button className="bg-white/10 rounded-md px-1.5 py-1 text-[11px] leading-none text-white/70">
                              R
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Quit Command */}
                      <div
                        className="cursor-pointer rounded px-2 py-1.5 hover:bg-white/10 transition-colors"
                        onClick={async () => {
                          try {
                            await window.electronAPI.quitApp()
                          } catch (error) {
                            console.error("Error quitting app:", error)
                          }
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span>Quit App</span>
                          <div className="flex gap-1">
                            <button className="bg-white/10 rounded-md px-1.5 py-1 text-[11px] leading-none text-white/70">
                              {COMMAND_KEY}
                            </button>
                            <button className="bg-white/10 rounded-md px-1.5 py-1 text-[11px] leading-none text-white/70">
                              Q
                            </button>
                          </div>
                        </div>
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

                    {/* Separator */}
                    <div className="h-px w-full bg-white/10" />

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

                    {/* Separator */}
                    <div className="h-px w-full bg-white/10" />
                    {/* Dashboard Button */}
                    <div
                      className="flex items-center gap-2 cursor-pointer rounded px-2 py-1.5 hover:bg-white/10 transition-colors"
                      onClick={showDashboard}  // Use showDashboard instead of setView 
                    >
                      <div className="flex items-center gap-1">
                        <BrainCircuit className="w-3.5 h-3.5 text-white/70" />
                        <span className="text-[11px] leading-none">Dashboard</span>
                      </div>
                    </div>

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
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default QueueCommands
