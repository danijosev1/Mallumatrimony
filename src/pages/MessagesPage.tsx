import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, Send, ArrowLeft, Search, MoreVertical, Phone, Video, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import RealtimeIndicator from '../components/ui/RealtimeIndicator';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
}

interface Conversation {
  id: string;
  name: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  avatar?: string;
  isOnline?: boolean;
}

interface Profile {
  id: string;
  name: string;
  full_name: string;
  images: string[];
}

export default function MessagesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [profiles, setProfiles] = useState<{ [key: string]: Profile }>({});
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageSubscriptionRef = useRef<any>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);
  
  // Cache to avoid redundant database calls
  const messagesCache = useRef<{ [conversationId: string]: Message[] }>({});
  const lastFetchTime = useRef<{ [conversationId: string]: number }>({});

  useEffect(() => {
    if (user) {
      fetchConversations();
      setupRealtimeSubscriptions();
    }

    return () => {
      // Cleanup subscriptions
      if (messageSubscriptionRef.current) {
        messageSubscriptionRef.current.unsubscribe();
      }
    };
  }, [user]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation);
      // Focus the message input when a conversation is selected
      setTimeout(() => {
        messageInputRef.current?.focus();
      }, 100);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const setupRealtimeSubscriptions = useCallback(() => {
    if (!user) return;

    // Single comprehensive subscription for all message events
    messageSubscriptionRef.current = supabase
      .channel('user_messages')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events
          schema: 'public',
          table: 'messages',
          filter: `or(sender_id.eq.${user.id},receiver_id.eq.${user.id})`
        },
        (payload) => {
          const message = payload.new as Message;
          const isNewMessage = payload.eventType === 'INSERT';
          const isMessageUpdate = payload.eventType === 'UPDATE';
          
          console.log(`📨 Message event: ${payload.eventType}`, message);
          
          if (isNewMessage) {
            // Determine if it's incoming or outgoing
            const isIncoming = message.receiver_id === user.id;
            const conversationId = isIncoming ? message.sender_id : message.receiver_id;
            
            // Update messages if this conversation is currently selected
            if (selectedConversation === conversationId) {
              setMessages(prev => {
                const exists = prev.some(msg => msg.id === message.id);
                if (exists) return prev;
                return [...prev, message];
              });
              
              // Auto-mark as read if user is viewing the conversation and it's incoming
              if (isIncoming) {
                markMessageAsRead(message.id);
              }
            }
            
            // Update conversation list
            updateConversationWithMessage(message, conversationId, isIncoming);
            
            // Update cache
            if (messagesCache.current[conversationId]) {
              const exists = messagesCache.current[conversationId].some(msg => msg.id === message.id);
              if (!exists) {
                messagesCache.current[conversationId] = [...messagesCache.current[conversationId], message];
              }
            }
          } else if (isMessageUpdate && selectedConversation) {
            // Handle read receipts
            const conversationId = message.sender_id === user.id ? message.receiver_id : message.sender_id;
            
            if (selectedConversation === conversationId) {
              setMessages(prev => 
                prev.map(msg => 
                  msg.id === message.id ? message : msg
                )
              );
            }
            
            // Update cache
            if (messagesCache.current[conversationId]) {
              messagesCache.current[conversationId] = messagesCache.current[conversationId].map(msg =>
                msg.id === message.id ? message : msg
              );
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Real-time subscription status:', status);
        setRealtimeConnected(status === 'SUBSCRIBED');
      });
  }, [user, selectedConversation]);

  const updateConversationWithMessage = useCallback((message: Message, conversationId: string, isIncoming: boolean) => {
    setConversations(prev => {
      const existingConvIndex = prev.findIndex(conv => conv.id === conversationId);
      
      if (existingConvIndex >= 0) {
        // Update existing conversation
        const updatedConversations = [...prev];
        updatedConversations[existingConvIndex] = {
          ...updatedConversations[existingConvIndex],
          lastMessage: message.content,
          lastMessageTime: message.created_at,
          unreadCount: isIncoming && selectedConversation !== conversationId 
            ? updatedConversations[existingConvIndex].unreadCount + 1 
            : updatedConversations[existingConvIndex].unreadCount
        };
        
        // Move to top
        const updatedConv = updatedConversations.splice(existingConvIndex, 1)[0];
        return [updatedConv, ...updatedConversations];
      }
      
      return prev; // Don't add new conversations here - let the conversation list refresh handle it
    });
  }, [selectedConversation]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      
      // Use the optimized RPC function to get conversation list with minimal data
      const { data: conversationData, error } = await supabase
        .rpc('get_conversation_list', { current_user_id: user?.id });
        
      if (error) throw error;
      
      // Transform data for UI
      const conversationsData: Conversation[] = conversationData?.map(conv => ({
        id: conv.other_user_id,
        name: conv.other_user_name || 'Unknown',
        lastMessage: conv.last_message || 'Start a conversation',
        lastMessageTime: conv.last_message_time || '',
        unreadCount: Number(conv.unread_count) || 0,
        avatar: conv.other_user_images?.[0],
        isOnline: false // Remove random online status to reduce UI churn
      })) || [];
      
      setConversations(conversationsData);
      
      // Create profiles map for compatibility (only store essential data)
      const profilesMap: { [key: string]: Profile } = {};
      conversationData?.forEach(conv => {
        profilesMap[conv.other_user_id] = {
          id: conv.other_user_id,
          name: conv.other_user_name,
          full_name: conv.other_user_name,
          images: conv.other_user_images?.[0] ? [conv.other_user_images[0]] : [] // Only store first image
        };
      });
      setProfiles(profilesMap);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (otherUserId: string) => {
    try {
      // Check cache first
      const cacheKey = otherUserId;
      const lastFetch = lastFetchTime.current[cacheKey];
      const cacheAge = lastFetch ? Date.now() - lastFetch : Infinity;
      
      // Use cache if it's less than 30 seconds old and we have data
      if (cacheAge < 30000 && messagesCache.current[cacheKey]) {
        setMessages(messagesCache.current[cacheKey]);
        
        // Mark messages as read
        await markConversationAsRead(otherUserId);
        return;
      }

      setMessagesLoading(true);
      
      // Optimize: Use a single RPC call to get all messages between users
      const { data: messageData, error } = await supabase
        .rpc('get_conversation_messages', { 
          current_user_id: user?.id,
          other_user_id: otherUserId,
          limit_count: 50 // Limit initial load
        });

      if (error) throw error;

      const messages = messageData || [];
      
      // Update cache
      messagesCache.current[cacheKey] = messages;
      lastFetchTime.current[cacheKey] = Date.now();
      
      setMessages(messages);

      // Mark messages as read
      await markConversationAsRead(otherUserId);
    } catch (error) {
      console.error('Error fetching messages:', error);
      
      // Fallback to original method if RPC fails
      await fetchMessagesOriginal(otherUserId);
    } finally {
      setMessagesLoading(false);
    }
  };

  // Fallback method
  const fetchMessagesOriginal = async (otherUserId: string) => {
    try {
      // Combine queries into one with OR condition to reduce round trips
      const { data: allMessages, error } = await supabase
        .from('messages')
        .select('id, sender_id, receiver_id, content, read, created_at') // Select only needed fields
        .or(`and(sender_id.eq.${user?.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user?.id})`)
        .order('created_at', { ascending: true })
        .limit(50); // Limit to recent messages

      if (error) throw error;

      const messages = allMessages || [];
      
      // Update cache
      messagesCache.current[otherUserId] = messages;
      lastFetchTime.current[otherUserId] = Date.now();
      
      setMessages(messages);

      // Mark messages as read
      await markConversationAsRead(otherUserId);
    } catch (error) {
      console.error('Error fetching messages (fallback):', error);
    }
  };

  const markConversationAsRead = async (otherUserId: string) => {
    try {
      // Only call if there are actually unread messages
      const conversation = conversations.find(c => c.id === otherUserId);
      if (!conversation || conversation.unreadCount === 0) return;

      await supabase.rpc('mark_messages_read', {
        current_user_id: user?.id,
        other_user_id: otherUserId
      });

      // Update conversation unread count immediately
      setConversations(prev => 
        prev.map(conv => 
          conv.id === otherUserId 
            ? { ...conv, unreadCount: 0 }
            : conv
        )
      );
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const markMessageAsRead = async (messageId: string) => {
    try {
      // Batch read updates to reduce database calls
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('id', messageId)
        .eq('read', false); // Only update if not already read
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user || sending) return;

    const messageContent = newMessage.trim();
    const tempId = `temp-${Date.now()}`;
    
    try {
      setSending(true);
      setNewMessage(''); // Clear input immediately for better UX

      // Create optimistic message for immediate UI update
      const optimisticMessage: Message = {
        id: tempId,
        sender_id: user.id,
        receiver_id: selectedConversation,
        content: messageContent,
        read: false,
        created_at: new Date().toISOString()
      };

      // Add optimistic message to UI and cache immediately
      setMessages(prev => [...prev, optimisticMessage]);
      
      // Update cache optimistically
      if (messagesCache.current[selectedConversation]) {
        messagesCache.current[selectedConversation] = [...messagesCache.current[selectedConversation], optimisticMessage];
      }

      // Send message to database with minimal data
      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: selectedConversation,
          content: messageContent
        })
        .select('id, sender_id, receiver_id, content, read, created_at') // Only select needed fields
        .single();

      if (error) throw error;

      // Replace optimistic message with real message
      if (data) {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === tempId ? data : msg
          )
        );
        
        // Update cache
        if (messagesCache.current[selectedConversation]) {
          messagesCache.current[selectedConversation] = messagesCache.current[selectedConversation].map(msg =>
            msg.id === tempId ? data : msg
          );
        }
      }

      // Update conversations list optimistically
      setConversations(prev => {
        const updatedConversations = prev.map(conv => 
          conv.id === selectedConversation 
            ? { 
                ...conv, 
                lastMessage: messageContent, 
                lastMessageTime: new Date().toISOString() 
              }
            : conv
        );
        
        // Move current conversation to top
        const currentConvIndex = updatedConversations.findIndex(c => c.id === selectedConversation);
        if (currentConvIndex > 0) {
          const currentConv = updatedConversations.splice(currentConvIndex, 1)[0];
          return [currentConv, ...updatedConversations];
        }
        
        return updatedConversations;
      });

      // Focus back on input after sending
      setTimeout(() => {
        messageInputRef.current?.focus();
      }, 100);

    } catch (error) {
      console.error('Error sending message:', error);
      
      // Remove optimistic message on error
      setMessages(prev => 
        prev.filter(msg => msg.id !== tempId)
      );
      
      // Remove from cache
      if (messagesCache.current[selectedConversation]) {
        messagesCache.current[selectedConversation] = messagesCache.current[selectedConversation].filter(msg => msg.id !== tempId);
      }
      
      // Restore message in input if sending failed
      setNewMessage(messageContent);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
  };

  // Optimized time formatting with memoization
  const formatTime = useCallback((timestamp: string) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  }, []);

  // Memoize filtered conversations to avoid unnecessary re-renders
  const filteredConversations = React.useMemo(() => 
    conversations.filter(conv =>
      conv.name.toLowerCase().includes(searchTerm.toLowerCase())
    ), [conversations, searchTerm]
  );

  const selectedProfile = selectedConversation ? profiles[selectedConversation] : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-32">
      <div className="max-w-7xl mx-auto h-[calc(100vh-80px)]">
        <div className="bg-white shadow-sm border-b">
          <div className="px-4 py-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <MessageCircle className="mr-3 text-rose-600" />
                Messages
                <RealtimeIndicator 
                  isConnected={realtimeConnected} 
                  className="ml-2" 
                />
              </h1>
              <button
                onClick={() => navigate('/')}
                className="text-gray-600 hover:text-gray-800 flex items-center"
              >
                <ArrowLeft className="mr-2" size={20} />
                Back to Home
              </button>
            </div>
          </div>
        </div>

        <div className="flex h-full">
          {/* Conversations List */}
          <div className={`w-full md:w-1/3 bg-white border-r ${selectedConversation ? 'hidden md:block' : ''}`}>
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="overflow-y-auto h-full">
              {filteredConversations.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">No conversations yet</p>
                  <p className="text-sm">Start matching with people to begin conversations!</p>
                  <button
                    onClick={() => navigate('/search')}
                    className="mt-4 bg-rose-600 text-white px-4 py-2 rounded-lg hover:bg-rose-700 transition-colors"
                  >
                    Find Matches
                  </button>
                </div>
              ) : (
                filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => setSelectedConversation(conversation.id)}
                    className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedConversation === conversation.id ? 'bg-rose-50 border-rose-200' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        {conversation.avatar ? (
                          <img
                            src={conversation.avatar}
                            alt={conversation.name}
                            className="w-12 h-12 rounded-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center">
                            <span className="text-rose-600 font-semibold text-lg">
                              {conversation.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        {conversation.unreadCount > 0 && (
                          <div className="absolute -top-1 -right-1 bg-rose-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {conversation.name}
                          </h3>
                          <span className="text-xs text-gray-500">
                            {formatTime(conversation.lastMessageTime)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 truncate mt-1">
                          {conversation.lastMessage}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className={`flex-1 flex flex-col ${!selectedConversation ? 'hidden md:flex' : ''}`}>
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="bg-white border-b p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setSelectedConversation(null)}
                      className="md:hidden p-2 hover:bg-gray-100 rounded-full"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    {selectedProfile?.images?.[0] ? (
                      <img
                        src={selectedProfile.images[0]}
                        alt={selectedProfile.name}
                        className="w-10 h-10 rounded-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
                        <span className="text-rose-600 font-semibold">
                          {selectedProfile?.name?.charAt(0).toUpperCase() || '?'}
                        </span>
                      </div>
                    )}
                    <div>
                      <h2 className="font-semibold text-gray-900">
                        {selectedProfile?.name || selectedProfile?.full_name || 'Unknown'}
                      </h2>
                      <p className="text-sm text-gray-500 flex items-center">
                        <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
                        Last seen recently
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-full">
                      <Phone className="w-5 h-5" />
                    </button>
                    <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-full">
                      <Video className="w-5 h-5" />
                    </button>
                    <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-full">
                      <Info className="w-5 h-5" />
                    </button>
                    <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-full">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 pb-32">
                  {messagesLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
                      <span className="ml-3 text-gray-600">Loading messages...</span>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="text-center">
                        <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <h3 className="text-lg font-medium text-gray-600 mb-2">Start a conversation</h3>
                        <p className="text-gray-500">Send a message to break the ice!</p>
                      </div>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.sender_id === user?.id
                              ? 'bg-rose-600 text-white'
                              : 'bg-white text-gray-900 border border-gray-200'
                          } ${message.id.startsWith('temp-') ? 'opacity-70' : ''}`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <div className={`flex items-center justify-end mt-1 space-x-1 ${
                            message.sender_id === user?.id ? 'text-rose-100' : 'text-gray-500'
                          }`}>
                            <span className="text-xs">{formatTime(message.created_at)}</span>
                            {message.sender_id === user?.id && !message.id.startsWith('temp-') && (
                              <span className="text-xs">
                                {message.read ? '✓✓' : '✓'}
                              </span>
                            )}
                            {message.id.startsWith('temp-') && (
                              <span className="text-xs opacity-60">Sending...</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input Box - Fixed at bottom with proper spacing */}
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 z-10">
                  <div className="max-w-7xl mx-auto">
                    <div className="flex items-center space-x-3">
                      <input
                        ref={messageInputRef}
                        type="text"
                        value={newMessage}
                        onChange={handleInputChange}
                        onKeyPress={handleKeyPress}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-rose-500 focus:border-transparent resize-none"
                        disabled={sending}
                        autoComplete="off"
                      />
                      <button
                        onClick={sendMessage}
                        disabled={!newMessage.trim() || sending}
                        className="p-3 bg-rose-600 text-white rounded-full hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                      >
                        {sending ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <Send className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    <div className="mt-2 text-xs text-gray-500 text-center flex items-center justify-center">
                      <RealtimeIndicator isConnected={realtimeConnected} className="mr-2" />
                      Press Enter to send
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Select a conversation
                  </h3>
                  <p className="text-gray-500">
                    Choose a conversation from the list to start messaging
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>