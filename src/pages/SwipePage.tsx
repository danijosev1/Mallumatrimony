import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useMembership } from '../context/MembershipContext';
import { useNavigate } from 'react-router-dom';
import { Lock, ArrowLeft, Crown } from 'lucide-react';
import SwipeCards from '../components/profile/SwipeCards';
import UpgradeModal from '../components/ui/UpgradeModal';
import { featuredProfiles } from '../data/mockProfiles';

const SwipePage: React.FC = () => {
  const { user } = useAuth();
  const { checkFeatureAccess } = useMembership();
  const navigate = useNavigate();
  const [showUpgradeModal, setShowUpgradeModal] = React.useState(false);

  React.useEffect(() => {
    if (!user) {
      navigate('/login');
    } else if (currentPlan === 'free') {
      setShowUpgradeModal(true);
    }
  }, [user, currentPlan, navigate]);

  if (!user) {
    return (
      <div className="pt-20 min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <Lock className="text-primary mx-auto mb-4" size={48} />
          <h2 className="text-2xl font-bold text-primary mb-4">Login Required</h2>
          <p className="text-text/70 mb-6">
            Please log in to use the swipe feature and discover your perfect match.
          </p>
          <button 
            onClick={() => navigate('/login')}
            className="btn-primary w-full"
          >
            Login to Continue
          </button>
        </div>
      </div>
    );
  }

  if (currentPlan === 'free') {
    return (
      <div className="pt-20 min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <Crown className="text-primary mx-auto mb-4" size={48} />
          <h2 className="text-2xl font-bold text-primary mb-4">Premium Feature</h2>
          <p className="text-text/70 mb-6">
            Swipe mode is available for Basic, Premium, and Elite members. Messaging is free for all users!
          </p>
          <div className="space-y-4">
            <button 
              onClick={() => setShowUpgradeModal(true)}
              className="btn-primary w-full"
            >
              Upgrade to Access
            </button>
            <button 
              onClick={() => navigate('/search')}
              className="btn-outline w-full"
            >
              Back to Search
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 bg-gradient-to-br from-pink-50 to-purple-50 min-h-screen">
      <div className="container-custom py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/search')}
            className="flex items-center text-primary hover:text-primary-light transition-colors duration-300"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Search
          </button>
          <h1 className="text-2xl font-bold text-primary">Discover Matches</h1>
          <div className="text-sm text-text/70">
            Swipe right to like, left to pass
          </div>
        </div>

        {/* Instructions */}
        <div className="text-center mb-8">
          <p className="text-text/80 max-w-2xl mx-auto">
            Swipe through profiles to find your perfect match. Swipe right if you're interested, 
            left to pass. When both of you like each other, it's a match!
          </p>
        </div>

        {/* Swipe Cards */}
        <div className="flex justify-center">
          <SwipeCards profiles={featuredProfiles} />
        </div>

        {/* Tips */}
        <div className="mt-16 bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
          <h3 className="text-lg font-semibold text-primary mb-4">Swipe Tips</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-text/70">
            <div>
              <strong className="text-primary">Swipe Right:</strong> When you're interested in someone
            </div>
            <div>
              <strong className="text-primary">Swipe Left:</strong> To pass on a profile
            </div>
            <div>
              <strong className="text-primary">Tap Buttons:</strong> Use the heart and X buttons below
            </div>
            <div>
              <strong className="text-primary">View Profile:</strong> Tap the profile to see more details
            </div>
          </div>
        </div>
      </div>

      {/* Upgrade Modal */}
      <UpgradeModal 
        isOpen={showUpgradeModal}
        onClose={() => {
          setShowUpgradeModal(false);
          navigate('/search');
        }}
        feature="Swipe Mode"
      />
    </div>
  );
};

export default SwipePage;