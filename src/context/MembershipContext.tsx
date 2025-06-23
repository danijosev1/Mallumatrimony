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
  const [dailyViewCount, setDailyViewCount] = useState(0);
  const [eliteSince, setEliteSince] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchMembershipStatus();
      fetchDailyViewCount();
    } else {
      setCurrentPlan('free');
      setIsPremium(false);
      setIsLoading(false);
      setDailyViewCount(0);
      setEliteSince(null);
    }
  }, [user]);

  const fetchMembershipStatus = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('membership_plan, is_premium, preferences')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setCurrentPlan(data.membership_plan as MembershipPlan);
        setIsPremium(data.is_premium || false);
        
        // Check for elite_since in preferences
        if (data.preferences && typeof data.preferences === 'object') {
          setEliteSince(data.preferences.elite_since || null);
        }
      }
    } catch (error) {
      console.error('Error fetching membership status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDailyViewCount = async () => {
    if (!user) return;

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { count, error } = await supabase
        .from('profile_views')
        .eq('viewer_id', user.id)
        .gte('created_at', today.toISOString())
        .select('*', { count: 'exact', head: true });

      if (error) throw error;

      setDailyViewCount(count || 0);
    } catch (error) {
      console.error('Error fetching daily view count:', error);
    }
  };

  const upgradePlan = async (plan: MembershipPlan) => {
    if (!user) return;

    try {
      // Get current preferences
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('preferences')
        .eq('id', user.id)
        .single();
        
      if (profileError) throw profileError;
      
      // Update preferences with elite_since timestamp if upgrading to elite
      const preferences = profileData.preferences || {};
      if (plan === 'elite' && !preferences.elite_since) {
        preferences.elite_since = new Date().toISOString();
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          membership_plan: plan,
          is_premium: plan !== 'free',
          preferences: preferences,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

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
    
    // Update in database
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
        return currentPlan === 'elite';
      case 'view_contact_info':
        return currentPlan === 'elite';
      default:
        return false;
    }
  };

  const canViewProfile = (): boolean => {
    const limits = getFeatureLimits();
    
    // If unlimited views (elite plan)
    if (limits.dailyViews === -1) {
      return true;
    }
    
    // Check if user has remaining views for today
    return dailyViewCount < limits.dailyViews;
  };

  const incrementProfileView = async (): Promise<void> => {
    if (!user) return;

    try {
      // Only increment if user hasn't exceeded their daily limit
      if (canViewProfile()) {
        setDailyViewCount(prev => prev + 1);
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
          messageLimit: -1, // unlimited
          canSeeWhoLiked: true,
          canUseAdvancedFilters: true
        };
      case 'elite':
        return {
          dailyViews: -1, // unlimited
          monthlyLikes: -1, // unlimited
          messageLimit: -1, // unlimited
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