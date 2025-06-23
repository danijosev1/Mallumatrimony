import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Mail } from 'lucide-react';

interface Message {
  id: number;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

interface QuickReply {
  text: string;
  response: string;
}

const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hello! I'm your AI assistant for Mallu Matrimony. I can help you with basic questions about our services, registration, profiles, and more. How can I assist you today?",
      isBot: true,
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickReplies: QuickReply[] = [
    {
      text: "How do I create a profile?",
      response: "Creating a profile is easy! Click on 'Register' in the top menu, fill in your basic details like name, email, and password. After registration, you'll be guided to complete your detailed profile with information about yourself, preferences, and what you're looking for in a partner."
    },
    {
      text: "Is the service free?",
      response: "Yes, basic registration and browsing profiles is free! We also offer premium memberships with additional features like unlimited messaging, advanced search filters, and priority profile visibility. You can upgrade anytime from your account settings."
    },
    {
      text: "How do I search for matches?",
      response: "Use our 'Search' feature to find compatible matches. You can filter by age, location, religion, education, profession, and more. Our smart matching algorithm also suggests compatible profiles based on your preferences."
    },
    {
      text: "Is my information secure?",
      response: "Absolutely! We take privacy and security very seriously. All profiles are verified, your personal information is encrypted, and you have full control over who can view your details. We never share your information with third parties."
    },
    {
      text: "How do I contact matches?",
      response: "You can express interest in profiles you like, send messages to mutual matches, and use our secure messaging system. Premium members get unlimited messaging and can see who viewed their profile."
    }
  ];

  const botResponses = {
    greeting: [
      "Hello! How can I help you today?",
      "Hi there! What would you like to know about Mallu Matrimony?",
      "Welcome! I'm here to assist you with any questions."
    ],
    registration: "To register, click the 'Register' button and fill in your details. After email verification, you can complete your profile with photos and preferences.",
    pricing: "Basic membership is free and includes profile creation and browsing. Premium membership offers unlimited messaging, advanced search, and priority visibility.",
    safety: "We verify all profiles, use secure encryption, and give you full control over your privacy settings. Your safety is our top priority.",
    matching: "Our algorithm matches you based on compatibility factors like age, location, education, interests, and family values you specify in your preferences.",
    contact: "For complex queries, please email us at contact@mallumatrimony.com and we'll get back to you within 24 hours.",
    default: "I understand you have a specific question. For detailed assistance, please email us at contact@mallumatrimony.com with your query, and our team will provide comprehensive help within 24 hours."
  };

  useEffect(() => {
    const handleOpenChatbot = () => {
      setIsOpen(true);
    };

    window.addEventListener('openChatbot', handleOpenChatbot);
    return () => window.removeEventListener('openChatbot', handleOpenChatbot);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getBotResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();
    
    // Check for quick replies first
    const quickReply = quickReplies.find(reply => 
      message.includes(reply.text.toLowerCase().slice(0, -1)) // Remove question mark for matching
    );
    
    if (quickReply) {
      return quickReply.response;
    }

    // Pattern matching for common queries
    if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
      return botResponses.greeting[Math.floor(Math.random() * botResponses.greeting.length)];
    }
    
    if (message.includes('register') || message.includes('sign up') || message.includes('create account')) {
      return botResponses.registration;
    }
    
    if (message.includes('price') || message.includes('cost') || message.includes('free') || message.includes('premium')) {
      return botResponses.pricing;
    }
    
    if (message.includes('safe') || message.includes('secure') || message.includes('privacy') || message.includes('verify')) {
      return botResponses.safety;
    }
    
    if (message.includes('match') || message.includes('algorithm') || message.includes('compatible')) {
      return botResponses.matching;
    }
    
    if (message.includes('contact') || message.includes('support') || message.includes('help') || message.includes('email')) {
      return botResponses.contact;
    }

    // For complex or unrecognized queries
    return botResponses.default;
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: messages.length + 1,
      text: inputText,
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Simulate typing delay
    setTimeout(() => {
      const botResponse: Message = {
        id: messages.length + 2,
        text: getBotResponse(inputText),
        isBot: true,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000); // Random delay between 1-2 seconds
  };

  const handleQuickReply = (reply: QuickReply) => {
    const userMessage: Message = {
      id: messages.length + 1,
      text: reply.text,
      isBot: false,
      timestamp: new Date()
    };

    const botMessage: Message = {
      id: messages.length + 2,
      text: reply.response,
      isBot: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage, botMessage]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-primary text-white p-4 rounded-full shadow-lg hover:bg-primary-light transition-all duration-300 z-50 hover:scale-110"
        aria-label="Open chat"
      >
        <MessageCircle size={24} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-white rounded-lg shadow-2xl z-50 flex flex-col border border-gray-200">
      {/* Header */}
      <div className="bg-primary text-white p-4 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center">
          <Bot size={20} className="mr-2" />
          <div>
            <h3 className="font-semibold">AI Assistant</h3>
            <p className="text-xs text-white/80">Usually replies instantly</p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-white/80 hover:text-white transition-colors duration-200"
        >
          <X size={20} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
          >
            <div className={`flex items-start space-x-2 max-w-[80%] ${message.isBot ? '' : 'flex-row-reverse space-x-reverse'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${message.isBot ? 'bg-primary/10' : 'bg-secondary/10'}`}>
                {message.isBot ? (
                  <Bot size={16} className="text-primary" />
                ) : (
                  <User size={16} className="text-secondary" />
                )}
              </div>
              <div
                className={`p-3 rounded-lg ${
                  message.isBot
                    ? 'bg-gray-100 text-gray-800'
                    : 'bg-primary text-white'
                }`}
              >
                <p className="text-sm">{message.text}</p>
                <p className={`text-xs mt-1 ${message.isBot ? 'text-gray-500' : 'text-white/70'}`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-2 max-w-[80%]">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-primary/10">
                <Bot size={16} className="text-primary" />
              </div>
              <div className="bg-gray-100 p-3 rounded-lg">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Replies */}
      {messages.length <= 1 && (
        <div className="p-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-2">Quick questions:</p>
          <div className="space-y-1">
            {quickReplies.slice(0, 3).map((reply, index) => (
              <button
                key={index}
                onClick={() => handleQuickReply(reply)}
                className="w-full text-left text-xs p-2 bg-gray-50 hover:bg-gray-100 rounded transition-colors duration-200"
              >
                {reply.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputText.trim()}
            className="bg-primary text-white p-2 rounded-md hover:bg-primary-light transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={16} />
          </button>
        </div>
        <div className="flex items-center justify-center mt-2">
          <a
            href="mailto:contact@mallumatrimony.com"
            className="text-xs text-primary hover:underline flex items-center"
          >
            <Mail size={12} className="mr-1" />
            Need detailed help? Email us
          </a>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;