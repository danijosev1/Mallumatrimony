import React from 'react';
import { Shield, Eye, Lock, Database, UserCheck, Mail } from 'lucide-react';

const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="pt-20 bg-background min-h-screen">
      <div className="container-custom py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="text-primary" size={32} />
            </div>
            <h1 className="text-4xl font-bold text-primary mb-4">Privacy Policy</h1>
            <p className="text-lg text-text/70">
              Your privacy is important to us. This policy explains how we collect, use, and protect your information.
            </p>
            <p className="text-sm text-text/60 mt-2">Last updated: December 2024</p>
          </div>

          {/* Content */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-8 space-y-8">
              
              {/* Information We Collect */}
              <section>
                <div className="flex items-center mb-4">
                  <Database className="text-primary mr-3" size={24} />
                  <h2 className="text-2xl font-semibold text-primary">Information We Collect</h2>
                </div>
                <div className="space-y-4 text-text/80">
                  <div>
                    <h3 className="font-medium text-primary mb-2">Personal Information</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Name, email address, phone number, and date of birth</li>
                      <li>Profile photos and personal descriptions</li>
                      <li>Educational and professional background</li>
                      <li>Family details and preferences</li>
                      <li>Religious and cultural information</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-medium text-primary mb-2">Usage Information</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Profile views, interactions, and messaging activity</li>
                      <li>Search preferences and match criteria</li>
                      <li>Device information and IP address</li>
                      <li>Cookies and similar tracking technologies</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* How We Use Information */}
              <section>
                <div className="flex items-center mb-4">
                  <UserCheck className="text-primary mr-3" size={24} />
                  <h2 className="text-2xl font-semibold text-primary">How We Use Your Information</h2>
                </div>
                <div className="space-y-4 text-text/80">
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>To create and maintain your matrimonial profile</li>
                    <li>To provide personalized match recommendations</li>
                    <li>To facilitate communication between members</li>
                    <li>To improve our services and user experience</li>
                    <li>To send important updates and notifications</li>
                    <li>To prevent fraud and ensure platform safety</li>
                    <li>To comply with legal obligations</li>
                  </ul>
                </div>
              </section>

              {/* Information Sharing */}
              <section>
                <div className="flex items-center mb-4">
                  <Eye className="text-primary mr-3" size={24} />
                  <h2 className="text-2xl font-semibold text-primary">Information Sharing</h2>
                </div>
                <div className="space-y-4 text-text/80">
                  <div>
                    <h3 className="font-medium text-primary mb-2">With Other Members</h3>
                    <p>Your profile information is visible to other verified members based on your privacy settings. You control what information is shared and with whom.</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-primary mb-2">With Service Providers</h3>
                    <p>We may share information with trusted third-party service providers who help us operate our platform, such as hosting, analytics, and customer support services.</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-primary mb-2">Legal Requirements</h3>
                    <p>We may disclose information when required by law, court order, or to protect our rights and the safety of our users.</p>
                  </div>
                </div>
              </section>

              {/* Data Security */}
              <section>
                <div className="flex items-center mb-4">
                  <Lock className="text-primary mr-3" size={24} />
                  <h2 className="text-2xl font-semibold text-primary">Data Security</h2>
                </div>
                <div className="space-y-4 text-text/80">
                  <p>We implement industry-standard security measures to protect your personal information:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>SSL encryption for all data transmission</li>
                    <li>Secure servers with regular security updates</li>
                    <li>Profile verification to prevent fake accounts</li>
                    <li>Regular security audits and monitoring</li>
                    <li>Limited access to personal data by authorized personnel only</li>
                    <li>Secure payment processing through trusted providers</li>
                  </ul>
                </div>
              </section>

              {/* Your Rights */}
              <section>
                <div className="flex items-center mb-4">
                  <UserCheck className="text-primary mr-3" size={24} />
                  <h2 className="text-2xl font-semibold text-primary">Your Rights and Choices</h2>
                </div>
                <div className="space-y-4 text-text/80">
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li><strong>Access:</strong> Request a copy of your personal information</li>
                    <li><strong>Update:</strong> Modify or correct your profile information</li>
                    <li><strong>Delete:</strong> Request deletion of your account and data</li>
                    <li><strong>Privacy Settings:</strong> Control who can view your profile</li>
                    <li><strong>Communication Preferences:</strong> Manage email and notification settings</li>
                    <li><strong>Data Portability:</strong> Request your data in a portable format</li>
                  </ul>
                </div>
              </section>

              {/* Cookies and Tracking */}
              <section>
                <div className="flex items-center mb-4">
                  <Eye className="text-primary mr-3" size={24} />
                  <h2 className="text-2xl font-semibold text-primary">Cookies and Tracking</h2>
                </div>
                <div className="space-y-4 text-text/80">
                  <p>We use cookies and similar technologies to:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Remember your login status and preferences</li>
                    <li>Analyze website usage and improve performance</li>
                    <li>Provide personalized content and recommendations</li>
                    <li>Ensure security and prevent fraud</li>
                  </ul>
                  <p className="mt-4">You can control cookie settings through your browser preferences.</p>
                </div>
              </section>

              {/* Data Retention */}
              <section>
                <div className="flex items-center mb-4">
                  <Database className="text-primary mr-3" size={24} />
                  <h2 className="text-2xl font-semibold text-primary">Data Retention</h2>
                </div>
                <div className="space-y-4 text-text/80">
                  <p>We retain your information for as long as necessary to:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Provide our services to you</li>
                    <li>Comply with legal obligations</li>
                    <li>Resolve disputes and enforce agreements</li>
                    <li>Improve our services and user experience</li>
                  </ul>
                  <p className="mt-4">When you delete your account, we will delete or anonymize your personal information within 30 days, except where retention is required by law.</p>
                </div>
              </section>

              {/* Children's Privacy */}
              <section>
                <div className="flex items-center mb-4">
                  <Shield className="text-primary mr-3" size={24} />
                  <h2 className="text-2xl font-semibold text-primary">Children's Privacy</h2>
                </div>
                <div className="space-y-4 text-text/80">
                  <p>Our service is intended for adults aged 18 and above. We do not knowingly collect personal information from children under 18. If we become aware that we have collected information from a child under 18, we will take steps to delete such information promptly.</p>
                </div>
              </section>

              {/* International Transfers */}
              <section>
                <div className="flex items-center mb-4">
                  <Database className="text-primary mr-3" size={24} />
                  <h2 className="text-2xl font-semibold text-primary">International Data Transfers</h2>
                </div>
                <div className="space-y-4 text-text/80">
                  <p>Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your information in accordance with this privacy policy and applicable laws.</p>
                </div>
              </section>

              {/* Changes to Policy */}
              <section>
                <div className="flex items-center mb-4">
                  <Mail className="text-primary mr-3" size={24} />
                  <h2 className="text-2xl font-semibold text-primary">Changes to This Policy</h2>
                </div>
                <div className="space-y-4 text-text/80">
                  <p>We may update this privacy policy from time to time. We will notify you of any material changes by:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Posting the updated policy on our website</li>
                    <li>Sending you an email notification</li>
                    <li>Displaying a prominent notice on our platform</li>
                  </ul>
                  <p className="mt-4">Your continued use of our service after any changes indicates your acceptance of the updated policy.</p>
                </div>
              </section>

              {/* Contact Information */}
              <section className="bg-primary/5 p-6 rounded-lg">
                <div className="flex items-center mb-4">
                  <Mail className="text-primary mr-3" size={24} />
                  <h2 className="text-2xl font-semibold text-primary">Contact Us</h2>
                </div>
                <div className="space-y-4 text-text/80">
                  <p>If you have any questions about this privacy policy or our data practices, please contact us:</p>
                  <div className="space-y-2">
                    <p><strong>Email:</strong> privacy@mallumatrimony.com</p>
                    <p><strong>Address:</strong> 09/263, Kanchiyar P.O, Idukki, Kerala - 685511, India</p>
                    <p><strong>Phone:</strong> Available through our contact form</p>
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

export default PrivacyPolicyPage;