import React, { useState, useRef } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { Heart, X, Star, MapPin, Briefcase, GraduationCap } from 'lucide-react';
import { ProfileType } from '../../types/profile';

interface SwipeCardsProps {
  profiles: ProfileType[];
}

const SwipeCards: React.FC<SwipeCardsProps> = ({ profiles }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [exitDirection, setExitDirection] = useState<'left' | 'right' | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);
  const likeOpacity = useTransform(x, [50, 150], [0, 1]);
  const passOpacity = useTransform(x, [-150, -50], [1, 0]);

  // Move conditional return after all hooks
  if (currentIndex >= profiles.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="text-center">
          <Star className="text-secondary mx-auto mb-4\" size={48} />
          <h3 className="text-2xl font-bold text-primary mb-2">That's All For Now!</h3>
          <p className="text-text/70 mb-4">
            You're an early bird to our community! 🐦
          </p>
          <p className="text-text/70 mb-6">
            Check back later for new profiles and matches.
          </p>
          <button 
            onClick={() => setCurrentIndex(0)}
            className="btn-primary"
          >
            Start Over
          </button>
        </div>
      </div>
    );
  }

  const handleDragEnd = (event: any, info: PanInfo) => {
    const threshold = 100;
    
    if (info.offset.x > threshold) {
      // Swiped right - like
      setExitDirection('right');
      handleSwipe('like');
    } else if (info.offset.x < -threshold) {
      // Swiped left - pass
      setExitDirection('left');
      handleSwipe('pass');
    } else {
      // Return to center
      x.set(0);
    }
  };

  const handleSwipe = (action: 'like' | 'pass') => {
    console.log(`${action} on profile:`, profiles[currentIndex]?.name);
    
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
      setExitDirection(null);
      x.set(0);
    }, 300);
  };

  const handleButtonAction = (action: 'like' | 'pass') => {
    setExitDirection(action === 'like' ? 'right' : 'left');
    x.set(action === 'like' ? 300 : -300);
    handleSwipe(action);
  };

  const getFirstName = (fullName: string) => {
    return fullName.split(' ')[0];
  };

  const getLastInitial = (fullName: string) => {
    const names = fullName.split(' ');
    return names.length > 1 ? names[names.length - 1][0] + '.' : '';
  };

  const currentProfile = profiles[currentIndex];
  const nextProfile = profiles[currentIndex + 1];

  return (
    <div className="relative w-full max-w-sm mx-auto h-[600px]">
      {/* Next card (background) */}
      {nextProfile && (
        <div className="absolute inset-0 bg-white rounded-2xl shadow-lg">
          <div className="relative h-full">
            <img
              src={nextProfile.images[0]}
              alt={nextProfile.name}
              className="w-full h-2/3 object-cover rounded-t-2xl"
            />
            <div className="p-6">
              <h3 className="text-xl font-bold text-primary">
                {getFirstName(nextProfile.name)} {getLastInitial(nextProfile.name)}
              </h3>
              <p className="text-text/70">{nextProfile.age} years • {nextProfile.location}</p>
            </div>
          </div>
        </div>
      )}

      {/* Current card */}
      <motion.div
        ref={cardRef}
        className="absolute inset-0 bg-white rounded-2xl shadow-xl cursor-grab active:cursor-grabbing"
        style={{ x, rotate, opacity }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        onDragEnd={handleDragEnd}
        animate={exitDirection ? {
          x: exitDirection === 'right' ? 300 : -300,
          opacity: 0
        } : {}}
        transition={{ duration: 0.3 }}
      >
        <div className="relative h-full">
          {/* Profile Image */}
          <div className="relative h-2/3">
            <img
              src={currentProfile.images[0]}
              alt={currentProfile.name}
              className="w-full h-full object-cover rounded-t-2xl"
            />
            
            {/* Premium Badge */}
            {currentProfile.isPremium && (
              <div className="absolute top-4 left-4 bg-secondary text-accent text-xs font-medium px-3 py-1 rounded-full">
                Premium
              </div>
            )}

            {/* Swipe Indicators */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              style={{ opacity: likeOpacity }}
            >
              <div className="bg-green-500 text-white px-6 py-3 rounded-full font-bold text-lg transform rotate-12">
                LIKE
              </div>
            </motion.div>

            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              style={{ opacity: passOpacity }}
            >
              <div className="bg-red-500 text-white px-6 py-3 rounded-full font-bold text-lg transform -rotate-12">
                PASS
              </div>
            </motion.div>
          </div>

          {/* Profile Info */}
          <div className="p-6 h-1/3 flex flex-col justify-between">
            <div>
              <h3 className="text-2xl font-bold text-primary mb-2">
                {getFirstName(currentProfile.name)} {getLastInitial(currentProfile.name)}, {currentProfile.age}
              </h3>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-text/70">
                  <Briefcase size={14} className="mr-2 text-primary" />
                  {currentProfile.profession}
                </div>
                <div className="flex items-center text-sm text-text/70">
                  <MapPin size={14} className="mr-2 text-primary" />
                  {currentProfile.location}
                </div>
                <div className="flex items-center text-sm text-text/70">
                  <GraduationCap size={14} className="mr-2 text-primary" />
                  {currentProfile.education}
                </div>
              </div>

              {/* Key Details */}
              <div className="flex flex-wrap gap-2">
                {currentProfile.keyDetails.slice(0, 3).map((detail, index) => (
                  <span 
                    key={index} 
                    className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full"
                  >
                    {detail}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Action Buttons */}
      <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 flex space-x-6">
        <button
          onClick={() => handleButtonAction('pass')}
          className="w-14 h-14 bg-white border-2 border-red-200 rounded-full flex items-center justify-center shadow-lg hover:border-red-300 transition-colors duration-300"
        >
          <X className="text-red-500" size={24} />
        </button>
        
        <button
          onClick={() => handleButtonAction('like')}
          className="w-16 h-16 bg-white border-2 border-green-200 rounded-full flex items-center justify-center shadow-lg hover:border-green-300 transition-colors duration-300"
        >
          <Heart className="text-green-500" size={28} />
        </button>
      </div>

      {/* Progress Indicator */}
      <div className="absolute -top-8 left-0 right-0">
        <div className="flex justify-center space-x-1">
          {profiles.slice(0, 5).map((_, index) => (
            <div
              key={index}
              className={`w-8 h-1 rounded-full ${
                index === currentIndex ? 'bg-primary' : 
                index < currentIndex ? 'bg-green-500' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
        <p className="text-center text-sm text-text/70 mt-2">
          {currentIndex + 1} of {profiles.length}
        </p>
      </div>
    </div>
  );
};

export default SwipeCards;