import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Heart, MessageCircle, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useMobileFeatures } from '../../hooks/useMobileFeatures';

const MobileNavigation: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const { hapticFeedback, isNative } = useMobileFeatures();

  const handleNavClick = async () => {
    if (isNative) {
      await hapticFeedback('light');
    }
  };

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/search', label: 'Search', icon: Search },
    { path: '/favorites', label: 'Favorites', icon: Heart },
    { path: '/messages', label: 'Messages', icon: MessageCircle },
    { path: user ? '/profile' : '/login', label: user ? 'Profile' : 'Login', icon: User }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-bottom">
      <div className="flex justify-around items-center py-2">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          const active = isActive(item.path);
          
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={handleNavClick}
              className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-all duration-200 ${
                active 
                  ? 'text-primary bg-primary/10' 
                  : 'text-gray-500 hover:text-primary active:scale-95'
              }`}
            >
              <IconComponent size={20} className="mb-1" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNavigation;