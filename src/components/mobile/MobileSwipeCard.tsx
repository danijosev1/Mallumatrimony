import React, { useState, useRef } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { Heart, X, Star, MapPin, Briefcase, GraduationCap, Info } from 'lucide-react';
import { ProfileType } from '../../types/profile';
import { useMobileFeatures } from '../../hooks/useMobileFeatures';

interface MobileSwipeCardProps {
  profile: ProfileType;
  onSwipe: (direction: 'left' | 'right') => void;
  onViewProfile: () => void;
}

const MobileSwipeCard: React.FC<MobileSwipeCardProps> = ({ 
  profile, 
  onSwipe, 
  onViewProfile 
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const { hapticFeedback, isNative } = useMobileFeatures();
  const cardRef = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);
  const likeOpacity = useTransform(x, [50, 150], [0, 1]);
  const passOpacity = useTransform(x, [-150, -50], [1, 0]);

  const handleDragEnd = async (event: any, info: PanInfo) => {
    const threshold = 100;
    
    if (info.offset.x > threshold) {
      // Swiped right - like
      if (isNative) await hapticFeedback('medium');
      onSwipe('right');
    } else if (info.offset.x < -threshold) {
      // Swiped left - pass
      if (isNative) await hapticFeedback('light');
      onSwipe('left');
    } else {
      // Return to center
      x.set(0);
    }
  };

  const handleButtonAction = async (action: 'like' | 'pass') => {
    if (isNative) {
      await hapticFeedback(action === 'like' ? 'medium' : 'light');
    }
    x.set(action === 'like' ? 300 : -300);
    onSwipe(action === 'like' ? 'right' : 'left');
  };

  const getFirstName = (fullName: string) => {
    return fullName.split(' ')[0];
  };

  const getLastInitial = (fullName: string) => {
    const names = fullName.split(' ');
    return names.length > 1 ? names[names.length - 1][0] + '.' : '';
  };

  return (
    <div className="relative w-full max-w-sm mx-auto h-[70vh] min-h-[500px]">
      <motion.div
        ref={cardRef}
        className="absolute inset-0 bg-white rounded-2xl shadow-xl cursor-grab active:cursor-grabbing overflow-hidden"
        style={{ x, rotate, opacity }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        onDragEnd={handleDragEnd}
        whileTap={{ scale: 0.95 }}
      >
        {/* Profile Image */}
        <div className="relative h-3/5">
          <img
            src={profile.images[0]}
            alt={profile.name}
            className="w-full h-full object-cover"
          />
          
          {/* Premium Badge */}
          {profile.isPremium && (
            <div className="absolute top-4 left-4 bg-secondary text-accent text-xs font-medium px-3 py-1 rounded-full flex items-center">
              <Star size={12} className="mr-1" />
              Elite
            </div>
          )}

          {/* Info Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowDetails(!showDetails);
              if (isNative) hapticFeedback('light');
            }}
            className="absolute top-4 right-4 bg-white/90 text-primary p-2 rounded-full shadow-md hover:bg-white transition-colors duration-200"
          >
            <Info size={16} />
          </button>

          {/* Swipe Indicators */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            style={{ opacity: likeOpacity }}
          >
            <div className="bg-green-500 text-white px-6 py-3 rounded-full font-bold text-lg transform rotate-12 shadow-lg">
              LIKE ❤️
            </div>
          </motion.div>

          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            style={{ opacity: passOpacity }}
          >
            <div className="bg-red-500 text-white px-6 py-3 rounded-full font-bold text-lg transform -rotate-12 shadow-lg">
              PASS ✕
            </div>
          </motion.div>
        </div>

        {/* Profile Info */}
        <div className="p-4 h-2/5 flex flex-col">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-primary mb-2">
              {getFirstName(profile.name)} {getLastInitial(profile.name)}, {profile.age}
            </h3>
            
            <div className="space-y-2 mb-3">
              <div className="flex items-center text-sm text-text/70">
                <Briefcase size={14} className="mr-2 text-primary flex-shrink-0" />
                <span className="truncate">{profile.profession}</span>
              </div>
              <div className="flex items-center text-sm text-text/70">
                <MapPin size={14} className="mr-2 text-primary flex-shrink-0" />
                <span className="truncate">{profile.location}</span>
              </div>
              <div className="flex items-center text-sm text-text/70">
                <GraduationCap size={14} className="mr-2 text-primary flex-shrink-0" />
                <span className="truncate">{profile.education}</span>
              </div>
            </div>

            {/* Expandable Details */}
            <AnimatePresence>
              {showDetails && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-gray-50 rounded-lg p-3 mb-3"
                >
                  <p className="text-sm text-text/80 line-clamp-3">
                    {profile.shortBio}
                  </p>
                  <button
                    onClick={onViewProfile}
                    className="text-primary text-sm font-medium mt-2 hover:underline"
                  >
                    View Full Profile →
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Key Details */}
            <div className="flex flex-wrap gap-1">
              {profile.keyDetails.slice(0, 3).map((detail, index) => (
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
      </motion.div>

      {/* Mobile Action Buttons */}
      <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 flex space-x-6">
        <button
          onClick={() => handleButtonAction('pass')}
          className="w-14 h-14 bg-white border-2 border-red-200 rounded-full flex items-center justify-center shadow-lg hover:border-red-300 transition-colors duration-300 active:scale-90"
        >
          <X className="text-red-500" size={24} />
        </button>
        
        <button
          onClick={() => handleButtonAction('like')}
          className="w-16 h-16 bg-white border-2 border-green-200 rounded-full flex items-center justify-center shadow-lg hover:border-green-300 transition-colors duration-300 active:scale-90"
        >
          <Heart className="text-green-500" size={28} />
        </button>
      </div>

      {/* Swipe Instructions */}
      <div className="absolute -bottom-24 left-1/2 transform -translate-x-1/2 text-center">
        <p className="text-xs text-text/60">
          Swipe right to like • Swipe left to pass
        </p>
      </div>
    </div>
  );
};

export default MobileSwipeCard;