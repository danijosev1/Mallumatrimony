import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, User, Heart, Bell, MessageCircle, LogOut, Crown, Eye } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useMembership } from '../../context/MembershipContext';
import { supabase } from '../../lib/supabase';
import Logo from '../ui/Logo';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, logout, isLoading } = useAuth();
  const { currentPlan, isPremium } = useMembership();
  const location = useLocation();
  const notificationsRef = useRef<HTMLDivElement>(null);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);
  const toggleUserMenu = () => setIsUserMenuOpen(!isUserMenuOpen);
  const closeUserMenu = () => setIsUserMenuOpen(false);
  const toggleNotifications = () => {
    if (!isNotificationsOpen && unreadCount > 0) {
      markNotificationsAsRead();
    }
    setIsNotificationsOpen(!isNotificationsOpen);
  };
  const closeNotifications = () => setIsNotificationsOpen(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.user-menu-container')) {
        setIsUserMenuOpen(false);
      }
      if (!target.closest('.notifications-container') && !target.closest('.notifications-button')) {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch notifications
  useEffect(() => {
    if (user) {
      fetchNotifications();
      
      // Set up realtime subscription for new notifications
      const channel = supabase
        .channel('notifications_channel')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'profile_interactions',
          filter: `receiver_id=eq.${user.id}`
        }, (payload) => {
          // New interaction received
          fetchNotifications();
        })
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`
        }, (payload) => {
          // New message received
          fetchNotifications();
        })
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'profile_views',
          filter: `viewed_profile_id=eq.${user.id}`
        }, (payload) => {
          // Profile viewed
          fetchNotifications();
        })
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'matches',
          filter: `user1_id=eq.${user.id}`
        }, (payload) => {
          // New match
          fetchNotifications();
        })
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'matches',
          filter: `user2_id=eq.${user.id}`
        }, (payload) => {
          // New match
          fetchNotifications();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      // Fetch recent likes
      const { data: likes, error: likesError } = await supabase
        .from('profile_interactions')
        .select(`
          id,
          interaction_type,
          created_at,
          profiles!profile_interactions_sender_id_fkey(
            id,
            name,
            full_name,
            images
          )
        `)
        .eq('receiver_id', user.id)
        .eq('interaction_type', 'like')
        .order('created_at', { ascending: false })
        .limit(5);

      if (likesError) throw likesError;

      // Fetch recent messages
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          read,
          created_at,
          profiles!messages_sender_id_fkey(
            id,
            name,
            full_name,
            images
          )
        `)
        .eq('receiver_id', user.id)
        .eq('read', false)
        .order('created_at', { ascending: false })
        .limit(5);

      if (messagesError) throw messagesError;

      // Fetch recent profile views
      const { data: views, error: viewsError } = await supabase
        .from('profile_views')
        .select(`
          id,
          created_at,
          profiles!profile_views_viewer_id_fkey(
            id,
            name,
            full_name,
            images
          )
        `)
        .eq('viewed_profile_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (viewsError) throw viewsError;

      // Fetch recent matches - simplified query
      const { data: matches, error: matchesError } = await supabase
        .from('matches')
        .select(`
          id,
          created_at,
          user1_id,
          user2_id
        `)
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(5);

      if (matchesError) throw matchesError;

      // Get other user IDs from matches
      const otherUserIds = matches?.map(match => 
        match.user1_id === user.id ? match.user2_id : match.user1_id
      ).filter(Boolean) || [];

      // Fetch profiles for other users if we have any matches
      let matchProfiles: any[] = [];
      if (otherUserIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name, full_name, images')
          .in('id', otherUserIds);

        if (profilesError) throw profilesError;
        matchProfiles = profiles || [];
      }

      // Transform likes
      const likeNotifications = likes?.map(like => ({
        id: like.id,
        type: 'like',
        read: true, // Likes are always considered read
        created_at: like.created_at,
        user: {
          id: like.profiles.id,
          name: like.profiles.name || like.profiles.full_name || 'Anonymous',
          image: like.profiles.images?.[0] || null
        },
        message: 'liked your profile'
      })) || [];

      // Transform messages
      const messageNotifications = messages?.map(message => ({
        id: message.id,
        type: 'message',
        read: message.read,
        created_at: message.created_at,
        user: {
          id: message.profiles.id,
          name: message.profiles.name || message.profiles.full_name || 'Anonymous',
          image: message.profiles.images?.[0] || null
        },
        message: 'sent you a message',
        content: message.content
      })) || [];

      // Transform views
      const viewNotifications = views?.map(view => ({
        id: view.id,
        type: 'view',
        read: true, // Views are always considered read
        created_at: view.created_at,
        user: {
          id: view.profiles.id,
          name: view.profiles.name || view.profiles.full_name || 'Anonymous',
          image: view.profiles.images?.[0] || null
        },
        message: 'viewed your profile'
      })) || [];

      // Transform matches with fetched profiles
      const matchNotifications = matches?.map(match => {
        const otherUserId = match.user1_id === user.id ? match.user2_id : match.user1_id;
        const otherUserProfile = matchProfiles.find(profile => profile.id === otherUserId);
        
        return {
          id: match.id,
          type: 'match',
          read: true, // Matches are always considered read
          created_at: match.created_at,
          user: {
            id: otherUserId,
            name: otherUserProfile?.name || otherUserProfile?.full_name || 'Anonymous',
            image: otherUserProfile?.images?.[0] || null
          },
          message: 'matched with you'
        };
      }) || [];

      // Combine and sort all notifications
      const allNotifications = [
        ...likeNotifications,
        ...messageNotifications,
        ...viewNotifications,
        ...matchNotifications
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setNotifications(allNotifications);
      setUnreadCount(messageNotifications.filter(n => !n.read).length);

    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markNotificationsAsRead = async () => {
    if (!user) return;

    try {
      // Mark all unread messages as read
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('receiver_id', user.id)
        .eq('read', false);

      // Update local state
      setUnreadCount(0);
      setNotifications(prev => 
        prev.map(notification => ({
          ...notification,
          read: true
        }))
      );
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      closeUserMenu();
      closeMenu();
      
      console.log('Header: Starting logout...');
      await logout();
      console.log('Header: Logout completed');
      
    } catch (error) {
      console.error('Header: Logout error:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Navigation links
  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Search', path: '/search' },
    { name: 'Success Stories', path: '/success-stories' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  // Check if we're on home page and not scrolled (transparent header)
  // Only make transparent if user is NOT logged in and on home page and not scrolled
  const isTransparentHeader = location.pathname === '/' && !isScrolled && !user;

  return (
    <header
      className={`fixed w-full z-50 transition-all duration-300 ${
        isTransparentHeader
          ? 'bg-transparent py-4' 
          : 'bg-white shadow-md py-2'
      }`}
      style={{ top: '0px' }}
    >
      <div className="container-custom flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="flex items-center">
          <Logo color={isTransparentHeader ? 'white' : 'primary'} />
          <span className={`ml-2 text-2xl font-bold ${isTransparentHeader ? 'text-white' : 'text-primary'}`}>
            Mallu Matrimony
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center space-x-8">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`font-medium transition-colors duration-300 ${
                isTransparentHeader
                  ? 'text-white hover:text-secondary' 
                  : 'text-gray-700 hover:text-primary'
              } ${location.pathname === link.path ? 'border-b-2 border-secondary' : ''}`}
              onClick={closeMenu}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* User Actions */}
        <div className="hidden lg:flex items-center space-x-4">
          {user ? (
            <>
              {/* Notifications Button */}
              <div className="relative notifications-container">
                <button 
                  onClick={toggleNotifications}
                  className="p-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors duration-300 notifications-button relative"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                
                {/* Notifications Dropdown */}
                {isNotificationsOpen && (
                  <div 
                    ref={notificationsRef}
                    className="absolute right-0 mt-2 w-80 bg-white shadow-lg rounded-md border border-gray-200 py-1 z-50"
                  >
                    <div className="py-2 px-4 border-b border-gray-100">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm text-gray-900">
                          Notifications
                        </p>
                        {unreadCount > 0 && (
                          <button 
                            onClick={markNotificationsAsRead}
                            className="text-xs text-primary hover:text-primary-light"
                          >
                            Mark all as read
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="py-6 text-center">
                          <Bell className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                          <p className="text-sm text-gray-500">No notifications yet</p>
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <Link
                            key={notification.id}
                            to={
                              notification.type === 'message' 
                                ? '/messages' 
                                : `/profile/${notification.user.id}`
                            }
                            className={`block py-3 px-4 hover:bg-gray-50 transition-colors duration-200 ${
                              !notification.read ? 'bg-blue-50' : ''
                            }`}
                            onClick={closeNotifications}
                          >
                            <div className="flex items-start">
                              {notification.user.image ? (
                                <img 
                                  src={notification.user.image} 
                                  alt={notification.user.name}
                                  className="h-10 w-10 rounded-full object-cover mr-3"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                                  <User className="h-5 w-5 text-gray-500" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {notification.user.name}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {formatTimeAgo(notification.created_at)}
                                  </p>
                                </div>
                                <p className="text-sm text-gray-600 flex items-center">
                                  {notification.type === 'like' && (
                                    <Heart className="h-3 w-3 text-red-500 mr-1" />
                                  )}
                                  {notification.type === 'message' && (
                                    <MessageCircle className="h-3 w-3 text-blue-500 mr-1" />
                                  )}
                                  {notification.type === 'view' && (
                                    <Eye className="h-3 w-3 text-green-500 mr-1" />
                                  )}
                                  {notification.type === 'match' && (
                                    <Heart className="h-3 w-3 text-pink-500 fill-current mr-1" />
                                  )}
                                  {notification.message}
                                </p>
                                {notification.content && (
                                  <p className="text-xs text-gray-500 mt-1 truncate">
                                    "{notification.content}"
                                  </p>
                                )}
                              </div>
                            </div>
                          </Link>
                        ))
                      )}
                    </div>
                    
                    <div className="py-2 px-4 border-t border-gray-100 text-center">
                      <Link 
                        to="/messages" 
                        className="text-xs text-primary hover:text-primary-light font-medium"
                        onClick={closeNotifications}
                      >
                        View all messages
                      </Link>
                    </div>
                  </div>
                )}
              </div>
              
              <Link to="/favorites" className="p-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors duration-300">
                <Heart size={20} />
              </Link>
              <Link to="/messages" className="p-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors duration-300">
                <MessageCircle size={20} />
              </Link>
              
              {/* Elite Badge */}
              {currentPlan === 'elite' && (
                <Link to="/select-plan" className="flex items-center bg-amber-100 text-amber-800 px-3 py-1 rounded-full">
                  <Crown size={14} className="mr-1" />
                  <span className="text-xs font-medium">Elite</span>
                </Link>
              )}
              
              {/* User Menu */}
              <div className="relative user-menu-container">
                <button 
                  onClick={toggleUserMenu}
                  className="flex items-center space-x-2 p-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors duration-300"
                  disabled={isLoading || isLoggingOut}
                >
                  <User size={20} />
                  {(isLoading || isLoggingOut) && (
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  )}
                </button>
                
                {isUserMenuOpen && !isLoggingOut && (
                  <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-md border border-gray-200 py-1 z-50">
                    <div className="py-2 px-4 border-b border-gray-100">
                      <p className="font-medium text-sm text-gray-900 truncate">
                        {user.email}
                      </p>
                      {currentPlan === 'elite' && (
                        <div className="flex items-center mt-1 text-xs text-amber-600">
                          <Crown size={10} className="mr-1" />
                          Elite Member
                        </div>
                      )}
                    </div>
                    <Link 
                      to="/profile" 
                      className="block py-2 px-4 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                      onClick={closeUserMenu}
                    >
                      My Profile
                    </Link>
                    <Link 
                      to="/settings" 
                      className="block py-2 px-4 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                      onClick={closeUserMenu}
                    >
                      Settings
                    </Link>
                    {currentPlan !== 'elite' && (
                      <Link 
                        to="/select-plan" 
                        className="block py-2 px-4 text-sm text-amber-600 hover:bg-amber-50 transition-colors duration-200"
                        onClick={closeUserMenu}
                      >
                        <div className="flex items-center">
                          <Crown size={14} className="mr-2" />
                          Upgrade to Elite
                        </div>
                      </Link>
                    )}
                    <button 
                      onClick={handleLogout} 
                      disabled={isLoading || isLoggingOut}
                      className="w-full text-left py-2 px-4 text-sm text-red-600 hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-center">
                        <LogOut size={16} className="mr-2" />
                        {isLoggingOut ? 'Logging out...' : 'Logout'}
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link 
                to="/login" 
                className={`px-6 py-3 rounded-md font-medium transition-all duration-300 ${
                  isTransparentHeader 
                    ? 'bg-white/20 backdrop-blur-sm text-white border-2 border-white/30 hover:bg-white/30 hover:border-white/50' 
                    : 'border-2 border-primary text-primary hover:bg-primary/10'
                }`}
              >
                Login
              </Link>
              <Link 
                to="/register" 
                className={`px-6 py-3 rounded-md font-medium transition-all duration-300 ${
                  isTransparentHeader 
                    ? 'bg-secondary text-accent hover:bg-secondary-light shadow-lg' 
                    : 'bg-primary text-white hover:bg-primary-light'
                }`}
              >
                Register
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="lg:hidden p-2 rounded-md focus:outline-none"
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? (
            <X size={24} className={isTransparentHeader ? 'text-white' : 'text-gray-700'} />
          ) : (
            <Menu size={24} className={isTransparentHeader ? 'text-white' : 'text-gray-700'} />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        className={`lg:hidden fixed inset-0 bg-white z-40 transition-transform duration-300 transform ${
          isMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ top: '48px' }}
      >
        <div className="p-4">
          <nav className="flex flex-col space-y-4">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`py-2 font-medium text-lg ${
                  location.pathname === link.path
                    ? 'text-primary border-b-2 border-secondary'
                    : 'text-gray-700 hover:text-primary'
                }`}
                onClick={closeMenu}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          <div className="mt-8 flex flex-col space-y-4">
            {user ? (
              <>
                <div className="py-2 border-b border-gray-200">
                  <p className="text-sm text-gray-600">Logged in as:</p>
                  <p className="font-medium text-gray-900 truncate">{user.email}</p>
                </div>
                <Link
                  to="/profile"
                  className="flex items-center py-2 text-primary"
                  onClick={closeMenu}
                >
                  <User size={20} className="mr-2" />
                  My Profile
                </Link>
                <Link
                  to="/favorites"
                  className="flex items-center py-2 text-primary"
                  onClick={closeMenu}
                >
                  <Heart size={20} className="mr-2" />
                  Favorites
                </Link>
                <Link
                  to="/messages"
                  className="flex items-center py-2 text-primary"
                  onClick={closeMenu}
                >
                  <MessageCircle size={20} className="mr-2" />
                  Messages
                </Link>
                {currentPlan !== 'elite' && (
                  <Link
                    to="/select-plan"
                    className="flex items-center py-2 text-amber-600"
                    onClick={closeMenu}
                  >
                    <Crown size={20} className="mr-2" />
                    Upgrade to Elite
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  disabled={isLoading || isLoggingOut}
                  className="flex items-center py-2 text-red-500 text-left disabled:opacity-50"
                >
                  <LogOut size={20} className="mr-2" />
                  {isLoggingOut ? 'Logging out...' : 'Logout'}
                  {isLoggingOut && (
                    <div className="ml-2 w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                  )}
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-outline w-full text-center" onClick={closeMenu}>
                  Login
                </Link>
                <Link to="/register" className="btn-primary w-full text-center" onClick={closeMenu}>
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;