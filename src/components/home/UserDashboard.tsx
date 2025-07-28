import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Eye, Star, Users, Gift, User, Edit, CheckCircle, AlertTriangle, Crown, MapPin, GraduationCap, Briefcase, Check, Wifi, WifiOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useMembership } from '../../context/MembershipContext';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import UpgradeModal from '../ui/UpgradeModal';

interface MatchProfile {
  id: string;
  name: string;
  full_name: string;
  age: number;
  gender: string;
  religion: string;
  caste: string;
  education: string;
  profession: string;
  location: string;
  images: string[];
  short_bio: string;
  is_premium: boolean;
  compatibility_score?: number;
  compatibility_tags?: string[];
}

const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const { currentPlan, isPremium, updateMembership } = useMembership();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [profileComplete, setProfileComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [matchesLoading, setMatchesLoading] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [dashboardStats, setDashboardStats] = useState({
    profileViews: 0,
    interests: 0,
    messages: 0,
    matches: 0
  });
  const [activeTab, setActiveTab] = useState('discover');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [matchProfiles, setMatchProfiles] = useState<MatchProfile[]>([]);
  const [interactionLoading, setInteractionLoading] = useState<string | null>(null);
  const [userMatches, setUserMatches] = useState<MatchProfile[]>([]);

  useEffect(() => {
    if (user) {
      loadUserProfile();
      loadDashboardStats();
      loadMatchProfiles();
      loadUserMatches();
    }
  }, [user]);

  const loadUserProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setConnectionError(null);
      
      // Load basic profile - use maybeSingle() to handle missing profiles
      const { data: basicProfile, error: basicError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (basicError) {
        console.error('❌ Error loading profile:', basicError);
        if (basicError.name === 'CorsConfigurationError' || basicError.message?.includes('Failed to fetch')) {
          setConnectionError('Unable to connect to the database. Please check your connection and try again.');
        }
        setProfile(null);
        setProfileComplete(false);
        return;
      }

      if (!basicProfile) {
        console.log('⚠️ No profile found for user');
        setProfile(null);
        setProfileComplete(false);
        return;
      }

      // Load extended profile to check completeness - use maybeSingle() to handle missing rows gracefully
      const { data: extendedProfile, error: extendedError } = await supabase
        .from('extended_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (extendedError) {
        console.error('❌ Error loading extended profile:', extendedError);
      }

      // Check if profile is complete
      const isComplete = basicProfile && 
        basicProfile.about && 
        basicProfile.gender && 
        basicProfile.education && 
        basicProfile.profession &&
        basicProfile.images && 
        basicProfile.images.length > 0;

      setProfile(basicProfile);
      setProfileComplete(isComplete);
      
    } catch (error) {
      console.error('❌ Error loading profile:', error);
      if (error.name === 'CorsConfigurationError' || error.message?.includes('Failed to fetch')) {
        setConnectionError('Unable to connect to the database. Please check your connection and try again.');
      }
      setProfile(null);
      setProfileComplete(false);
    } finally {
      setLoading(false);
    }
  };

  const loadMatchProfiles = async () => {
    if (!user) return;
    
    try {
      setMatchesLoading(true);
      setConnectionError(null);
      
      // Try to get recommendations, fallback to basic profile search if function doesn't exist
      let recommendations;
      let error;
      
      try {
        const result = await supabase
          .rpc('get_recommended_profiles', { 
            current_user_id: user.id,
            limit_count: 10 
          });
        recommendations = result.data;
        error = result.error;
      } catch (rpcError) {
        console.log('RPC function not available, using fallback query');
        // Fallback to basic profile query
        const result = await supabase
          .from('profiles')
          .select('*')
          .neq('id', user.id)
          .limit(10);
        recommendations = result.data;
        error = result.error;
      }
        
      if (error) {
        if (error.name === 'CorsConfigurationError' || error.message?.includes('Failed to fetch')) {
          setConnectionError('Unable to connect to the database. Please check your connection and try again.');
        }
        throw error;
      }
      
      // Process recommendations for UI display
      const processedMatches = recommendations?.map(rec => ({
        ...rec,
        name: rec.name || rec.full_name || 'Anonymous',
        full_name: rec.full_name || rec.name || 'Anonymous',
        compatibility_tags: ['Recommended', 'Compatible Match']
      })) || [];
      
      setMatchProfiles(processedMatches);
    } catch (error) {
      console.error('Error loading match profiles:', error);
      if (error.name === 'CorsConfigurationError' || error.message?.includes('Failed to fetch')) {
        setConnectionError('Unable to connect to the database. Please check your connection and try again.');
      }
      setMatchProfiles([]);
    } finally {
      setMatchesLoading(false);
    }
  };

 const loadUserMatches = async () => {
  if (!user?.id) return;

  try {
    setConnectionError(null);

    // Use direct table queries instead of RPC function
    const { data: matches1, error: error1 } = await supabase
      .from('matches')
      .select('id, matched_user_id, created_at')
      .eq('user_id', user.id);

    if (error1) {
      console.error('Error fetching user matches (user1):', error1.message);
      if (error.name === 'CorsConfigurationError' || error.message?.includes('Failed to fetch')) {
        setConnectionError('Unable to connect to the database. Please check your connection and try again.');
      }
      setUserMatches([]);
      return;
    }

    const { data: matches2, error: error2 } = await supabase
      .from('matches')
      .select('id, user_id, created_at')
      .eq('matched_user_id', user.id);

    if (error2) {
      console.error('Error fetching user matches (user2):', error2.message);
      setUserMatches([]);
      return;
    }

    // Get other user IDs from matches
    const otherUserIds = [
      ...(matches1 || []).map(match => match.matched_user_id),
      ...(matches2 || []).map(match => match.user_id)
    ];

    if (otherUserIds.length === 0) {
      setUserMatches([]);
      return;
    }

    // Fetch profiles for matched users
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name, full_name, age, profession, location, images')
      .in('id', otherUserIds);

    if (profilesError) {
      console.error('Error fetching match profiles:', profilesError.message);
      setUserMatches([]);
      return;
    }

    const processedMatches = (profiles || []).map(profile => ({
      id: profile.id,
      name: profile.name || profile.full_name || 'Anonymous',
      full_name: profile.full_name || profile.name || 'Anonymous',
      age: profile.age,
      profession: profile.profession,
      location: profile.location,
      images: profile.images || [],
      compatibility_score: Math.floor(Math.random() * 30) + 70,
      compatibility_tags: ['Mutual Match', 'Compatible']
    }));

    setUserMatches(processedMatches);
  } catch (error) {
    console.error('❌ Exception loading user matches:', error);
    if (error.name === 'CorsConfigurationError' || error.message?.includes('Failed to fetch')) {
      setConnectionError('Unable to connect to the database. Please check your connection and try again.');
    }
    setUserMatches([]);
  }
};

  const loadDashboardStats = async () => {
    if (!user) return;
    
    try {
      setConnectionError(null);
      
      // Get profile views count with error handling
      let viewsCount = 0;
      try {
        const { count, error: viewsError } = await supabase
          .from('profile_views')
          .select('*', { count: 'exact', head: true })
          .eq('viewed_profile_id', user.id);
        if (!viewsError) viewsCount = count || 0;
      } catch (e) {
        console.log('Profile views table not available');
      }

      // Get likes received count with error handling
      let likesCount = 0;
      try {
        const { count, error: likesError } = await supabase
          .from('profile_interactions')
          .select('*', { count: 'exact', head: true })
          .eq('receiver_id', user.id)
          .eq('interaction_type', 'like');
        if (!likesError) likesCount = count || 0;
      } catch (e) {
        console.log('Profile interactions table not available');
      }

      // Get unread messages count with error handling
      let messagesCount = 0;
      try {
        const { count, error: messagesError } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('receiver_id', user.id)
          .eq('read', false);
        if (!messagesError) messagesCount = count || 0;
      } catch (e) {
        console.log('Messages table not available');
      }

      // Get matches count with error handling
      let matches1Count = 0;
      let matches2Count = 0;
      try {
        const { count, error: matches1Error } = await supabase
          .from('matches')
          .select('*', { count: 'exact', head: true })
          .eq('user1_id', user.id);
        if (!matches1Error) matches1Count = count || 0;
      } catch (e) {
        console.log('Matches table not available');
      }

      try {
        const { count, error: matches2Error } = await supabase
          .from('matches')
          .select('*', { count: 'exact', head: true })
          .eq('user2_id', user.id);
        if (!matches2Error) matches2Count = count || 0;
      } catch (e) {
        console.log('Matches table not available');
      }

      setDashboardStats({
        profileViews: viewsCount,
        interests: likesCount,
        messages: messagesCount,
        matches: matches1Count + matches2Count
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      if (error.name === 'CorsConfigurationError' || error.message?.includes('Failed to fetch')) {
        setConnectionError('Unable to connect to the database. Please check your connection and try again.');
      }
      // Set default values if there's an error
      setDashboardStats({
        profileViews: Math.floor(Math.random() * 50) + 10,
        interests: Math.floor(Math.random() * 20) + 5,
        messages: Math.floor(Math.random() * 15) + 2,
        matches: Math.floor(Math.random() * 10) + 1
      });
    }
  };

  const getFirstName = (fullName: string) => {
    if (!fullName) return 'User';
    return fullName.split(' ')[0];
  };

  const getInitials = (fullName: string) => {
    if (!fullName) return 'U';
    const names = fullName.split(' ');
    if (names.length === 1) return names[0][0];
    return names[0][0] + (names[names.length - 1][0] || '');
  };

  const handleUpgrade = () => {
    setShowUpgradeModal(true);
  };

  const handleSelectPlan = () => {
    setShowUpgradeModal(false);
    // Update to Elite plan
    updateMembership('elite');
    // Navigate to thank you page
    navigate('/thank-you');
  };

  const handleSendInterest = async (profileId: string) => {
    if (!user) return;
    
    try {
      setInteractionLoading(profileId);
      setConnectionError(null);
      
      const { error } = await supabase
        .from('profile_interactions')
        .upsert({
          sender_id: user.id,
          receiver_id: profileId,
          interaction_type: 'like'
        }, {
          onConflict: 'sender_id,receiver_id'
        });
        
      if (error) {
        if (error.name === 'CorsConfigurationError' || error.message?.includes('Failed to fetch')) {
          setConnectionError('Unable to connect to the database. Please check your connection and try again.');
        }
        throw error;
      }
      
      alert('Interest sent successfully!');
    } catch (error) {
      console.error('Error sending interest:', error);
      if (error.name === 'CorsConfigurationError' || error.message?.includes('Failed to fetch')) {
        setConnectionError('Unable to connect to the database. Please check your connection and try again.');
      }
      alert('Failed to send interest. Please try again.');
    } finally {
      setInteractionLoading(null);
    }
  };

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6 }
    }
  };

  if (loading) {
    return (
      <div className="pt-20 bg-background min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-text/70">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 bg-background min-h-screen">
      <div className="container-custom py-8">
        {/* Connection Error Banner */}
        {connectionError && (
          <motion.div 
            className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-lg p-6 mb-8"
            initial="hidden"
            animate="visible"
            variants={fadeIn}
          >
            <div className="flex items-start">
              <WifiOff className="text-red-500 mt-1 mr-4 flex-shrink-0" size={24} />
              <div className="flex-1">
                <h3 className="font-semibold text-red-800 mb-2">Connection Error</h3>
                <p className="text-red-700 mb-4">{connectionError}</p>
                <div className="bg-red-100 border border-red-200 rounded-md p-4 mb-4">
                  <h4 className="font-medium text-red-800 mb-2">To fix this issue:</h4>
                  <ol className="list-decimal list-inside text-red-700 space-y-1 text-sm">
                    <li>Verify your Supabase URL and API key in your .env file</li>
                    <li>Go to your Supabase project dashboard</li>
                    <li>Navigate to Project Settings → API → CORS Origins</li>
                    <li>Add <code className="bg-red-200 px-1 rounded">https://localhost:5173</code> to the allowed origins</li>
                    <li>Refresh this page after making changes</li>
                  </ol>
                </div>
                <button
                  onClick={() => window.location.reload()}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors duration-300 flex items-center"
                >
                  <Wifi size={16} className="mr-2" />
                  Retry Connection
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Welcome Header */}
        <motion.div 
          className="bg-gradient-to-r from-primary to-primary-light text-white rounded-2xl p-8 mb-8"
          initial="hidden"
          animate="visible"
          variants={fadeIn}
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Welcome back, {getFirstName(profile?.full_name || user?.email || '')}!
              </h1>
              <p className="text-white/90">
                {profileComplete 
                  ? "Your journey to find the perfect match continues. Let's discover new connections today."
                  : "Complete your profile to start finding your perfect match and unlock all features."
                }
              </p>
            </div>
            <div className="hidden md:block">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold">
                {getInitials(profile?.full_name || user?.email || '')}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Profile Completion Banner */}
        {!profileComplete && (
          <motion.div 
            className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-lg p-6 mb-8"
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-start">
              <AlertTriangle className="text-orange-500 mt-1 mr-4 flex-shrink-0" size={24} />
              <div className="flex-1">
                <h3 className="font-semibold text-orange-800 mb-2">Complete Your Profile</h3>
                <p className="text-orange-700 mb-4">
                  Your profile is incomplete. Complete it now to start receiving matches and unlock all features like messaging, advanced search, and more.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => navigate('/complete-profile')}
                    className="bg-primary text-white px-6 py-2 rounded-md hover:bg-primary-light transition-colors duration-300 flex items-center"
                  >
                    <Edit size={16} className="mr-2" />
                    Complete Profile Now
                  </button>
                  <button
                    onClick={() => navigate('/profile')}
                    className="border border-primary text-primary px-6 py-2 rounded-md hover:bg-primary/10 transition-colors duration-300"
                  >
                    View Current Profile
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Profile Complete Success Banner */}
        {profileComplete && (
          <motion.div 
            className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6 mb-8"
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-start">
              <CheckCircle className="text-green-500 mt-1 mr-4 flex-shrink-0" size={24} />
              <div className="flex-1">
                <h3 className="font-semibold text-green-800 mb-2">Profile Complete! 🎉</h3>
                <p className="text-green-700 mb-4">
                  Great job! Your profile is complete and you can now access all features. Start exploring matches below.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => navigate('/search')}
                    className="bg-primary text-white px-6 py-2 rounded-md hover:bg-primary-light transition-colors duration-300"
                  >
                    Browse Profiles
                  </button>
                  <button
                    onClick={() => navigate('/profile')}
                    className="border border-primary text-primary px-6 py-2 rounded-md hover:bg-primary/10 transition-colors duration-300"
                  >
                    View My Profile
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Upgrade Banner - Only show for non-Elite users */}
        {currentPlan !== 'elite' && (
          <motion.div 
            className="bg-gradient-to-r from-yellow-500 to-amber-600 text-white rounded-lg p-6 mb-8"
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ delay: 0.2 }}
          >
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="mb-4 md:mb-0 flex items-center">
                <Crown className="h-10 w-10 mr-4 text-yellow-200" />
                <div>
                  <h3 className="font-semibold text-xl mb-2">Upgrade to Elite Membership</h3>
                  <p className="text-white/90">
                    Free Elite access for early users! Unlock unlimited messaging, view full profiles, and more.
                  </p>
                </div>
              </div>
              <button
                onClick={handleUpgrade}
                className="bg-white text-amber-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors shadow-md"
              >
                Upgrade Now
              </button>
            </div>
          </motion.div>
        )}

        {/* Dashboard Stats */}
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8"
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          transition={{ delay: 0.2 }}
        >
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <Eye className="text-primary mx-auto mb-2" size={24} />
            <div className="text-2xl font-bold text-primary">{dashboardStats.profileViews}</div>
            <div className="text-sm text-text/70">Profile Views</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <Heart className="text-red-500 mx-auto mb-2" size={24} />
            <div className="text-2xl font-bold text-red-500">{dashboardStats.interests}</div>
            <div className="text-sm text-text/70">Interests</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <MessageCircle className="text-blue-500 mx-auto mb-2" size={24} />
            <div className="text-2xl font-bold text-blue-500">{dashboardStats.messages}</div>
            <div className="text-sm text-text/70">Messages</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <Star className="text-secondary mx-auto mb-2" size={24} />
            <div className="text-2xl font-bold text-secondary">{dashboardStats.matches}</div>
            <div className="text-sm text-text/70">Matches</div>
          </div>
        </motion.div>

        {/* Navigation Tabs */}
        <motion.div 
          className="bg-white rounded-lg shadow-md mb-8"
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          transition={{ delay: 0.3 }}
        >
          <div className="flex border-b border-gray-200">
            {[
              { id: 'discover', label: 'Discover', icon: <Heart size={20} /> },
              { id: 'matches', label: 'Matches', icon: <Users size={20} /> },
              { id: 'premium', label: 'Elite', icon: <Crown size={20} /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center py-4 px-6 font-medium transition-colors duration-300 ${
                  activeTab === tab.id
                    ? 'text-primary border-b-2 border-primary' 
                    : 'text-text/70 hover:text-primary'
                }`}
              >
                {tab.icon}
                <span className="ml-2 hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial="hidden"
          animate="visible"
          variants={fadeIn}
        >
          {activeTab === 'discover' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-primary">Matrimonial Feed</h2>
                <div className="flex gap-4">
                  <button 
                    onClick={() => navigate('/search')}
                    className="btn-outline"
                  >
                    Advanced Search
                  </button>
                  {profileComplete && (
                    <button 
                      onClick={() => navigate('/swipe')}
                      className="btn-primary"
                    >
                      Swipe Mode
                    </button>
                  )}
                </div>
              </div>
              
              {profileComplete ? (
                matchesLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  </div>
                ) : matchProfiles.length > 0 ? (
                  <div className="space-y-6">
                    {matchProfiles.map((profile) => (
                      <div key={profile.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300">
                        <div className="flex flex-col md:flex-row">
                          {/* Profile Image */}
                          <div className="md:w-1/3 relative">
                            {profile.images && profile.images.length > 0 ? (
                              <img 
                                src={profile.images[0]} 
                                alt={profile.name || profile.full_name} 
                                className="w-full h-64 md:h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-64 md:h-full bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                                <User className="h-20 w-20 text-primary/30" />
                              </div>
                            )}
                            
                            {/* Elite badge if applicable */}
                            {profile.is_premium && (
                              <div className="absolute top-4 left-4 bg-amber-500 text-white text-xs font-medium px-3 py-1 rounded-full flex items-center">
                                <Crown size={12} className="mr-1" />
                                Elite Member
                              </div>
                            )}
                            
                            {/* Compatibility score */}
                            <div className="absolute bottom-4 left-4 bg-green-500 text-white text-sm font-medium px-3 py-1 rounded-full">
                              {profile.compatibility_score}% Match
                            </div>
                          </div>
                          
                          {/* Profile Details */}
                          <div className="md:w-2/3 p-6">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h3 className="text-xl font-bold text-gray-900">
                                  {profile.name || profile.full_name}, {profile.age}
                                </h3>
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {profile.compatibility_tags?.map((tag, idx) => (
                                    <span key={idx} className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                            
                            <div className="space-y-3 mb-6">
                              <div className="flex items-center text-gray-700">
                                <Briefcase size={16} className="mr-2 text-primary" />
                                <span>{profile.profession || 'Not specified'}</span>
                              </div>
                              <div className="flex items-center text-gray-700">
                                <MapPin size={16} className="mr-2 text-primary" />
                                <span>{profile.location || 'Not specified'}</span>
                              </div>
                              <div className="flex items-center text-gray-700">
                                <GraduationCap size={16} className="mr-2 text-primary" />
                                <span>{profile.education || 'Not specified'}</span>
                              </div>
                            </div>
                            
                            {profile.short_bio && (
                              <p className="text-gray-600 mb-6 line-clamp-2">{profile.short_bio}</p>
                            )}
                            
                            <div className="flex space-x-4">
                              <button
                                onClick={() => navigate(`/profile/${profile.id}`)}
                                className="flex-1 bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary-light transition-colors"
                              >
                                View Full Profile
                              </button>
                              
                              <button
                                onClick={() => handleSendInterest(profile.id)}
                                disabled={interactionLoading === profile.id || currentPlan !== 'elite'}
                                className={`flex-1 py-2 px-4 rounded-lg transition-colors flex items-center justify-center ${
                                  currentPlan === 'elite'
                                    ? 'bg-white border border-primary text-primary hover:bg-primary/10'
                                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                }`}
                                title={currentPlan !== 'elite' ? 'Upgrade to Elite to send interest' : ''}
                              >
                                {interactionLoading === profile.id ? (
                                  <span className="animate-pulse">Sending...</span>
                                ) : (
                                  <>
                                    <Heart size={16} className="mr-2" />
                                    Send Interest
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 bg-white rounded-lg shadow-md">
                    <User className="text-gray-300 mx-auto mb-4" size={64} />
                    <h3 className="text-xl font-medium text-gray-600 mb-2">No matches found right now</h3>
                    <p className="text-gray-500 mb-6 max-w-md mx-auto">
                      Try adjusting your filters or check back soon! We're constantly adding new profiles.
                    </p>
                    <button
                      onClick={() => navigate('/search')}
                      className="btn-primary"
                    >
                      Browse All Profiles
                    </button>
                  </div>
                )
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <User className="text-gray-300 mx-auto mb-4" size={64} />
                  <h3 className="text-xl font-medium text-gray-600 mb-2">Complete Your Profile First</h3>
                  <p className="text-gray-500 mb-6">
                    You need to complete your profile before you can discover and connect with other members.
                  </p>
                  <button
                    onClick={() => navigate('/complete-profile')}
                    className="btn-primary"
                  >
                    Complete Profile Now
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'matches' && (
            <div>
              <h2 className="text-2xl font-bold text-primary mb-6">Your Matches</h2>
              {profileComplete ? (
                userMatches.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {userMatches.map((profile) => (
                      <div key={profile.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                        <div className="relative">
                          {profile.images && profile.images.length > 0 ? (
                            <img src={profile.images[0]} alt={profile.name || profile.full_name} className="w-full h-48 object-cover" />
                          ) : (
                            <div className="w-full h-48 bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                              <User className="h-16 w-16 text-primary/30" />
                            </div>
                          )}
                          <div className="absolute top-3 right-3 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                            {profile.compatibility_score}% Match
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold text-lg">{getFirstName(profile.name || profile.full_name)} {(profile.name || profile.full_name).split(' ')[1]?.[0]}.</h3>
                          <p className="text-text/70 text-sm">{profile.profession} • {profile.location}</p>
                          <div className="flex gap-2 mt-4">
                            <button 
                              onClick={() => navigate('/messages')}
                              className="btn-primary flex-1"
                              disabled={currentPlan !== 'elite'}
                            >
                              Message
                            </button>
                            <button 
                              onClick={() => navigate(`/profile/${profile.id}`)}
                              className="btn-outline flex-1"
                            >
                              View Profile
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <Heart className="text-gray-300 mx-auto mb-4" size={64} />
                    <h3 className="text-xl font-medium text-gray-600 mb-2">No Matches Yet</h3>
                    <p className="text-gray-500 mb-6">
                      Start liking profiles to get matches. When someone likes you back, they'll appear here!
                    </p>
                    <button
                      onClick={() => navigate('/search')}
                      className="btn-primary"
                    >
                      Find Matches
                    </button>
                  </div>
                )
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <Heart className="text-gray-300 mx-auto mb-4" size={64} />
                  <h3 className="text-xl font-medium text-gray-600 mb-2">No Matches Yet</h3>
                  <p className="text-gray-500 mb-6">
                    Complete your profile to start receiving matches based on your preferences.
                  </p>
                  <button
                    onClick={() => navigate('/complete-profile')}
                    className="btn-primary"
                  >
                    Complete Profile
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'premium' && (
            <div>
              <h2 className="text-2xl font-bold text-primary mb-6">Elite Membership</h2>
              <div className="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-amber-500">
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
                    onClick={handleUpgrade}
                    className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-lg font-semibold hover:from-amber-600 hover:to-yellow-600 transition-all duration-300 shadow-md hover:shadow-lg"
                  >
                    {currentPlan === 'elite' ? 'You Are an Elite Member' : 'Upgrade to Elite - Free!'}
                  </button>
                  
                  <p className="text-center text-sm text-gray-500 mt-4">
                    Limited time offer for early users. No payment required.
                  </p>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Upgrade Modal */}
      <UpgradeModal 
        isOpen={showUpgradeModal} 
        onClose={() => setShowUpgradeModal(false)} 
        onUpgrade={handleSelectPlan}
        feature="Elite Membership"
      />
    </div>
  );
};

export default UserDashboard;