import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ChevronLeft, 
  Heart, 
  MessageCircle, 
  Flag, 
  UserCheck, 
  Phone, 
  Mail, 
  Share2, 
  Calendar, 
  MapPin, 
  GraduationCap, 
  Briefcase as BriefcaseBusiness, 
  Ruler, 
  Users, 
  Edit, 
  Settings, 
  Eye, 
  Star, 
  Crown,
  Camera,
  Plus,
  Lock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useMembership } from '../context/MembershipContext';
import { supabase } from '../lib/supabase';
import { allProfiles } from '../data/mockProfiles';
import UpgradeModal from '../components/ui/UpgradeModal';

const ProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { incrementProfileView, canViewProfile, currentPlan, updateMembership } = useMembership();
  const navigate = useNavigate();
  const [isLiked, setIsLiked] = useState(false);
  const [activeTab, setActiveTab] = useState('about');
  const [mainImage, setMainImage] = useState(0);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [viewRecorded, setViewRecorded] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [profileStats, setProfileStats] = useState({
    views: 0,
    interests: 0,
    matches: 0
  });
  
  // Check if this is the current user's profile
  const isOwnProfile = user && (id === user.id || id === 'me' || !id);

  useEffect(() => {
    if (isOwnProfile) {
      loadCurrentUserProfile();
    } else {
      loadProfileById(id!);
    }
  }, [id, user, isOwnProfile]);

  // Record profile view for non-own profiles
  useEffect(() => {
    if (!isOwnProfile && profile && user && !viewRecorded && canViewProfile()) {
      recordProfileView();
    }
  }, [profile, user, isOwnProfile, viewRecorded, canViewProfile]);

  const recordProfileView = async () => {
    if (!user || !profile || isOwnProfile || viewRecorded) return;

    try {
      await incrementProfileView();
      setViewRecorded(true);
      console.log('✅ Profile view recorded');
    } catch (error) {
      console.error('❌ Error recording profile view:', error);
    }
  };

  const loadCurrentUserProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);
      console.log('🔍 Loading current user profile...');
      
      // Load basic profile - use maybeSingle() to handle missing profiles
      const { data: basicProfile, error: basicError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (basicError) {
        console.error('❌ Basic profile error:', basicError);
        throw basicError;
      }

      if (!basicProfile) {
        console.log('⚠️ No profile found, redirecting to complete profile');
        // Profile doesn't exist, redirect to complete profile
        navigate('/complete-profile');
        return;
      }

      // Load extended profile - use maybeSingle() to handle cases where no extended profile exists
      const { data: extendedProfile, error: extendedError } = await supabase
        .from('extended_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (extendedError) {
        console.error('❌ Extended profile error:', extendedError);
      }

      // Load profile stats
      await loadProfileStats(user.id);

      // Combine profiles
      const combinedProfile = {
        ...basicProfile,
        ...extendedProfile,
        // Convert extended profile format to display format
        familyDetails: extendedProfile?.family_details || {
          fatherOccupation: extendedProfile?.father_occupation,
          motherOccupation: extendedProfile?.mother_occupation,
          siblings: extendedProfile?.siblings,
          familyType: extendedProfile?.family_type,
          familyStatus: extendedProfile?.family_status,
          familyLocation: extendedProfile?.family_location
        },
        preferences: extendedProfile?.preferences || {
          ageRange: extendedProfile?.partner_age_min && extendedProfile?.partner_age_max 
            ? `${extendedProfile.partner_age_min}-${extendedProfile.partner_age_max}`
            : '',
          heightRange: extendedProfile?.partner_height_min && extendedProfile?.partner_height_max
            ? `${extendedProfile.partner_height_min}-${extendedProfile.partner_height_max}`
            : '',
          religion: extendedProfile?.partner_religion,
          caste: extendedProfile?.partner_caste,
          education: extendedProfile?.partner_education,
          profession: extendedProfile?.partner_profession,
          income: extendedProfile?.partner_income,
          location: extendedProfile?.partner_location
        },
        contactInfo: {
          email: basicProfile.email,
          phone: basicProfile.phone
        },
        keyDetails: basicProfile.key_details || [
          basicProfile.religion,
          basicProfile.profession,
          basicProfile.location,
          basicProfile.education
        ].filter(Boolean),
        // Use birth_date to calculate age if age is not set
        age: basicProfile.age || (extendedProfile?.birth_date 
          ? new Date().getFullYear() - new Date(extendedProfile.birth_date).getFullYear()
          : null),
        // Map extended profile fields
        maritalStatus: basicProfile.marital_status || extendedProfile?.marital_status,
        height: basicProfile.height || extendedProfile?.height,
        religion: basicProfile.religion || extendedProfile?.religion,
        caste: basicProfile.caste || extendedProfile?.caste,
        education: basicProfile.education || extendedProfile?.education,
        profession: basicProfile.profession || extendedProfile?.profession,
        income: basicProfile.income || extendedProfile?.income,
        location: basicProfile.location || extendedProfile?.location,
        about: basicProfile.about || extendedProfile?.about,
        shortBio: basicProfile.short_bio || (extendedProfile?.about?.substring(0, 150) + '...'),
        images: basicProfile.images || [],
        isPremium: basicProfile.is_premium || false,
        createdAt: basicProfile.created_at
      };

      setProfile(combinedProfile);
      console.log('✅ Current user profile loaded');
    } catch (error) {
      console.error('❌ Error loading profile:', error);
      // If profile doesn't exist, redirect to complete profile
      if (isOwnProfile) {
        navigate('/complete-profile');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadProfileById = async (profileId: string) => {
    try {
      setLoading(true);
      console.log('🔍 Loading profile by ID:', profileId);
      
      // Try to load from database first - use maybeSingle() to handle missing profiles
      const { data: basicProfile, error: basicError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .maybeSingle();

      if (basicError) {
        console.error('❌ Basic profile error:', basicError);
        // If there's a database error, fall back to mock data
        console.log('⚠️ Database error, using mock data');
        const mockProfile = allProfiles.find(p => p.id === profileId);
        if (mockProfile) {
          setProfile(mockProfile);
        } else {
          setProfile(null);
        }
        return;
      }

      if (basicProfile) {
        console.log('✅ Profile found in database');
        
        // Load extended profile - use maybeSingle() to handle cases where no extended profile exists
        const { data: extendedProfile } = await supabase
          .from('extended_profiles')
          .select('*')
          .eq('id', profileId)
          .maybeSingle();

        // Check if user has liked this profile
        if (user) {
          const { data: interaction } = await supabase
            .from('profile_interactions')
            .select('interaction_type')
            .eq('sender_id', user.id)
            .eq('receiver_id', profileId)
            .eq('interaction_type', 'like')
            .maybeSingle();
            
          setIsLiked(!!interaction);
        }

        // Combine profiles (similar to above)
        const combinedProfile = {
          ...basicProfile,
          ...extendedProfile,
          familyDetails: extendedProfile?.family_details || {},
          preferences: extendedProfile?.preferences || {},
          contactInfo: {
            email: basicProfile.email,
            phone: basicProfile.phone
          },
          keyDetails: basicProfile.key_details || [],
          age: basicProfile.age || (extendedProfile?.birth_date 
            ? new Date().getFullYear() - new Date(extendedProfile.birth_date).getFullYear()
            : null),
          maritalStatus: basicProfile.marital_status || extendedProfile?.marital_status,
          shortBio: basicProfile.short_bio || (extendedProfile?.about?.substring(0, 150) + '...'),
          images: basicProfile.images || [],
          isPremium: basicProfile.is_premium || false,
          createdAt: basicProfile.created_at
        };

        setProfile(combinedProfile);
      } else {
        console.log('⚠️ Profile not found in database, using mock data');
        // Fallback to mock data
        const mockProfile = allProfiles.find(p => p.id === profileId);
        setProfile(mockProfile || null);
      }
    } catch (error) {
      console.error('❌ Error loading profile:', error);
      // Fallback to mock data on any error
      console.log('⚠️ Using mock data due to error');
      const mockProfile = allProfiles.find(p => p.id === profileId);
      setProfile(mockProfile || null);
    } finally {
      setLoading(false);
    }
  };

  const loadProfileStats = async (userId: string) => {
    try {
      // Mock stats for now - in real app would come from database
      setProfileStats({
        views: Math.floor(Math.random() * 100) + 20,
        interests: Math.floor(Math.random() * 30) + 5,
        matches: Math.floor(Math.random() * 15) + 2
      });
    } catch (error) {
      console.error('❌ Error loading profile stats:', error);
    }
  };

  const handleLike = async () => {
    if (!user || !profile || isOwnProfile) return;

    try {
      const newLikedState = !isLiked;
      setIsLiked(newLikedState);

      // Record interaction in database
      const { error } = await supabase
        .from('profile_interactions')
        .upsert({
          sender_id: user.id,
          receiver_id: profile.id,
          interaction_type: newLikedState ? 'like' : 'pass'
        }, {
          onConflict: 'sender_id,receiver_id'
        });

      if (error) {
        console.error('❌ Error recording interaction:', error);
        // Revert state on error
        setIsLiked(!newLikedState);
      } else {
        console.log('✅ Interaction recorded:', newLikedState ? 'like' : 'pass');
      }
    } catch (error) {
      console.error('❌ Error in handleLike:', error);
      setIsLiked(!isLiked); // Revert on error
    }
  };

  const handleMessage = () => {
    if (!user || !profile || isOwnProfile) return;
    
    // Navigate to messages
    navigate('/messages');
  };

  const handleShare = async () => {
    const shareData = {
      title: `${profile?.name || profile?.full_name}'s Profile - Mallu Matrimony`,
      text: `Check out this profile on Mallu Matrimony`,
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(window.location.href);
        alert('Profile link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleUpgrade = () => {
    setShowUpgradeModal(true);
  };

  const handleSelectPlan = () => {
    setShowUpgradeModal(false);
    updateMembership('elite');
    navigate('/thank-you');
  };

  if (loading) {
    return (
      <div className="pt-20 min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-text/70">Loading profile...</p>
        </div>
      </div>
    );
  }
  
  // If profile not found
  if (!profile) {
    return (
      <div className="pt-20 min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <h2 className="text-2xl font-bold text-primary mb-4">Profile Not Found</h2>
          <p className="mb-6 text-text/70">The profile you're looking for doesn't exist or has been removed.</p>
          <div className="space-y-4">
            {isOwnProfile ? (
              <button
                onClick={() => navigate('/complete-profile')}
                className="btn-primary"
              >
                Complete Your Profile
              </button>
            ) : (
              <Link to="/search" className="btn-primary">
                Browse Profiles
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }
  
  // For demo purposes - normally we'd have more images
  const profileImages = profile.images && profile.images.length > 0 ? profile.images : [
    'https://images.pexels.com/photos/834863/pexels-photo-834863.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    'https://images.pexels.com/photos/1516680/pexels-photo-1516680.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
  ];
  
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <div className="pt-20 bg-background min-h-screen">
      <div className="container-custom py-8">
        {/* Back Navigation */}
        <div className="flex items-center justify-between mb-6">
          <Link to={isOwnProfile ? "/" : "/search"} className="flex items-center text-primary hover:underline">
            <ChevronLeft size={20} className="mr-1" /> 
            {isOwnProfile ? 'Back to Home' : 'Back to Search Results'}
          </Link>
          
          {isOwnProfile && (
            <div className="flex space-x-3">
              <button
                onClick={() => navigate('/complete-profile')}
                className="btn-outline flex items-center"
              >
                <Edit size={18} className="mr-2" />
                Edit Profile
              </button>
              <button
                onClick={() => navigate('/settings')}
                className="btn-outline flex items-center"
              >
                <Settings size={18} className="mr-2" />
                Settings
              </button>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Images Section */}
          <motion.div 
            className="lg:col-span-1"
            initial="hidden"
            animate="visible"
            variants={fadeIn}
          >
            <div className="sticky top-24">
              {/* Main Image */}
              <div className="mb-4 bg-white p-2 rounded-lg shadow-md">
                <div className="relative aspect-[3/4] rounded-lg overflow-hidden">
                  <img 
                    src={profileImages[mainImage]} 
                    alt={profile.name || profile.full_name} 
                    className="w-full h-full object-cover"
                  />
                  {profile.isPremium && (
                    <div className="absolute top-3 left-3 bg-amber-500 text-white text-xs font-medium px-2 py-1 rounded-full flex items-center">
                      <Crown size={12} className="mr-1" />
                      Elite Member
                    </div>
                  )}
                  {isOwnProfile && (
                    <div className="absolute top-3 right-3 bg-primary text-white text-xs font-medium px-2 py-1 rounded-full">
                      Your Profile
                    </div>
                  )}
                  {!isOwnProfile && (
                    <div className="absolute bottom-3 left-3 bg-black/70 text-white text-xs px-2 py-1 rounded-full flex items-center">
                      <Eye size={12} className="mr-1" />
                      {Math.floor(Math.random() * 50) + 10} views
                    </div>
                  )}
                </div>
              </div>
              
              {/* Thumbnail Images */}
              {profileImages.length > 1 && (
                <div className="grid grid-cols-3 gap-2 mb-6">
                  {profileImages.map((img, index) => (
                    <button 
                      key={index}
                      onClick={() => setMainImage(index)}
                      className={`bg-white p-1 rounded-md overflow-hidden transition-all duration-300 ${
                        mainImage === index ? 'ring-2 ring-primary' : 'hover:ring-1 hover:ring-primary/50'
                      }`}
                    >
                      <div className="aspect-square">
                        <img 
                          src={img} 
                          alt={`${profile.name || profile.full_name} - photo ${index + 1}`} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </button>
                  ))}
                  {isOwnProfile && profileImages.length < 6 && (
                    <button 
                      onClick={() => navigate('/complete-profile')}
                      className="aspect-square border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center text-text/70 hover:border-primary hover:text-primary transition-all duration-300"
                    >
                      <Plus size={20} className="mb-1" />
                      <span className="text-xs">Add Photo</span>
                    </button>
                  )}
                </div>
              )}
              
              {/* Action Buttons */}
              {!isOwnProfile && (
                <div className="flex flex-col gap-3 mb-6">
                  <button 
                    onClick={handleMessage}
                    className="btn-primary flex items-center justify-center"
                  >
                    <MessageCircle size={18} className="mr-2" /> 
                    Send Message
                  </button>
                  <button 
                    className={`flex items-center justify-center py-3 px-6 rounded-md font-medium transition-all duration-300 ${
                      isLiked 
                        ? 'bg-red-100 text-red-500 border border-red-200 hover:bg-red-200'
                        : 'bg-white text-primary border border-primary hover:bg-primary/10'
                    }`}
                    onClick={handleLike}
                  >
                    <Heart size={18} className={`mr-2 ${isLiked ? 'fill-red-500' : ''}`} />
                    {isLiked ? 'Interested ❤️' : 'Express Interest'}
                  </button>
                </div>
              )}
              
              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                  <h3 className="font-medium text-primary">
                    {isOwnProfile ? 'Profile Actions' : 'Quick Actions'}
                  </h3>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-2 gap-4">
                    {isOwnProfile ? (
                      <>
                        <button 
                          onClick={() => navigate('/complete-profile')}
                          className="flex flex-col items-center justify-center p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors duration-300"
                        >
                          <Edit size={20} className="text-primary mb-1" />
                          <span className="text-sm">Edit Profile</span>
                        </button>
                        <button 
                          onClick={handleShare}
                          className="flex flex-col items-center justify-center p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors duration-300"
                        >
                          <Share2 size={20} className="text-primary mb-1" />
                          <span className="text-sm">Share</span>
                        </button>
                        <button className="flex flex-col items-center justify-center p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors duration-300">
                          <Eye size={20} className="text-primary mb-1" />
                          <span className="text-sm">View Stats</span>
                        </button>
                        <button 
                          onClick={() => navigate('/settings')}
                          className="flex flex-col items-center justify-center p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors duration-300"
                        >
                          <Settings size={20} className="text-primary mb-1" />
                          <span className="text-sm">Settings</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button className="flex flex-col items-center justify-center p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors duration-300">
                          <UserCheck size={20} className="text-primary mb-1" />
                          <span className="text-sm">Shortlist</span>
                        </button>
                        <button 
                          onClick={handleShare}
                          className="flex flex-col items-center justify-center p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors duration-300"
                        >
                          <Share2 size={20} className="text-primary mb-1" />
                          <span className="text-sm">Share</span>
                        </button>
                        <button 
                          onClick={currentPlan === 'elite' ? () => {} : handleUpgrade}
                          className="flex flex-col items-center justify-center p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors duration-300"
                        >
                          <Phone size={20} className="text-primary mb-1" />
                          <span className="text-sm">Contact</span>
                        </button>
                        <button className="flex flex-col items-center justify-center p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors duration-300">
                          <Flag size={20} className="text-primary mb-1" />
                          <span className="text-sm">Report</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Profile Stats for Own Profile */}
              {isOwnProfile && (
                <div className="bg-white rounded-lg shadow-md overflow-hidden mt-6">
                  <div className="p-4 border-b border-gray-100">
                    <h3 className="font-medium text-primary">Profile Statistics</h3>
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-primary">{profileStats.views}</div>
                        <div className="text-xs text-text/70">Profile Views</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-red-500">{profileStats.interests}</div>
                        <div className="text-xs text-text/70">Interests</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-500">{profileStats.matches}</div>
                        <div className="text-xs text-text/70">Matches</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
          
          {/* Profile Details Section */}
          <motion.div 
            className="lg:col-span-2"
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ delay: 0.2 }}
          >
            {/* Profile Header */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-2xl md:text-3xl font-bold text-primary mb-2">
                    {profile.name || profile.full_name}, {profile.age || 'Age not specified'}
                  </h1>
                  
                  <div className="flex flex-wrap items-center text-text/70 gap-x-4 gap-y-2 mb-4">
                    <div className="flex items-center">
                      <BriefcaseBusiness size={16} className="mr-1 text-primary" />
                      {profile.profession || 'Profession not specified'}
                    </div>
                    <div className="flex items-center">
                      <MapPin size={16} className="mr-1 text-primary" />
                      {profile.location || 'Location not specified'}
                    </div>
                    <div className="flex items-center">
                      <Calendar size={16} className="mr-1 text-primary" />
                      Member since {new Date(profile.createdAt || profile.created_at || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </div>
                  </div>
                </div>
                
                {profile.isPremium && (
                  <div className="flex items-center bg-amber-100 text-amber-800 px-3 py-1 rounded-full">
                    <Crown size={16} className="mr-1" />
                    <span className="text-sm font-medium">Elite Member</span>
                  </div>
                )}
              </div>
              
              {/* Key Details */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-4">
                <div className="p-3 bg-primary/5 rounded-md">
                  <p className="text-xs text-text/60 mb-1">Religion</p>
                  <p className="font-medium">{profile.religion || 'Not specified'}</p>
                </div>
                <div className="p-3 bg-primary/5 rounded-md">
                  <p className="text-xs text-text/60 mb-1">Height</p>
                  <p className="font-medium">{profile.height || 'Not specified'}</p>
                </div>
                <div className="p-3 bg-primary/5 rounded-md">
                  <p className="text-xs text-text/60 mb-1">Education</p>
                  <p className="font-medium">{profile.education?.split(' ').slice(0, 2).join(' ') || 'Not specified'}</p>
                </div>
                <div className="p-3 bg-primary/5 rounded-md">
                  <p className="text-xs text-text/60 mb-1">Marital Status</p>
                  <p className="font-medium">{profile.maritalStatus || 'Not specified'}</p>
                </div>
              </div>
              
              {/* Short Bio */}
              <p className="text-text/80 mb-4">{profile.shortBio || profile.about || 'No bio available'}</p>
              
              {/* Tags */}
              {profile.keyDetails && profile.keyDetails.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {profile.keyDetails.map((detail: string, index: number) => (
                    <span 
                      key={index} 
                      className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full"
                    >
                      {detail}
                    </span>
                  ))}
                </div>
              )}
            </div>
            
            {/* Tabs Navigation */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
              <div className="flex border-b border-gray-200">
                <button 
                  className={`flex-1 py-3 px-4 text-center font-medium transition-colors duration-300 ${
                    activeTab === 'about' 
                      ? 'text-primary border-b-2 border-primary' 
                      : 'text-text/70 hover:text-primary'
                  }`}
                  onClick={() => setActiveTab('about')}
                >
                  About
                </button>
                <button 
                  className={`flex-1 py-3 px-4 text-center font-medium transition-colors duration-300 ${
                    activeTab === 'family' 
                      ? 'text-primary border-b-2 border-primary' 
                      : 'text-text/70 hover:text-primary'
                  }`}
                  onClick={() => setActiveTab('family')}
                >
                  Family
                </button>
                <button 
                  className={`flex-1 py-3 px-4 text-center font-medium transition-colors duration-300 ${
                    activeTab === 'preferences' 
                      ? 'text-primary border-b-2 border-primary' 
                      : 'text-text/70 hover:text-primary'
                  }`}
                  onClick={() => setActiveTab('preferences')}
                >
                  Preferences
                </button>
              </div>
              
              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'about' && (
                  <div>
                    <h3 className="text-lg font-medium text-primary mb-4">About Me</h3>
                    <p className="text-text/80 mb-6">{profile.about || 'No detailed information available.'}</p>
                    
                    <h3 className="text-lg font-medium text-primary mb-4">Basic Details</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                      <div className="flex items-center">
                        <div className="w-8 h-8 flex items-center justify-center bg-primary/10 rounded-full mr-3">
                          <Calendar size={16} className="text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-text/60">Age</p>
                          <p className="font-medium">{profile.age || 'Not specified'} Years</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <div className="w-8 h-8 flex items-center justify-center bg-primary/10 rounded-full mr-3">
                          <Heart size={16} className="text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-text/60">Marital Status</p>
                          <p className="font-medium">{profile.maritalStatus || 'Not specified'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <div className="w-8 h-8 flex items-center justify-center bg-primary/10 rounded-full mr-3">
                          <MapPin size={16} className="text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-text/60">Location</p>
                          <p className="font-medium">{profile.location || 'Not specified'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <div className="w-8 h-8 flex items-center justify-center bg-primary/10 rounded-full mr-3">
                          <Ruler size={16} className="text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-text/60">Height</p>
                          <p className="font-medium">{profile.height || 'Not specified'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <div className="w-8 h-8 flex items-center justify-center bg-primary/10 rounded-full mr-3">
                          <GraduationCap size={16} className="text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-text/60">Education</p>
                          <p className="font-medium">{profile.education || 'Not specified'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <div className="w-8 h-8 flex items-center justify-center bg-primary/10 rounded-full mr-3">
                          <BriefcaseBusiness size={16} className="text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-text/60">Profession</p>
                          <p className="font-medium">{profile.profession || 'Not specified'}</p>
                        </div>
                      </div>
                    </div>
                    
                    {profile.horoscope && (
                      <div>
                        <h3 className="text-lg font-medium text-primary mb-4">Horoscope</h3>
                        <p className="text-text/80 mb-6">{profile.horoscope}</p>
                      </div>
                    )}
                  </div>
                )}
                
                {activeTab === 'family' && (
                  <div>
                    <h3 className="text-lg font-medium text-primary mb-4">Family Details</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                      {profile.familyDetails?.fatherOccupation && (
                        <div className="flex items-start">
                          <div className="w-8 h-8 flex items-center justify-center bg-primary/10 rounded-full mr-3 mt-1">
                            <Users size={16} className="text-primary" />
                          </div>
                          <div>
                            <p className="text-sm text-text/60">Father's Occupation</p>
                            <p className="font-medium">{profile.familyDetails.fatherOccupation}</p>
                          </div>
                        </div>
                      )}
                      
                      {profile.familyDetails?.motherOccupation && (
                        <div className="flex items-start">
                          <div className="w-8 h-8 flex items-center justify-center bg-primary/10 rounded-full mr-3 mt-1">
                            <Users size={16} className="text-primary" />
                          </div>
                          <div>
                            <p className="text-sm text-text/60">Mother's Occupation</p>
                            <p className="font-medium">{profile.familyDetails.motherOccupation}</p>
                          </div>
                        </div>
                      )}
                      
                      {profile.familyDetails?.siblings && (
                        <div className="flex items-start">
                          <div className="w-8 h-8 flex items-center justify-center bg-primary/10 rounded-full mr-3 mt-1">
                            <Users size={16} className="text-primary" />
                          </div>
                          <div>
                            <p className="text-sm text-text/60">Siblings</p>
                            <p className="font-medium">{profile.familyDetails.siblings}</p>
                          </div>
                        </div>
                      )}
                      
                      {profile.familyDetails?.familyType && (
                        <div className="flex items-start">
                          <div className="w-8 h-8 flex items-center justify-center bg-primary/10 rounded-full mr-3 mt-1">
                            <Users size={16} className="text-primary" />
                          </div>
                          <div>
                            <p className="text-sm text-text/60">Family Type</p>
                            <p className="font-medium">{profile.familyDetails.familyType}</p>
                          </div>
                        </div>
                      )}
                      
                      {profile.familyDetails?.familyValues && (
                        <div className="flex items-start sm:col-span-2">
                          <div className="w-8 h-8 flex items-center justify-center bg-primary/10 rounded-full mr-3 mt-1">
                            <Users size={16} className="text-primary" />
                          </div>
                          <div>
                            <p className="text-sm text-text/60">Family Values</p>
                            <p className="font-medium">{profile.familyDetails.familyValues}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {activeTab === 'preferences' && (
                  <div>
                    <h3 className="text-lg font-medium text-primary mb-4">Partner Preferences</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                      {profile.preferences?.ageRange && (
                        <div className="flex items-start">
                          <div className="w-8 h-8 flex items-center justify-center bg-primary/10 rounded-full mr-3 mt-1">
                            <Calendar size={16} className="text-primary" />
                          </div>
                          <div>
                            <p className="text-sm text-text/60">Age</p>
                            <p className="font-medium">{profile.preferences.ageRange}</p>
                          </div>
                        </div>
                      )}
                      
                      {profile.preferences?.height && (
                        <div className="flex items-start">
                          <div className="w-8 h-8 flex items-center justify-center bg-primary/10 rounded-full mr-3 mt-1">
                            <Ruler size={16} className="text-primary" />
                          </div>
                          <div>
                            <p className="text-sm text-text/60">Height</p>
                            <p className="font-medium">{profile.preferences.height}</p>
                          </div>
                        </div>
                      )}
                      
                      {profile.preferences?.education && (
                        <div className="flex items-start">
                          <div className="w-8 h-8 flex items-center justify-center bg-primary/10 rounded-full mr-3 mt-1">
                            <GraduationCap size={16} className="text-primary" />
                          </div>
                          <div>
                            <p className="text-sm text-text/60">Education</p>
                            <p className="font-medium">{profile.preferences.education}</p>
                          </div>
                        </div>
                      )}
                      
                      {profile.preferences?.profession && (
                        <div className="flex items-start">
                          <div className="w-8 h-8 flex items-center justify-center bg-primary/10 rounded-full mr-3 mt-1">
                            <BriefcaseBusiness size={16} className="text-primary" />
                          </div>
                          <div>
                            <p className="text-sm text-text/60">Profession</p>
                            <p className="font-medium">{profile.preferences.profession}</p>
                          </div>
                        </div>
                      )}
                      
                      {profile.preferences?.location && (
                        <div className="flex items-start">
                          <div className="w-8 h-8 flex items-center justify-center bg-primary/10 rounded-full mr-3 mt-1">
                            <MapPin size={16} className="text-primary" />
                          </div>
                          <div>
                            <p className="text-sm text-text/60">Location</p>
                            <p className="font-medium">{profile.preferences.location}</p>
                          </div>
                        </div>
                      )}
                      
                      {profile.preferences?.religion && (
                        <div className="flex items-start">
                          <div className="w-8 h-8 flex items-center justify-center bg-primary/10 rounded-full mr-3 mt-1">
                            <Heart size={16} className="text-primary" />
                          </div>
                          <div>
                            <p className="text-sm text-text/60">Religion</p>
                            <p className="font-medium">{profile.preferences.religion}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Contact Info (Limited for non-elite) */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-primary">Contact Information</h3>
                
                {currentPlan !== 'elite' && !isOwnProfile && (
                  <div className="flex items-center bg-amber-100 text-amber-800 text-sm px-3 py-1 rounded-full">
                    <Crown size={14} className="mr-1" />
                    Upgrade to view
                  </div>
                )}
              </div>
              
              {(currentPlan === 'elite' || isOwnProfile) ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <Mail size={18} className="text-primary mr-2" />
                    <a href={`mailto:${profile.contactInfo?.email || profile.email}`} className="text-primary hover:underline">
                      {profile.contactInfo?.email || profile.email}
                    </a>
                  </div>
                  
                  {profile.contactInfo?.phone && (
                    <div className="flex items-center">
                      <Phone size={18} className="text-primary mr-2" />
                      <a href={`tel:${profile.contactInfo.phone}`} className="text-primary hover:underline">
                        {profile.contactInfo.phone}
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="flex flex-col items-center mb-4">
                    <Lock className="text-amber-500 mb-2" size={32} />
                    <h4 className="text-lg font-semibold text-amber-800">Contact Details Locked</h4>
                    <p className="text-amber-700 max-w-md mx-auto mt-2">
                      Upgrade to Elite membership to view contact details and connect directly
                    </p>
                  </div>
                  <button 
                    onClick={handleUpgrade}
                    className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white px-6 py-3 rounded-lg font-medium hover:from-amber-600 hover:to-yellow-600 transition-colors shadow-md"
                  >
                    <Crown size={16} className="inline-block mr-2" />
                    Upgrade to Elite - Free!
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Upgrade Modal */}
      <UpgradeModal 
        isOpen={showUpgradeModal} 
        onClose={() => setShowUpgradeModal(false)} 
        onUpgrade={handleSelectPlan}
        feature="Contact Information"
      />
    </div>
  );
};

export default ProfilePage;