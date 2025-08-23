import React from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, MapPin, Briefcase, GraduationCap, Crown, Eye, Star } from 'lucide-react';
import { useMobileFeatures } from '../../hooks/useMobileFeatures';

interface MobileProfileCardProps {
  profile: {
    id: string;
    name: string;
    full_name: string;
    age: number;
    profession: string;
    location: string;
    education: string;
    images: string[];
    short_bio: string;
    is_premium: boolean;
  };
  onLike: () => void;
  onMessage: () => void;
  onViewProfile: () => void;
  isLiked?: boolean;
  isMatched?: boolean;
}

const MobileProfileCard: React.FC<MobileProfileCardProps> = ({
  profile,
  onLike,
  onMessage,
  onViewProfile,
  isLiked = false,
  isMatched = false
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
      {/* Profile Image */}
      <div className="relative aspect-[4/3]">
        <img
          src={profile.images[0]}
          alt={profile.name || profile.full_name}
          className="w-full h-full object-cover"
        />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col space-y-2">
          {profile.is_premium && (
            <div className="bg-amber-500 text-white text-xs font-medium px-2 py-1 rounded-full flex items-center">
              <Crown size={10} className="mr-1" />
              Elite
            </div>
          )}
          
          {isMatched && (
            <div className="bg-green-500 text-white text-xs font-medium px-2 py-1 rounded-full flex items-center">
              <Heart size={10} className="mr-1 fill-current" />
              Matched
            </div>
          )}
        </div>

        {/* View count */}
        <div className="absolute top-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded-full flex items-center">
          <Eye size={10} className="mr-1" />
          {Math.floor(Math.random() * 50) + 10}
        </div>

        {/* Quick actions overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
          <button
            onClick={() => handleAction(onViewProfile)}
            className="bg-white/90 text-primary px-4 py-2 rounded-full text-sm font-medium hover:bg-white transition-colors"
          >
            View Full Profile
          </button>
        </div>
      </div>

      {/* Profile Info */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              {getFirstName(profile.name || profile.full_name)}, {profile.age}
            </h3>
            
            <div className="space-y-1">
              <div className="flex items-center text-sm text-gray-600">
                <Briefcase size={12} className="mr-2 text-primary flex-shrink-0" />
                <span className="truncate">{profile.profession}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <MapPin size={12} className="mr-2 text-primary flex-shrink-0" />
                <span className="truncate">{profile.location}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <GraduationCap size={12} className="mr-2 text-primary flex-shrink-0" />
                <span className="truncate">{profile.education}</span>
              </div>
            </div>
          </div>
          
          {/* Compatibility score */}
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">
              {Math.floor(Math.random() * 30) + 70}%
            </div>
            <div className="text-xs text-gray-500">Match</div>
          </div>
        </div>

        {/* Bio */}
        {profile.short_bio && (
          <p className="text-sm text-gray-700 line-clamp-2 mb-4">
            {profile.short_bio}
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <button
            onClick={() => handleAction(onLike)}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center active:scale-95 ${
              isLiked
                ? 'bg-red-100 text-red-600 border border-red-200'
                : 'border border-primary text-primary hover:bg-primary/10'
            }`}
          >
            <Heart size={16} className={`mr-2 ${isLiked ? 'fill-current' : ''}`} />
            {isLiked ? 'Liked' : 'Like'}
          </button>
          
          <button
            onClick={() => handleAction(onMessage)}
            className="flex-1 bg-primary text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-light transition-colors duration-200 flex items-center justify-center active:scale-95"
          >
            <MessageCircle size={16} className="mr-2" />
            Message
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default MobileProfileCard;