import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Heart, MapPin, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const QuickRegistrationForm: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    lookingFor: '',
    age: '',
    location: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Store form data in localStorage to pre-fill registration
    localStorage.setItem('quickRegData', JSON.stringify(formData));
    navigate('/register');
  };

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6 }
    }
  };

  return (
    <motion.div 
      className="max-w-4xl mx-auto"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={fadeIn}
    >
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-primary to-primary-light p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-2">Find Your Perfect Match</h3>
          <p className="text-white/90">Answer these 3 simple questions to get started</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Question 1: Looking For */}
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="text-primary" size={24} />
              </div>
              <h4 className="text-lg font-semibold text-primary mb-4">I'm looking for</h4>
              <div className="space-y-3">
                {['Male', 'Female'].map((option) => (
                  <label key={option} className="flex items-center justify-center cursor-pointer">
                    <input
                      type="radio"
                      name="lookingFor"
                      value={option}
                      checked={formData.lookingFor === option}
                      onChange={(e) => handleInputChange('lookingFor', e.target.value)}
                      className="sr-only"
                    />
                    <div className={`w-full p-3 rounded-lg border-2 transition-all duration-300 ${
                      formData.lookingFor === option 
                        ? 'border-primary bg-primary/10 text-primary' 
                        : 'border-gray-200 hover:border-primary/50'
                    }`}>
                      {option}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Question 2: Age */}
            <div className="text-center">
              <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="text-secondary" size={24} />
              </div>
              <h4 className="text-lg font-semibold text-primary mb-4">Age range</h4>
              <div className="space-y-3">
                {['21-25', '26-30', '31-35', '36-40', '40+'].map((option) => (
                  <label key={option} className="flex items-center justify-center cursor-pointer">
                    <input
                      type="radio"
                      name="age"
                      value={option}
                      checked={formData.age === option}
                      onChange={(e) => handleInputChange('age', e.target.value)}
                      className="sr-only"
                    />
                    <div className={`w-full p-3 rounded-lg border-2 transition-all duration-300 ${
                      formData.age === option 
                        ? 'border-secondary bg-secondary/10 text-accent' 
                        : 'border-gray-200 hover:border-secondary/50'
                    }`}>
                      {option} years
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Question 3: Location */}
            <div className="text-center">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="text-accent" size={24} />
              </div>
              <h4 className="text-lg font-semibold text-primary mb-4">Preferred location</h4>
              <div className="space-y-3">
                {['Kerala', 'Bangalore', 'Mumbai', 'Delhi', 'Abroad'].map((option) => (
                  <label key={option} className="flex items-center justify-center cursor-pointer">
                    <input
                      type="radio"
                      name="location"
                      value={option}
                      checked={formData.location === option}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      className="sr-only"
                    />
                    <div className={`w-full p-3 rounded-lg border-2 transition-all duration-300 ${
                      formData.location === option 
                        ? 'border-accent bg-accent/10 text-accent' 
                        : 'border-gray-200 hover:border-accent/50'
                    }`}>
                      {option}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="text-center mt-8">
            <button
              type="submit"
              disabled={!formData.lookingFor || !formData.age || !formData.location}
              className="btn-primary text-lg px-8 py-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center mx-auto"
            >
              Create My Profile
              <ChevronRight size={20} className="ml-2" />
            </button>
            <p className="text-sm text-text/60 mt-4">
              Free to join • 100% verified profiles • Secure & private
            </p>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default QuickRegistrationForm;