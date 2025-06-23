import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { User, Calendar, MapPin, Heart, GraduationCap, Briefcase, DollarSign, Users, Home, Star, Camera, Phone } from 'lucide-react';
import PhotoUpload from '../components/ui/PhotoUpload';

interface ExtendedProfile {
  gender: string;
  birth_date: string;
  religion: string;
  caste: string;
  height: string;
  marital_status: string;
  education: string;
  profession: string;
  income: string;
  location: string;
  about: string;
  mother_tongue: string;
  complexion: string;
  body_type: string;
  eating_habits: string;
  drinking_habits: string;
  smoking_habits: string;
  family_type: string;
  family_status: string;
  father_occupation: string;
  mother_occupation: string;
  siblings: string;
  family_location: string;
  partner_age_min: string;
  partner_age_max: string;
  partner_height_min: string;
  partner_height_max: string;
  partner_religion: string;
  partner_caste: string;
  partner_education: string;
  partner_profession: string;
  partner_income: string;
  partner_location: string;
  hobbies: string;
  interests: string;
  life_goals: string;
  ideal_partner: string;
  preferences: any;
  family_details: any;
}

export default function CompleteProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [photos, setPhotos] = useState<string[]>([]);
  const totalSteps = 7;
  
  const [profile, setProfile] = useState<ExtendedProfile>({
    gender: '',
    birth_date: '',
    religion: '',
    caste: '',
    height: '',
    marital_status: '',
    education: '',
    profession: '',
    income: '',
    location: '',
    about: '',
    mother_tongue: '',
    complexion: '',
    body_type: '',
    eating_habits: '',
    drinking_habits: '',
    smoking_habits: '',
    family_type: '',
    family_status: '',
    father_occupation: '',
    mother_occupation: '',
    siblings: '',
    family_location: '',
    partner_age_min: '',
    partner_age_max: '',
    partner_height_min: '',
    partner_height_max: '',
    partner_religion: '',
    partner_caste: '',
    partner_education: '',
    partner_profession: '',
    partner_income: '',
    partner_location: '',
    hobbies: '',
    interests: '',
    life_goals: '',
    ideal_partner: '',
    preferences: {},
    family_details: {}
  });

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
      const { data, error } = await supabase
        .from('extended_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error loading profile:', error);
        return;
      }

      if (data) {
        setProfile(prev => ({
          ...prev,
          ...data,
          preferences: data.preferences || {},
          family_details: data.family_details || {}
        }));
      }
    } catch (error: any) {
      console.error('Error loading profile:', error);
    }
  };

  const ensureMainProfileExists = async () => {
    if (!user) return false;

    try {
      // Check if main profile exists
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking profile:', checkError);
        return false;
      }

      if (!existingProfile) {
        // Create main profile if it doesn't exist
        console.log('Creating main profile for user:', user.id);
        const { error: createError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            full_name: user.email?.split('@')[0] || 'User',
            name: user.email?.split('@')[0] || 'User',
            membership_plan: 'free',
            is_premium: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (createError) {
          console.error('Error creating main profile:', createError);
          return false;
        }
        console.log('✅ Main profile created successfully');
      }

      return true;
    } catch (error) {
      console.error('Error ensuring main profile exists:', error);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      console.log('💾 Starting profile completion for user:', user.id);

      // First, ensure the main profile exists
      const mainProfileExists = await ensureMainProfileExists();
      if (!mainProfileExists) {
        throw new Error('Failed to create or verify main profile');
      }

      // Prepare family details
      const familyDetails = {
        fatherOccupation: profile.father_occupation,
        motherOccupation: profile.mother_occupation,
        siblings: profile.siblings,
        familyType: profile.family_type,
        familyStatus: profile.family_status,
        familyLocation: profile.family_location
      };

      // Prepare preferences
      const preferences = {
        ageRange: `${profile.partner_age_min}-${profile.partner_age_max}`,
        heightRange: `${profile.partner_height_min}-${profile.partner_height_max}`,
        religion: profile.partner_religion,
        caste: profile.partner_caste,
        education: profile.partner_education,
        profession: profile.partner_profession,
        income: profile.partner_income,
        location: profile.partner_location
      };

      // Calculate age from birth date
      const age = profile.birth_date ? 
        new Date().getFullYear() - new Date(profile.birth_date).getFullYear() : null;

      // Update or insert extended profile
      console.log('📝 Updating extended profile...');
      const { error: extendedError } = await supabase
        .from('extended_profiles')
        .upsert({
          id: user.id,
          ...profile,
          family_details: familyDetails,
          preferences: preferences,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        });

      if (extendedError) {
        console.error('❌ Extended profile error:', extendedError);
        throw new Error(`Extended profile update failed: ${extendedError.message}`);
      }

      console.log('✅ Extended profile updated successfully');

      // Update basic profile with photos and key info
      const profileUpdateData = {
        images: photos,
        age: age,
        gender: profile.gender,
        religion: profile.religion,
        caste: profile.caste,
        height: profile.height,
        marital_status: profile.marital_status,
        education: profile.education,
        profession: profile.profession,
        income: profile.income,
        location: profile.location,
        about: profile.about,
        short_bio: profile.about?.substring(0, 150) + (profile.about?.length > 150 ? '...' : ''),
        key_details: [
          profile.religion,
          profile.profession,
          profile.location,
          profile.education
        ].filter(Boolean),
        family_details: familyDetails,
        preferences: preferences,
        updated_at: new Date().toISOString()
      };

      console.log('📝 Updating basic profile with data:', profileUpdateData);

      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileUpdateData)
        .eq('id', user.id);

      if (profileError) {
        console.error('❌ Profile update error:', profileError);
        throw new Error(`Profile update failed: ${profileError.message}`);
      }

      console.log('✅ Profile saved successfully');

      // Redirect to home page where they can see their profile in the search results
      navigate('/');
    } catch (error: any) {
      console.error('❌ Error saving profile:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Error saving profile. Please try again.';
      
      if (error.message?.includes('violates check constraint')) {
        errorMessage = 'Please check that all required fields are filled correctly.';
      } else if (error.message?.includes('column') && error.message?.includes('does not exist')) {
        errorMessage = 'Database configuration issue. Please contact support.';
      } else if (error.message?.includes('permission denied')) {
        errorMessage = 'Permission error. Please try logging out and back in.';
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ExtendedProfile, value: string) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1:
        return profile.gender && profile.birth_date && profile.height && profile.marital_status && profile.mother_tongue;
      case 2:
        return profile.religion;
      case 3:
        return profile.education && profile.profession && profile.location;
      case 4:
        return true; // Family details are optional
      case 5:
        return true; // Partner preferences are optional
      case 6:
        return profile.about;
      case 7:
        return photos.length > 0; // At least one photo required
      default:
        return true;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-3 mb-6">
              <User className="h-6 w-6 text-rose-500" />
              <h2 className="text-xl font-semibold text-gray-900">Basic Information</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Gender *</label>
                <select
                  value={profile.gender}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Birth Date *</label>
                <input
                  type="date"
                  value={profile.birth_date}
                  onChange={(e) => handleInputChange('birth_date', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Height *</label>
                <select
                  value={profile.height}
                  onChange={(e) => handleInputChange('height', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Height</option>
                  <option value={`4'6" - 4'8"`}>4'6" - 4'8"</option>
                  <option value={`4'9" - 4'11"`}>4'9" - 4'11"</option>
                  <option value={`5'0" - 5'2"`}>5'0" - 5'2"</option>
                  <option value={`5'3" - 5'5"`}>5'3" - 5'5"</option>
                  <option value={`5'6" - 5'8"`}>5'6" - 5'8"</option>
                  <option value={`5'9" - 5'11"`}>5'9" - 5'11"</option>
                  <option value={`6'0" - 6'2"`}>6'0" - 6'2"</option>
                  <option value={`6'3" and above`}>6'3" and above</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Marital Status *</label>
                <select
                  value={profile.marital_status}
                  onChange={(e) => handleInputChange('marital_status', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Status</option>
                  <option value="Never Married">Never Married</option>
                  <option value="Divorced">Divorced</option>
                  <option value="Widowed">Widowed</option>
                  <option value="Separated">Separated</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mother Tongue *</label>
                <select
                  value={profile.mother_tongue}
                  onChange={(e) => handleInputChange('mother_tongue', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Mother Tongue</option>
                  <option value="Malayalam">Malayalam</option>
                  <option value="Tamil">Tamil</option>
                  <option value="Hindi">Hindi</option>
                  <option value="English">English</option>
                  <option value="Kannada">Kannada</option>
                  <option value="Telugu">Telugu</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Complexion</label>
                <select
                  value={profile.complexion}
                  onChange={(e) => handleInputChange('complexion', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                >
                  <option value="">Select Complexion</option>
                  <option value="Very Fair">Very Fair</option>
                  <option value="Fair">Fair</option>
                  <option value="Wheatish">Wheatish</option>
                  <option value="Dark">Dark</option>
                  <option value="Very Dark">Very Dark</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-3 mb-6">
              <Heart className="h-6 w-6 text-rose-500" />
              <h2 className="text-xl font-semibold text-gray-900">Religious & Cultural Background</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Religion *</label>
                <select
                  value={profile.religion}
                  onChange={(e) => handleInputChange('religion', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Religion</option>
                  <option value="Hindu">Hindu</option>
                  <option value="Christian">Christian</option>
                  <option value="Muslim">Muslim</option>
                  <option value="Sikh">Sikh</option>
                  <option value="Buddhist">Buddhist</option>
                  <option value="Jain">Jain</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Caste/Community</label>
                <input
                  type="text"
                  value={profile.caste}
                  onChange={(e) => handleInputChange('caste', e.target.value)}
                  placeholder="Enter caste/community"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Eating Habits</label>
                <select
                  value={profile.eating_habits}
                  onChange={(e) => handleInputChange('eating_habits', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                >
                  <option value="">Select Eating Habits</option>
                  <option value="Vegetarian">Vegetarian</option>
                  <option value="Non-Vegetarian">Non-Vegetarian</option>
                  <option value="Eggetarian">Eggetarian</option>
                  <option value="Vegan">Vegan</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Drinking Habits</label>
                <select
                  value={profile.drinking_habits}
                  onChange={(e) => handleInputChange('drinking_habits', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                >
                  <option value="">Select Drinking Habits</option>
                  <option value="Never">Never</option>
                  <option value="Occasionally">Occasionally</option>
                  <option value="Socially">Socially</option>
                  <option value="Regularly">Regularly</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Smoking Habits</label>
                <select
                  value={profile.smoking_habits}
                  onChange={(e) => handleInputChange('smoking_habits', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                >
                  <option value="">Select Smoking Habits</option>
                  <option value="Never">Never</option>
                  <option value="Occasionally">Occasionally</option>
                  <option value="Socially">Socially</option>
                  <option value="Regularly">Regularly</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Body Type</label>
                <select
                  value={profile.body_type}
                  onChange={(e) => handleInputChange('body_type', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                >
                  <option value="">Select Body Type</option>
                  <option value="Slim">Slim</option>
                  <option value="Average">Average</option>
                  <option value="Athletic">Athletic</option>
                  <option value="Heavy">Heavy</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-3 mb-6">
              <Briefcase className="h-6 w-6 text-rose-500" />
              <h2 className="text-xl font-semibold text-gray-900">Professional Details</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Education *</label>
                <select
                  value={profile.education}
                  onChange={(e) => handleInputChange('education', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Education</option>
                  <option value="High School">High School</option>
                  <option value="Diploma">Diploma</option>
                  <option value="Bachelor's Degree">Bachelor's Degree</option>
                  <option value="Master's Degree">Master's Degree</option>
                  <option value="Doctorate">Doctorate</option>
                  <option value="Professional Degree">Professional Degree</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Profession *</label>
                <select
                  value={profile.profession}
                  onChange={(e) => handleInputChange('profession', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Profession</option>
                  <option value="Software Engineer">Software Engineer</option>
                  <option value="Doctor">Doctor</option>
                  <option value="Teacher">Teacher</option>
                  <option value="Engineer">Engineer</option>
                  <option value="Business Owner">Business Owner</option>
                  <option value="Government Employee">Government Employee</option>
                  <option value="Lawyer">Lawyer</option>
                  <option value="Accountant">Accountant</option>
                  <option value="Nurse">Nurse</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Annual Income</label>
                <select
                  value={profile.income}
                  onChange={(e) => handleInputChange('income', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                >
                  <option value="">Select Income Range</option>
                  <option value="Below 2 Lakhs">Below ₹2 Lakhs</option>
                  <option value="2-5 Lakhs">₹2-5 Lakhs</option>
                  <option value="5-10 Lakhs">₹5-10 Lakhs</option>
                  <option value="10-20 Lakhs">₹10-20 Lakhs</option>
                  <option value="20-50 Lakhs">₹20-50 Lakhs</option>
                  <option value="Above 50 Lakhs">Above ₹50 Lakhs</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Location *</label>
                <input
                  type="text"
                  value={profile.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="e.g., Kochi, Kerala"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-3 mb-6">
              <Home className="h-6 w-6 text-rose-500" />
              <h2 className="text-xl font-semibold text-gray-900">Family Details</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Family Type</label>
                <select
                  value={profile.family_type}
                  onChange={(e) => handleInputChange('family_type', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                >
                  <option value="">Select Family Type</option>
                  <option value="Nuclear Family">Nuclear Family</option>
                  <option value="Joint Family">Joint Family</option>
                  <option value="Extended Family">Extended Family</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Family Status</label>
                <select
                  value={profile.family_status}
                  onChange={(e) => handleInputChange('family_status', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                >
                  <option value="">Select Family Status</option>
                  <option value="Middle Class">Middle Class</option>
                  <option value="Upper Middle Class">Upper Middle Class</option>
                  <option value="Rich">Rich</option>
                  <option value="Affluent">Affluent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Father's Occupation</label>
                <input
                  type="text"
                  value={profile.father_occupation}
                  onChange={(e) => handleInputChange('father_occupation', e.target.value)}
                  placeholder="Father's occupation"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mother's Occupation</label>
                <input
                  type="text"
                  value={profile.mother_occupation}
                  onChange={(e) => handleInputChange('mother_occupation', e.target.value)}
                  placeholder="Mother's occupation"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Siblings</label>
                <input
                  type="text"
                  value={profile.siblings}
                  onChange={(e) => handleInputChange('siblings', e.target.value)}
                  placeholder="e.g., 1 brother, 1 sister"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Family Location</label>
                <input
                  type="text"
                  value={profile.family_location}
                  onChange={(e) => handleInputChange('family_location', e.target.value)}
                  placeholder="Family's hometown"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-3 mb-6">
              <Star className="h-6 w-6 text-rose-500" />
              <h2 className="text-xl font-semibold text-gray-900">Partner Preferences</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Partner Age Range</label>
                <div className="flex space-x-2">
                  <select
                    value={profile.partner_age_min}
                    onChange={(e) => handleInputChange('partner_age_min', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  >
                    <option value="">Min Age</option>
                    {Array.from({ length: 30 }, (_, i) => i + 18).map(age => (
                      <option key={age} value={age}>{age}</option>
                    ))}
                  </select>
                  <select
                    value={profile.partner_age_max}
                    onChange={(e) => handleInputChange('partner_age_max', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  >
                    <option value="">Max Age</option>
                    {Array.from({ length: 30 }, (_, i) => i + 18).map(age => (
                      <option key={age} value={age}>{age}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Partner Height Range</label>
                <div className="flex space-x-2">
                  <select
                    value={profile.partner_height_min}
                    onChange={(e) => handleInputChange('partner_height_min', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  >
                    <option value="">Min Height</option>
                    <option value={`4'6"`}>4'6"</option>
                    <option value={`4'9"`}>4'9"</option>
                    <option value={`5'0"`}>5'0"</option>
                    <option value={`5'3"`}>5'3"</option>
                    <option value={`5'6"`}>5'6"</option>
                    <option value={`5'9"`}>5'9"</option>
                    <option value={`6'0"`}>6'0"</option>
                  </select>
                  <select
                    value={profile.partner_height_max}
                    onChange={(e) => handleInputChange('partner_height_max', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  >
                    <option value="">Max Height</option>
                    <option value={`5'0"`}>5'0"</option>
                    <option value={`5'3"`}>5'3"</option>
                    <option value={`5'6"`}>5'6"</option>
                    <option value={`5'9"`}>5'9"</option>
                    <option value={`6'0"`}>6'0"</option>
                    <option value={`6'3"`}>6'3"</option>
                    <option value={`6'6"`}>6'6"</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Partner Religion</label>
                <select
                  value={profile.partner_religion}
                  onChange={(e) => handleInputChange('partner_religion', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                >
                  <option value="">Any Religion</option>
                  <option value="Hindu">Hindu</option>
                  <option value="Christian">Christian</option>
                  <option value="Muslim">Muslim</option>
                  <option value="Sikh">Sikh</option>
                  <option value="Buddhist">Buddhist</option>
                  <option value="Jain">Jain</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Partner Caste</label>
                <input
                  type="text"
                  value={profile.partner_caste}
                  onChange={(e) => handleInputChange('partner_caste', e.target.value)}
                  placeholder="Preferred caste (optional)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Partner Education</label>
                <select
                  value={profile.partner_education}
                  onChange={(e) => handleInputChange('partner_education', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                >
                  <option value="">Any Education</option>
                  <option value="High School">High School</option>
                  <option value="Diploma">Diploma</option>
                  <option value="Bachelor's Degree">Bachelor's Degree</option>
                  <option value="Master's Degree">Master's Degree</option>
                  <option value="Doctorate">Doctorate</option>
                  <option value="Professional Degree">Professional Degree</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Partner Profession</label>
                <input
                  type="text"
                  value={profile.partner_profession}
                  onChange={(e) => handleInputChange('partner_profession', e.target.value)}
                  placeholder="Preferred profession"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Partner Income</label>
                <select
                  value={profile.partner_income}
                  onChange={(e) => handleInputChange('partner_income', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                >
                  <option value="">Any Income</option>
                  <option value="Below 2 Lakhs">Below ₹2 Lakhs</option>
                  <option value="2-5 Lakhs">₹2-5 Lakhs</option>
                  <option value="5-10 Lakhs">₹5-10 Lakhs</option>
                  <option value="10-20 Lakhs">₹10-20 Lakhs</option>
                  <option value="20-50 Lakhs">₹20-50 Lakhs</option>
                  <option value="Above 50 Lakhs">Above ₹50 Lakhs</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Partner Location</label>
                <input
                  type="text"
                  value={profile.partner_location}
                  onChange={(e) => handleInputChange('partner_location', e.target.value)}
                  placeholder="Preferred location"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-3 mb-6">
              <Users className="h-6 w-6 text-rose-500" />
              <h2 className="text-xl font-semibold text-gray-900">About Yourself & Interests</h2>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">About Me *</label>
                <textarea
                  value={profile.about}
                  onChange={(e) => handleInputChange('about', e.target.value)}
                  placeholder="Tell us about yourself, your values, interests, and what you're looking for in a life partner..."
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hobbies & Interests</label>
                <textarea
                  value={profile.hobbies}
                  onChange={(e) => handleInputChange('hobbies', e.target.value)}
                  placeholder="e.g., Reading, Traveling, Cooking, Music, Sports..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Life Goals & Aspirations</label>
                <textarea
                  value={profile.life_goals}
                  onChange={(e) => handleInputChange('life_goals', e.target.value)}
                  placeholder="Share your future plans, career goals, and life aspirations..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">What I'm Looking For in a Partner</label>
                <textarea
                  value={profile.ideal_partner}
                  onChange={(e) => handleInputChange('ideal_partner', e.target.value)}
                  placeholder="Describe the qualities you value in a life partner..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent resize-none"
                />
              </div>
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-3 mb-6">
              <Camera className="h-6 w-6 text-rose-500" />
              <h2 className="text-xl font-semibold text-gray-900">Add Your Photos</h2>
            </div>

            <PhotoUpload 
              photos={photos}
              onPhotosChange={setPhotos}
              maxPhotos={6}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-rose-500 to-pink-600 px-8 py-6">
            <h1 className="text-3xl font-bold text-white">Complete Your Matrimonial Profile</h1>
            <p className="text-rose-100 mt-2">Step {currentStep} of {totalSteps}: Create your detailed profile to find your perfect match</p>
            
            {/* Progress Bar */}
            <div className="mt-4 bg-white/20 rounded-full h-2">
              <div 
                className="bg-white rounded-full h-2 transition-all duration-300"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              ></div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8">
            {renderStep()}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-8 border-t border-gray-200 mt-8">
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                Previous
              </button>
              
              {currentStep < totalSteps ? (
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={!canProceedToNext()}
                  className="bg-gradient-to-r from-rose-500 to-pink-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-rose-600 hover:to-pink-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next Step
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading || !canProceedToNext()}
                  className="bg-gradient-to-r from-rose-500 to-pink-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-rose-600 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {loading ? 'Saving Profile...' : 'Complete Profile & Start Matching'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}