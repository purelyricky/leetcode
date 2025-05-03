import React from 'react';
import { useUser } from '../contexts/userContext';
import DashboardComponent from '../components/Dashboard/Dashboard';
import { Button } from '../components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface DashboardPageProps {
  onBackToSolutions: () => void;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ onBackToSolutions }) => {
  const { user, isLoadingProfile } = useUser();

  if (isLoadingProfile) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/70">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black min-h-screen">
      {/* Header */}
      <div className="border-b border-white/10 p-4 sticky top-0 bg-black/80 backdrop-blur-md z-10">
        <div className="container mx-auto flex justify-between items-center">
          <Button
            variant="ghost"
            onClick={onBackToSolutions}
            className="text-white/70 hover:text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Solutions
          </Button>
          
          <h1 className="text-xl font-bold text-white">
            LeetCode Helper Dashboard
          </h1>
          
          <div className="w-[100px]"></div> {/* Spacer for balance */}
        </div>
      </div>
      
      {/* Dashboard Content */}
      <div className="container mx-auto py-6">
        <DashboardComponent />
      </div>
    </div>
  );
};

export default DashboardPage;