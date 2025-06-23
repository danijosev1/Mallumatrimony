import React from 'react';
import { X, Crown, Check, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade?: (plan: string) => void;
  feature?: string;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose, onUpgrade, feature }) => {
  const navigate = useNavigate();
  
  const handleSelectPlan = () => {
    if (onUpgrade) {
      onUpgrade('elite');
    } else {
      navigate('/select-plan');
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            className="fixed inset-0 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          <motion.div
            className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Crown size={28} className="mr-3" />
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Upgrade to Elite Membership</h2>
                    {feature && (
                      <p className="text-white/90">
                        Unlock "{feature}" and many more premium features
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="text-white/80 hover:text-white transition-colors duration-200"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Plans */}
            <div className="p-6">
              <div className="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-amber-500 mb-6">
                <div className="bg-gradient-to-r from-amber-500 to-yellow-500 p-6 text-white">
                  <div className="flex items-center mb-4">
                    <Crown className="h-10 w-10 mr-4" />
                    <div>
                      <h3 className="text-2xl font-bold">Elite Membership</h3>
                      <p className="text-white/90">Exclusive benefits for serious relationship seekers</p>
                    </div>
                  </div>
                  
                  <div className="flex items-baseline mb-2">
                    <span className="text-3xl font-bold line-through opacity-70">₹2000</span>
                    <span className="text-4xl font-bold ml-2">₹0</span>
                    <span className="ml-2 text-white/90">for early users!</span>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {[
                      "Unlimited profile views",
                      "Unlimited messaging",
                      "View contact details",
                      "Elite member badge",
                      "Priority profile visibility",
                      "Advanced matching algorithm",
                      "Dedicated relationship manager",
                      "Premium support"
                    ].map((feature, index) => (
                      <div key={index} className="flex items-start">
                        <div className="mt-1 mr-3 bg-green-100 text-green-600 rounded-full p-1">
                          <Check size={16} />
                        </div>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  <button
                    onClick={handleSelectPlan}
                    className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-lg font-semibold hover:from-amber-600 hover:to-yellow-600 transition-all duration-300 shadow-md hover:shadow-lg"
                  >
                    Upgrade to Elite - Free!
                  </button>
                  
                  <p className="text-center text-sm text-gray-500 mt-4">
                    Limited time offer for early users. No payment required.
                  </p>
                </div>
              </div>

              {/* Benefits Section */}
              <div className="mt-8 bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                  Why Upgrade to Elite?
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Crown className="text-amber-600" size={20} />
                    </div>
                    <h4 className="font-medium text-gray-900 mb-1">Elite Badge</h4>
                    <p className="text-sm text-gray-600">Stand out with an exclusive badge</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Star className="text-amber-600" size={20} />
                    </div>
                    <h4 className="font-medium text-gray-900 mb-1">Better Matches</h4>
                    <p className="text-sm text-gray-600">Advanced algorithm finds perfect matches</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Check className="text-amber-600" size={20} />
                    </div>
                    <h4 className="font-medium text-gray-900 mb-1">Unlimited Access</h4>
                    <p className="text-sm text-gray-600">No restrictions on messaging or viewing</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Crown className="text-amber-600" size={20} />
                    </div>
                    <h4 className="font-medium text-gray-900 mb-1">Priority Support</h4>
                    <p className="text-sm text-gray-600">Get help when you need it most</p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-6 text-center text-sm text-gray-600">
                <p>Free Elite membership for early users. Limited time offer.</p>
                <p className="mt-1">No hidden fees. Cancel anytime.</p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default UpgradeModal;