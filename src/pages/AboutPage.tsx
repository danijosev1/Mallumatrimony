import React from 'react';
import { Heart, Users, Star, Trophy } from 'lucide-react';

const AboutPage: React.FC = () => {
  return (
    <div className="bg-gradient-to-b from-purple-50 to-white">
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
            About Our Mission
          </h1>
          <p className="mt-4 text-xl text-gray-600">
            Connecting hearts and building lasting relationships in the digital age
          </p>
        </div>

        {/* Values Grid */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4 mb-16">
          <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <Heart className="w-12 h-12 text-rose-500 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Genuine Connections</h3>
            <p className="text-gray-600">
              We prioritize authentic relationships built on trust and compatibility
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <Users className="w-12 h-12 text-blue-500 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Inclusive Community</h3>
            <p className="text-gray-600">
              A welcoming space for everyone to find meaningful relationships
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <Star className="w-12 h-12 text-yellow-500 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Quality Matches</h3>
            <p className="text-gray-600">
              Advanced matching algorithms to help you find your perfect match
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <Trophy className="w-12 h-12 text-green-500 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Success Stories</h3>
            <p className="text-gray-600">
              Thousands of happy couples who found love through our platform
            </p>
          </div>
        </div>

        {/* Story Section */}
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Our Story</h2>
          <div className="max-w-3xl mx-auto">
            <p className="text-gray-600 mb-4">
              Founded in 2024, we set out to revolutionize the way people connect and find love online. 
              Our platform combines cutting-edge technology with a human-centered approach to create 
              meaningful relationships that last.
            </p>
            <p className="text-gray-600 mb-4">
              We understand that finding the right person is about more than just swiping right. 
              It's about understanding each other's values, aspirations, and what makes us unique. 
              That's why we've developed sophisticated matching algorithms that look beyond the surface 
              to help you find truly compatible partners.
            </p>
            <p className="text-gray-600">
              Today, we're proud to have helped countless couples find love and build lasting 
              relationships. Our commitment to authenticity, safety, and meaningful connections 
              continues to drive everything we do.
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div className="text-center">
            <div className="text-4xl font-bold text-purple-600">1000+</div>
            <div className="mt-2 text-gray-600">Active Users</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-purple-600">500+</div>
            <div className="mt-2 text-gray-600">Successful Matches</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-purple-600">95%</div>
            <div className="mt-2 text-gray-600">User Satisfaction</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;