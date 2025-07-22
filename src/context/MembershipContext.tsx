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
      // Try to get user profile directly instead of using RPC function
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      const profile = data;

      if (profile) {
        setCurrentPlan((profile.membership_plan as MembershipPlan) || 'free');
        setIsPremium(profile.is_premium ?? false);

        if (typeof profile.preferences === 'object') {
          setEliteSince(profile.preferences.elite_since ?? null);
        }
      } else {
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

  const upgradePlan = async (plan: MembershipPlan) => {
    if (!user) return;

    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('preferences')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      const preferences = profileData?.preferences || {};

      if (plan === 'elite' && !preferences.elite_since) {
        preferences.elite_since = new Date().toISOString();
      }

      const { error: updateError } = await supabase.rpc('update_user_preferences', {
        user_id: user.id,
        new_preferences: preferences
      });

      if (updateError) throw updateError;

      setCurrentPlan(plan);
      setIsPremium(plan !== 'free');
      if (plan === 'elite') {
        setEliteSince(preferences.elite_since);
      }
    } catch (error) {
      console.error('Error upgrading plan:', error);
      throw error;
    }
  };

  const updateMembership = (plan: MembershipPlan) => {
    setCurrentPlan(plan);
    setIsPremium(plan !== 'free');

    if (plan === 'elite') {
      const now = new Date().toISOString();
      setEliteSince(now);
    }

    if (user) {
      upgradePlan(plan).catch(console.error);
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
        return currentPlan === 'elite';
      default:
        return false;
    }
  };

  const canViewProfile = (): boolean => {
    const limits = getFeatureLimits();
    if (limits.dailyViews === -1) return true;
    return true; // Currently not limiting views
  };

  const incrementProfileView = async (): Promise<void> => {
    if (!user) return;
    try {
      // Logic is disabled for now
      console.log('Profile view recorded (tracking disabled)');
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
          messageLimit: -1,
          canSeeWhoLiked: true,
          canUseAdvancedFilters: true
        };
      case 'elite':
        return {
          dailyViews: -1,
          monthlyLikes: -1,
          messageLimit: -1,
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
