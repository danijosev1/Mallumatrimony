import React, { useState, useEffect, useRef } from 'react';
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
  const [sending, setSending] = useState(false);
  const [profiles, setProfiles] = useState<{ [key: string]: Profile }>({});
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageSubscriptionRef = useRef<any>(null);
  const conversationSubscriptionRef = useRef<any>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);

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
      if (conversationSubscriptionRef.current) {
        conversationSubscriptionRef.current.unsubscribe();
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

  const setupRealtimeSubscriptions = () => {
    if (!user) return;

    // Subscribe to new messages for the current user
    messageSubscriptionRef.current = supabase
      .channel('messages_channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`
        },
        (payload) => {
          const newMessage = payload.new as Message;
          console.log('📨 New message received:', newMessage);
          
          // If this message is for the currently selected conversation, add it to messages
          if (selectedConversation === newMessage.sender_id) {
            setMessages(prev => {
              // Check if message already exists to avoid duplicates
              const exists = prev.some(msg => msg.id === newMessage.id);
              if (exists) return prev;
              return [...prev, newMessage];
            });
            
            // Mark as read immediately since user is viewing the conversation
            markMessageAsRead(newMessage.id);
          }
          
          // Update conversations list
          updateConversationWithNewMessage(newMessage);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=eq.${user.id}`
        },
        (payload) => {
          // Handle message read receipts
          const updatedMessage = payload.new as Message;
          console.log('✅ Message read receipt:', updatedMessage);
          
          if (selectedConversation === updatedMessage.receiver_id) {
            setMessages(prev => 
              prev.map(msg => 
                msg.id === updatedMessage.id ? updatedMessage : msg
              )
            );
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Real-time subscription status:', status);
        setRealtimeConnected(status === 'SUBSCRIBED');
      });

    // Subscribe to messages sent by the current user (for real-time updates)
    conversationSubscriptionRef.current = supabase
      .channel('sent_messages_channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=eq.${user.id}`
        },
        (payload) => {
          const newMessage = payload.new as Message;
          console.log('📤 Message sent confirmation:', newMessage);
          
          // Update the message in the current conversation if it's selected
          if (selectedConversation === newMessage.receiver_id) {
            setMessages(prev => {
              // Check if message already exists to avoid duplicates
              const exists = prev.some(msg => msg.id === newMessage.id);
              if (exists) return prev;
              return [...prev, newMessage];
            });
          }
          
          // Update conversations list with the new message
          updateConversationWithSentMessage(newMessage);
        }
      )
      .subscribe((status) => {
        console.log('📡 Sent messages subscription status:', status);
      });
  };

  const updateConversationWithNewMessage = (message: Message) => {
    setConversations(prev => 
      prev.map(conv => {
        if (conv.id === message.sender_id) {
          return {
            ...conv,
            lastMessage: message.content,
            lastMessageTime: message.created_at,
            unreadCount: selectedConversation === message.sender_id ? 0 : conv.unreadCount + 1
          };
        }
        return conv;
      })
    );
  };

  const updateConversationWithSentMessage = (message: Message) => {
    setConversations(prev => {
      // Check if conversation exists
      const conversationExists = prev.some(conv => conv.id === message.receiver_id);
      
      if (conversationExists) {
        // Update existing conversation
        return prev.map(conv => 
          conv.id === message.receiver_id 
            ? { 
                ...conv, 
                lastMessage: message.content, 
                lastMessageTime: message.created_at 
              }
            : conv
        );
      } else {
        // If the conversation doesn't exist yet (first message), we might need to add it
        // This would require fetching the receiver's profile first
        return prev;
      }
    });
  };

  const fetchConversations = async () => {
    try {
      setLoading(true);
      
      // Use the optimized RPC function to get conversation list
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
        isOnline: Math.random() > 0.5 // Mock online status
      })) || [];
      
      setConversations(conversationsData);
      
      // Create profiles map for compatibility
      const profilesMap: { [key: string]: Profile } = {};
      conversationData?.forEach(conv => {
        profilesMap[conv.other_user_id] = {
          id: conv.other_user_id,
          name: conv.other_user_name,
          full_name: conv.other_user_name,
          images: conv.other_user_images || []
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
      // Fetch messages between current user and other user
      const { data: sentMessages, error: sentError } = await supabase
        .from('messages')
        .select('*')
        .eq('sender_id', user?.id)
        .eq('receiver_id', otherUserId)
        .order('created_at', { ascending: true });

      if (sentError) throw sentError;

      const { data: receivedMessages, error: receivedError } = await supabase
        .from('messages')
        .select('*')
        .eq('sender_id', otherUserId)
        .eq('receiver_id', user?.id)
        .order('created_at', { ascending: true });

      if (receivedError) throw receivedError;

      // Combine and sort messages
      const allMessages = [...(sentMessages || []), ...(receivedMessages || [])]
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

      setMessages(allMessages);

      // Mark messages as read
      await supabase.rpc('mark_messages_read', {
        current_user_id: user?.id,
        other_user_id: otherUserId
      });
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const markConversationAsRead = async (otherUserId: string) => {
    try {
      await supabase.rpc('mark_messages_read', {
        current_user_id: user?.id,
        other_user_id: otherUserId
      });

      // Update conversation unread count
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
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('id', messageId);
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user || sending) return;

    // Move messageContent declaration outside try block to fix scope issue
    const messageContent = newMessage.trim();
    
    try {
      setSending(true);
      
      setNewMessage(''); // Clear input immediately for better UX

      // Create optimistic message for immediate UI update
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        sender_id: user.id,
        receiver_id: selectedConversation,
        content: messageContent,
        read: false,
        created_at: new Date().toISOString()
      };

      // Add optimistic message to UI immediately
      setMessages(prev => [...prev, optimisticMessage]);

      // Send message to database
      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: selectedConversation,
          content: messageContent
        })
        .select()
        .single();

      if (error) throw error;

      // Replace optimistic message with real message
      if (data) {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === optimisticMessage.id ? data : msg
          )
        );
      }

      // Update conversations list
      setConversations(prev => 
        prev.map(conv => 
          conv.id === selectedConversation 
            ? { 
                ...conv, 
                lastMessage: messageContent, 
                lastMessageTime: new Date().toISOString() 
              }
            : conv
        )
      );

      // Focus back on input after sending
      setTimeout(() => {
        messageInputRef.current?.focus();
      }, 100);

    } catch (error) {
      console.error('Error sending message:', error);
      
      // Remove optimistic message on error
      setMessages(prev => 
        prev.filter(msg => msg.id !== `temp-${Date.now()}`)
      );
      
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

  const formatTime = (timestamp: string) => {
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
  };

  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchTerm.toLowerCase())
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
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center">
                            <span className="text-rose-600 font-semibold text-lg">
                              {conversation.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        {conversation.isOnline && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                        )}
                        {conversation.unreadCount > 0 && (
                          <div className="absolute -top-1 -right-1 bg-rose-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                            {conversation.unreadCount}
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
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                        {conversations.find(c => c.id === selectedConversation)?.isOnline ? 'Online' : 'Last seen recently'}
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
                  {messages.length === 0 ? (
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
  );
}