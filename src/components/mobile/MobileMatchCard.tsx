import React from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, MapPin, Briefcase, Star, Crown } from 'lucide-react';
import { useMobileFeatures } from '../../hooks/useMobileFeatures';

interface MobileMatchCardProps {
  match: {
    id: string;
    name: string;
    age: number;
    profession: string;
    location: string;
    images: string[];
    compatibility_score?: number;
    is_premium?: boolean;
  };
  onMessage: () => void;
  onViewProfile: () => void;
}

const MobileMatchCard: React.FC<MobileMatchCardProps> = ({
  match,
  onMessage,
  onViewProfile
}) => {
  const { hapticFeedback, isNative } = useMobileFeatures();

  const handleAction = async (action: () => void) => {
    if (isNative) await hapticFeedback('light');
    action();
  };

  const getFirstName = (fullName: string) => {
    return fullName.split(' ')[0];
  };

  return (
    <motion.div
      className="bg-white rounded-xl shadow-md overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="relative">
        {/* Profile Image */}
        <div className="aspect-[4/3] relative">
          <img
            src={match.images[0]}
            alt={match.name}
            className="w-full h-full object-cover"
          />
          
          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col space-y-2">
            {match.is_premium && (
              <div className="bg-amber-500 text-white text-xs font-medium px-2 py-1 rounded-full flex items-center">
                <Crown size={10} className="mr-1" />
                Elite
              </div>
            )}
            
            {match.compatibility_score && (
              <div className="bg-green-500 text-white text-xs font-medium px-2 py-1 rounded-full">
                {match.compatibility_score}% Match
              </div>
            )}
          </div>

          {/* Match indicator */}
          <div className="absolute top-3 right-3 bg-pink-500 text-white text-xs font-medium px-2 py-1 rounded-full flex items-center">
            <Heart size={10} className="mr-1 fill-current" />
            Match
          </div>
        </div>

        {/* Profile Info */}
        <div className="p-4">
          <div className="mb-3">
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              {getFirstName(match.name)}, {match.age}
            </h3>
            
            <div className="space-y-1">
              <div className="flex items-center text-sm text-gray-600">
                <Briefcase size={12} className="mr-2 text-primary flex-shrink-0" />
                <span className="truncate">{match.profession}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <MapPin size={12} className="mr-2 text-primary flex-shrink-0" />
                <span className="truncate">{match.location}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <button
              onClick={() => handleAction(onMessage)}
              className="flex-1 bg-primary text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-light transition-colors duration-200 flex items-center justify-center active:scale-95"
            >
              <MessageCircle size={16} className="mr-2" />
              Message
            </button>
            
            <button
              onClick={() => handleAction(onViewProfile)}
              className="flex-1 border border-primary text-primary py-3 px-4 rounded-lg font-medium hover:bg-primary/10 transition-colors duration-200 active:scale-95"
            >
              View Profile
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MobileMatchCard;