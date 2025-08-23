import React, { useState } from 'react';
import { ArrowLeft, MoreVertical, Bell, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMobileFeatures } from '../../hooks/useMobileFeatures';
import { useAuth } from '../../context/AuthContext';
import Logo from '../ui/Logo';

interface MobileHeaderProps {
  title?: string;
  showBack?: boolean;
  showNotifications?: boolean;
  showMenu?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({
  title,
  showBack = false,
  showNotifications = false,
  showMenu = false,
  onBack,
  rightAction
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hapticFeedback, isNative } = useMobileFeatures();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleBack = async () => {
    if (isNative) await hapticFeedback('light');
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  const handleMenuClick = async () => {
    if (isNative) await hapticFeedback('light');
    setShowDropdown(!showDropdown);
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50 safe-area-top">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left Side */}
        <div className="flex items-center">
          {showBack ? (
            <button
              onClick={handleBack}
              className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors duration-200 active:scale-90"
            >
              <ArrowLeft size={20} className="text-gray-700" />
            </button>
          ) : (
            <div className="flex items-center">
              <Logo />
              <span className="ml-2 text-lg font-bold text-primary">
                {title || 'Mallu Matrimony'}
              </span>
            </div>
          )}
        </div>

        {/* Center Title (when back button is shown) */}
        {showBack && title && (
          <h1 className="text-lg font-semibold text-gray-900 truncate">
            {title}
          </h1>
        )}

        {/* Right Side */}
        <div className="flex items-center space-x-2">
          {rightAction}
          
          {showNotifications && user && (
            <button
              onClick={async () => {
                if (isNative) await hapticFeedback('light');
                navigate('/notifications');
              }}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200 active:scale-90 relative"
            >
              <Bell size={20} className="text-gray-700" />
              {/* Notification badge would go here */}
            </button>
          )}

          {showMenu && (
            <div className="relative">
              <button
                onClick={handleMenuClick}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200 active:scale-90"
              >
                <MoreVertical size={20} className="text-gray-700" />
              </button>

              {/* Dropdown Menu */}
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <button
                    onClick={async () => {
                      if (isNative) await hapticFeedback('light');
                      navigate('/settings');
                      setShowDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                  >
                    <Settings size={16} className="mr-3" />
                    Settings
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default MobileHeader;