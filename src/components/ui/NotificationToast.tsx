import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Eye, X, User } from 'lucide-react';

interface NotificationToastProps {
  type: 'like' | 'message' | 'view' | 'match';
  message: string;
  userName?: string;
  userImage?: string;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  type,
  message,
  userName,
  userImage,
  isVisible,
  onClose,
  duration = 5000
}) => {
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShowToast(true);
      
      const timer = setTimeout(() => {
        setShowToast(false);
        setTimeout(onClose, 300);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'like':
        return <Heart className="w-5 h-5 text-red-500 fill-current" />;
      case 'message':
        return <MessageCircle className="w-5 h-5 text-blue-500" />;
      case 'view':
        return <Eye className="w-5 h-5 text-green-500" />;
      case 'match':
        return <Heart className="w-5 h-5 text-pink-500 fill-current" />;
      default:
        return <Heart className="w-5 h-5 text-gray-500" />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'like':
        return 'bg-red-50 border-red-200';
      case 'message':
        return 'bg-blue-50 border-blue-200';
      case 'view':
        return 'bg-green-50 border-green-200';
      case 'match':
        return 'bg-pink-50 border-pink-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <AnimatePresence>
      {showToast && (
        <motion.div
          initial={{ opacity: 0, x: 300, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 300, scale: 0.8 }}
          className={`fixed top-20 right-4 z-50 ${getBackgroundColor()} rounded-lg shadow-lg border p-4 max-w-sm w-full mx-4`}
        >
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              {getIcon()}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                {userImage ? (
                  <img
                    src={userImage}
                    alt={userName}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                ) : userName ? (
                  <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                    <User className="w-3 h-3 text-gray-600" />
                  </div>
                ) : null}
                
                {userName && (
                  <span className="font-medium text-gray-900 text-sm">{userName}</span>
                )}
              </div>
              
              <p className="text-sm text-gray-700">{message}</p>
            </div>
            
            <button
              onClick={() => {
                setShowToast(false);
                setTimeout(onClose, 300);
              }}
              className="flex-shrink-0 p-1 hover:bg-white hover:bg-opacity-50 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NotificationToast;