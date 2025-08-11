import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, User, Heart, Bell, MessageCircle, LogOut, Crown, Eye } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useMembership } from '../../context/MembershipContext';
import { supabase } from '../../lib/supabase';
import Logo from '../ui/Logo';

// Local interfaces - no external dependencies
interface NotificationUser {
  id: string;
  name: string;
  image: string | null;
}

interface Notification {
  id: string | number;
  type: 'like' | 'message' | 'view' | 'match';
  read: boolean;
  created_at: string;
  user: NotificationUser;
  message: string;
  content?: string;
}

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [realtimeEnabled, setRealtimeEnabled] = useState(true); // Allow disabling
  
  const { user, logout, isLoading } = useAuth();
  const { currentPlan, isPremium } = useMembership();
  const location = useLocation();
  const notificationsRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);
  const toggleUserMenu = () => setIsUserMenuOpen(!isUserMenuOpen);
  const closeUserMenu = () => setIsUserMenuOpen(false);
  
  const toggleNotifications = useCallback(() => {
    if (!isNotificationsOpen && unreadCount > 0) {
      markNotificationsAsRead();
    }
    setIsNotificationsOpen(!isNotificationsOpen);
  }, [isNotificationsOpen, unreadCount]);
  
  const closeNotifications = () => setIsNotificationsOpen(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menus when clicking outside
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

  // Optimized notification fetching - memoized to prevent unnecessary calls
  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    try {
      // Only fetch unread messages for notification count (more efficient)
      const { data: unreadMessages, error: messagesError } = await supabase
        .from('messages')
        .select('id')
        .eq('receiver_id', user.id)
        .eq('read', false);

      if (!messagesError && unreadMessages) {
        setUnreadCount(unreadMessages.length);
      }

      // Only fetch full notifications when dropdown is open
      if (isNotificationsOpen) {
        await fetchDetailedNotifications();
      }
    } catch (error) {
      console.error('Error fetching notification count:', error);
    }
  }, [user?.id, isNotificationsOpen]);

  // Separate function for detailed notifications (only when needed)
  const fetchDetailedNotifications = async () => {
    if (!user) return;

    try {
      // Fetch data in parallel for better performance
      const [likesResponse, messagesResponse, viewsResponse, matchesResponse] = await Promise.allSettled([
        // Likes
        supabase
          .from('profile_interactions')
          .select('id, interaction_type, created_at, sender_id')
          .eq('receiver_id', user.id)
          .eq('interaction_type', 'like')
          .order('created_at', { ascending: false })
          .limit(5),
        
        // Messages
        supabase
          .from('messages')
          .select('id, content, read, created_at, sender_id')
          .eq('receiver_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5),
        
        // Views
        supabase
          .from('profile_views')
          .select('id, created_at, viewer_id')
          .eq('viewed_profile_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5),
        
        // Matches (optimized with single query using OR)
        supabase
          .from('matches')
          .select('id, created_at, user1_id, user2_id')
          .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
          .order('created_at', { ascending: false })
          .limit(10)
      ]);

      // Extract successful results
      const likes = likesResponse.status === 'fulfilled' && likesResponse.value.data ? likesResponse.value.data : [];
      const messages = messagesResponse.status === 'fulfilled' && messagesResponse.value.data ? messagesResponse.value.data : [];
      const views = viewsResponse.status === 'fulfilled' && viewsResponse.value.data ? viewsResponse.value.data : [];
      const matches = matchesResponse.status === 'fulfilled' && matchesResponse.value.data ? matchesResponse.value.data : [];

      // Get unique user IDs for profile fetching
      const userIds = [
        ...likes.map(like => like.sender_id),
        ...messages.map(message => message.sender_id),
        ...views.map(view => view.viewer_id),
        ...matches.map(match => match.user1_id === user.id ? match.user2_id : match.user1_id)
      ].filter((id, index, arr) => arr.indexOf(id) === index && id);

      // Fetch profiles only if needed
      let profiles: any[] = [];
      if (userIds.length > 0) {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, name, full_name, images')
          .in('id', userIds);
        
        if (!error && data) profiles = data;
      }

      // Helper function to get user info
      const getUserInfo = (userId: string): NotificationUser => {
        const profile = profiles.find(p => p.id === userId);
        return {
          id: userId,
          name: profile?.name || profile?.full_name || 'Anonymous',
          image: profile?.images?.[0] || null
        };
      };

      // Transform notifications
      const allNotifications = [
        ...likes.map(like => ({
          id: like.id,
          type: 'like' as const,
          read: true,
          created_at: like.created_at,
          user: getUserInfo(like.sender_id),
          message: 'liked your profile'
        })),
        ...messages.map(message => ({
          id: message.id,
          type: 'message' as const,
          read: message.read,
          created_at: message.created_at,
          user: getUserInfo(message.sender_id),
          message: 'sent you a message',
          content: message.content
        })),
        ...views.map(view => ({
          id: view.id,
          type: 'view' as const,
          read: true,
          created_at: view.created_at,
          user: getUserInfo(view.viewer_id),
          message: 'viewed your profile'
        })),
        ...matches.map(match => {
          const otherUserId = match.user1_id === user.id ? match.user2_id : match.user1_id;
          const isNewMatch = match.user2_id === user.id;
          
          return {
            id: match.id,
            type: 'match' as const,
            read: true,
            created_at: match.created_at,
            user: getUserInfo(otherUserId),
            message: isNewMatch ? 'sent you a match request' : 'matched with you'
          };
        })
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setNotifications(allNotifications);
      setUnreadCount(messages.filter(m => !m.read).length);

    } catch (error) {
      console.error('Error fetching detailed notifications:', error);
    }
  };

  // OPTIMIZED REALTIME SETUP - Single subscription with efficient filtering
  useEffect(() => {
    if (!user || !realtimeEnabled) return;

    // Cleanup previous subscription
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    console.log('🔌 Setting up optimized notification realtime for user:', user.id);

    // Single channel with consolidated filtering
    const channel = supabase
      .channel(`user_notifications_${user.id}_${Date.now()}`)
      // Only listen to unread messages for notification count (most important)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`
        },
        (payload) => {
          console.log('📧 New message notification');
          setUnreadCount(prev => prev + 1);
          // Only fetch detailed notifications if dropdown is open
          if (isNotificationsOpen) {
            fetchDetailedNotifications();
          }
        }
      )
      // Listen to message reads to update count
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`
        },
        (payload) => {
          const message = payload.new as any;
          if (message.read) {
            console.log('📧 Message marked as read');
            setUnreadCount(prev => Math.max(0, prev - 1));
          }
        }
      )
      // Optional: Listen to high-priority notifications only
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'matches',
          filter: `user2_id=eq.${user.id}` // Only new match requests
        },
        (payload) => {
          console.log('💕 New match request');
          // Show immediate notification without heavy fetching
          if (isNotificationsOpen) {
            fetchDetailedNotifications();
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Notification subscription status:', status);
      });

    channelRef.current = channel;

    return () => {
      console.log('🔌 Cleaning up notification subscription');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user?.id, realtimeEnabled, isNotificationsOpen]); // Stable dependencies

  // Initial notification count fetch
  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user, fetchNotifications]);

  // Fetch detailed notifications when dropdown opens
  useEffect(() => {
    if (isNotificationsOpen && user) {
      fetchDetailedNotifications();
    }
  }, [isNotificationsOpen, user]);

  const markNotificationsAsRead = async () => {
    if (!user) return;

    try {
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('receiver_id', user.id)
        .eq('read', false);

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
      
      // Disable realtime before logout
      setRealtimeEnabled(false);
      
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
                            key={`${notification.type}-${notification.id}`}
                            to={
                              notification.type === 'message' 
                                ? '/messages' 
                                : notification.type === 'match'
                                ? '/matches'
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

      {/* Mobile Menu - keeping existing mobile menu code */}
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
                  {unreadCount > 0 && (
                    <div className="flex items-center mt-1">
                      <Bell size={16} className="text-red-500 mr-1" />
                      <span className="text-sm text-red-500">{unreadCount} new notifications</span>
                    </div>
                  )}
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
                  {unreadCount > 0 && (
                    <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                      {unreadCount}
                    </span>
                  )}
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