import React from 'react';
import { AlertTriangle, Crown, Eye } from 'lucide-react';
import { useMembership } from '../../context/MembershipContext';

interface ViewLimitWarningProps {
  onUpgrade: () => void;
}

const ViewLimitWarning: React.FC<ViewLimitWarningProps> = ({ onUpgrade }) => {
  const { currentPlan, limits, dailyViewsUsed, monthlyViewsUsed } = useMembership();

  const dailyRemaining = limits.profileViewsPerDay === -1 ? 'Unlimited' : limits.profileViewsPerDay - dailyViewsUsed;
  const monthlyRemaining = limits.profileViewsPerMonth === -1 ? 'Unlimited' : limits.profileViewsPerMonth - monthlyViewsUsed;

  const isNearDailyLimit = limits.profileViewsPerDay !== -1 && dailyViewsUsed >= limits.profileViewsPerDay * 0.8;
  const isNearMonthlyLimit = limits.profileViewsPerMonth !== -1 && monthlyViewsUsed >= limits.profileViewsPerMonth * 0.8;

  if (!isNearDailyLimit && !isNearMonthlyLimit) return null;

  return (
    <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-4 mb-6">
      <div className="flex items-start">
        <AlertTriangle className="text-orange-500 mt-1 mr-3 flex-shrink-0" size={20} />
        <div className="flex-1">
          <h3 className="font-medium text-orange-800 mb-2">Profile View Limit Warning</h3>
          
          <div className="space-y-2 text-sm text-orange-700 mb-4">
            <div className="flex items-center justify-between">
              <span>Daily views remaining:</span>
              <span className="font-medium">{dailyRemaining}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Monthly views remaining:</span>
              <span className="font-medium">{monthlyRemaining}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onUpgrade}
              className="flex items-center justify-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-light transition-colors duration-300"
            >
              <Crown size={16} className="mr-2" />
              Upgrade Plan
            </button>
            
            <div className="text-xs text-orange-600">
              Upgrade to get more profile views and unlock premium features
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewLimitWarning;