import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

export type MembershipPlan = 'free' | 'basic' | 'premium' | 'elite';

interface MembershipContextType {
  currentPlan: MembershipPlan;
  isPremium: boolean;
  isLoading: boolean;
  eliteSince: string | null;
  upgradePlan: (plan: MembershipPlan) => Promise<void>;
  updateMembership: (plan: MembershipPlan) => void;
  checkFeatureAccess: (feature: string) => boolean;
  canViewProfile: () => boolean;
  incrementProfileView: () => Promise<void>;
  getFeatureLimits: () => {
    dailyViews: number;
    monthlyLikes: number;
    messageLimit: number;
    canSeeWhoLiked: boolean;
    canUseAdvancedFilters: boolean;
  };
}

const MembershipContext = createContext<MembershipContextType | undefined>(undefined);

interface MembershipProviderProps {
  children: ReactNode;
}

export function MembershipProvider({ children }: MembershipProviderProps) {
  const { user } = useAuth();
  const [currentPlan, setCurrentPlan] = useState<MembershipPlan>('free');
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [eliteSince, setEliteSince] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchMembershipStatus();
    } else {
      setCurrentPlan('free');
      setIsPremium(false);
      setIsLoading(false);
      setEliteSince(null);
    }
  }, [user]);

  const fetchMembershipStatus = async () => {
    if (!user?.id) return;

    try {
      // Get user profile from profiles table
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (error) {
        // If profile doesn't exist, create one
        if (error.code === 'PGRST116') {
          await createUserProfile();
          return;
        }
        throw error;
      }

      if (profileData) {
        const plan = profileData.membership_plan as MembershipPlan || 'free';
        const premium = profileData.is_premium ?? false;
        const eliteDate = profileData.elite_since || null;

        setCurrentPlan(plan);
        setIsPremium(premium);
        setEliteSince(eliteDate);
      } else {
        // Fallback to defaults
        setCurrentPlan('free');
        setIsPremium(false);
        setEliteSince(null);
      }
    } catch (error) {
      console.error('❌ Error fetching membership status:', error);
      // Set defaults on error
      setCurrentPlan('free');
      setIsPremium(false);
      setEliteSince(null);
    } finally {
      setIsLoading(false);
    }
  };

  const createUserProfile = async () => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          membership_plan: 'free',
          is_premium: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      setCurrentPlan('free');
      setIsPremium(false);
      setEliteSince(null);
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  };

  const upgradePlan = async (plan: MembershipPlan) => {
    if (!user?.id) return;

    try {
      const updateData: any = {
        membership_plan: plan,
        is_premium: plan !== 'free',
        updated_at: new Date().toISOString()
      };

      // Set elite_since date if upgrading to elite
      if (plan === 'elite' && currentPlan !== 'elite') {
        updateData.elite_since = new Date().toISOString();
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;

      // Update local state
      setCurrentPlan(plan);
      setIsPremium(plan !== 'free');
      
      if (plan === 'elite' && currentPlan !== 'elite') {
        setEliteSince(updateData.elite_since);
      }

      console.log(`✅ Successfully upgraded to ${plan} plan`);
    } catch (error) {
      console.error('Error upgrading plan:', error);
      throw error;
    }
  };

  const updateMembership = (plan: MembershipPlan) => {
    // Update local state immediately for better UX
    setCurrentPlan(plan);
    setIsPremium(plan !== 'free');

    if (plan === 'elite' && currentPlan !== 'elite') {
      const now = new Date().toISOString();
      setEliteSince(now);
    }

    // Update database in background
    if (user) {
      upgradePlan(plan).catch((error) => {
        console.error('Failed to update membership in database:', error);
        // Revert local state on failure
        fetchMembershipStatus();
      });
    }
  };

  const checkFeatureAccess = (feature: string): boolean => {
    const limits = getFeatureLimits();

    switch (feature) {
      case 'advanced_filters':
        return limits.canUseAdvancedFilters;
      case 'see_who_liked':
        return limits.canSeeWhoLiked;
      case 'unlimited_messaging':
        return currentPlan === 'premium' || currentPlan === 'elite';
      case 'priority_support':
      case 'view_contact_info':
      case 'verified_badge':
        return currentPlan === 'elite';
      case 'read_receipts':
        return currentPlan === 'premium' || currentPlan === 'elite';
      case 'boost_profile':
        return currentPlan === 'basic' || currentPlan === 'premium' || currentPlan === 'elite';
      default:
        return false;
    }
  };

  const canViewProfile = (): boolean => {
    const limits = getFeatureLimits();
    // For now, always allow profile viewing
    // In the future, you can implement daily view tracking
    if (limits.dailyViews === -1) return true;
    return true;
  };

  const incrementProfileView = async (): Promise<void> => {
    if (!user?.id) return;
    
    try {
      // Record profile view in profile_views table (if you want to track this)
      const { error } = await supabase
        .from('profile_views')
        .insert({
          viewer_id: user.id,
          viewed_at: new Date().toISOString()
        });

      if (error && error.code !== '23505') { // Ignore duplicate key errors
        console.error('Error recording profile view:', error);
      }
    } catch (error) {
      console.error('Error incrementing profile view:', error);
    }
  };

  const getFeatureLimits = () => {
    switch (currentPlan) {
      case 'free':
        return {
          dailyViews: 10,
          monthlyLikes: 5,
          messageLimit: 3,
          canSeeWhoLiked: false,
          canUseAdvancedFilters: false
        };
      case 'basic':
        return {
          dailyViews: 50,
          monthlyLikes: 25,
          messageLimit: 20,
          canSeeWhoLiked: false,
          canUseAdvancedFilters: true
        };
      case 'premium':
        return {
          dailyViews: 200,
          monthlyLikes: 100,
          messageLimit: -1, // Unlimited
          canSeeWhoLiked: true,
          canUseAdvancedFilters: true
        };
      case 'elite':
        return {
          dailyViews: -1, // Unlimited
          monthlyLikes: -1, // Unlimited
          messageLimit: -1, // Unlimited
          canSeeWhoLiked: true,
          canUseAdvancedFilters: true
        };
      default:
        return {
          dailyViews: 10,
          monthlyLikes: 5,
          messageLimit: 3,
          canSeeWhoLiked: false,
          canUseAdvancedFilters: false
        };
    }
  };

  const value: MembershipContextType = {
    currentPlan,
    isPremium,
    isLoading,
    eliteSince,
    upgradePlan,
    updateMembership,
    checkFeatureAccess,
    canViewProfile,
    incrementProfileView,
    getFeatureLimits
  };

  return (
    <MembershipContext.Provider value={value}>
      {children}
    </MembershipContext.Provider>
  );
}

export function useMembership() {
  const context = useContext(MembershipContext);
  if (context === undefined) {
    throw new Error('useMembership must be used within a MembershipProvider');
  }
  return context;
}