import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, AlertCircle, CheckCircle2, ArrowRight, Info } from 'lucide-react';
import { supabase } from '../lib/supabase';

type RegisterFormData = {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
};

const CreateProfilePage: React.FC = () => {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterFormData>();
  const navigate = useNavigate();
  const [registerError, setRegisterError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setIsLoading(true);
      setRegisterError('');

      console.log('🔐 Starting registration for:', data.email);

      // Create the auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName
          }
        }
      });

      if (authError) {
        console.error('❌ Registration error:', authError);
        throw authError;
      }

      if (authData.user) {
        console.log('✅ Registration successful for:', authData.user.email);
        setRegistrationSuccess(true);
        
        // The auth context will handle the redirect to home page
        // where the user will see their dashboard with profile completion prompts
      }
    } catch (error: any) {
      console.error('❌ Registration error:', error);
      if (error.message?.includes('User already registered') || error.message?.includes('already exists')) {
        setRegisterError('An account with this email already exists. Please try logging in instead.');
      } else if (error.message?.includes('confirmation email') || error.message?.includes('email service')) {
        setRegisterError('Email service temporarily unavailable. Your account has been created successfully.');
        setRegistrationSuccess(true);
      } else {
        setRegisterError(error.message || 'An error occurred during registration');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (registrationSuccess) {
    return (
      <div className="min-h-screen pt-20 pb-12 flex flex-col bg-background">
        <div className="container-custom flex-grow flex items-center justify-center">
          <div className="w-full max-w-md">
            <div className="bg-white shadow-md rounded-lg p-8 text-center">
              <CheckCircle2 size={48} className="text-green-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-primary mb-4">Welcome to Mallu Matrimony! 🎉</h1>
              <p className="text-text mb-6">
                Your account has been created successfully! You'll be redirected to your dashboard where you can complete your profile and start finding matches.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
                <div className="flex items-start">
                  <Info size={20} className="text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-700">
                    <p className="font-medium mb-1">What's Next:</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Complete your detailed profile</li>
                      <li>Add photos and preferences</li>
                      <li>Start browsing and connecting with matches!</li>
                    </ol>
                  </div>
                </div>
              </div>
              <div className="text-sm text-text/60">
                Redirecting you to your dashboard...
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-12 flex flex-col bg-background">
      <div className="container-custom flex-grow flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="bg-white shadow-md rounded-lg p-8">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-primary mb-2">Create Your Account</h1>
              <p className="text-text/70">Join thousands of Malayalis finding their perfect match</p>
            </div>
            
            {registerError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-start">
                  <AlertCircle size={20} className="text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-700 font-medium">{registerError}</p>
                    {registerError.includes('already exists') && (
                      <div className="mt-2 text-sm text-red-600">
                        <p className="mb-1">If you already have an account:</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>Try logging in instead</li>
                          <li>Use the "Forgot Password" link if needed</li>
                          <li>Contact support if you need help</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="mb-6 p-4 bg-primary/5 border border-primary/20 rounded-md">
              <div className="flex items-start">
                <CheckCircle2 size={20} className="text-primary mr-2 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-primary">
                  <p className="font-medium mb-1">What happens after registration?</p>
                  <p>You'll be taken to your personal dashboard where you can complete your profile, add photos, set preferences, and start connecting with potential matches!</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-text mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User size={20} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="fullName"
                    {...register('fullName', { 
                      required: 'Full name is required',
                      minLength: {
                        value: 2,
                        message: 'Name must be at least 2 characters'
                      }
                    })}
                    className={`block w-full pl-10 pr-3 py-2 border ${
                      errors.fullName ? 'border-red-300' : 'border-gray-300'
                    } rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent`}
                    placeholder="John Doe"
                    disabled={isLoading}
                  />
                </div>
                {errors.fullName && (
                  <p className="mt-1 text-sm text-red-600">{errors.fullName.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-text mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail size={20} className="text-gray-400" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    {...register('email', { 
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address'
                      }
                    })}
                    className={`block w-full pl-10 pr-3 py-2 border ${
                      errors.email ? 'border-red-300' : 'border-gray-300'
                    } rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent`}
                    placeholder="you@example.com"
                    disabled={isLoading}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-text mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock size={20} className="text-gray-400" />
                  </div>
                  <input
                    type="password"
                    id="password"
                    {...register('password', { 
                      required: 'Password is required',
                      minLength: {
                        value: 6,
                        message: 'Password must be at least 6 characters'
                      }
                    })}
                    className={`block w-full pl-10 pr-3 py-2 border ${
                      errors.password ? 'border-red-300' : 'border-gray-300'
                    } rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent`}
                    placeholder="••••••••"
                    disabled={isLoading}
                  />
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-text mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock size={20} className="text-gray-400" />
                  </div>
                  <input
                    type="password"
                    id="confirmPassword"
                    {...register('confirmPassword', { 
                      required: 'Please confirm your password',
                      validate: value => value === watch('password') || 'Passwords do not match'
                    })}
                    className={`block w-full pl-10 pr-3 py-2 border ${
                      errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                    } rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent`}
                    placeholder="••••••••"
                    disabled={isLoading}
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                )}
              </div>

              <button
                type="submit"
                className="w-full btn-primary flex items-center justify-center"
                disabled={isLoading}
              >
                {isLoading ? 'Creating Account...' : 'Create Account & Continue'}
                {!isLoading && <ArrowRight size={18} className="ml-2" />}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-text">
                Already have an account?{' '}
                <button 
                  onClick={() => navigate('/login')}
                  className="font-medium text-primary hover:text-primary-light"
                >
                  Sign in here
                </button>
              </p>
            </div>

            <div className="mt-6 text-xs text-text/60 text-center">
              By creating an account, you agree to our Terms of Service and Privacy Policy
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateProfilePage;