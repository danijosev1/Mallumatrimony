import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  User, 
  Calendar, 
  MapPin, 
  GraduationCap, 
  Briefcase, 
  Heart, 
  Camera, 
  Save, 
  ArrowRight,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import PhotoUpload from '../components/ui/PhotoUpload';

interface ProfileFormData {
  // Basic Information
  fullName: string;
  age: number;
  gender: string;
  religion: string;
  caste: string;
  height: string;
  maritalStatus: string;
  
  // Professional Information
  education: string;
  profession: string;
  income: string;
  location: string;
  
  // Personal Information
  about: string;
  shortBio: string;
  motherTongue: string;
  
  // Family Information
  fatherOccupation: string;
  motherOccupation: string;
  siblings: string;
  familyType: string;
  familyStatus: string;
  familyLocation: string;
  
  // Partner Preferences
  partnerAgeMin: number;
  partnerAgeMax: number;
  partnerReligion: string;
  partnerEducation: string;
  partnerProfession: string;
  partnerLocation: string;
  
  // Lifestyle
  eatingHabits: string;
  drinkingHabits: string;
  smokingHabits: string;
  
  // Additional
  hobbies: string;
  interests: string;
  lifeGoals: string;
  idealPartner: string;
}

const CompleteProfilePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [photos, setPhotos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [existingProfile, setExistingProfile] = useState<any>(null);
  
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<ProfileFormData>();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadExistingProfile();
  }, [user, navigate]);

  const loadExistingProfile = async () => {
    if (!user) return;

    try {
      // Load basic profile
      const { data: basicProfile, error: basicError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (basicError) {
        console.error('Error loading basic profile:', basicError);
        return;
      }

      // Load extended profile
      const { data: extendedProfile, error: extendedError } = await supabase
        .from('extended_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (extendedError) {
        console.error('Error loading extended profile:', extendedError);
      }

      if (basicProfile) {
        setExistingProfile({ ...basicProfile, ...extendedProfile });
        
        // Pre-fill form with existing data
        if (basicProfile.full_name) setValue('fullName', basicProfile.full_name);
        if (basicProfile.age) setValue('age', basicProfile.age);
        if (basicProfile.gender) setValue('gender', basicProfile.gender);
        if (basicProfile.religion) setValue('religion', basicProfile.religion);
        if (basicProfile.caste) setValue('caste', basicProfile.caste);
        if (basicProfile.height) setValue('height', basicProfile.height);
        if (basicProfile.marital_status) setValue('maritalStatus', basicProfile.marital_status);
        if (basicProfile.education) setValue('education', basicProfile.education);
        if (basicProfile.profession) setValue('profession', basicProfile.profession);
        if (basicProfile.income) setValue('income', basicProfile.income);
        if (basicProfile.location) setValue('location', basicProfile.location);
        if (basicProfile.about) setValue('about', basicProfile.about);
        if (basicProfile.short_bio) setValue('shortBio', basicProfile.short_bio);
        if (basicProfile.images) setPhotos(basicProfile.images);

        // Pre-fill extended profile data if available
        if (extendedProfile) {
          if (extendedProfile.mother_tongue) setValue('motherTongue', extendedProfile.mother_tongue);
          if (extendedProfile.father_occupation) setValue('fatherOccupation', extendedProfile.father_occupation);
          if (extendedProfile.mother_occupation) setValue('motherOccupation', extendedProfile.mother_occupation);
          if (extendedProfile.siblings) setValue('siblings', extendedProfile.siblings);
          if (extendedProfile.family_type) setValue('familyType', extendedProfile.family_type);
          if (extendedProfile.family_status) setValue('familyStatus', extendedProfile.family_status);
          if (extendedProfile.family_location) setValue('familyLocation', extendedProfile.family_location);
          if (extendedProfile.partner_age_min) setValue('partnerAgeMin', parseInt(extendedProfile.partner_age_min));
          if (extendedProfile.partner_age_max) setValue('partnerAgeMax', parseInt(extendedProfile.partner_age_max));
          if (extendedProfile.partner_religion) setValue('partnerReligion', extendedProfile.partner_religion);
          if (extendedProfile.partner_education) setValue('partnerEducation', extendedProfile.partner_education);
          if (extendedProfile.partner_profession) setValue('partnerProfession', extendedProfile.partner_profession);
          if (extendedProfile.partner_location) setValue('partnerLocation', extendedProfile.partner_location);
          if (extendedProfile.eating_habits) setValue('eatingHabits', extendedProfile.eating_habits);
          if (extendedProfile.drinking_habits) setValue('drinkingHabits', extendedProfile.drinking_habits);
          if (extendedProfile.smoking_habits) setValue('smokingHabits', extendedProfile.smoking_habits);
          if (extendedProfile.hobbies) setValue('hobbies', extendedProfile.hobbies);
          if (extendedProfile.interests) setValue('interests', extendedProfile.interests);
          if (extendedProfile.life_goals) setValue('lifeGoals', extendedProfile.life_goals);
          if (extendedProfile.ideal_partner) setValue('idealPartner', extendedProfile.ideal_partner);
        }
      }
    } catch (error) {
      console.error('Error loading existing profile:', error);
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    if (!user) return;

    try {
      setIsSubmitting(true);
      setSubmitError(null);
      console.log('🔄 Starting profile update...');

      // Prepare basic profile data
      const basicProfileData = {
        id: user.id,
        email: user.email,
        full_name: data.fullName,
        name: data.fullName,
        age: data.age,
        gender: data.gender,
        religion: data.religion,
        caste: data.caste || null,
        height: data.height,
        marital_status: data.maritalStatus,
        education: data.education,
        profession: data.profession,
        income: data.income || null,
        location: data.location,
        about: data.about,
        short_bio: data.shortBio,
        images: photos,
        key_details: [
          data.religion,
          data.profession,
          data.location,
          data.education
        ].filter(Boolean),
        updated_at: new Date().toISOString()
      };

      // Update basic profile using INSERT ... ON CONFLICT since we know id is unique
      const { error: basicError } = await supabase
        .from('profiles')
        .upsert(basicProfileData, {
          onConflict: 'id'  // Use the primary key for conflict resolution
        });

      if (basicError) {
        console.error('❌ Basic profile update failed:', basicError);
        throw new Error(`Basic profile update failed: ${basicError.message}`);
      }

      console.log('✅ Basic profile updated successfully');

      // Prepare extended profile data
      const extendedProfileData = {
        id: user.id,
        mother_tongue: data.motherTongue || null,
        father_occupation: data.fatherOccupation || null,
        mother_occupation: data.motherOccupation || null,
        siblings: data.siblings || null,
        family_type: data.familyType || null,
        family_status: data.familyStatus || null,
        family_location: data.familyLocation || null,
        partner_age_min: data.partnerAgeMin || null,
        partner_age_max: data.partnerAgeMax || null,
        partner_religion: data.partnerReligion || null,
        partner_education: data.partnerEducation || null,
        partner_profession: data.partnerProfession || null,
        partner_location: data.partnerLocation || null,
        eating_habits: data.eatingHabits || null,
        drinking_habits: data.drinkingHabits || null,
        smoking_habits: data.smokingHabits || null,
        hobbies: data.hobbies || null,
        interests: data.interests || null,
        life_goals: data.lifeGoals || null,
        ideal_partner: data.idealPartner || null,
        updated_at: new Date().toISOString()
      };

      // Use INSERT ... ON CONFLICT with the primary key (id)
      const { error: extendedError } = await supabase
        .from('extended_profiles')
        .upsert(extendedProfileData, {
          onConflict: 'id'  // Use the primary key for conflict resolution
        });

      if (extendedError) {
        console.error('❌ Extended profile update failed:', extendedError);
        throw new Error(`Extended profile update failed: ${extendedError.message}`);
      }

      console.log('✅ Extended profile updated successfully');

      setSubmitSuccess(true);
      
      // Redirect to dashboard after successful completion
      setTimeout(() => {
        navigate('/');
      }, 2000);

    } catch (error: any) {
      console.error('❌ Profile completion error:', error);
      setSubmitError(error.message || 'Failed to complete profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, 4));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const fadeIn = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.5 } }
  };

  if (submitSuccess) {
    return (
      <div className="min-h-screen pt-20 pb-12 flex flex-col bg-background">
        <div className="container-custom flex-grow flex items-center justify-center">
          <div className="w-full max-w-md">
            <div className="bg-white shadow-md rounded-lg p-8 text-center">
              <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-primary mb-4">Profile Completed! 🎉</h1>
              <p className="text-text mb-6">
                Your profile has been successfully completed. You can now start discovering and connecting with potential matches!
              </p>
              <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
                <div className="flex items-start">
                  <Info size={20} className="text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-green-700">
                    <p className="font-medium mb-1">What's Next:</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Browse and discover potential matches</li>
                      <li>Send interests to profiles you like</li>
                      <li>Start conversations with mutual matches</li>
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
    <div className="min-h-screen pt-20 pb-12 bg-background">
      <div className="container-custom py-8">
        {/* Progress Indicator */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                  step <= currentStep 
                    ? 'bg-primary text-white' 
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {step}
                </div>
                {step < 4 && (
                  <div className={`w-16 h-1 mx-2 ${
                    step < currentStep ? 'bg-primary' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm text-text/70">
            <span>Basic Info</span>
            <span>Professional</span>
            <span>Family & Preferences</span>
            <span>Photos & Bio</span>
          </div>
        </div>

        {/* Error Display */}
        {submitError && (
          <div className="max-w-4xl mx-auto mb-6">
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex items-start">
                <AlertCircle size={20} className="text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-700 font-medium">{submitError}</p>
                  <div className="mt-2 text-sm text-red-600">
                    <p className="mb-1">If this error persists:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Try refreshing the page and submitting again</li>
                      <li>Check your internet connection</li>
                      <li>Contact support if the issue continues</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h1 className="text-2xl font-bold text-primary">Complete Your Profile</h1>
              <p className="text-text/70 mt-1">
                Step {currentStep} of 4: {
                  currentStep === 1 ? 'Basic Information' :
                  currentStep === 2 ? 'Professional Details' :
                  currentStep === 3 ? 'Family & Partner Preferences' :
                  'Photos & Personal Bio'
                }
              </p>
            </div>

            <div className="p-6">
              <motion.div
                key={currentStep}
                initial="hidden"
                animate="visible"
                variants={fadeIn}
              >
                {/* Step 1: Basic Information */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-primary mb-4 flex items-center">
                      <User size={24} className="mr-2" />
                      Basic Information
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-text mb-1">Full Name *</label>
                        <input
                          type="text"
                          {...register('fullName', { required: 'Full name is required' })}
                          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          placeholder="Enter your full name"
                        />
                        {errors.fullName && (
                          <p className="mt-1 text-sm text-red-600">{errors.fullName.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-text mb-1">Age *</label>
                        <input
                          type="number"
                          {...register('age', { 
                            required: 'Age is required',
                            min: { value: 18, message: 'Must be at least 18 years old' },
                            max: { value: 100, message: 'Must be less than 100 years old' }
                          })}
                          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          placeholder="Enter your age"
                        />
                        {errors.age && (
                          <p className="mt-1 text-sm text-red-600">{errors.age.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-text mb-1">Gender *</label>
                        <select
                          {...register('gender', { required: 'Gender is required' })}
                          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        >
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                        {errors.gender && (
                          <p className="mt-1 text-sm text-red-600">{errors.gender.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-text mb-1">Religion *</label>
                        <select
                          {...register('religion', { required: 'Religion is required' })}
                          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        >
                          <option value="">Select Religion</option>
                          <option value="Hindu">Hindu</option>
                          <option value="Muslim">Muslim</option>
                          <option value="Christian">Christian</option>
                          <option value="Sikh">Sikh</option>
                          <option value="Buddhist">Buddhist</option>
                          <option value="Jain">Jain</option>
                          <option value="Other">Other</option>
                        </select>
                        {errors.religion && (
                          <p className="mt-1 text-sm text-red-600">{errors.religion.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-text mb-1">Caste</label>
                        <input
                          type="text"
                          {...register('caste')}
                          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          placeholder="Enter your caste (optional)"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-text mb-1">Height *</label>
                        <select
                          {...register('height', { required: 'Height is required' })}
                          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        >
                          <option value="">Select Height</option>
                          <option value='4&apos;6"'>4'6"</option>
                          <option value='4&apos;7"'>4'7"</option>
                          <option value='4&apos;8"'>4'8"</option>
                          <option value='4&apos;9"'>4'9"</option>
                          <option value='4&apos;10"'>4'10"</option>
                          <option value='4&apos;11"'>4'11"</option>
                          <option value='5&apos;0"'>5'0"</option>
                          <option value='5&apos;1"'>5'1"</option>
                          <option value='5&apos;2"'>5'2"</option>
                          <option value='5&apos;3"'>5'3"</option>
                          <option value='5&apos;4"'>5'4"</option>
                          <option value='5&apos;5"'>5'5"</option>
                          <option value='5&apos;6"'>5'6"</option>
                          <option value='5&apos;7"'>5'7"</option>
                          <option value='5&apos;8"'>5'8"</option>
                          <option value='5&apos;9"'>5'9"</option>
                          <option value='5&apos;10"'>5'10"</option>
                          <option value='5&apos;11"'>5'11"</option>
                          <option value='6&apos;0"'>6'0"</option>
                          <option value='6&apos;1"'>6'1"</option>
                          <option value='6&apos;2"'>6'2"</option>
                          <option value='6&apos;3"'>6'3"</option>
                          <option value='6&apos;4"'>6'4"</option>
                          <option value='6&apos;5"'>6'5"</option>
                          <option value='6&apos;6"'>6'6"</option>
                        </select>
                        {errors.height && (
                          <p className="mt-1 text-sm text-red-600">{errors.height.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-text mb-1">Marital Status *</label>
                        <select
                          {...register('maritalStatus', { required: 'Marital status is required' })}
                          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        >
                          <option value="">Select Marital Status</option>
                          <option value="Never Married">Never Married</option>
                          <option value="Divorced">Divorced</option>
                          <option value="Widowed">Widowed</option>
                          <option value="Separated">Separated</option>
                        </select>
                        {errors.maritalStatus && (
                          <p className="mt-1 text-sm text-red-600">{errors.maritalStatus.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-text mb-1">Mother Tongue</label>
                        <select
                          {...register('motherTongue')}
                          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        >
                          <option value="">Select Mother Tongue</option>
                          <option value="Malayalam">Malayalam</option>
                          <option value="Tamil">Tamil</option>
                          <option value="Telugu">Telugu</option>
                          <option value="Kannada">Kannada</option>
                          <option value="Hindi">Hindi</option>
                          <option value="English">English</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Professional Information */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-primary mb-4 flex items-center">
                      <Briefcase size={24} className="mr-2" />
                      Professional Information
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-text mb-1">Education *</label>
                        <select
                          {...register('education', { required: 'Education is required' })}
                          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        >
                          <option value="">Select Education</option>
                          <option value="High School">High School</option>
                          <option value="Diploma">Diploma</option>
                          <option value="Bachelor's Degree">Bachelor's Degree</option>
                          <option value="Master's Degree">Master's Degree</option>
                          <option value="PhD">PhD</option>
                          <option value="Professional Degree">Professional Degree</option>
                          <option value="Other">Other</option>
                        </select>
                        {errors.education && (
                          <p className="mt-1 text-sm text-red-600">{errors.education.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-text mb-1">Profession *</label>
                        <input
                          type="text"
                          {...register('profession', { required: 'Profession is required' })}
                          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          placeholder="e.g., Software Engineer, Doctor, Teacher"
                        />
                        {errors.profession && (
                          <p className="mt-1 text-sm text-red-600">{errors.profession.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-text mb-1">Annual Income</label>
                        <select
                          {...register('income')}
                          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        >
                          <option value="">Select Income Range</option>
                          <option value="Below 3 LPA">Below 3 LPA</option>
                          <option value="3-5 LPA">3-5 LPA</option>
                          <option value="5-10 LPA">5-10 LPA</option>
                          <option value="10-15 LPA">10-15 LPA</option>
                          <option value="15-20 LPA">15-20 LPA</option>
                          <option value="20-30 LPA">20-30 LPA</option>
                          <option value="30+ LPA">30+ LPA</option>
                          <option value="Prefer not to say">Prefer not to say</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-text mb-1">Location *</label>
                        <input
                          type="text"
                          {...register('location', { required: 'Location is required' })}
                          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          placeholder="e.g., Kochi, Kerala"
                        />
                        {errors.location && (
                          <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Family & Preferences */}
                {currentStep === 3 && (
                  <div className="space-y-8">
                    {/* Family Information */}
                    <div>
                      <h2 className="text-xl font-semibold text-primary mb-4 flex items-center">
                        <Heart size={24} className="mr-2" />
                        Family Information
                      </h2>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-text mb-1">Father's Occupation</label>
                          <input
                            type="text"
                            {...register('fatherOccupation')}
                            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="Father's profession"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-text mb-1">Mother's Occupation</label>
                          <input
                            type="text"
                            {...register('motherOccupation')}
                            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="Mother's profession"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-text mb-1">Siblings</label>
                          <input
                            type="text"
                            {...register('siblings')}
                            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="e.g., 1 brother, 1 sister"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-text mb-1">Family Type</label>
                          <select
                            {...register('familyType')}
                            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          >
                            <option value="">Select Family Type</option>
                            <option value="Nuclear Family">Nuclear Family</option>
                            <option value="Joint Family">Joint Family</option>
                            <option value="Extended Family">Extended Family</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-text mb-1">Family Status</label>
                          <select
                            {...register('familyStatus')}
                            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          >
                            <option value="">Select Family Status</option>
                            <option value="Middle Class">Middle Class</option>
                            <option value="Upper Middle Class">Upper Middle Class</option>
                            <option value="Rich">Rich</option>
                            <option value="Affluent">Affluent</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-text mb-1">Family Location</label>
                          <input
                            type="text"
                            {...register('familyLocation')}
                            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="Family's hometown"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Partner Preferences */}
                    <div>
                      <h3 className="text-lg font-semibold text-primary mb-4">Partner Preferences</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-text mb-1">Partner Age Range</label>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="number"
                              {...register('partnerAgeMin')}
                              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                              placeholder="Min age"
                              min="18"
                              max="100"
                            />
                            <input
                              type="number"
                              {...register('partnerAgeMax')}
                              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                              placeholder="Max age"
                              min="18"
                              max="100"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-text mb-1">Partner Religion</label>
                          <select
                            {...register('partnerReligion')}
                            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          >
                            <option value="">Any Religion</option>
                            <option value="Hindu">Hindu</option>
                            <option value="Muslim">Muslim</option>
                            <option value="Christian">Christian</option>
                            <option value="Sikh">Sikh</option>
                            <option value="Buddhist">Buddhist</option>
                            <option value="Jain">Jain</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-text mb-1">Partner Education</label>
                          <select
                            {...register('partnerEducation')}
                            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          >
                            <option value="">Any Education</option>
                            <option value="High School">High School</option>
                            <option value="Diploma">Diploma</option>
                            <option value="Bachelor's Degree">Bachelor's Degree</option>
                            <option value="Master's Degree">Master's Degree</option>
                            <option value="PhD">PhD</option>
                            <option value="Professional Degree">Professional Degree</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-text mb-1">Partner Profession</label>
                          <input
                            type="text"
                            {...register('partnerProfession')}
                            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="Preferred profession (optional)"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-text mb-1">Partner Location</label>
                          <input
                            type="text"
                            {...register('partnerLocation')}
                            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="Preferred location (optional)"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Lifestyle Preferences */}
                    <div>
                      <h3 className="text-lg font-semibold text-primary mb-4">Lifestyle</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-text mb-1">Eating Habits</label>
                          <select
                            {...register('eatingHabits')}
                            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          >
                            <option value="">Select</option>
                            <option value="Vegetarian">Vegetarian</option>
                            <option value="Non-Vegetarian">Non-Vegetarian</option>
                            <option value="Eggetarian">Eggetarian</option>
                            <option value="Vegan">Vegan</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-text mb-1">Drinking Habits</label>
                          <select
                            {...register('drinkingHabits')}
                            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          >
                            <option value="">Select</option>
                            <option value="Never">Never</option>
                            <option value="Occasionally">Occasionally</option>
                            <option value="Socially">Socially</option>
                            <option value="Regularly">Regularly</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-text mb-1">Smoking Habits</label>
                          <select
                            {...register('smokingHabits')}
                            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          >
                            <option value="">Select</option>
                            <option value="Never">Never</option>
                            <option value="Occasionally">Occasionally</option>
                            <option value="Socially">Socially</option>
                            <option value="Regularly">Regularly</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4: Photos & Bio */}
                {currentStep === 4 && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-xl font-semibold text-primary mb-4 flex items-center">
                        <Camera size={24} className="mr-2" />
                        Photos & Personal Bio
                      </h2>

                      <PhotoUpload 
                        photos={photos} 
                        onPhotosChange={setPhotos}
                        maxPhotos={6}
                      />
                    </div>

                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-text mb-1">Short Bio *</label>
                        <textarea
                          {...register('shortBio', { 
                            required: 'Short bio is required',
                            maxLength: { value: 200, message: 'Bio must be less than 200 characters' }
                          })}
                          rows={3}
                          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          placeholder="Write a brief introduction about yourself (max 200 characters)"
                        />
                        {errors.shortBio && (
                          <p className="mt-1 text-sm text-red-600">{errors.shortBio.message}</p>
                        )}
                        <p className="text-xs text-text/60 mt-1">
                          {watch('shortBio')?.length || 0}/200 characters
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-text mb-1">About Me *</label>
                        <textarea
                          {...register('about', { 
                            required: 'About section is required',
                            minLength: { value: 50, message: 'Please write at least 50 characters' }
                          })}
                          rows={5}
                          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          placeholder="Tell us more about yourself, your interests, values, and what you're looking for in a life partner..."
                        />
                        {errors.about && (
                          <p className="mt-1 text-sm text-red-600">{errors.about.message}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-text mb-1">Hobbies & Interests</label>
                          <textarea
                            {...register('hobbies')}
                            rows={3}
                            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="e.g., Reading, Traveling, Music, Sports..."
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-text mb-1">Life Goals</label>
                          <textarea
                            {...register('lifeGoals')}
                            rows={3}
                            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="Your aspirations and future plans..."
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-text mb-1">Ideal Partner Description</label>
                        <textarea
                          {...register('idealPartner')}
                          rows={4}
                          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          placeholder="Describe your ideal life partner - their qualities, values, and what you're looking for in a relationship..."
                        />
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Navigation Buttons */}
            <div className="p-6 border-t border-gray-200 flex justify-between">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="btn-outline"
                >
                  Previous
                </button>
              )}
              
              <div className="ml-auto">
                {currentStep < 4 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="btn-primary"
                  >
                    Next Step
                    <ArrowRight size={18} className="ml-2" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary flex items-center"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Completing Profile...
                      </>
                    ) : (
                      <>
                        <Save size={18} className="mr-2" />
                        Complete Profile & Start Matching
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompleteProfilePage;