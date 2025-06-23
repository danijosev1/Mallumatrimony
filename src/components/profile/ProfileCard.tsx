import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Info, Crown, Eye } from 'lucide-react';
import { ProfileType } from '../../types/profile';

interface ProfileCardProps {
  profile: ProfileType;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ profile }) => {
  const [isLiked, setIsLiked] = useState(false);
  
  const toggleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLiked(!isLiked);
  };

  const getFirstName = (fullName: string) => {
    return fullName.split(' ')[0];
  };

  const getLastInitial = (fullName: string) => {
    const names = fullName.split(' ');
    return names.length > 1 ? names[names.length - 1][0] + '.' : '';
  };

  return (
    <Link to={`/profile/${profile.id}`} className="block group">
      <div className="kerala-card hover:scale-[1.02] transition-transform duration-300">
        {/* Profile Image */}
        <div className="relative h-60 overflow-hidden">
          <img
            src={profile.images[0]}
            alt={profile.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          
          {/* Premium badge if applicable */}
          {profile.isPremium && (
            <div className="absolute top-3 left-3 bg-secondary text-accent text-xs font-medium px-2 py-1 rounded-full flex items-center">
              <Crown size={12} className="mr-1" />
              Premium
            </div>
          )}
          
          {/* Profile views indicator */}
          <div className="absolute top-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded-full flex items-center">
            <Eye size={12} className="mr-1" />
            {Math.floor(Math.random() * 50) + 10}
          </div>
          
          {/* Quick action buttons */}
          <div className="absolute bottom-3 right-3 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button 
              onClick={toggleLike}
              className="p-2 bg-white/90 rounded-full hover:bg-white transition-colors duration-300"
              aria-label="Like profile"
            >
              <Heart 
                size={18} 
                className={isLiked ? "text-red-500 fill-red-500" : "text-primary"} 
              />
            </button>
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // Handle message action
              }}
              className="p-2 bg-white/90 rounded-full hover:bg-white transition-colors duration-300"
              aria-label="Send message"
            >
              <MessageCircle size={18} className="text-primary" />
            </button>
          </div>
        </div>
        
        {/* Profile Info */}
        <div className="p-4">
          <h3 className="font-medium text-lg text-primary mb-1">
            {getFirstName(profile.name)} {getLastInitial(profile.name)}, {profile.age}
          </h3>
          
          <div className="flex items-center text-sm text-text/70 mb-3">
            <span>{profile.profession}</span>
            <span className="mx-1.5">•</span>
            <span>{profile.location}</span>
          </div>
          
          {/* Key Details */}
          <div className="flex flex-wrap gap-2 mb-3">
            {profile.keyDetails.slice(0, 3).map((detail, index) => (
              <span 
                key={index} 
                className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full"
              >
                {detail}
              </span>
            ))}
          </div>
          
          {/* Short Bio */}
          <p className="text-sm text-text/80 line-clamp-2">{profile.shortBio}</p>
        </div>
      </div>
    </Link>
  );
};

export default ProfileCard;