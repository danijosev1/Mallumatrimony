import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import MobileNavigation from './MobileNavigation';
import { useMobileFeatures } from '../../hooks/useMobileFeatures';

const MobileLayout: React.FC = () => {
  const { isNative } = useMobileFeatures();

  useEffect(() => {
    // Add mobile-specific CSS classes
    if (isNative) {
      document.body.classList.add('mobile-app');
    }

    return () => {
      document.body.classList.remove('mobile-app');
    };
  }, [isNative]);

  return (
    <div className="min-h-screen bg-background">
      <main className="pb-16">
        <Outlet />
      </main>
      <MobileNavigation />
    </div>
  );
};

export default MobileLayout;