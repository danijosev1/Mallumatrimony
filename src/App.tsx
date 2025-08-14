import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import SearchPage from './pages/SearchPage';
import CreateProfilePage from './pages/CreateProfilePage';
import CompleteProfilePage from './pages/CompleteProfilePage';
import SelectPlanPage from './pages/SelectPlanPage';
import SettingsPage from './pages/SettingsPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import SuccessStoriesPage from './pages/SuccessStoriesPage';
import SwipePage from './pages/SwipePage';
import MessagesPage from './pages/MessagesPage';
import FavoritesPage from './pages/FavoritesPage';
import ThankYouPage from './pages/ThankYouPage';
import ChatBot from './components/ui/ChatBot';
import { AuthProvider } from './context/AuthContext';
import { MembershipProvider } from './context/MembershipContext';
import { NotificationProvider } from './context/NotificationContext';

// Component to handle scroll restoration and prevent unnecessary redirects
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll to top when route changes, but don't interfere with auth
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

// Main app component with routing logic
const AppContent: React.FC = () => {
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    // Mark initial load as complete after a short delay
    const timer = setTimeout(() => {
      setIsInitialLoad(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Add visibility change handler to prevent issues when switching tabs
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Tab became visible - don't trigger any auth redirects
        console.log('🔍 Tab became visible, maintaining current route');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <ScrollToTop />
      <Header />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/profile/:id" element={<ProfilePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/swipe" element={<SwipePage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/register" element={<CreateProfilePage />} />
          <Route path="/create-profile" element={<CreateProfilePage />} />
          <Route path="/complete-profile" element={<CompleteProfilePage />} />
          <Route path="/select-plan" element={<SelectPlanPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsOfServicePage />} />
          <Route path="/success-stories" element={<SuccessStoriesPage />} />
          <Route path="/dashboard" element={<HomePage />} />
          <Route path="/thank-you" element={<ThankYouPage />} />
        </Routes>
      </main>
      <Footer />
      <ChatBot />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <MembershipProvider>
        <NotificationProvider>
          <Router>
            <AppContent />
          </Router>
        </NotificationProvider>
      </MembershipProvider>
    </AuthProvider>
  );
}

export default App;