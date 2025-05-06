// src/_pages/Dashboard.tsx

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/userContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { BarChart, Calendar, ChevronLeft, Code, LineChart, Target, Trophy, BookOpen, BrainCircuit, ArrowRight, Settings, Sparkles } from 'lucide-react';
import { getUserLearningTrend, getRecommendedCategories } from '../lib/supabaseSchema';
import { useToast } from '../contexts/toast';

// DSA categories with color coding
const DSA_CATEGORIES: { [key: string]: string } = {
  'Array': 'bg-blue-500',
  'String': 'bg-green-500',
  'Hash Table': 'bg-yellow-500',
  'Math': 'bg-purple-500',
  'Sorting': 'bg-pink-500',
  'Greedy': 'bg-orange-500',
  'Depth-First Search': 'bg-indigo-500',
  'Binary Search': 'bg-red-500', 
  'Tree': 'bg-emerald-500',
  'Dynamic Programming': 'bg-amber-500',
  'Two Pointers': 'bg-cyan-500',
  'Breadth-First Search': 'bg-violet-500',
  'Stack': 'bg-lime-500',
  'Backtracking': 'bg-rose-500',
  'Design': 'bg-sky-500',
  'Graph': 'bg-fuchsia-500',
  'Linked List': 'bg-teal-500',
  'Heap': 'bg-blue-600',
  'Sliding Window': 'bg-orange-600',
  'Divide and Conquer': 'bg-emerald-600',
  'Bit Manipulation': 'bg-indigo-600',
  'Other': 'bg-gray-500'
};

interface CategoryProgress {
  category: string;
  avg_reveal_level: number;
  problems_attempted: number;
  problems_solved: number;
  focus_reason: string;
}

interface LearningTrendPoint {
  period: string;
  problems_count: number;
  avg_reveal_level: number;
  categories: {
    category: string;
    problems_count: number;
    avg_reveal_level: number;
  }[];
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, userProfile, refreshUserProfile } = useUser();
  const { showToast } = useToast();
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'all'>('month');
  const [learningTrend, setLearningTrend] = useState<LearningTrendPoint[]>([]);
  const [recommendedCategories, setRecommendedCategories] = useState<CategoryProgress[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Function to navigate back to the main view
  const handleBack = () => {
    navigate('/');
  };

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      
      try {
        // Load user profile
        await refreshUserProfile();
        
        // Load learning trend data
        const trendData = await getUserLearningTrend(user.id, timeframe);
        setLearningTrend(trendData || []);
        
        // Load recommended categories
        const recommendations = await getRecommendedCategories(user.id);
        setRecommendedCategories(recommendations || []);
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        showToast('Error', 'Failed to load dashboard data', 'error');
        setIsLoading(false);
      }
    };
    
    loadDashboardData();
  }, [user, timeframe, refreshUserProfile, showToast]);

  // Handle empty state for new users
  const hasData = learningTrend.length > 0 || recommendedCategories.length > 0;
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-black">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/70">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black min-h-screen text-white p-6">
      {/* Header with back button */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="text-white/70 hover:text-white hover:bg-white/10"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Learning Dashboard</h1>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.electronAPI.openSettingsPortal()}
          className="text-white/70 hover:text-white hover:bg-white/10"
        >
          <Settings className="w-4 h-4 mr-1" />
          Settings
        </Button>
      </div>
      
      {/* User Progress Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="bg-black/40 border border-amber-500/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Trophy className="w-4 h-4 text-amber-500 mr-2" />
              Problem Mastery
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {userProfile?.problems_solved || 0}
            </div>
            <p className="text-xs text-white/60 mt-1">Problems solved with less help over time</p>
          </CardContent>
        </Card>
        
        <Card className="bg-black/40 border border-amber-500/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <BrainCircuit className="w-4 h-4 text-amber-500 mr-2" />
              Learning Efficiency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {hasData ? `${Math.floor(100 - (recommendedCategories[0]?.avg_reveal_level || 0) * 20)}%` : "N/A"}
            </div>
            <p className="text-xs text-white/60 mt-1">Based on how much solution help you need</p>
          </CardContent>
        </Card>
        
        <Card className="bg-black/40 border border-amber-500/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Calendar className="w-4 h-4 text-amber-500 mr-2" />
              Learning Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {userProfile?.streak_days || 0} days
            </div>
            <p className="text-xs text-white/60 mt-1">
              Continue solving problems to build your streak
            </p>
          </CardContent>
        </Card>
      </div>
      
      {!hasData ? (
        // Empty state for new users
        <div className="bg-black/40 border border-amber-500/10 rounded-xl p-8 text-center my-8">
          <Sparkles className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Start Your Learning Journey</h2>
          <p className="text-white/70 mb-6 max-w-md mx-auto">
            Solve your first algorithm problem to see personalized learning insights
            and track your progress over time.
          </p>
          <Button 
            onClick={handleBack}
            className="bg-amber-500 hover:bg-amber-600 text-black"
          >
            <Code className="w-4 h-4 mr-2" />
            Solve Your First Problem
          </Button>
        </div>
      ) : (
        // Data visualization for returning users
        <>
          {/* Learning Progress Chart */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center">
                <LineChart className="w-5 h-5 text-amber-500 mr-2" />
                Learning Progress
              </h2>
              
              <div className="flex gap-2">
                <Button
                  variant={timeframe === 'week' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeframe('week')}
                  className={timeframe === 'week' 
                    ? 'bg-amber-500 text-black' 
                    : 'border-amber-500/20 text-white/70'
                  }
                >
                  Week
                </Button>
                <Button
                  variant={timeframe === 'month' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeframe('month')}
                  className={timeframe === 'month' 
                    ? 'bg-amber-500 text-black' 
                    : 'border-amber-500/20 text-white/70'
                  }
                >
                  Month
                </Button>
                <Button
                  variant={timeframe === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeframe('all')}
                  className={timeframe === 'all' 
                    ? 'bg-amber-500 text-black' 
                    : 'border-amber-500/20 text-white/70'
                  }
                >
                  All Time
                </Button>
              </div>
            </div>
            
            <Card className="bg-black/40 border border-amber-500/10 p-4">
              <div className="h-64 relative">
                {learningTrend.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <p className="text-white/50">Not enough data to display a chart yet</p>
                  </div>
                ) : (
                  <>
                    {/* Simple chart implementation - in a real app, use a proper chart library */}
                    <div className="flex flex-col h-full">
                      <div className="flex-1 flex items-end">
                        <div className="flex h-full w-full items-end justify-between gap-2">
                          {learningTrend.map((point, index) => {
                            // Lower reveal level is better, so invert for visualization
                            // 5 is max, so 5 - avg gives us how good they're doing (higher bar = better)
                            const performanceHeight = 
                              Math.max(0, Math.min(100, (5 - point.avg_reveal_level) * 20)); // 0-100%
                            return (
                              <div key={index} className="flex flex-col items-center group">
                                <div className="text-xs text-white/50 mb-1 opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full">
                                  {point.period}
                                </div>
                                <div 
                                  className="w-8 bg-amber-500/70 hover:bg-amber-500 transition-colors rounded-t"
                                  style={{ height: `${performanceHeight}%` }}
                                >
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <div className="h-8 flex items-center justify-between text-xs text-white/50 mt-2">
                        {learningTrend.map((point, index) => (
                          <div key={index} className="text-center w-8 truncate">
                            {point.period.split('-')[1]}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Legend */}
                    <div className="flex gap-4 justify-center mt-2">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-amber-500/70 rounded"></div>
                        <span className="text-xs text-white/70">Learning efficiency</span>
                      </div>
                      <div className="text-xs text-white/50">
                        Higher = less help needed
                      </div>
                    </div>
                  </>
                )}
              </div>
            </Card>
          </div>
          
          {/* Category Progress */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <BarChart className="w-5 h-5 text-amber-500 mr-2" />
              Category Progress
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendedCategories.length > 0 ? (
                recommendedCategories.map((category, index) => (
                  <Card 
                    key={index} 
                    className={`bg-black/40 border ${index < 3 ? 'border-amber-500/30' : 'border-white/10'}`}
                  >
                    <CardHeader className={`pb-2 ${index < 3 ? 'bg-amber-900/20' : ''}`}>
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-sm font-medium flex items-center">
                          <div className={`w-3 h-3 rounded-full ${DSA_CATEGORIES[category.category] || 'bg-gray-500'} mr-2`}></div>
                          {category.category}
                        </CardTitle>
                        
                        {index < 3 && (
                          <span className="bg-amber-500/20 text-amber-400 text-xs px-2 py-0.5 rounded">
                            Focus Area
                          </span>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-white/60">Problems Solved:</span>
                        <span className="font-medium">
                          {category.problems_solved} / {category.problems_attempted || 0}
                        </span>
                      </div>
                      
                      <div className="w-full bg-white/10 rounded-full h-2 mb-4">
                        <div 
                          className={`${DSA_CATEGORIES[category.category] || 'bg-gray-500'} h-2 rounded-full`} 
                          style={{ 
                            width: `${category.problems_attempted ? (category.problems_solved / category.problems_attempted) * 100 : 0}%` 
                          }}
                        ></div>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-white/60">Learning Efficiency:</span>
                        <span className="font-medium">
                          {Math.floor(100 - category.avg_reveal_level * 20)}%
                        </span>
                      </div>
                      
                      <div className="w-full bg-white/10 rounded-full h-2 mt-2">
                        <div 
                          className={`${category.avg_reveal_level < 2.5 ? 'bg-green-500' : 'bg-amber-500'} h-2 rounded-full`} 
                          style={{ width: `${Math.max(0, 100 - category.avg_reveal_level * 20)}%` }}
                        ></div>
                      </div>
                      
                      <p className="text-xs text-white/50 mt-3 italic">
                        {category.focus_reason}
                      </p>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-2 bg-black/40 border border-white/10 rounded-lg p-6 text-center">
                  <p className="text-white/70">
                    Solve problems in different categories to track your progress
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {/* Learning Tips */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <BookOpen className="w-5 h-5 text-amber-500 mr-2" />
              Learning Tips
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-black/40 border border-white/10">
                <CardHeader>
                  <CardTitle className="text-base">Spaced Repetition</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-white/70">
                  <p>Revisit problems you've solved after a few days. This reinforces your memory and deepens understanding of the patterns.</p>
                </CardContent>
              </Card>
              
              <Card className="bg-black/40 border border-white/10">
                <CardHeader>
                  <CardTitle className="text-base">Explain First</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-white/70">
                  <p>Taking time to explain the problem in your own words before seeing solutions improves understanding by up to 70%.</p>
                </CardContent>
              </Card>
              
              <Card className="bg-black/40 border border-white/10">
                <CardHeader>
                  <CardTitle className="text-base">Minimize Hints</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-white/70">
                  <p>Challenge yourself to solve problems with minimal hints. Your dashboard tracks how well you're doing with this!</p>
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* Recommended Next Steps */}
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Target className="w-5 h-5 text-amber-500 mr-2" />
              Recommended Next Steps
            </h2>
            
            <Card className="bg-gradient-to-br from-amber-900/20 to-black border border-amber-500/20 p-5">
              <div className="space-y-4">
                <h3 className="font-medium text-white">Based on your progress, focus on:</h3>
                
                <div className="space-y-3">
                  {recommendedCategories.slice(0, 2).map((category, index) => (
                    <div key={index} className="flex items-center bg-white/5 p-2 rounded">
                      <div className={`w-2 h-2 rounded-full ${DSA_CATEGORIES[category.category]} mr-2`}></div>
                      <span className="text-sm">{category.category} problems</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleBack}
                        className="ml-auto text-amber-400 hover:text-amber-300"
                      >
                        Practice
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  ))}
                  
                  <div className="flex items-center bg-white/5 p-2 rounded">
                    <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                    <span className="text-sm">Try a new problem type</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleBack}
                      className="ml-auto text-amber-400 hover:text-amber-300"
                    >
                      Explore
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;