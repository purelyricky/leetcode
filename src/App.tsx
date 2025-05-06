import SubscribedApp from "./_pages/SubscribedApp"
import { UpdateNotification } from "./components/UpdateNotification"
import {
  QueryClient,
  QueryClientProvider
} from "@tanstack/react-query"
import { useEffect, useState, useCallback } from "react"
import {
  Toast,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport
} from "./components/ui/toast"
import { ToastContext } from "./contexts/toast"
import { WelcomeScreen } from "./components/WelcomeScreen"
import { SettingsDialog } from "./components/Settings/SettingsDialog"
import AuthPage from "./_pages/AuthPage"
import { supabase } from "./lib/supabase"
import { User } from "@supabase/supabase-js"
import { UserProvider } from "./contexts/userContext"
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from './_pages/Dashboard'

// Create a React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      gcTime: Infinity,
      retry: 1,
      refetchOnWindowFocus: false
    },
    mutations: {
      retry: 1
    }
  }
})

// Root component that provides the QueryClient
function App() {
  const [toastState, setToastState] = useState({
    open: false,
    title: "",
    description: "",
    variant: "neutral" as "neutral" | "success" | "error"
  })
  const [credits, setCredits] = useState<number>(999) // Unlimited credits
  const [currentLanguage, setCurrentLanguage] = useState<string>("python")
  const [isInitialized, setIsInitialized] = useState(false)
  const [hasApiKey, setHasApiKey] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  
  // Authentication states
  const [isFirstVisit, setIsFirstVisit] = useState(true)
  const [showAuthPage, setShowAuthPage] = useState(false)
  const [user, setUser] = useState<User | null>(null)

  // Set unlimited credits
  const updateCredits = useCallback(() => {
    setCredits(999) // No credit limit in this version
    window.__CREDITS__ = 999
  }, [])

  // Helper function to safely update language
  const updateLanguage = useCallback((newLanguage: string) => {
    setCurrentLanguage(newLanguage)
    window.__LANGUAGE__ = newLanguage
  }, [])

  // Helper function to mark initialization complete
  const markInitialized = useCallback(() => {
    setIsInitialized(true)
    window.__IS_INITIALIZED__ = true
  }, [])

  // Show toast method
  const showToast = useCallback(
    (
      title: string,
      description: string,
      variant: "neutral" | "success" | "error"
    ) => {
      setToastState({
        open: true,
        title,
        description,
        variant
      })
    },
    []
  )

  // Check for authenticated user
  useEffect(() => {
    if (!isInitialized) return;
    
    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        
        if (error) {
          console.error("Error checking session:", error);
          return;
        }
        if (data?.user) {
          setUser(data.user);
          setIsFirstVisit(false);
          setShowAuthPage(false);
          
          // User is logged in, check for API key
          const hasKey = await window.electronAPI.checkApiKey();
          setHasApiKey(hasKey);
          
          // Removing this condition as requested
          // if (!hasKey) {
          //   setIsSettingsOpen(true);
          // }
        } else {
          // No user found
          setUser(null);
        }
      } catch (error) {
        console.error("Session check failed:", error);
      }
    };
    
    // Setup auth change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth state changed:", event);
        if (event === "SIGNED_IN" || event === "USER_UPDATED") {
          setUser(session?.user || null);
          setIsFirstVisit(false);
          setShowAuthPage(false);
        } else if (event === "SIGNED_OUT") {
          setUser(null);
          setIsFirstVisit(true);
        }
      }
    );
    
    checkSession();
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [isInitialized]);

  // Initialize basic app state
  useEffect(() => {
    // Load config and set values
    const initializeApp = async () => {
      try {
        // Set unlimited credits
        updateCredits()
        
        // Load config including language and model settings
        const config = await window.electronAPI.getConfig()
        
        // Load language preference
        if (config && config.language) {
          updateLanguage(config.language)
        } else {
          updateLanguage("python")
        }
        
        markInitialized()
      } catch (error) {
        console.error("Failed to initialize app:", error)
        // Fallback to defaults
        updateLanguage("python")
        markInitialized()
      }
    }
    
    initializeApp()

    // Event listeners for process events
    const onApiKeyInvalid = () => {
      showToast(
        "API Key Invalid",
        "Your OpenAI API key appears to be invalid or has insufficient credits",
        "error"
      )
      setIsSettingsOpen(true)
    }

    // Setup API key invalid listener
    window.electronAPI.onApiKeyInvalid(onApiKeyInvalid)

    // Define a no-op handler for solution success
    const unsubscribeSolutionSuccess = window.electronAPI.onSolutionSuccess(
      () => {
        console.log("Solution success - no credits deducted in this version")
        // No credit deduction in this version
      }
    )

    // Listen for settings dialog open requests
    const unsubscribeSettings = window.electronAPI.onShowSettings(() => {
      console.log("Show settings dialog requested");
      setIsSettingsOpen(true);
    });
    
    // Cleanup function
    return () => {
      window.electronAPI.removeListener("API_KEY_INVALID", onApiKeyInvalid)
      unsubscribeSolutionSuccess()
      unsubscribeSettings()
      window.__IS_INITIALIZED__ = false
      setIsInitialized(false)
    }
  }, [updateCredits, updateLanguage, markInitialized, showToast])

  // API Key dialog management
  const handleOpenSettings = useCallback(() => {
    console.log('Opening settings dialog');
    setIsSettingsOpen(true);
  }, []);
  
  const handleCloseSettings = useCallback((open: boolean) => {
    console.log('Settings dialog state changed:', open);
    setIsSettingsOpen(open);
  }, []);

  const handleApiKeySave = useCallback(async (apiKey: string) => {
    try {
      await window.electronAPI.updateConfig({ apiKey })
      setHasApiKey(true)
      showToast("Success", "API key saved successfully", "success")
      
      // Reload app after a short delay to reinitialize with the new API key
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (error) {
      console.error("Failed to save API key:", error)
      showToast("Error", "Failed to save API key", "error")
    }
  }, [showToast])

  // Handle authentication flow
  const handleGetStarted = useCallback(() => {
    setShowAuthPage(true);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <ToastContext.Provider value={{ showToast }}>
          <UserProvider>
            <Router>
              <div className="relative">
                {isInitialized ? (
                  user ? (
                    <Routes>
                      <Route
                        path="/"
                        element={
                          <SubscribedApp
                            credits={credits}
                            currentLanguage={currentLanguage}
                            setLanguage={updateLanguage}
                            hasApiKey={hasApiKey}
                            user={user}
                          />
                        }
                      />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  ) : (
                    showAuthPage ? (
                      <AuthPage onAuthSuccess={() => {
                        // This function will be called after successful authentication
                        // No need to do anything here as the auth state listener will handle it
                      }} />
                    ) : (
                      <WelcomeScreen onGetStarted={handleGetStarted} />
                    )
                  )
                ) : (
                  <div className="min-h-screen bg-black flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-6 h-6 border-2 border-white/20 border-t-white/80 rounded-full animate-spin"></div>
                      <p className="text-white/60 text-sm">
                        Initializing...
                      </p>
                    </div>
                  </div>
                )}
                <UpdateNotification />
              </div>
              
              {/* Settings Dialog */}
              <SettingsDialog 
                open={isSettingsOpen} 
                onOpenChange={handleCloseSettings} 
              />
              
              <Toast
                open={toastState.open}
                onOpenChange={(open) =>
                  setToastState((prev) => ({ ...prev, open }))
                }
                variant={toastState.variant}
                duration={1500}
              >
                <ToastTitle>{toastState.title}</ToastTitle>
                <ToastDescription>{toastState.description}</ToastDescription>
              </Toast>
              <ToastViewport />
            </Router>
          </UserProvider>
        </ToastContext.Provider>
      </ToastProvider>
    </QueryClientProvider>
  )
}

export default App