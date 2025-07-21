import React, { useState, useEffect } from 'react';
import { Search, Filter, MapPin, Heart, X, User, Calendar, GraduationCap, Briefcase, DollarSign, MessageCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase.ts';

interface Profile {
  id: string;
  full_name: string;
  name: string;
  age: number;
  gender: string;
  religion: string;
  caste: string;
  education: string;
  profession: string;
  location: string;
  marital_status: string;
  income: string;
  images: string[];
  short_bio: string;
  is_premium: boolean;
}

interface SearchFilters {
  ageMin: number;
  ageMax: number;
  gender: string;
  religion: string;
  caste: string;
  education: string;
  profession: string;
  location: string;
  maritalStatus: string;
  heightMin: string;
  heightMax: string;
}

const SearchPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [interactionLoading, setInteractionLoading] = useState<string | null>(null);
  const [userMatches, setUserMatches] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<SearchFilters>({
    ageMin: 18,
    ageMax: 60,
    gender: '',
    religion: '',
    caste: '',
    education: '',
    profession: '',
    location: '',
    maritalStatus: '',
    heightMin: '',
    heightMax: ''
  });

  useEffect(() => {
    if (user) {
      fetchProfiles();
      fetchUserMatches();
    }
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [profiles, filters, searchQuery]);

const fetchUserMatches = async () => {
  if (!user) return;

  try {
    const { data: matches1, error: error1 } = await supabase
      .from('matches')
      .select('*')
      .eq('user1_id', user.id);

    if (error1) throw error1;

    const { data: matches2, error: error2 } = await supabase
      .from('matches')
      .select('*')
      .eq('user2_id', user.id);

    if (error2) throw error2;

    const allMatches = [...(matches1 || []), ...(matches2 || [])];
    const matchedUserIds = new Set(
      allMatches.map(match => 
        match.user1_id === user.id ? match.user2_id : match.user1_id
      )
    );
    setUserMatches(matchedUserIds);
  } catch (error) {
    console.error('Error fetching user matches:', error);
  }
};

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user?.id || '');

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = profiles.filter(profile => {
      // Search query filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesQuery = 
          profile.full_name?.toLowerCase().includes(query) ||
          profile.location?.toLowerCase().includes(query) ||
          profile.profession?.toLowerCase().includes(query) ||
          profile.education?.toLowerCase().includes(query);
        if (!matchesQuery) return false;
      }

      // Age filter
      if (profile.age && (profile.age < filters.ageMin || profile.age > filters.ageMax)) {
        return false;
      }

      // Gender filter
      if (filters.gender && profile.gender !== filters.gender) {
        return false;
      }

      // Religion filter
      if (filters.religion && profile.religion !== filters.religion) {
        return false;
      }

      // Caste filter
      if (filters.caste && profile.caste !== filters.caste) {
        return false;
      }

      // Education filter
      if (filters.education && profile.education !== filters.education) {
        return false;
      }

      // Profession filter
      if (filters.profession && profile.profession !== filters.profession) {
        return false;
      }

      // Location filter
      if (filters.location && !profile.location?.toLowerCase().includes(filters.location.toLowerCase())) {
        return false;
      }

      // Marital status filter
      if (filters.maritalStatus && profile.marital_status !== filters.maritalStatus) {
        return false;
      }

      return true;
    });

    setFilteredProfiles(filtered);
  };

  const handleFilterChange = (key: keyof SearchFilters, value: string | number) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      ageMin: 18,
      ageMax: 60,
      gender: '',
      religion: '',
      caste: '',
      education: '',
      profession: '',
      location: '',
      maritalStatus: '',
      heightMin: '',
      heightMax: ''
    });
    setSearchQuery('');
  };

  const handleViewProfile = (profileId: string) => {
    navigate(`/profile/${profileId}`);
  };

  const handleSendInterest = async (profileId: string) => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      setInteractionLoading(profileId);
      
      const { error } = await supabase
        .from('profile_interactions')
        .upsert({
          sender_id: user.id,
          receiver_id: profileId,
          interaction_type: 'like'
        }, {
          onConflict: 'sender_id,receiver_id'
        });

      if (error) throw error;

      // Check if this creates a match
      const { data: existingInteraction } = await supabase
        .from('profile_interactions')
        .select('*')
        .eq('sender_id', profileId)
        .eq('receiver_id', user.id)
        .eq('interaction_type', 'like')
        .maybeSingle();

      if (existingInteraction) {
        // It's a match! Show success message
        alert('🎉 It\'s a match! You can now message each other.');
        // Refresh matches
        fetchUserMatches();
      } else {
        alert('Interest sent successfully!');
      }
      
    } catch (error) {
      console.error('Error sending interest:', error);
      alert('Failed to send interest. Please try again.');
    } finally {
      setInteractionLoading(null);
    }
  };

  const handleSendMessage = (profileId: string) => {
    if (userMatches.has(profileId)) {
      navigate('/messages');
    } else {
      alert('You need to match with this person first to send a message.');
    }
  };

  const handleLike = async (profileId: string) => {
    if (!user) return;
    
    try {
      await supabase
        .from('profile_interactions')
        .upsert({
          sender_id: user.id,
          receiver_id: profileId,
          interaction_type: 'like'
        }, {
          onConflict: 'sender_id,receiver_id'
        });
    } catch (error) {
      console.error('Error liking profile:', error);
    }
  };

  const handlePass = async (profileId: string) => {
    if (!user) return;
    
    try {
      await supabase
        .from('profile_interactions')
        .upsert({
          sender_id: user.id,
          receiver_id: profileId,
          interaction_type: 'pass'
        }, {
          onConflict: 'sender_id,receiver_id'
        });
    } catch (error) {
      console.error('Error passing profile:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50 flex items-center justify-center pt-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50 pt-20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Find Your Perfect Match</h1>
          <p className="text-gray-600">Search through thousands of verified profiles</p>
        </div>

        {/* Search Bar */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search by name, location, profession..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent text-lg"
            />
          </div>
        </div>

        {/* Filter Toggle */}
        <div className="max-w-4xl mx-auto mb-8 flex justify-between items-center">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 bg-white px-6 py-3 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            <Filter className="h-5 w-5" />
            <span>Advanced Filters</span>
          </button>
          <div className="text-gray-600">
            {filteredProfiles.length} profiles found
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="max-w-4xl mx-auto mb-8 bg-white rounded-xl shadow-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Age Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Age Range</label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.ageMin}
                    onChange={(e) => handleFilterChange('ageMin', parseInt(e.target.value) || 18)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.ageMax}
                    onChange={(e) => handleFilterChange('ageMax', parseInt(e.target.value) || 60)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              {/* Gender */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                <select
                  value={filters.gender}
                  onChange={(e) => handleFilterChange('gender', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                >
                  <option value="">Any</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              {/* Religion */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Religion</label>
                <select
                  value={filters.religion}
                  onChange={(e) => handleFilterChange('religion', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                >
                  <option value="">Any</option>
                  <option value="Hindu">Hindu</option>
                  <option value="Muslim">Muslim</option>
                  <option value="Christian">Christian</option>
                  <option value="Sikh">Sikh</option>
                  <option value="Buddhist">Buddhist</option>
                  <option value="Jain">Jain</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Education */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Education</label>
                <select
                  value={filters.education}
                  onChange={(e) => handleFilterChange('education', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                >
                  <option value="">Any</option>
                  <option value="High School">High School</option>
                  <option value="Bachelor's">Bachelor's</option>
                  <option value="Master's">Master's</option>
                  <option value="PhD">PhD</option>
                  <option value="Diploma">Diploma</option>
                </select>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <input
                  type="text"
                  placeholder="City, State"
                  value={filters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                />
              </div>

              {/* Marital Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Marital Status</label>
                <select
                  value={filters.maritalStatus}
                  onChange={(e) => handleFilterChange('maritalStatus', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                >
                  <option value="">Any</option>
                  <option value="Never Married">Never Married</option>
                  <option value="Divorced">Divorced</option>
                  <option value="Widowed">Widowed</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-4">
              <button
                onClick={clearFilters}
                className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Clear All
              </button>
              <button
                onClick={() => setShowFilters(false)}
                className="px-6 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}

        {/* Results */}
        <div className="max-w-6xl mx-auto">
          {filteredProfiles.length === 0 ? (
            <div className="text-center py-12">
              <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No profiles found</h3>
              <p className="text-gray-600">Try adjusting your search criteria</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProfiles.map((profile) => (
                <div key={profile.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                  {/* Profile Image */}
                  <div className="relative h-64 bg-gradient-to-br from-rose-100 to-pink-100">
                    {profile.images && profile.images.length > 0 ? (
                      <img
                        src={profile.images[0]}
                        alt={profile.full_name || 'Profile'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="h-16 w-16 text-gray-400" />
                      </div>
                    )}
                    
                    {/* Match indicator */}
                    {userMatches.has(profile.id) && (
                      <div className="absolute top-4 left-4 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center">
                        <Heart className="w-3 h-3 mr-1 fill-current" />
                        Matched
                      </div>
                    )}
                    
                    <div className="absolute top-4 right-4 flex space-x-2">
                      <button
                        onClick={() => handlePass(profile.id)}
                        className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors"
                      >
                        <X className="h-5 w-5 text-gray-600" />
                      </button>
                      <button
                        onClick={() => handleLike(profile.id)}
                        className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors"
                      >
                        <Heart className="h-5 w-5 text-rose-600" />
                      </button>
                    </div>
                  </div>

                  {/* Profile Info */}
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {profile.full_name || profile.name || 'Anonymous'}
                      </h3>
                      {profile.is_premium && (
                        <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                          Premium
                        </span>
                      )}
                    </div>

                    <div className="space-y-2 text-sm text-gray-600">
                      {profile.age && (
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4" />
                          <span>{profile.age} years old</span>
                        </div>
                      )}
                      {profile.location && (
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4" />
                          <span>{profile.location}</span>
                        </div>
                      )}
                      {profile.education && (
                        <div className="flex items-center space-x-2">
                          <GraduationCap className="h-4 w-4" />
                          <span>{profile.education}</span>
                        </div>
                      )}
                      {profile.profession && (
                        <div className="flex items-center space-x-2">
                          <Briefcase className="h-4 w-4" />
                          <span>{profile.profession}</span>
                        </div>
                      )}
                      {profile.income && (
                        <div className="flex items-center space-x-2">
                          <DollarSign className="h-4 w-4" />
                          <span>{profile.income}</span>
                        </div>
                      )}
                    </div>

                    {profile.short_bio && (
                      <p className="mt-3 text-gray-700 text-sm line-clamp-2">
                        {profile.short_bio}
                      </p>
                    )}

                    <div className="mt-4 flex space-x-2">
                      <button 
                        onClick={() => handleViewProfile(profile.id)}
                        className="flex-1 bg-rose-600 text-white py-2 px-4 rounded-lg hover:bg-rose-700 transition-colors"
                      >
                        View Profile
                      </button>
                      
                      {userMatches.has(profile.id) ? (
                        <button 
                          onClick={() => handleSendMessage(profile.id)}
                          className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                        >
                          <MessageCircle className="w-4 h-4 mr-1" />
                          Message
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleSendInterest(profile.id)}
                          disabled={interactionLoading === profile.id}
                          className="flex-1 border border-rose-600 text-rose-600 py-2 px-4 rounded-lg hover:bg-rose-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {interactionLoading === profile.id ? 'Sending...' : 'Send Interest'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchPage;