import React from 'react';
import { FileText, Users, Shield, AlertTriangle, CheckCircle, Scale } from 'lucide-react';

const TermsOfServicePage: React.FC = () => {
  return (
    <div className="pt-20 bg-background min-h-screen">
      <div className="container-custom py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="text-primary" size={32} />
            </div>
            <h1 className="text-4xl font-bold text-primary mb-4">Terms of Service</h1>
            <p className="text-lg text-text/70">
              Please read these terms carefully before using our matrimonial services.
            </p>
            <p className="text-sm text-text/60 mt-2">Last updated: December 2024</p>
          </div>

          {/* Content */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-8 space-y-8">
              
              {/* Acceptance of Terms */}
              <section>
                <div className="flex items-center mb-4">
                  <CheckCircle className="text-primary mr-3" size={24} />
                  <h2 className="text-2xl font-semibold text-primary">Acceptance of Terms</h2>
                </div>
                <div className="space-y-4 text-text/80">
                  <p>By accessing and using Mallu Matrimony, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.</p>
                  <p>These terms apply to all visitors, users, and others who access or use the service.</p>
                </div>
              </section>

              {/* Service Description */}
              <section>
                <div className="flex items-center mb-4">
                  <Users className="text-primary mr-3" size={24} />
                  <h2 className="text-2xl font-semibold text-primary">Service Description</h2>
                </div>
                <div className="space-y-4 text-text/80">
                  <p>Mallu Matrimony is an online matrimonial platform that helps individuals find suitable life partners. Our services include:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Profile creation and management</li>
                    <li>Partner search and matching algorithms</li>
                    <li>Communication tools between members</li>
                    <li>Privacy and security features</li>
                    <li>Premium membership benefits</li>
                    <li>Customer support services</li>
                  </ul>
                </div>
              </section>

              {/* User Eligibility */}
              <section>
                <div className="flex items-center mb-4">
                  <Shield className="text-primary mr-3" size={24} />
                  <h2 className="text-2xl font-semibold text-primary">User Eligibility</h2>
                </div>
                <div className="space-y-4 text-text/80">
                  <p>To use our service, you must:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Be at least 18 years of age</li>
                    <li>Be legally eligible to marry under applicable law</li>
                    <li>Provide accurate and truthful information</li>
                    <li>Have the legal capacity to enter into this agreement</li>
                    <li>Not be prohibited from using the service under applicable laws</li>
                  </ul>
                </div>
              </section>

              {/* User Responsibilities */}
              <section>
                <div className="flex items-center mb-4">
                  <Users className="text-primary mr-3" size={24} />
                  <h2 className="text-2xl font-semibold text-primary">User Responsibilities</h2>
                </div>
                <div className="space-y-4 text-text/80">
                  <div>
                    <h3 className="font-medium text-primary mb-2">Profile Information</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Provide accurate, current, and complete information</li>
                      <li>Update your profile to maintain accuracy</li>
                      <li>Use only your own photographs</li>
                      <li>Not misrepresent your identity, age, or marital status</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-medium text-primary mb-2">Conduct Guidelines</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Treat other members with respect and courtesy</li>
                      <li>Use appropriate language in all communications</li>
                      <li>Respect others' privacy and boundaries</li>
                      <li>Report inappropriate behavior or content</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Prohibited Activities */}
              <section>
                <div className="flex items-center mb-4">
                  <AlertTriangle className="text-primary mr-3" size={24} />
                  <h2 className="text-2xl font-semibold text-primary">Prohibited Activities</h2>
                </div>
                <div className="space-y-4 text-text/80">
                  <p>You agree not to:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Create fake or duplicate profiles</li>
                    <li>Harass, abuse, or harm other users</li>
                    <li>Share inappropriate or offensive content</li>
                    <li>Solicit money or financial information</li>
                    <li>Use the service for commercial purposes</li>
                    <li>Attempt to hack or compromise the platform</li>
                    <li>Violate any applicable laws or regulations</li>
                    <li>Share contact information of other users without consent</li>
                    <li>Use automated systems or bots</li>
                    <li>Engage in spam or unsolicited communications</li>
                  </ul>
                </div>
              </section>

              {/* Privacy and Data Protection */}
              <section>
                <div className="flex items-center mb-4">
                  <Shield className="text-primary mr-3" size={24} />
                  <h2 className="text-2xl font-semibold text-primary">Privacy and Data Protection</h2>
                </div>
                <div className="space-y-4 text-text/80">
                  <p>Your privacy is important to us. Our Privacy Policy explains how we collect, use, and protect your information. By using our service, you consent to the collection and use of information as described in our Privacy Policy.</p>
                  <p>You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</p>
                </div>
              </section>

              {/* Payment and Subscriptions */}
              <section>
                <div className="flex items-center mb-4">
                  <Scale className="text-primary mr-3" size={24} />
                  <h2 className="text-2xl font-semibold text-primary">Payment and Subscriptions</h2>
                </div>
                <div className="space-y-4 text-text/80">
                  <div>
                    <h3 className="font-medium text-primary mb-2">Subscription Plans</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>We offer various subscription plans with different features</li>
                      <li>Subscription fees are charged in advance</li>
                      <li>All fees are non-refundable unless otherwise stated</li>
                      <li>Prices may change with 30 days notice</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-medium text-primary mb-2">Auto-Renewal</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Subscriptions automatically renew unless cancelled</li>
                      <li>You can cancel auto-renewal in your account settings</li>
                      <li>Cancellation takes effect at the end of the current billing period</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Intellectual Property */}
              <section>
                <div className="flex items-center mb-4">
                  <FileText className="text-primary mr-3" size={24} />
                  <h2 className="text-2xl font-semibold text-primary">Intellectual Property</h2>
                </div>
                <div className="space-y-4 text-text/80">
                  <p>The service and its original content, features, and functionality are owned by Mallu Matrimony and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.</p>
                  <p>You retain ownership of content you submit, but grant us a license to use, display, and distribute it as necessary to provide the service.</p>
                </div>
              </section>

              {/* Disclaimers */}
              <section>
                <div className="flex items-center mb-4">
                  <AlertTriangle className="text-primary mr-3" size={24} />
                  <h2 className="text-2xl font-semibold text-primary">Disclaimers</h2>
                </div>
                <div className="space-y-4 text-text/80">
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>We do not guarantee that you will find a suitable match</li>
                    <li>We are not responsible for the accuracy of user-provided information</li>
                    <li>We do not conduct background checks on users</li>
                    <li>Users are responsible for their own safety when meeting others</li>
                    <li>The service is provided "as is" without warranties of any kind</li>
                  </ul>
                </div>
              </section>

              {/* Limitation of Liability */}
              <section>
                <div className="flex items-center mb-4">
                  <Scale className="text-primary mr-3" size={24} />
                  <h2 className="text-2xl font-semibold text-primary">Limitation of Liability</h2>
                </div>
                <div className="space-y-4 text-text/80">
                  <p>To the maximum extent permitted by law, Mallu Matrimony shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Loss of profits, data, or use</li>
                    <li>Personal injury or property damage</li>
                    <li>Emotional distress</li>
                    <li>Any damages arising from interactions with other users</li>
                  </ul>
                </div>
              </section>

              {/* Termination */}
              <section>
                <div className="flex items-center mb-4">
                  <AlertTriangle className="text-primary mr-3" size={24} />
                  <h2 className="text-2xl font-semibold text-primary">Termination</h2>
                </div>
                <div className="space-y-4 text-text/80">
                  <p>We may terminate or suspend your account and access to the service immediately, without prior notice, for any reason, including:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Violation of these terms</li>
                    <li>Fraudulent or illegal activity</li>
                    <li>Harassment of other users</li>
                    <li>Providing false information</li>
                  </ul>
                  <p>You may also terminate your account at any time through your account settings.</p>
                </div>
              </section>

              {/* Governing Law */}
              <section>
                <div className="flex items-center mb-4">
                  <Scale className="text-primary mr-3" size={24} />
                  <h2 className="text-2xl font-semibold text-primary">Governing Law</h2>
                </div>
                <div className="space-y-4 text-text/80">
                  <p>These terms shall be governed by and construed in accordance with the laws of India. Any disputes arising from these terms or the use of the service shall be subject to the exclusive jurisdiction of the courts in Kerala, India.</p>
                </div>
              </section>

              {/* Changes to Terms */}
              <section>
                <div className="flex items-center mb-4">
                  <FileText className="text-primary mr-3" size={24} />
                  <h2 className="text-2xl font-semibold text-primary">Changes to Terms</h2>
                </div>
                <div className="space-y-4 text-text/80">
                  <p>We reserve the right to modify these terms at any time. We will notify users of any material changes by:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Posting the updated terms on our website</li>
                    <li>Sending email notifications to registered users</li>
                    <li>Displaying prominent notices on the platform</li>
                  </ul>
                  <p>Your continued use of the service after any changes constitutes acceptance of the new terms.</p>
                </div>
              </section>

              {/* Contact Information */}
              <section className="bg-primary/5 p-6 rounded-lg">
                <div className="flex items-center mb-4">
                  <Users className="text-primary mr-3" size={24} />
                  <h2 className="text-2xl font-semibold text-primary">Contact Us</h2>
                </div>
                <div className="space-y-4 text-text/80">
                  <p>If you have any questions about these Terms of Service, please contact us:</p>
                  <div className="space-y-2">
                    <p><strong>Email:</strong> legal@mallumatrimony.com</p>
                    <p><strong>Address:</strong> 09/263, Kanchiyar P.O, Idukki, Kerala - 685511, India</p>
                    <p><strong>Support:</strong> Available through our contact form</p>
                  </div>
                  <p className="mt-4">We will respond to your inquiry within 30 days.</p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfServicePage;