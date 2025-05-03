import React from 'react';
import { useUser } from '../contexts/userContext';
import DashboardComponent from '../components/Dashboard/Dashboard';

const DashboardPage: React.FC = () => {
  const { user, isLoadingProfile } = useUser();

  if (isLoadingProfile) {
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
    <div className="bg-black">
      {/* Dashboard Content */}
      <div className="container mx-auto py-6">
        <DashboardComponent />
      </div>
    </div>
  );
};

export default DashboardPage;