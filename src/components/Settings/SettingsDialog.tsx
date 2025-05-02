import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "../ui/dialog";
import { Button } from "../ui/button";
import { useToast } from "../../contexts/toast";
import { 
  KeyRound, 
  Settings, 
  Zap, 
  Braces, 
  Cpu, 
  Bot, 
  TerminalSquare, 
  Code2, 
  X, 
  Check, 
  Brain, 
  GraduationCap, 
  MessageSquare, 
  ArrowRight, 
  ExternalLink, 
  AlertCircle,
  Copy,
  ClipboardCheck
} from "lucide-react";

type APIProvider = "openai" | "gemini" | "anthropic";

interface SettingsDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function SettingsDialog({ open: externalOpen, onOpenChange }: SettingsDialogProps) {
  const [open, setOpen] = useState(externalOpen || false);
  const [apiKey, setApiKey] = useState("");
  const [apiProvider, setApiProvider] = useState<APIProvider>("openai");
  const [extractionModel, setExtractionModel] = useState("gpt-4o");
  const [solutionModel, setSolutionModel] = useState("gpt-4o");
  const [debuggingModel, setDebuggingModel] = useState("gpt-4o");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'api' | 'models' | 'shortcuts'>('api');
  const { showToast } = useToast();
  const [copiedLinks, setCopiedLinks] = useState<{[key: string]: boolean}>({});
  
  // Sync with external open state
  useEffect(() => {
    if (externalOpen !== undefined) {
      setOpen(externalOpen);
    }
  }, [externalOpen]);

  // Handle open state changes
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (onOpenChange && newOpen !== externalOpen) {
      onOpenChange(newOpen);
    }
  };
  
  // Load current config on dialog open
  useEffect(() => {
    if (open) {
      setIsLoading(true);
      
      window.electronAPI
        .getConfig()
        .then((config: { apiKey: any; apiProvider: any; extractionModel: any; solutionModel: any; debuggingModel: any; }) => {
          setApiKey(config.apiKey || "");
          setApiProvider(config.apiProvider || "openai");
          setExtractionModel(config.extractionModel || "gpt-4o");
          setSolutionModel(config.solutionModel || "gpt-4o");
          setDebuggingModel(config.debuggingModel || "gpt-4o");
        })
        .catch((error: any) => {
          console.error("Failed to load config:", error);
          showToast("Error", "Failed to load settings", "error");
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [open, showToast]);

  // Handle API provider change
  const handleProviderChange = (provider: APIProvider) => {
    setApiProvider(provider);
    
    // Reset models to defaults when changing provider
    if (provider === "openai") {
      setExtractionModel("gpt-4o");
      setSolutionModel("gpt-4o");
      setDebuggingModel("gpt-4o");
    } else if (provider === "gemini") {
      setExtractionModel("gemini-1.5-pro");
      setSolutionModel("gemini-1.5-pro");
      setDebuggingModel("gemini-1.5-pro");
    } else if (provider === "anthropic") {
      setExtractionModel("claude-3-7-sonnet-20250219");
      setSolutionModel("claude-3-7-sonnet-20250219");
      setDebuggingModel("claude-3-7-sonnet-20250219");
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const result = await window.electronAPI.updateConfig({
        apiKey,
        apiProvider,
        extractionModel,
        solutionModel,
        debuggingModel,
      });
      
      if (result) {
        showToast("Success", "Settings saved successfully", "success");
        handleOpenChange(false);
        
        // Force reload the app to apply the API key
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
      showToast("Error", "Failed to save settings", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Mask API key for display
  const maskApiKey = (key: string) => {
    if (!key || key.length < 10) return "";
    return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
  };

  // Open external link handler
  const openExternalLink = (url: string) => {
    window.electronAPI.openLink(url);
  };

  // Copy link to clipboard
  const copyLinkToClipboard = (url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      // Set this specific link as copied
      setCopiedLinks(prev => ({...prev, [url]: true}));
      
      // Reset copied status after 2 seconds
      setTimeout(() => {
        setCopiedLinks(prev => ({...prev, [url]: false}));
      }, 2000);
      
      showToast("Success", "Link copied to clipboard", "success");
    }).catch(err => {
      console.error("Failed to copy link:", err);
      showToast("Error", "Failed to copy link", "error");
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent 
        className="settings-dialog p-0 bg-gradient-to-b from-black to-[#0c0c0c] border border-amber-500/10 text-white rounded-xl overflow-hidden"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(600px, 90vw)',
          height: 'min(750px, 85vh)',
          maxHeight: '90vh',
          margin: 0,
          boxShadow: '0 10px 25px -5px rgba(245, 158, 11, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.2)',
          zIndex: 9999,
          opacity: 0.98
        }}
      >        
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-amber-500/10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <Settings className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <h2 className="text-lg font-medium text-white">LeetCode Helper Settings</h2>
                <p className="text-xs text-amber-500/80">Customize your DSA learning experience</p>
              </div>
            </div>
            <button 
              onClick={() => handleOpenChange(false)}
              className="rounded-full p-2 hover:bg-white/5 transition-colors"
            >
              <X className="h-4 w-4 text-white/60" />
            </button>
          </div>
          
          {/* Tab navigation */}
          <div className="flex border-b border-amber-500/10">
            <TabButton 
              isActive={activeTab === 'api'} 
              onClick={() => setActiveTab('api')}
              icon={<KeyRound className="w-4 h-4" />}
              label="API Key"
            />
            <TabButton 
              isActive={activeTab === 'models'} 
              onClick={() => setActiveTab('models')}
              icon={<Brain className="w-4 h-4" />}
              label="AI Models"
            />
            <TabButton 
              isActive={activeTab === 'shortcuts'} 
              onClick={() => setActiveTab('shortcuts')}
              icon={<Zap className="w-4 h-4" />}
              label="Shortcuts"
            />
          </div>
          
          {/* Content area */}
          <div className="flex-1 overflow-y-auto p-5">
            {/* API Key Tab */}
            {activeTab === 'api' && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-amber-400 flex items-center gap-2">
                    <Bot className="w-4 h-4" />
                    Select AI Provider
                  </h3>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <ProviderCard
                      isSelected={apiProvider === "openai"}
                      onClick={() => handleProviderChange("openai")}
                      name="OpenAI"
                      description="GPT-4o models"
                      icon={<TerminalSquare className="w-5 h-5" />}
                    />
                    <ProviderCard
                      isSelected={apiProvider === "gemini"}
                      onClick={() => handleProviderChange("gemini")}
                      name="Gemini"
                      description="Google AI models"
                      icon={<Cpu className="w-5 h-5" />}
                    />
                    <ProviderCard
                      isSelected={apiProvider === "anthropic"}
                      onClick={() => handleProviderChange("anthropic")}
                      name="Claude"
                      description="Anthropic models"
                      icon={<MessageSquare className="w-5 h-5" />}
                    />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-amber-400 flex items-center gap-2">
                    <KeyRound className="w-4 h-4" />
                    API Key
                  </h3>
                  
                  <div className="relative">
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder={
                        apiProvider === "openai" ? "sk-..." : 
                        apiProvider === "gemini" ? "Enter your Gemini API key" :
                        "sk-ant-..."
                      }
                      className="w-full bg-black/50 border border-amber-500/20 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-amber-500/50"
                    />
                    {apiKey && (
                      <div className="absolute right-3 top-3 text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-400">
                        {maskApiKey(apiKey)}
                      </div>
                    )}
                  </div>
                  
                  <p className="text-xs text-white/50 flex items-center gap-1.5">
                    <AlertCircle className="w-3 h-3 text-amber-500/80" />
                    Your API key is stored locally and only used for API calls
                  </p>
                </div>
                
                <div className="mt-4 p-4 rounded-lg bg-gradient-to-br from-amber-900/10 to-amber-700/5 border border-amber-500/10">
                  <h4 className="text-sm font-medium text-amber-400 mb-2 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4" />
                    Getting an API Key
                  </h4>
                  
                  <div className="space-y-3">
                    {getApiInstructionsForProvider(apiProvider).map((step, index) => (
                      <div key={index} className="flex gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center text-xs font-medium">
                          {index + 1}
                        </div>
                        <div className="text-xs text-white/70">
                          {step.text}
                          {step.link && (
                            <button 
                              className="ml-1 text-amber-400 hover:underline flex items-center gap-0.5"
                              onClick={() => copyLinkToClipboard(step.link!)}
                            >
                              {step.linkText}
                              {copiedLinks[step.link] ? (
                                <ClipboardCheck className="w-3 h-3 text-green-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {/* AI Models Tab */}
            {activeTab === 'models' && (
              <div className="space-y-6">
                <p className="text-xs text-white/70 mb-4">
                  Select which AI models to use for different stages of the problem-solving process. 
                  More powerful models provide better insights but may use more API credits.
                </p>
                
                {modelCategories.map((category) => {
                  // Get models for current provider
                  const models = 
                    apiProvider === "openai" ? category.openaiModels : 
                    apiProvider === "gemini" ? category.geminiModels :
                    category.anthropicModels;
                  
                  // Get current model value and setter function
                  const currentValue = 
                    category.key === 'extractionModel' ? extractionModel :
                    category.key === 'solutionModel' ? solutionModel :
                    debuggingModel;
                    
                  const setValue = 
                    category.key === 'extractionModel' ? setExtractionModel :
                    category.key === 'solutionModel' ? setSolutionModel :
                    setDebuggingModel;
                    
                  return (
                    <div key={category.key} className="pb-5 border-b border-amber-500/10 last:border-0">
                      <h3 className="text-sm font-semibold text-amber-400 mb-2 flex items-center gap-2">
                        {category.icon}
                        {category.title}
                      </h3>
                      <p className="text-xs text-white/60 mb-3">{category.description}</p>
                      
                      <div className="space-y-2">
                        {models.map((model) => (
                          <ModelCard
                            key={model.id}
                            model={model}
                            isSelected={currentValue === model.id}
                            onSelect={() => setValue(model.id)}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            {/* Shortcuts Tab */}
            {activeTab === 'shortcuts' && (
              <div className="space-y-6">
                <p className="text-xs text-white/70 mb-4">
                  LeetCode Helper uses global keyboard shortcuts for quick access to features.
                  These shortcuts work anywhere on your screen.
                </p>
                
                <div className="bg-black/40 border border-amber-500/10 rounded-lg overflow-hidden">
                  <div className="grid grid-cols-3 text-xs font-medium text-amber-400 p-3 border-b border-amber-500/10">
                    <div>Action</div>
                    <div>Shortcut</div>
                    <div>Description</div>
                  </div>
                  
                  <div className="divide-y divide-amber-500/10">
                    {shortcuts.map((shortcut, index) => (
                      <div key={index} className="grid grid-cols-3 p-3 hover:bg-amber-500/5 transition-colors">
                        <div className="text-sm text-white">{shortcut.action}</div>
                        <div>
                          {shortcut.keys.split('/').map((combo, idx) => (
                            <span key={idx} className="inline-flex items-center px-2 py-0.5 mr-1 bg-black border border-amber-500/20 rounded text-amber-500 text-xs font-mono">
                              {combo.trim()}
                            </span>
                          ))}
                        </div>
                        <div className="text-xs text-white/60">{shortcut.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="p-4 rounded-lg bg-gradient-to-br from-amber-900/10 to-amber-700/5 border border-amber-500/10">
                  <h4 className="text-sm font-medium text-amber-400 mb-2">Learning Tips</h4>
                  <ul className="space-y-2 text-xs text-white/70">
                    <li className="flex gap-2">
                      <Check className="w-4 h-4 text-amber-500/80 flex-shrink-0" />
                      <span>Use <span className="text-white">Ctrl+T/Cmd+T</span> to enable click-through mode when working directly in LeetCode</span>
                    </li>
                    <li className="flex gap-2">
                      <Check className="w-4 h-4 text-amber-500/80 flex-shrink-0" />
                      <span>Capture multiple screenshots (<span className="text-white">Ctrl+H/Cmd+H</span>) for multi-part problems or complex test cases</span>
                    </li>
                    <li className="flex gap-2">
                      <Check className="w-4 h-4 text-amber-500/80 flex-shrink-0" />
                      <span>For best learning experience, try to solve problems first, then use the app to verify understanding and learn optimization techniques</span>
                    </li>
                    <li className="flex gap-2">
                      <Check className="w-4 h-4 text-amber-500/80 flex-shrink-0" />
                      <span>When debugging, take screenshots of both your code and any error messages for comprehensive analysis</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>
          
          {/* Footer/Actions */}
          <div className="p-5 border-t border-amber-500/10 flex justify-between">
            <Button
              variant="outline"
              onClick={() => handleOpenChange(false)}
              className="px-4 py-2 border border-amber-500/20 bg-transparent hover:bg-amber-500/5 text-white rounded-lg transition-colors"
            >
              Cancel
            </Button>
            
            <Button
              onClick={handleSave}
              disabled={isLoading || !apiKey}
              className={`px-6 py-2 bg-amber-500 hover:bg-amber-600 text-black font-medium rounded-lg transition-colors flex items-center gap-2 ${
                isLoading || !apiKey ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? 'Saving...' : 'Save Settings'}
              {!isLoading && <ArrowRight className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Helper Components
const TabButton = ({ isActive, onClick, icon, label }: { 
  isActive: boolean, 
  onClick: () => void,
  icon: React.ReactNode,
  label: string
}) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-all ${
      isActive 
        ? 'text-amber-400 border-amber-500' 
        : 'text-white/50 border-transparent hover:text-white/80 hover:border-amber-500/30'
    }`}
  >
    {icon}
    {label}
  </button>
);

const ProviderCard = ({ isSelected, onClick, name, description, icon }: {
  isSelected: boolean,
  onClick: () => void,
  name: string,
  description: string,
  icon: React.ReactNode
}) => (
  <div
    onClick={onClick}
    className={`cursor-pointer p-3 rounded-lg border transition-all flex flex-col items-center text-center gap-2 ${
      isSelected 
        ? 'bg-amber-500/10 border-amber-500/50' 
        : 'bg-black/40 border-amber-500/10 hover:bg-black/80 hover:border-amber-500/30'
    }`}
  >
    <div className={`p-2 rounded-full ${isSelected ? 'bg-amber-500/20' : 'bg-black/40'}`}>
      {icon}
    </div>
    <div>
      <div className={`font-medium ${isSelected ? 'text-amber-400' : 'text-white'}`}>{name}</div>
      <div className="text-xs text-white/50">{description}</div>
    </div>
  </div>
);

const ModelCard = ({ model, isSelected, onSelect }: {
  model: {id: string, name: string, description: string},
  isSelected: boolean,
  onSelect: () => void
}) => (
  <div
    onClick={onSelect}
    className={`cursor-pointer p-3 rounded-lg border transition-all ${
      isSelected 
        ? 'bg-amber-500/10 border-amber-500/30' 
        : 'bg-black/40 border-amber-500/10 hover:border-amber-500/20'
    }`}
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className={`w-4 h-4 rounded-full flex-shrink-0 ${
          isSelected ? 'bg-amber-500' : 'bg-black border border-amber-500/20'
        }`}>
          {isSelected && <Check className="w-3 h-3 text-black" />}
        </div>
        <div className="font-medium text-sm">{model.name}</div>
      </div>
      {isSelected && (
        <span className="text-xs px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded">Active</span>
      )}
    </div>
    <p className="text-xs text-white/60 mt-1 ml-6">{model.description}</p>
  </div>
);

// Helper functions and data
function getApiInstructionsForProvider(provider: APIProvider) {
  if (provider === "openai") {
    return [
      { text: "Create an account at", link: "https://platform.openai.com/signup", linkText: "OpenAI (copy link)" },
      { text: "Navigate to", link: "https://platform.openai.com/api-keys", linkText: "API Keys (copy link)" },
      { text: "Click 'Create new secret key' and copy the generated key" },
      { text: "Paste the key in the field above and click Save" }
    ];
  } else if (provider === "gemini") {
    return [
      { text: "Create a Google AI Studio account at", link: "https://aistudio.google.com/", linkText: "Google AI Studio (copy link)" },
      { text: "Navigate to", link: "https://aistudio.google.com/app/apikey", linkText: "API Keys (copy link)" },
      { text: "Click 'Create API key' and copy the generated key" },
      { text: "Paste the key in the field above and click Save" }
    ];
  } else {
    return [
      { text: "Create an Anthropic account at", link: "https://console.anthropic.com/", linkText: "Anthropic Console (copy link)" },
      { text: "Navigate to", link: "https://console.anthropic.com/settings/keys", linkText: "API Keys (copy link)" },
      { text: "Click 'Create key' and copy the generated key" },
      { text: "Paste the key in the field above and click Save" }
    ];
  }
}

// Model category definitions
const modelCategories = [
  {
    key: 'extractionModel' as const,
    title: 'Problem Understanding',
    description: 'Used to analyze problems, identify patterns, and explore edge cases',
    icon: <Code2 className="w-4 h-4" />,
    openaiModels: [
      { id: "gpt-4o", name: "GPT-4o", description: "Best for comprehensive problem analysis and pattern recognition" },
      { id: "gpt-4o-mini", name: "GPT-4o Mini", description: "Faster processing with good pattern identification" }
    ],
    geminiModels: [
      { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", description: "Excellent at breaking down complex DSA problems" },
      { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", description: "Quick analysis with solid edge case detection" }
    ],
    anthropicModels: [
      { id: "claude-3-7-sonnet-20250219", name: "Claude 3.7 Sonnet", description: "Exceptional at identifying patterns and constraints" },
      { id: "claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet", description: "Strong problem analysis with educational insights" },
      { id: "claude-3-opus-20240229", name: "Claude 3 Opus", description: "Most detailed problem breakdown and pattern recognition" }
    ]
  },
  {
    key: 'solutionModel' as const,
    title: 'Learning Methodology',
    description: 'Provides structured learning approach with 11-step methodology',
    icon: <Braces className="w-4 h-4" />,
    openaiModels: [
      { id: "gpt-4o", name: "GPT-4o", description: "Best for comprehensive explanations and visual aids" },
      { id: "gpt-4o-mini", name: "GPT-4o Mini", description: "Good educational content with faster generation" }
    ],
    geminiModels: [
      { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", description: "Detailed step-by-step learning approach" },
      { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", description: "Faster educational explanations" }
    ],
    anthropicModels: [
      { id: "claude-3-7-sonnet-20250219", name: "Claude 3.7 Sonnet", description: "Excellent structured learning methodology" },
      { id: "claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet", description: "Clear step-by-step educational approach" },
      { id: "claude-3-opus-20240229", name: "Claude 3 Opus", description: "Most comprehensive learning methodology" }
    ]
  },
  {
    key: 'debuggingModel' as const,
    title: 'Code Improvement',
    description: 'Analyzes your code, identifies issues, and provides educational insights',
    icon: <Zap className="w-4 h-4" />,
    openaiModels: [
      { id: "gpt-4o", name: "GPT-4o", description: "Best for debugging with educational explanations" },
      { id: "gpt-4o-mini", name: "GPT-4o Mini", description: "Quick code review with learning insights" }
    ],
    geminiModels: [
      { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", description: "Thorough code analysis with key learning points" },
      { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", description: "Fast debugging with educational takeaways" }
    ],
    anthropicModels: [
      { id: "claude-3-7-sonnet-20250219", name: "Claude 3.7 Sonnet", description: "Excellent debugging with concept explanations" },
      { id: "claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet", description: "Good balance of fixes and educational content" },
      { id: "claude-3-opus-20240229", name: "Claude 3 Opus", description: "Most in-depth code review with learning objectives" }
    ]
  }
];

// Shortcut data
const shortcuts = [
  {
    action: "Toggle Visibility", 
    keys: "Ctrl+B / Cmd+B",
    description: "Show or hide the helper window"
  },
  {
    action: "Click-Through Mode", 
    keys: "Ctrl+T / Cmd+T",
    description: "Enable interaction with underlying windows"
  },
  {
    action: "Capture Problem", 
    keys: "Ctrl+H / Cmd+H",
    description: "Take screenshot of the LeetCode problem"
  },
  {
    action: "Analyze Problem", 
    keys: "Ctrl+Enter / Cmd+Enter",
    description: "Generate comprehensive analysis & solution"
  },
  {
    action: "Remove Last Screenshot", 
    keys: "Ctrl+L / Cmd+L",
    description: "Delete the most recent screenshot"
  },
  {
    action: "New Problem", 
    keys: "Ctrl+R / Cmd+R",
    description: "Reset and prepare for a new problem"
  },
  {
    action: "Move Window", 
    keys: "Ctrl+Arrows / Cmd+Arrows",
    description: "Reposition the window on screen"
  },
  {
    action: "Decrease Opacity", 
    keys: "Ctrl+[ / Cmd+[",
    description: "Make window more transparent"
  },
  {
    action: "Increase Opacity", 
    keys: "Ctrl+] / Cmd+]",
    description: "Make window more visible"
  },
  {
    action: "Quit Application", 
    keys: "Ctrl+Q / Cmd+Q",
    description: "Close LeetCode Helper completely"
  }
];