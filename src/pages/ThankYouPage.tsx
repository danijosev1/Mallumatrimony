import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Crown, Check, Heart, MessageCircle, Eye, Search } from 'lucide-react';
import { useMembership } from '../context/MembershipContext';

const ThankYouPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentPlan, eliteSince } = useMembership();
  
  useEffect(() => {
    // If user is not an elite member, redirect to home
    if (currentPlan !== 'elite') {
      navigate('/');
    }
    
    // Auto-redirect after 10 seconds
    const timer = setTimeout(() => {
      navigate('/');
    }, 10000);
    
    return () => clearTimeout(timer);
  }, [currentPlan, navigate]);
  
  // Format the elite since date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'today';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-yellow-100 pt-20 pb-20">
      <div className="container mx-auto px-4 py-12">
        <motion.div 
          className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-500 to-yellow-500 p-8 text-white text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <Crown className="h-10 w-10" />
            </motion.div>
            
            <motion.h1 
              className="text-3xl md:text-4xl font-bold mb-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              You're Now an Elite Member!
            </motion.h1>
            
            <motion.p
              className="text-xl text-white/90"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              Welcome to the exclusive club of serious relationship seekers
            </motion.p>
          </div>
          
          {/* Content */}
          <div className="p-8">
            <motion.div
              className="text-center mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <p className="text-lg text-gray-700 mb-4">
                Start exploring full profiles and send unlimited messages. Your journey to finding your perfect match just got a major upgrade!
              </p>
              <p className="text-gray-600">
                Elite member since: <span className="font-semibold">{formatDate(eliteSince)}</span>
              </p>
            </motion.div>
            
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <div className="bg-amber-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-amber-800 mb-4 flex items-center">
                  <Crown className="mr-2 text-amber-600" size={20} />
                  Elite Benefits Unlocked
                </h3>
                <ul className="space-y-3">
                  {[
                    "Unlimited profile views",
                    "Unlimited messaging",
                    "View contact details",
                    "Elite member badge",
                    "Priority profile visibility",
                    "Advanced matching algorithm"
                  ].map((benefit, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="text-green-500 mr-2 mt-1 flex-shrink-0" size={16} />
                      <span className="text-gray-700">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="bg-amber-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-amber-800 mb-4">What to do next?</h3>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <div className="bg-amber-100 p-2 rounded-full mr-3 flex-shrink-0">
                      <Search className="text-amber-600" size={18} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">Browse Profiles</p>
                      <p className="text-sm text-gray-600">Explore potential matches with no limits</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-amber-100 p-2 rounded-full mr-3 flex-shrink-0">
                      <MessageCircle className="text-amber-600" size={18} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">Send Messages</p>
                      <p className="text-sm text-gray-600">Connect with unlimited matches</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-amber-100 p-2 rounded-full mr-3 flex-shrink-0">
                      <Eye className="text-amber-600" size={18} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">View Full Profiles</p>
                      <p className="text-sm text-gray-600">Access complete details including contact info</p>
                    </div>
                  </li>
                </ul>
              </div>
            </motion.div>
            
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <button
                onClick={() => navigate('/')}
                className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white px-8 py-3 rounded-lg font-semibold hover:from-amber-600 hover:to-yellow-600 transition-all duration-300 shadow-md hover:shadow-lg"
              >
                <Heart className="inline-block mr-2" size={18} />
                Start Finding Matches
              </button>
              
              <p className="text-sm text-gray-500 mt-4">
                You'll be redirected to your dashboard in a few seconds...
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ThankYouPage;