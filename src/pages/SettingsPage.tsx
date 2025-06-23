import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Lock, 
  Bell, 
  Shield, 
  Eye, 
  Heart, 
  Trash2, 
  Save,
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  Settings as SettingsIcon,
  Crown,
  Phone,
  Globe,
  MessageCircle
} from 'lucide-react';

interface UserSettings {
  email_notifications: boolean;
  profile_visibility: 'public' | 'members_only' | 'premium_only';
  show_online_status: boolean;
  allow_messages: 'everyone' | 'matches_only' | 'premium_only';
  show_profile_views: boolean;
  auto_renewal: boolean;
}

const SettingsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState('account');
  const [profile, setProfile] = useState<any>(null);
  const [settings, setSettings] = useState<UserSettings>({
    email_notifications: true,
    profile_visibility: 'public',
    show_online_status: true,
    allow_messages: 'everyone',
    show_profile_views: true,
    auto_renewal: false
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadUserData();
  }, [user, navigate]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      
      // Load user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      setProfile(profileData);

      // Load user settings (mock for now - in real app would come from database)
      setSettings({
        email_notifications: true,
        profile_visibility: 'public',
        show_online_status: true,
        allow_messages: 'everyone',
        show_profile_views: true,
        auto_renewal: false
      });

    } catch (error) {
      console.error('❌ Error loading user data:', error);
      setMessage({ type: 'error', text: 'Failed to load user data' });
    } finally {
      setLoading(false);
    }
  };

  const handleSettingsChange = (key: keyof UserSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      
      // In a real app, you would save settings to database
      // For now, we'll just simulate the save
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMessage({ type: 'success', text: 'Settings saved successfully!' });
      
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('❌ Error saving settings:', error);
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }

    try {
      setSaving(true);
      
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) throw error;

      setMessage({ type: 'success', text: 'Password updated successfully!' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error('❌ Error changing password:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to change password' });
    } finally {
      setSaving(false);
    }
  };

  const deleteAccount = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your data.'
    );

    if (!confirmed) return;

    const doubleConfirm = window.prompt(
      'Type "DELETE" to confirm account deletion:'
    );

    if (doubleConfirm !== 'DELETE') {
      setMessage({ type: 'error', text: 'Account deletion cancelled' });
      return;
    }

    try {
      setSaving(true);
      
      // In a real app, you would call a server function to delete the account
      // For now, we'll just log out the user
      setMessage({ type: 'success', text: 'Account deletion initiated. You will be logged out.' });
      
      setTimeout(async () => {
        await logout();
      }, 2000);
      
    } catch (error) {
      console.error('❌ Error deleting account:', error);
      setMessage({ type: 'error', text: 'Failed to delete account' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="pt-20 min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-text/70">Loading settings...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'account', label: 'Account', icon: <User size={20} /> },
    { id: 'privacy', label: 'Privacy', icon: <Shield size={20} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={20} /> },
    { id: 'security', label: 'Security', icon: <Lock size={20} /> }
  ];

  return (
    <div className="pt-20 bg-background min-h-screen">
      <div className="container-custom py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/')}
              className="flex items-center text-primary hover:text-primary-light transition-colors duration-300 mr-4"
            >
              <ArrowLeft size={20} className="mr-2" />
              Back to Home
            </button>
            <div>
              <h1 className="text-3xl font-bold text-primary flex items-center">
                <SettingsIcon size={32} className="mr-3" />
                Account Settings
              </h1>
              <p className="text-text/70 mt-1">Manage your account preferences and privacy settings</p>
            </div>
          </div>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-700' 
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle size={20} className="mr-2 flex-shrink-0" />
            ) : (
              <AlertTriangle size={20} className="mr-2 flex-shrink-0" />
            )}
            <p>{message.text}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-medium text-primary">Settings</h3>
              </div>
              <nav className="p-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-4 py-3 text-left rounded-md transition-colors duration-300 ${
                      activeTab === tab.id
                        ? 'bg-primary/10 text-primary'
                        : 'text-text/70 hover:bg-gray-50 hover:text-primary'
                    }`}
                  >
                    {tab.icon}
                    <span className="ml-3">{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden mt-6">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-medium text-primary">Quick Actions</h3>
              </div>
              <div className="p-4 space-y-3">
                <button
                  onClick={() => navigate('/profile')}
                  className="w-full flex items-center px-3 py-2 text-left text-text/70 hover:bg-gray-50 hover:text-primary rounded-md transition-colors duration-300"
                >
                  <Eye size={16} className="mr-3" />
                  View My Profile
                </button>
                <button
                  onClick={() => navigate('/complete-profile')}
                  className="w-full flex items-center px-3 py-2 text-left text-text/70 hover:bg-gray-50 hover:text-primary rounded-md transition-colors duration-300"
                >
                  <User size={16} className="mr-3" />
                  Edit Profile
                </button>
                <button
                  onClick={() => navigate('/select-plan')}
                  className="w-full flex items-center px-3 py-2 text-left text-text/70 hover:bg-gray-50 hover:text-primary rounded-md transition-colors duration-300"
                >
                  <Crown size={16} className="mr-3" />
                  Upgrade Plan
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Account Tab */}
              {activeTab === 'account' && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-primary mb-6">Account Information</h2>
                  
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-text mb-2">Email Address</label>
                        <div className="flex items-center">
                          <Mail size={18} className="text-gray-400 mr-2" />
                          <input
                            type="email"
                            value={user?.email || ''}
                            disabled
                            className="flex-1 p-3 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                          />
                        </div>
                        <p className="text-xs text-text/60 mt-1">Email cannot be changed</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-text mb-2">Full Name</label>
                        <div className="flex items-center">
                          <User size={18} className="text-gray-400 mr-2" />
                          <input
                            type="text"
                            value={profile?.full_name || ''}
                            onChange={(e) => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
                            className="flex-1 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text mb-2">Phone Number</label>
                      <div className="flex items-center">
                        <Phone size={18} className="text-gray-400 mr-2" />
                        <input
                          type="tel"
                          value={profile?.phone || ''}
                          onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="Enter your phone number"
                          className="flex-1 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text mb-2">Membership Plan</label>
                      <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-primary capitalize flex items-center">
                              <Crown size={16} className="mr-2" />
                              {profile?.membership_plan || 'Free'} Plan
                            </p>
                            <p className="text-sm text-text/70">
                              {profile?.membership_plan === 'free' 
                                ? 'Limited features available' 
                                : 'Premium features unlocked'}
                            </p>
                          </div>
                          <button
                            onClick={() => navigate('/select-plan')}
                            className="btn-primary"
                          >
                            {profile?.membership_plan === 'free' ? 'Upgrade' : 'Change Plan'}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={saveSettings}
                        disabled={saving}
                        className="btn-primary flex items-center"
                      >
                        <Save size={18} className="mr-2" />
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Privacy Tab */}
              {activeTab === 'privacy' && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-primary mb-6">Privacy Settings</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-text mb-2">Profile Visibility</label>
                      <select
                        value={settings.profile_visibility}
                        onChange={(e) => handleSettingsChange('profile_visibility', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      >
                        <option value="public">Public - Visible to everyone</option>
                        <option value="members_only">Members Only - Visible to registered users</option>
                        <option value="premium_only">Premium Only - Visible to premium members</option>
                      </select>
                      <p className="text-xs text-text/60 mt-1">Control who can see your profile</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text mb-2">Who can message you?</label>
                      <select
                        value={settings.allow_messages}
                        onChange={(e) => handleSettingsChange('allow_messages', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      >
                        <option value="everyone">Everyone</option>
                        <option value="matches_only">Matches Only</option>
                        <option value="premium_only">Premium Members Only</option>
                      </select>
                      <p className="text-xs text-text/60 mt-1">Manage who can send you messages</p>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <Globe size={20} className="text-primary mr-3" />
                          <div>
                            <p className="font-medium">Show Online Status</p>
                            <p className="text-sm text-text/70">Let others see when you're online</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.show_online_status}
                            onChange={(e) => handleSettingsChange('show_online_status', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <Eye size={20} className="text-primary mr-3" />
                          <div>
                            <p className="font-medium">Show Profile Views</p>
                            <p className="text-sm text-text/70">Display who viewed your profile</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.show_profile_views}
                            onChange={(e) => handleSettingsChange('show_profile_views', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={saveSettings}
                        disabled={saving}
                        className="btn-primary flex items-center"
                      >
                        <Save size={18} className="mr-2" />
                        {saving ? 'Saving...' : 'Save Privacy Settings'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-primary mb-6">Notification Preferences</h2>
                  
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <Mail size={20} className="text-primary mr-3" />
                        <div>
                          <p className="font-medium">Email Notifications</p>
                          <p className="text-sm text-text/70">Receive updates via email</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.email_notifications}
                          onChange={(e) => handleSettingsChange('email_notifications', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium mb-3 flex items-center">
                        <Bell size={18} className="text-primary mr-2" />
                        Email Notification Types
                      </h4>
                      <div className="space-y-3">
                        {[
                          { id: 'new_matches', label: 'New matches', icon: <Heart size={16} /> },
                          { id: 'profile_views', label: 'Profile views', icon: <Eye size={16} /> },
                          { id: 'messages', label: 'Messages received', icon: <MessageCircle size={16} /> },
                          { id: 'interests', label: 'Interest expressions', icon: <Heart size={16} /> },
                          { id: 'weekly_digest', label: 'Weekly digest', icon: <Mail size={16} /> },
                          { id: 'promotions', label: 'Promotional offers', icon: <Crown size={16} /> }
                        ].map((type) => (
                          <div key={type.id} className="flex items-center p-2 hover:bg-white rounded-md transition-colors duration-200">
                            <input
                              type="checkbox"
                              id={type.id}
                              defaultChecked={true}
                              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                            />
                            <div className="ml-3 flex items-center">
                              <span className="text-primary mr-2">{type.icon}</span>
                              <label htmlFor={type.id} className="text-sm text-text cursor-pointer">
                                {type.label}
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={saveSettings}
                        disabled={saving}
                        className="btn-primary flex items-center"
                      >
                        <Save size={18} className="mr-2" />
                        {saving ? 'Saving...' : 'Save Notification Settings'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-primary mb-6">Security Settings</h2>
                  
                  <div className="space-y-8">
                    {/* Change Password */}
                    <div>
                      <h3 className="text-lg font-medium text-primary mb-4 flex items-center">
                        <Lock size={20} className="mr-2" />
                        Change Password
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-text mb-2">Current Password</label>
                          <input
                            type="password"
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="Enter current password"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-text mb-2">New Password</label>
                          <input
                            type="password"
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="Enter new password"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-text mb-2">Confirm New Password</label>
                          <input
                            type="password"
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="Confirm new password"
                          />
                        </div>
                        <button
                          onClick={changePassword}
                          disabled={saving || !passwordData.newPassword || !passwordData.confirmPassword}
                          className="btn-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Lock size={18} className="mr-2" />
                          {saving ? 'Updating...' : 'Update Password'}
                        </button>
                      </div>
                    </div>

                    {/* Auto Renewal */}
                    <div className="border-t border-gray-200 pt-6">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <Crown size={20} className="text-primary mr-3" />
                          <div>
                            <p className="font-medium">Auto-renewal</p>
                            <p className="text-sm text-text/70">Automatically renew your subscription</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.auto_renewal}
                            onChange={(e) => handleSettingsChange('auto_renewal', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                      </div>
                    </div>

                    {/* Delete Account */}
                    <div className="border-t border-gray-200 pt-6">
                      <h3 className="text-lg font-medium text-red-600 mb-4 flex items-center">
                        <AlertTriangle size={20} className="mr-2" />
                        Danger Zone
                      </h3>
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-start">
                          <AlertTriangle className="text-red-500 mt-1 mr-3 flex-shrink-0" size={20} />
                          <div className="flex-1">
                            <h4 className="font-medium text-red-800 mb-2">Delete Account</h4>
                            <p className="text-sm text-red-700 mb-4">
                              Once you delete your account, there is no going back. This will permanently delete your profile, 
                              messages, matches, and all associated data.
                            </p>
                            <button
                              onClick={deleteAccount}
                              disabled={saving}
                              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors duration-300 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Trash2 size={16} className="mr-2" />
                              {saving ? 'Deleting...' : 'Delete Account'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;