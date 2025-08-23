import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { featuredProfiles } from '../data/mockProfiles';
import ExpoSwipeCard from '../components/mobile/ExpoSwipeCard';
import MobileHeader from '../components/mobile/MobileHeader';
import { useExpoFeatures } from '../hooks/useExpoFeatures';
import { Star, RefreshCw } from 'lucide-react';

const ExpoSwipePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { hapticFeedback, isNative, showLocalNotification } = useExpoFeatures();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [profiles] = useState(featuredProfiles);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleSwipe = async (direction: 'left' | 'right') => {
    const currentProfile = profiles[currentIndex];
    
    if (direction === 'right') {
      console.log('Liked:', currentProfile.name);
      
      // Show match notification (simulate)
      if (Math.random() > 0.7) { // 30% chance of match
        if (isNative) {
          await showLocalNotification(
            "It's a Match! 🎉",
            `You and ${currentProfile.name} liked each other!`
          );
          await hapticFeedback('heavy');
        }
      }
    } else {
      console.log('Passed:', currentProfile.name);
    }

    // Move to next profile
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
    }, 300);
  };

  const handleViewProfile = () => {
    const currentProfile = profiles[currentIndex];
    navigate(`/profile/${currentProfile.id}`);
  };

  const handleRestart = async () => {
    if (isNative) await hapticFeedback('medium');
    setCurrentIndex(0);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center p-6">
          <h2 className="text-xl font-bold text-primary mb-4">Login Required</h2>
          <p className="text-text/70 mb-6">Please log in to discover matches</p>
          <button 
            onClick={() => navigate('/login')}
            className="btn-primary"
          >
            Login to Continue
          </button>
        </div>
      </div>
    );
  }

  if (currentIndex >= profiles.length) {
    return (
      <div className="min-h-screen bg-background">
        <MobileHeader 
          title="Discover" 
          showBack={true}
          onBack={() => navigate('/')}
        />
        
        <div className="pt-20 pb-24 flex flex-col items-center justify-center min-h-screen px-6">
          <div className="text-center">
            <Star className="text-secondary mx-auto mb-4" size={48} />
            <h3 className="text-2xl font-bold text-primary mb-2">That's All For Now!</h3>
            <p className="text-text/70 mb-4">
              You've seen all available profiles. Check back later for new matches!
            </p>
            <div className="space-y-3">
              <button 
                onClick={handleRestart}
                className="btn-primary flex items-center justify-center w-full"
              >
                <RefreshCw size={18} className="mr-2" />
                Start Over
              </button>
              <button 
                onClick={() => navigate('/search')}
                className="btn-outline w-full"
              >
                Browse All Profiles
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentProfile = profiles[currentIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      <MobileHeader 
        title="Discover" 
        showBack={true}
        onBack={() => navigate('/')}
        rightAction={
          <div className="text-sm text-text/70">
            {currentIndex + 1} of {profiles.length}
          </div>
        }
      />
      
      <div className="pt-20 pb-32 px-4 flex items-center justify-center min-h-screen">
        <ExpoSwipeCard
          profile={currentProfile}
          onSwipe={handleSwipe}
          onViewProfile={handleViewProfile}
        />
      </div>

      {/* Progress Indicator */}
      <div className="fixed bottom-20 left-0 right-0 px-4">
        <div className="flex justify-center space-x-1">
          {profiles.slice(0, Math.min(5, profiles.length)).map((_, index) => (
            <div
              key={index}
              className={`h-1 rounded-full transition-all duration-300 ${
                index === currentIndex ? 'w-8 bg-primary' : 
                index < currentIndex ? 'w-4 bg-green-500' : 'w-4 bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExpoSwipePage;