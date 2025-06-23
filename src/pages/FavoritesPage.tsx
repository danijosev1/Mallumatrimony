import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Heart, Search, Filter, ArrowLeft, MessageCircle, Star, Eye, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface LikedProfile {
  id: string;
  full_name: string;
  name: string;
  age: number;
  gender: string;
  religion: string;
  education: string;
  profession: string;
  location: string;
  images: string[];
  short_bio: string;
  is_premium: boolean;
  liked_at: string;
  is_mutual: boolean;
}

const FavoritesPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<LikedProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadFavorites();
  }, [user, navigate]);

  const loadFavorites = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Get all profiles that the current user has liked
      const { data: likedInteractions, error: interactionsError } = await supabase
        .from('profile_interactions')
        .select(`
          receiver_id,
          created_at,
          profiles!profile_interactions_receiver_id_fkey(
            id,
            full_name,
            name,
            age,
            gender,
            religion,
            education,
            profession,
            location,
            images,
            short_bio,
            is_premium
          )
        `)
        .eq('sender_id', user.id)
        .eq('interaction_type', 'like')
        .order('created_at', { ascending: false });

      if (interactionsError) throw interactionsError;

      // Check for mutual likes
      const receiverIds = likedInteractions?.map(interaction => interaction.receiver_id) || [];
      
      let mutualLikes: string[] = [];
      if (receiverIds.length > 0) {
        const { data: mutualInteractions, error: mutualError } = await supabase
          .from('profile_interactions')
          .select('sender_id')
          .eq('receiver_id', user.id)
          .eq('interaction_type', 'like')
          .in('sender_id', receiverIds);

        if (!mutualError) {
          mutualLikes = mutualInteractions?.map(interaction => interaction.sender_id) || [];
        }
      }

      // Transform the data
      const favoritesData: LikedProfile[] = (likedInteractions || [])
        .filter(interaction => interaction.profiles) // Filter out any null profiles
        .map(interaction => {
          const profile = interaction.profiles as any;
          return {
            id: profile.id,
            full_name: profile.full_name || profile.name || 'Anonymous',
            name: profile.name || profile.full_name || 'Anonymous',
            age: profile.age || 0,
            gender: profile.gender || 'Not specified',
            religion: profile.religion || 'Not specified',
            education: profile.education || 'Not specified',
            profession: profile.profession || 'Not specified',
            location: profile.location || 'Not specified',
            images: profile.images || [],
            short_bio: profile.short_bio || 'No bio available',
            is_premium: profile.is_premium || false,
            liked_at: interaction.created_at,
            is_mutual: mutualLikes.includes(profile.id)
          };
        });

      setFavorites(favoritesData);
    } catch (error) {
      console.error('❌ Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (profileId: string) => {
    if (!user || removingId) return;

    try {
      setRemovingId(profileId);
      
      // Remove the like interaction
      const { error } = await supabase
        .from('profile_interactions')
        .delete()
        .eq('sender_id', user.id)
        .eq('receiver_id', profileId)
        .eq('interaction_type', 'like');

      if (error) throw error;

      // Remove from local state
      setFavorites(prev => prev.filter(fav => fav.id !== profileId));
      
    } catch (error) {
      console.error('❌ Error removing favorite:', error);
      alert('Failed to remove from favorites. Please try again.');
    } finally {
      setRemovingId(null);
    }
  };

  const handleMessage = (profileId: string) => {
    const favorite = favorites.find(f => f.id === profileId);
    if (favorite?.is_mutual) {
      navigate('/messages');
    } else {
      alert('You can only message users who have also liked you back.');
    }
  };

  const filteredFavorites = favorites.filter(favorite =>
    favorite.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    favorite.profession.toLowerCase().includes(searchTerm.toLowerCase()) ||
    favorite.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedFavorites = [...filteredFavorites].sort((a, b) => {
    switch (sortBy) {
      case 'recent':
        return new Date(b.liked_at).getTime() - new Date(a.liked_at).getTime();
      case 'name':
        return a.name.localeCompare(b.name);
      case 'age':
        return a.age - b.age;
      default:
        return 0;
    }
  });

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="pt-20 min-h-screen bg-gradient-to-br from-rose-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600 mx-auto mb-4"></div>
          <p className="text-gray/70">Loading favorites...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 bg-gradient-to-br from-rose-50 to-pink-50 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/')}
              className="flex items-center text-rose-600 hover:text-rose-700 transition-colors duration-300 mr-4"
            >
              <ArrowLeft size={20} className="mr-2" />
              Back to Home
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Heart size={32} className="mr-3 text-rose-500" />
                My Favorites
              </h1>
              <p className="text-gray-600 mt-1">Profiles you've liked</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-rose-600">{favorites.length}</div>
            <div className="text-sm text-gray-600">Liked Profiles</div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search favorites..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Filter className="text-gray-400 mr-2" size={18} />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                >
                  <option value="recent">Recently Liked</option>
                  <option value="name">Name (A-Z)</option>
                  <option value="age">Age</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Favorites Grid */}
        {sortedFavorites.length === 0 ? (
          <div className="text-center py-16">
            {searchTerm ? (
              <div>
                <Search className="text-gray-300 mx-auto mb-4" size={64} />
                <h3 className="text-xl font-medium text-gray-600 mb-2">No results found</h3>
                <p className="text-gray-500 mb-4">Try adjusting your search terms</p>
                <button
                  onClick={() => setSearchTerm('')}
                  className="bg-rose-600 text-white px-6 py-2 rounded-lg hover:bg-rose-700 transition-colors"
                >
                  Clear Search
                </button>
              </div>
            ) : (
              <div>
                <Heart className="text-gray-300 mx-auto mb-4" size={64} />
                <h3 className="text-xl font-medium text-gray-600 mb-2">No favorites yet</h3>
                <p className="text-gray-500 mb-4">Start exploring profiles and like the ones you're interested in</p>
                <button
                  onClick={() => navigate('/search')}
                  className="bg-rose-600 text-white px-6 py-2 rounded-lg hover:bg-rose-700 transition-colors"
                >
                  Browse Profiles
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {sortedFavorites.map((favorite) => (
                <div key={favorite.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow group">
                  {/* Profile Image */}
                  <div className="relative h-64">
                    {favorite.images && favorite.images.length > 0 ? (
                      <img
                        src={favorite.images[0]}
                        alt={favorite.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center">
                        <Heart className="text-rose-300" size={48} />
                      </div>
                    )}
                    
                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex flex-col space-y-2">
                      {favorite.is_mutual && (
                        <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center">
                          <Heart size={12} className="mr-1 fill-current" />
                          Mutual
                        </div>
                      )}
                      {favorite.is_premium && (
                        <div className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full flex items-center">
                          <Star size={12} className="mr-1 fill-current" />
                          Premium
                        </div>
                      )}
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => removeFavorite(favorite.id)}
                      disabled={removingId === favorite.id}
                      className="absolute top-3 right-3 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors duration-300 opacity-0 group-hover:opacity-100 disabled:opacity-50"
                      title="Remove from favorites"
                    >
                      {removingId === favorite.id ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Trash2 size={14} />
                      )}
                    </button>

                    {/* Liked Date */}
                    <div className="absolute bottom-3 left-3 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                      Liked {formatTimeAgo(favorite.liked_at)}
                    </div>
                  </div>

                  {/* Profile Info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-lg text-gray-900 mb-1">
                      {favorite.name}, {favorite.age}
                    </h3>
                    
                    <div className="text-sm text-gray-600 mb-3 space-y-1">
                      <div>{favorite.profession}</div>
                      <div>{favorite.location}</div>
                      <div>{favorite.religion}</div>
                    </div>

                    <p className="text-sm text-gray-700 line-clamp-2 mb-4">
                      {favorite.short_bio}
                    </p>

                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => navigate(`/profile/${favorite.id}`)}
                        className="flex-1 bg-rose-600 text-white py-2 px-3 rounded-lg hover:bg-rose-700 transition-colors duration-300 flex items-center justify-center text-sm"
                      >
                        <Eye size={14} className="mr-1" />
                        View
                      </button>
                      
                      {favorite.is_mutual ? (
                        <button
                          onClick={() => handleMessage(favorite.id)}
                          className="flex-1 bg-green-600 text-white py-2 px-3 rounded-lg hover:bg-green-700 transition-colors duration-300 flex items-center justify-center text-sm"
                        >
                          <MessageCircle size={14} className="mr-1" />
                          Message
                        </button>
                      ) : (
                        <button
                          disabled
                          className="flex-1 bg-gray-300 text-gray-500 py-2 px-3 rounded-lg cursor-not-allowed flex items-center justify-center text-sm"
                          title="They need to like you back to message"
                        >
                          <MessageCircle size={14} className="mr-1" />
                          Message
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Favorites Statistics</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-rose-50 rounded-lg">
                  <div className="text-2xl font-bold text-rose-600">{favorites.length}</div>
                  <div className="text-sm text-gray-600">Total Favorites</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {favorites.filter(f => f.is_mutual).length}
                  </div>
                  <div className="text-sm text-gray-600">Mutual Likes</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {favorites.filter(f => f.is_premium).length}
                  </div>
                  <div className="text-sm text-gray-600">Premium Members</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {favorites.length > 0 ? Math.round(favorites.reduce((sum, f) => sum + f.age, 0) / favorites.length) : 0}
                  </div>
                  <div className="text-sm text-gray-600">Average Age</div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FavoritesPage;