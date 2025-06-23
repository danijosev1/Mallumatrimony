import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Heart, MessageCircle, User, Settings, Crown, Users, Star } from 'lucide-react';
import { useMembership } from '../../context/MembershipContext';

interface SidebarProps {
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ className = '' }) => {
  const location = useLocation();
  const { currentPlan } = useMembership();
  
  const isActive = (path: string) => location.pathname === path;
  
  const navItems = [
    { path: '/', label: 'Home', icon: <Home size={20} /> },
    { path: '/search', label: 'Search', icon: <Search size={20} /> },
    { path: '/favorites', label: 'Favorites', icon: <Heart size={20} /> },
    { path: '/messages', label: 'Messages', icon: <MessageCircle size={20} /> },
    { path: '/profile', label: 'My Profile', icon: <User size={20} /> },
    { path: '/settings', label: 'Settings', icon: <Settings size={20} /> },
  ];

  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`}>
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-medium text-primary">Navigation</h3>
      </div>
      
      <nav className="p-2">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center px-4 py-3 rounded-md transition-colors duration-300 ${
              isActive(item.path)
                ? 'bg-primary/10 text-primary'
                : 'text-text/70 hover:bg-gray-50 hover:text-primary'
            }`}
          >
            {item.icon}
            <span className="ml-3">{item.label}</span>
          </Link>
        ))}
      </nav>
      
      {/* Elite Membership Banner */}
      {currentPlan !== 'elite' && (
        <div className="p-4 mt-2">
          <div className="bg-gradient-to-r from-amber-100 to-yellow-100 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <Crown className="text-amber-600 mr-2" size={20} />
              <h4 className="font-semibold text-amber-800">Elite Membership</h4>
            </div>
            <p className="text-sm text-amber-700 mb-3">
              Upgrade to Elite for unlimited messaging and full profile access.
            </p>
            <Link
              to="/select-plan"
              className="block w-full py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-center rounded-md text-sm font-medium hover:from-amber-600 hover:to-yellow-600 transition-colors"
            >
              Upgrade Now - Free!
            </Link>
          </div>
        </div>
      )}
      
      {/* Quick Stats */}
      <div className="p-4 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Quick Stats</h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm text-gray-600">
              <Users size={16} className="mr-2 text-primary/70" />
              <span>Daily Matches</span>
            </div>
            <span className="text-sm font-medium">12</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm text-gray-600">
              <Heart size={16} className="mr-2 text-red-500/70" />
              <span>Interests</span>
            </div>
            <span className="text-sm font-medium">8</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm text-gray-600">
              <Star size={16} className="mr-2 text-yellow-500/70" />
              <span>Matches</span>
            </div>
            <span className="text-sm font-medium">3</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;