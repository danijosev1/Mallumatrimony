import React, { useState } from 'react';
import { Mail, MapPin, Send, AlertCircle, CheckCircle, MessageCircle, Clock, Users } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { supabase } from '../lib/supabase';

type ContactFormData = {
  name: string;
  email: string;
  message: string;
};

const ContactPage: React.FC = () => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ContactFormData>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const onSubmit = async (data: ContactFormData) => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);
      setSubmitSuccess(false);

      const { error } = await supabase
        .from('contact_messages')
        .insert([data]);

      if (error) throw error;

      setSubmitSuccess(true);
      reset();
    } catch (error: any) {
      setSubmitError(error.message || 'Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openChatbot = () => {
    const event = new CustomEvent('openChatbot');
    window.dispatchEvent(event);
  };

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="container-custom py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-primary mb-4">Contact Us</h1>
            <p className="text-lg text-text/70">
              Have questions? We'd love to hear from you. Choose how you'd like to get in touch with us.
            </p>
          </div>

          {/* Contact Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">AI Chat Assistant</h3>
              <p className="text-text/70 mb-4">Get instant answers to common questions</p>
              <button 
                onClick={openChatbot}
                className="btn-primary w-full"
              >
                Start Chat
              </button>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Email Support</h3>
              <p className="text-text/70 mb-4">For detailed queries and complex issues</p>
              <a 
                href="mailto:contact@mallumatrimony.com"
                className="btn-outline w-full inline-block text-center"
              >
                Send Email
              </a>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Visit Our Office</h3>
              <p className="text-text/70 text-sm">
                09/263, Kanchiyar P.O<br />
                Idukki, Kerala - 685511<br />
                India
              </p>
            </div>
          </div>

          {/* Support Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-gradient-to-r from-primary/5 to-primary/10 p-6 rounded-lg text-center">
              <Clock className="text-primary mx-auto mb-3" size={32} />
              <h4 className="font-semibold text-primary mb-2">Response Time</h4>
              <p className="text-text/70 text-sm">
                AI Chat: Instant<br />
                Email: Within 24 hours
              </p>
            </div>

            <div className="bg-gradient-to-r from-secondary/5 to-secondary/10 p-6 rounded-lg text-center">
              <Users className="text-accent mx-auto mb-3" size={32} />
              <h4 className="font-semibold text-accent mb-2">Support Team</h4>
              <p className="text-text/70 text-sm">
                Dedicated Malayalam-speaking<br />
                customer support specialists
              </p>
            </div>

            <div className="bg-gradient-to-r from-primary/5 to-secondary/5 p-6 rounded-lg text-center">
              <MessageCircle className="text-primary mx-auto mb-3" size={32} />
              <h4 className="font-semibold text-primary mb-2">Available 24/7</h4>
              <p className="text-text/70 text-sm">
                AI assistant available round<br />
                the clock for instant help
              </p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6 md:p-8">
              <h2 className="text-2xl font-semibold text-primary mb-6">Send us a Detailed Message</h2>
              <p className="text-text/70 mb-6">
                For complex queries, technical issues, or detailed feedback, please use the form below. 
                Our team will review your message and respond within 24 hours.
              </p>

              {submitSuccess && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md flex items-center text-green-700">
                  <CheckCircle size={20} className="mr-2 flex-shrink-0" />
                  <p>Thank you for your message. We'll get back to you within 24 hours!</p>
                </div>
              )}

              {submitError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md flex items-center text-red-700">
                  <AlertCircle size={20} className="mr-2 flex-shrink-0" />
                  <p>{submitError}</p>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-text mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    {...register('name', { 
                      required: 'Name is required',
                      minLength: {
                        value: 2,
                        message: 'Name must be at least 2 characters'
                      }
                    })}
                    className={`w-full p-3 border ${
                      errors.name ? 'border-red-300' : 'border-gray-300'
                    } rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent`}
                    placeholder="John Doe"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-text mb-1">
                    Email Address
                  </label>
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
                    className={`w-full p-3 border ${
                      errors.email ? 'border-red-300' : 'border-gray-300'
                    } rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent`}
                    placeholder="you@example.com"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-text mb-1">
                    Message
                  </label>
                  <textarea
                    id="message"
                    {...register('message', { 
                      required: 'Message is required',
                      minLength: {
                        value: 10,
                        message: 'Message must be at least 10 characters'
                      }
                    })}
                    rows={5}
                    className={`w-full p-3 border ${
                      errors.message ? 'border-red-300' : 'border-gray-300'
                    } rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent`}
                    placeholder="Please describe your query in detail..."
                  />
                  {errors.message && (
                    <p className="mt-1 text-sm text-red-600">{errors.message.message}</p>
                  )}
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto btn-primary flex items-center justify-center"
                  >
                    <Send size={18} className="mr-2" />
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mt-12 bg-primary/5 rounded-lg p-8">
            <h3 className="text-2xl font-semibold text-primary mb-6 text-center">Frequently Asked Questions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-primary mb-2">How do I create a profile?</h4>
                <p className="text-text/70 text-sm">Click 'Register' and follow the simple steps. Our AI assistant can guide you through the process.</p>
              </div>
              <div>
                <h4 className="font-semibold text-primary mb-2">Is my information secure?</h4>
                <p className="text-text/70 text-sm">Yes, we use advanced encryption and verification processes to keep your data safe and secure.</p>
              </div>
              <div>
                <h4 className="font-semibold text-primary mb-2">How does matching work?</h4>
                <p className="text-text/70 text-sm">Our algorithm considers your preferences, compatibility factors, and cultural values to suggest suitable matches.</p>
              </div>
              <div>
                <h4 className="font-semibold text-primary mb-2">What if I need technical help?</h4>
                <p className="text-text/70 text-sm">Use our AI chat for instant help, or email us for detailed technical support within 24 hours.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;