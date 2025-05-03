import React, { useEffect, useState } from 'react';
import { useUser } from '../../contexts/userContext';
import { ProblemHistory, LearningProgress, getUserLearningProgress, getUserRecentProblems } from '../../lib/supabaseSchema';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Trophy, Book, Target, BarChart2, Clock, Star, Zap, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';

// Create category type with color information
type CategoryWithColor = {
  name: string;
  color: string;
  problems: number;
  solved: number;
  understanding: number;
  recommended: boolean;
};

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

const Dashboard: React.FC = () => {
  const { user, userProfile, refreshUserProfile, learningProgress, recentProblems, refreshLearningData } = useUser();
  const [categories, setCategories] = useState<CategoryWithColor[]>([]);
  const [streak, setStreak] = useState(0);
  const [totalProblems, setTotalProblems] = useState(0);

  useEffect(() => {
    if (user) {
      refreshUserProfile();
      refreshLearningData();
    }
  }, [user, refreshUserProfile, refreshLearningData]);

  useEffect(() => {
    if (userProfile) {
      setStreak(userProfile.streak_days);
      setTotalProblems(userProfile.problems_solved);
    }
  }, [userProfile]);

  useEffect(() => {
    if (learningProgress) {
      // Transform categories with color information and recommendations
      const categoriesWithColor: CategoryWithColor[] = learningProgress.map(progress => {
        return {
          name: progress.category,
          color: DSA_CATEGORIES[progress.category] || 'bg-gray-500',
          problems: progress.problems_attempted,
          solved: progress.problems_solved,
          understanding: progress.average_understanding,
          recommended: progress.average_understanding < 70 // Recommend categories that need improvement
        };
      });
      
      // Add any missing categories that we recommend to beginners
      const existingCategories = new Set(categoriesWithColor.map(c => c.name));
      const beginnersCategories = ['Array', 'String', 'Hash Table'];
      
      for (const cat of beginnersCategories) {
        if (!existingCategories.has(cat)) {
          categoriesWithColor.push({
            name: cat,
            color: DSA_CATEGORIES[cat] || 'bg-gray-500',
            problems: 0,
            solved: 0,
            understanding: 0,
            recommended: true
          });
        }
      }
      
      // Sort by recommendation first, then by problems attempted
      categoriesWithColor.sort((a, b) => {
        if (a.recommended && !b.recommended) return -1;
        if (!a.recommended && b.recommended) return 1;
        return b.problems - a.problems;
      });
      
      setCategories(categoriesWithColor);
    }
  }, [learningProgress]);

  if (!user) {
    return (
      <div className="p-6 text-center">
        <p className="text-white/70">Please sign in to view your dashboard</p>
      </div>
    );
  }

  return (
    <div className="bg-black min-h-screen text-white p-6">
      <h1 className="text-2xl font-bold mb-6">Learning Dashboard</h1>
      
      {/* User Progress Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="bg-black/40 border border-amber-500/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Trophy className="w-4 h-4 text-amber-500 mr-2" />
              Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{streak} days</div>
            <p className="text-xs text-white/60 mt-1">Keep solving problems daily to build your streak</p>
          </CardContent>
        </Card>
        
        <Card className="bg-black/40 border border-amber-500/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Book className="w-4 h-4 text-amber-500 mr-2" />
              Problems Solved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{totalProblems}</div>
            <p className="text-xs text-white/60 mt-1">Total problems solved to date</p>
          </CardContent>
        </Card>
        
        <Card className="bg-black/40 border border-amber-500/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Target className="w-4 h-4 text-amber-500 mr-2" />
              Hint Credits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {userProfile?.hint_credits_remaining || 0}
            </div>
            <p className="text-xs text-white/60 mt-1">
              Credits refresh daily. Use them to reveal code hints.
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Category Progress */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <BarChart2 className="w-5 h-5 text-amber-500 mr-2" />
          Learning Progress by Category
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.length > 0 ? (
            categories.map((category, index) => (
              <Card 
                key={index} 
                className={`bg-black/40 border ${category.recommended ? 'border-amber-500/30' : 'border-white/10'}`}
              >
                <CardHeader className={`pb-2 ${category.recommended ? 'bg-amber-900/20' : ''}`}>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <div className={`w-3 h-3 rounded-full ${category.color} mr-2`}></div>
                      {category.name}
                    </CardTitle>
                    
                    {category.recommended && (
                      <span className="bg-amber-500/20 text-amber-400 text-xs px-2 py-0.5 rounded">
                        Recommended
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-white/60">Problems Solved:</span>
                    <span className="font-medium">
                      {category.solved} / {category.problems || 0}
                    </span>
                  </div>
                  
                  <div className="w-full bg-white/10 rounded-full h-2 mb-4">
                    <div 
                      className={`${category.color} h-2 rounded-full`} 
                      style={{ 
                        width: `${category.problems ? (category.solved / category.problems) * 100 : 0}%` 
                      }}
                    ></div>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Understanding:</span>
                    <span className="font-medium">
                      {category.understanding.toFixed(0)}%
                    </span>
                  </div>
                  
                  <div className="w-full bg-white/10 rounded-full h-2 mt-2">
                    <div 
                      className={`${category.understanding > 70 ? 'bg-green-500' : 'bg-amber-500'} h-2 rounded-full`} 
                      style={{ width: `${category.understanding}%` }}
                    ></div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-2 bg-black/40 border border-white/10 rounded-lg p-6 text-center">
              <p className="text-white/70">
                Solve your first problem to start tracking category progress
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Recent Problems */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Clock className="w-5 h-5 text-amber-500 mr-2" />
          Recently Solved Problems
        </h2>
        
        <div className="space-y-2">
          {recentProblems && recentProblems.length > 0 ? (
            recentProblems.map((problem, index) => (
              <div 
                key={index}
                className="flex justify-between items-center bg-black/40 border border-white/10 rounded-lg p-4"
              >
                <div>
                  <h3 className="font-medium text-white">{problem.problem_title}</h3>
                  <div className="flex items-center mt-1">
                    <span className={`inline-block w-2 h-2 rounded-full ${
                      DSA_CATEGORIES[problem.problem_category] || 'bg-gray-500'
                    } mr-1.5`}></span>
                    <span className="text-xs text-white/60">{problem.problem_category}</span>
                    
                    <span className="mx-2 text-white/30">•</span>
                    
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      problem.problem_difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' :
                      problem.problem_difficulty === 'Medium' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {problem.problem_difficulty}
                    </span>
                  </div>
                </div>
                
                <div className="text-xs text-white/50">
                  {new Date(problem.created_at!).toLocaleDateString()}
                </div>
              </div>
            ))
          ) : (
            <div className="bg-black/40 border border-white/10 rounded-lg p-6 text-center">
              <p className="text-white/70">
                No problems solved yet. Start solving to track your history.
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Personalized Recommendations */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Zap className="w-5 h-5 text-amber-500 mr-2" />
          Personalized Recommendations
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Next Steps Card */}
          <Card className="bg-gradient-to-br from-amber-900/20 to-black border border-amber-500/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Star className="w-5 h-5 text-amber-500 mr-2" />
                Your Next Steps
              </CardTitle>
              <CardDescription className="text-white/60">
                Based on your current progress
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {categories.filter(c => c.recommended).length > 0 ? (
                <>
                  <p className="text-white/80">
                    Focus on these problem categories to improve your skills:
                  </p>
                  <ul className="space-y-2">
                    {categories
                      .filter(c => c.recommended)
                      .slice(0, 3)
                      .map((category, index) => (
                        <li key={index} className="flex items-center bg-white/5 p-2 rounded">
                          <div className={`w-2 h-2 rounded-full ${category.color} mr-2`}></div>
                          <span>{category.name}</span>
                          <ChevronRight className="w-4 h-4 text-white/30 ml-auto" />
                        </li>
                      ))}
                  </ul>
                  <Button className="w-full bg-amber-500 hover:bg-amber-600 text-black mt-2">
                    Start Practicing
                  </Button>
                </>
              ) : (
                <p className="text-white/70">
                  Solve more problems to get personalized recommendations
                </p>
              )}
            </CardContent>
          </Card>
          
          {/* Learning Tips Card */}
          <Card className="bg-black/40 border border-white/10">
            <CardHeader>
              <CardTitle className="text-lg">Learning Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-white/5 p-3 rounded">
                <h4 className="font-medium text-white mb-1">Explain Before Solving</h4>
                <p className="text-sm text-white/70">
                  Taking time to explain the problem in your own words improves 
                  understanding and retention by up to 70%.
                </p>
              </div>
              
              <div className="bg-white/5 p-3 rounded">
                <h4 className="font-medium text-white mb-1">Start With Patterns</h4>
                <p className="text-sm text-white/70">
                  Most DSA problems follow common patterns. Identifying the pattern
                  is often the key to finding the solution.
                </p>
              </div>
              
              <div className="bg-white/5 p-3 rounded">
                <h4 className="font-medium text-white mb-1">Use Hint Credits Wisely</h4>
                <p className="text-sm text-white/70">
                  Try solving problems on your own first, then use hint credits
                  strategically to learn new approaches.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;