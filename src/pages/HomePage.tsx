import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Users, Shield, Heart, ChevronRight, Star, User, Calendar, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ProfileCard from '../components/profile/ProfileCard';
import { featuredProfiles } from '../data/mockProfiles';
import TestimonialSlider from '../components/home/TestimonialSlider';
import QuickRegistrationForm from '../components/home/QuickRegistrationForm';
import UserDashboard from '../components/home/UserDashboard';

const HomePage: React.FC = () => {
  const { user } = useAuth();

  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6 }
    }
  };

  // If user is logged in, show dashboard
  if (user) {
    return <UserDashboard />;
  }

  // Non-logged in user experience
  return (
    <div className="pt-0">
      {/* Hero Section with Kerala Background */}
      <section className="relative h-screen flex items-center" style={{ marginTop: '-48px', paddingTop: '48px' }}>
        <div className="absolute inset-0">
          <img 
            src="https://images.pexels.com/photos/3700369/pexels-photo-3700369.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080" 
            alt="Kerala backwaters" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/70"></div>
        </div>
        <div className="container-custom relative z-10 text-white">
          <div className="max-w-2xl">
            <motion.h1 
              className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              Find Your Perfect <span className="text-secondary">Malayali</span> Match
            </motion.h1>
            <motion.p 
              className="text-lg md:text-xl mb-8"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              Connecting hearts with Kerala's rich traditions. Join thousands of Malayali couples who found their perfect match through our trusted matrimonial service.
            </motion.p>
          </div>
        </div>
        
        {/* Kerala-inspired decorative element */}
        <div className="absolute bottom-0 left-0 right-0 h-16 overflow-hidden">
          <div className="absolute inset-0 bg-white opacity-20">
            <div className="flex justify-around">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="w-16 h-16 rounded-full bg-secondary/30 -mb-8 animate-float" style={{ animationDelay: `${i * 0.5}s` }}></div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Quick Registration Section */}
      <section className="py-20 bg-background">
        <div className="container-custom">
          <motion.div 
            className="text-center mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
          >
            <h2 className="section-title mx-auto">Start Your Journey Today</h2>
            <p className="text-lg max-w-3xl mx-auto text-text/80">
              Answer a few questions to create your profile and find your perfect match
            </p>
          </motion.div>

          <QuickRegistrationForm />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="container-custom">
          <motion.div 
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
          >
            <h2 className="section-title mx-auto">Why Choose Mallu Matrimony</h2>
            <p className="text-lg max-w-3xl mx-auto text-text/80">
              We connect Malayali hearts with authenticity, trust, and cultural understanding
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <Users className="text-primary\" size={40} />,
                title: "Verified Profiles",
                description: "All profiles undergo thorough verification to ensure authenticity and trust"
              },
              {
                icon: <Shield className="text-primary" size={40} />,
                title: "Privacy Control",
                description: "Advanced privacy settings give you complete control over your information"
              },
              {
                icon: <Search className="text-primary\" size={40} />,
                title: "Smart Matching",
                description: "Our algorithm connects you with matches based on compatibility and preferences"
              },
              {
                icon: <Heart className="text-primary" size={40} />,
                title: "Kerala Traditions",
                description: "Designed specifically for Malayali matrimonial traditions and expectations"
              }
            ].map((feature, index) => (
              <motion.div 
                key={index}
                className="kerala-card p-6 flex flex-col items-center text-center"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeIn}
                transition={{ delay: index * 0.1 }}
              >
                <div className="mb-4 bg-primary/10 p-4 rounded-full">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3 text-primary">{feature.title}</h3>
                <p className="text-text/80">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Success Stats */}
      <section className="py-20 bg-primary text-white">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { number: "10,000+", label: "Happy Couples" },
              { number: "50,000+", label: "Active Profiles" },
              { number: "95%", label: "Success Rate" }
            ].map((stat, index) => (
              <motion.div 
                key={index} 
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
              >
                <p className="text-4xl md:text-5xl font-bold text-secondary mb-2">
                  {stat.number}
                </p>
                <p className="text-xl text-white/90">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-background">
        <div className="container-custom">
          <motion.div 
            className="text-center mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
          >
            <h2 className="section-title mx-auto">Success Stories</h2>
            <p className="text-lg max-w-3xl mx-auto text-text/80">
              Read heartfelt testimonials from couples who found their soulmates through Mallu Matrimony
            </p>
          </motion.div>

          <TestimonialSlider />

          <div className="text-center mt-12">
            <Link to="/success-stories" className="btn-primary">
              Read More Success Stories
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary/5 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-kerala-pattern"></div>
        <div className="container-custom relative z-10">
          <motion.div 
            className="max-w-3xl mx-auto text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-6">
              Begin Your Journey to Find Your Soulmate
            </h2>
            <p className="text-lg mb-8 text-text/80">
              Join thousands of Malayalis who found their perfect match. Create your profile today and start your journey.
            </p>
            <Link to="/register" className="btn-primary">
              Create Your Profile
            </Link>
            
            <div className="mt-8 flex items-center justify-center">
              <Star fill="#D4AF37" className="text-secondary" size={20} />
              <Star fill="#D4AF37" className="text-secondary" size={20} />
              <Star fill="#D4AF37" className="text-secondary" size={20} />
              <Star fill="#D4AF37" className="text-secondary" size={20} />
              <Star fill="#D4AF37" className="text-secondary" size={20} />
              <span className="ml-2 text-text/80">Rated 4.9/5 by our members</span>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;