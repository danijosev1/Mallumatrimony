import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, X, MessageCircle, User } from 'lucide-react';

interface MatchNotificationProps {
  isVisible: boolean;
  matchedUser: {
    id: string;
    name: string;
    image?: string;
  } | null;
  onClose: () => void;
  onMessage: () => void;
}

export const MatchNotification: React.FC<MatchNotificationProps> = ({
  isVisible,
  matchedUser,
  onClose,
  onMessage
}) => {
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    if (isVisible && matchedUser) {
      setShowNotification(true);
      
      // Auto-hide after 10 seconds
      const timer = setTimeout(() => {
        setShowNotification(false);
        setTimeout(onClose, 300); // Wait for animation to complete
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [isVisible, matchedUser, onClose]);

  if (!matchedUser) return null;

  return (
    <AnimatePresence>
      {showNotification && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 50 }}
          className="fixed bottom-4 right-4 z-50 bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 max-w-sm w-full mx-4"
        >
          {/* Close button */}
          <button
            onClick={() => {
              setShowNotification(false);
              setTimeout(onClose, 300);
            }}
            className="absolute top-3 right-3 p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>

          {/* Match celebration */}
          <div className="text-center mb-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-16 h-16 bg-gradient-to-r from-pink-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-3"
            >
              <Heart className="w-8 h-8 text-white fill-current" />
            </motion.div>
            
            <motion.h3
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xl font-bold text-gray-900 mb-1"
            >
              It's a Match! 🎉
            </motion.h3>
            
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-gray-600 text-sm"
            >
              You and {matchedUser.name} liked each other
            </motion.p>
          </div>

          {/* User profile */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex items-center space-x-3 mb-4 p-3 bg-gray-50 rounded-lg"
          >
            {matchedUser.image ? (
              <img
                src={matchedUser.image}
                alt={matchedUser.name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 bg-gradient-to-r from-rose-400 to-pink-400 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
            )}
            <div>
              <h4 className="font-semibold text-gray-900">{matchedUser.name}</h4>
              <p className="text-sm text-gray-600">Start a conversation!</p>
            </div>
          </motion.div>

          {/* Action buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex space-x-3"
          >
            <button
              onClick={() => {
                setShowNotification(false);
                setTimeout(onClose, 300);
              }}
              className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              Maybe Later
            </button>
            <button
              onClick={() => {
                onMessage();
                setShowNotification(false);
                setTimeout(onClose, 300);
              }}
              className="flex-1 py-2 px-4 bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-lg hover:from-pink-600 hover:to-red-600 transition-colors text-sm font-medium flex items-center justify-center"
            >
              <MessageCircle className="w-4 h-4 mr-1" />
              Message
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MatchNotification;