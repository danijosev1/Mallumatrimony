import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Crown, Gift, Clock, Users } from 'lucide-react';
import { useMembership } from '../context/MembershipContext';

const SelectPlanPage: React.FC = () => {
  const { updateMembership } = useMembership();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    try {
      setLoading(true);
      
      // Update to Elite plan
      await updateMembership('elite');
      
      // Navigate to thank you page
      navigate('/thank-you');
    } catch (error) {
      console.error('Error upgrading plan:', error);
      alert('Failed to upgrade. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-yellow-50 pt-20">
      <div className="container mx-auto px-4 py-12">
        {/* Welcome Offer Banner */}
        <div className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-2xl p-8 mb-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="flex animate-pulse">
              {[...Array(20)].map((_, i) => (
                <div key={i} className="w-8 h-8 bg-white/20 rounded-full mx-2 animate-bounce" style={{ animationDelay: `${i * 0.1}s` }}></div>
              ))}
            </div>
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-center mb-4">
              <Gift className="text-yellow-200 mr-3 animate-bounce" size={32} />
              <h1 className="text-4xl font-bold">🎉 EXCLUSIVE OFFER!</h1>
              <Gift className="text-yellow-200 ml-3 animate-bounce" size={32} />
            </div>
            <h2 className="text-2xl font-semibold mb-4">Elite Membership FREE for Early Users!</h2>
            <div className="flex flex-wrap justify-center gap-6 text-center text-yellow-200 mb-6">
              <div className="flex items-center">
                <Clock size={20} className="mr-2" />
                <span>Limited Time Only</span>
              </div>
              <div className="flex items-center">
                <Users size={20} className="mr-2" />
                <span>Limited Spots Available</span>
              </div>
            </div>
            <p className="text-lg text-white/90 max-w-3xl mx-auto">
              As an early user of our platform, you're eligible for our exclusive Elite membership completely FREE!
              Enjoy all premium features with no payment required.
            </p>
          </div>
        </div>

        {/* Elite Plan Card */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-amber-500">
            <div className="bg-gradient-to-r from-amber-500 to-yellow-500 p-8 text-white text-center">
              <Crown className="h-16 w-16 mx-auto mb-4" />
              <h2 className="text-3xl font-bold mb-2">Elite Membership</h2>
              <p className="text-xl text-white/90 mb-4">The ultimate matrimonial experience</p>
              
              <div className="flex items-baseline justify-center mb-2">
                <span className="text-4xl font-bold line-through opacity-70">₹2000</span>
                <span className="text-5xl font-bold ml-3">₹0</span>
                <span className="ml-2 text-white/90">for early users!</span>
              </div>
            </div>
            
            <div className="p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">
                Everything You Need to Find Your Perfect Match
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {[
                  "Unlimited profile views",
                  "Unlimited messaging",
                  "View contact details",
                  "Elite member badge",
                  "Priority profile visibility",
                  "Advanced matching algorithm",
                  "Dedicated relationship manager",
                  "Premium support",
                  "Verified profiles only",
                  "Advanced search filters",
                  "See who viewed your profile",
                  "Personalized recommendations"
                ].map((feature, index) => (
                  <div key={index} className="flex items-start">
                    <div className="mt-1 mr-3 bg-green-100 text-green-600 rounded-full p-1">
                      <Check size={16} />
                    </div>
                    <span className="text-gray-800">{feature}</span>
                  </div>
                ))}
              </div>
              
              <button
                onClick={handleUpgrade}
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-lg font-semibold hover:from-amber-600 hover:to-yellow-600 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  "Activate Elite Membership - FREE!"
                )}
              </button>
              
              <p className="text-center text-sm text-gray-500 mt-4">
                Limited time offer for early users. No payment required.
              </p>
            </div>
          </div>
          
          {/* Additional Info */}
          <div className="text-center mt-8">
            <p className="text-gray-600 mb-4">
              Join thousands of Malayalis who found their perfect match with our Elite membership
            </p>
            <div className="flex justify-center space-x-8 text-sm text-gray-500">
              <span>✓ No Credit Card Required</span>
              <span>✓ Cancel Anytime</span>
              <span>✓ 24/7 Support</span>
            </div>
          </div>

          {/* Back Button */}
          <div className="text-center mt-8">
            <button
              onClick={() => navigate(-1)}
              className="text-gray-600 hover:text-gray-800 font-medium"
            >
              ← Back to Previous Page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectPlanPage;