import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, MapPin, Facebook, Instagram, Twitter, MessageCircle } from 'lucide-react';
import Logo from '../ui/Logo';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-primary text-white pt-12 pb-6">
      <div className="container-custom">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Logo and About */}
          <div>
            <div className="flex items-center mb-4">
              <Logo color="white" />
              <span className="ml-2 text-2xl font-bold">Mallu Matrimony</span>
            </div>
            <p className="mb-4 text-white/80">
              Connecting hearts with Kerala's rich traditions. Find your perfect match with our trusted matrimonial service.
            </p>
            <div className="flex space-x-4">
              <a href="https://facebook.com" className="hover:text-secondary transition-colors duration-300" aria-label="Facebook">
                <Facebook size={20} />
              </a>
              <a href="https://instagram.com" className="hover:text-secondary transition-colors duration-300" aria-label="Instagram">
                <Instagram size={20} />
              </a>
              <a href="https://twitter.com" className="hover:text-secondary transition-colors duration-300" aria-label="Twitter">
                <Twitter size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xl font-bold mb-4 text-secondary">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/search" className="text-white/80 hover:text-secondary transition-colors duration-300">
                  Search Profiles
                </Link>
              </li>
              <li>
                <Link to="/success-stories" className="text-white/80 hover:text-secondary transition-colors duration-300">
                  Success Stories
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-white/80 hover:text-secondary transition-colors duration-300">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-white/80 hover:text-secondary transition-colors duration-300">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-white/80 hover:text-secondary transition-colors duration-300">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-white/80 hover:text-secondary transition-colors duration-300">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-xl font-bold mb-4 text-secondary">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <MapPin size={20} className="mr-2 mt-1 text-secondary" />
                <span className="text-white/80">
                  09/263, Kanchiyar P.O<br />
                  Idukki, Kerala, 685511<br />
                  India
                </span>
              </li>
              <li className="flex items-center">
                <MessageCircle size={20} className="mr-2 text-secondary" />
                <button 
                  onClick={() => {
                    // This will be handled by the chatbot component
                    const event = new CustomEvent('openChatbot');
                    window.dispatchEvent(event);
                  }}
                  className="text-white/80 hover:text-secondary transition-colors duration-300"
                >
                  Chat with AI Assistant
                </button>
              </li>
              <li className="flex items-center">
                <Mail size={20} className="mr-2 text-secondary" />
                <a href="mailto:contact@mallumatrimony.com" className="text-white/80 hover:text-secondary transition-colors duration-300">
                  contact@mallumatrimony.com
                </a>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-xl font-bold mb-4 text-secondary">Newsletter</h3>
            <p className="mb-4 text-white/80">
              Subscribe to our newsletter to receive updates and offers.
            </p>
            <form className="mb-4">
              <div className="flex">
                <input
                  type="email"
                  placeholder="Your email"
                  className="px-4 py-2 rounded-l-md w-full focus:outline-none text-text"
                />
                <button
                  type="submit"
                  className="bg-secondary text-accent px-4 py-2 rounded-r-md hover:bg-secondary-light transition-colors duration-300"
                >
                  Subscribe
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Kerala-inspired border */}
        <div className="relative h-4 my-6">
          <div className="absolute inset-0 flex">
            {[...Array(20)].map((_, i) => (
              <div key={i} className="flex-grow">
                <div className="h-1 bg-secondary mx-1 mb-1 rounded-full"></div>
                <div className="h-1 bg-secondary/50 mx-2 rounded-full"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="text-center text-white/70 text-sm pt-4 border-t border-white/20">
          <p>© {currentYear} Mallu Matrimony. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;