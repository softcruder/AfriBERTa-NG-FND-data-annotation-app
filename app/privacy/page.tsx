import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Privacy Policy | AfriBERTa NG Data Annotation Platform",
  description: "Privacy policy for AfriBERTa NG fake news detection data annotation platform",
}

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <Image src="/logo.png" alt="AfriBERTa NG Logo" width={80} height={80} />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground">AfriBERTa NG Data Annotation Platform</p>
          <p className="text-sm text-muted-foreground mt-2">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        {/* Navigation */}
        <div className="mb-8 text-center">
          <Link href="/" className="text-primary hover:underline mr-4">
            ← Back to Home
          </Link>
          <Link href="/terms" className="text-primary hover:underline">
            View Terms of Service
          </Link>
        </div>

        <div className="prose prose-lg max-w-none">
          {/* Introduction */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p className="mb-4">
              Welcome to AfriBERTa NG Data Annotation Platform (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). This privacy policy explains how we collect, use, protect, and share information about you when you use our fake news detection data annotation platform.
            </p>
            <p className="mb-4">
              Our platform is designed to facilitate the annotation of data for training machine learning models to detect fake news, with a focus on Nigerian and African contexts. We are committed to protecting your privacy and handling your data responsibly.
            </p>
          </section>

          {/* Information We Collect */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
            
            <h3 className="text-xl font-medium mb-3">2.1 Account Information</h3>
            <p className="mb-4">When you sign in using Google OAuth, we collect:</p>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Basic Profile Information:</strong> Name, email address, profile picture</li>
              <li><strong>Google Account ID:</strong> Unique identifier from your Google account</li>
              <li><strong>Authentication Tokens:</strong> Access and refresh tokens for API access</li>
            </ul>

            <h3 className="text-xl font-medium mb-3">2.2 Usage Data</h3>
            <p className="mb-4">We collect information about how you use our platform:</p>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Annotation Data:</strong> Your data annotation work, including labels, classifications, and comments</li>
              <li><strong>Performance Metrics:</strong> Time spent on annotations, accuracy scores, productivity statistics</li>
              <li><strong>Session Information:</strong> Login times, session duration, feature usage</li>
              <li><strong>Technical Data:</strong> Browser type, device information, IP address (anonymized)</li>
            </ul>

            <h3 className="text-xl font-medium mb-3">2.3 Google Services Integration</h3>
            <p className="mb-4">Our platform integrates with Google services and may access:</p>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Google Drive:</strong> Read-only access to specific data files for annotation</li>
              <li><strong>Google Sheets:</strong> Read and write access to manage annotation data and user statistics</li>
            </ul>
          </section>

          {/* Why We Collect Information */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Why We Collect Information</h2>
            
            <h3 className="text-xl font-medium mb-3">3.1 Platform Functionality</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>Authenticate users and maintain secure sessions</li>
              <li>Provide access to annotation tools and data</li>
              <li>Track annotation progress and quality</li>
              <li>Manage user roles (annotator vs. admin)</li>
            </ul>

            <h3 className="text-xl font-medium mb-3">3.2 Google OAuth Scopes Justification</h3>
            <p className="mb-4">We request the following Google OAuth scopes for legitimate business purposes:</p>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>openid, email, profile:</strong> Essential for user authentication and identification</li>
              <li><strong>drive.readonly:</strong> Required to access data files stored in Google Drive for annotation tasks</li>
              <li><strong>spreadsheets:</strong> Necessary to store annotation results, track user progress, and manage platform data</li>
            </ul>

            <h3 className="text-xl font-medium mb-3">3.3 Research and Quality Improvement</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>Improve the quality of fake news detection models</li>
              <li>Enhance platform usability and features</li>
              <li>Generate anonymized research insights</li>
            </ul>
          </section>

          {/* Data Security */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Data Security</h2>
            <p className="mb-4">We implement robust security measures to protect your data:</p>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Encryption:</strong> All session data is encrypted using AES-256-GCM encryption</li>
              <li><strong>Secure Cookies:</strong> Session cookies are httpOnly, secure, and properly configured</li>
              <li><strong>Access Controls:</strong> Role-based access with admin authorization for specific email addresses</li>
              <li><strong>Regular Security Reviews:</strong> Ongoing assessment of security practices</li>
              <li><strong>Data Minimization:</strong> We only collect data necessary for platform functionality</li>
            </ul>
          </section>

          {/* Data Sharing */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Data Sharing and Disclosure</h2>
            
            <h3 className="text-xl font-medium mb-3">5.1 Research Partners</h3>
            <p className="mb-4">
              Anonymized annotation data may be shared with academic research partners for the purpose of advancing fake news detection research. Personal identifiers are never included in research datasets.
            </p>

            <h3 className="text-xl font-medium mb-3">5.2 Service Providers</h3>
            <p className="mb-4">We may share data with trusted service providers who help us operate our platform:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Google Cloud Platform for authentication and data storage</li>
              <li>Vercel for application hosting and analytics</li>
              <li>These providers are bound by strict data protection agreements</li>
            </ul>

            <h3 className="text-xl font-medium mb-3">5.3 Legal Requirements</h3>
            <p className="mb-4">
              We may disclose information if required by law, court order, or to protect the rights and safety of our users and platform.
            </p>
          </section>

          {/* Data Retention */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Data Retention</h2>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Account Data:</strong> Retained while your account is active</li>
              <li><strong>Annotation Data:</strong> Retained for research purposes unless deletion is requested</li>
              <li><strong>Session Data:</strong> Automatically expired based on token lifetime</li>
              <li><strong>Analytics Data:</strong> Anonymized and retained for platform improvement</li>
            </ul>
          </section>

          {/* Your Rights */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Your Rights</h2>
            <p className="mb-4">You have the following rights regarding your data:</p>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Correction:</strong> Request correction of inaccurate data</li>
              <li><strong>Deletion:</strong> Request deletion of your account and associated data</li>
              <li><strong>Portability:</strong> Request export of your annotation data</li>
              <li><strong>Withdrawal:</strong> Revoke Google OAuth permissions at any time</li>
            </ul>
            <p className="mb-4">
              To exercise these rights, please contact us at the email address provided below.
            </p>
          </section>

          {/* Third-Party Services */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Third-Party Services</h2>
            <p className="mb-4">Our platform integrates with:</p>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Google OAuth 2.0:</strong> For authentication - governed by Google&apos;s Privacy Policy</li>
              <li><strong>Google Drive API:</strong> For data access - subject to Google&apos;s Terms of Service</li>
              <li><strong>Google Sheets API:</strong> For data management - subject to Google&apos;s Terms of Service</li>
              <li><strong>Vercel Analytics:</strong> For usage analytics - anonymized data only</li>
            </ul>
          </section>

          {/* International Transfers */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. International Data Transfers</h2>
            <p className="mb-4">
              Our platform may transfer and process data internationally. We ensure appropriate safeguards are in place for cross-border data transfers, including adherence to data protection frameworks and service provider agreements.
            </p>
          </section>

          {/* Changes to Policy */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Changes to This Policy</h2>
            <p className="mb-4">
              We may update this privacy policy from time to time. We will notify users of significant changes via email or platform notification. Continued use of the platform after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          {/* Contact Information */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Contact Us</h2>
            <p className="mb-4">
              If you have questions about this privacy policy or our data practices, please contact us:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Project Lead:</strong> oladipona17@gmail.com</li>
              <li><strong>Technical Lead:</strong> nasirullah.m1901406@st.futminna.edu.ng</li>
              <li><strong>Platform:</strong> AfriBERTa NG Data Annotation Platform</li>
            </ul>
          </section>

          {/* Footer */}
          <div className="border-t pt-6 mt-8 text-center text-sm text-muted-foreground">
            <p>© 2024 AfriBERTa NG Data Annotation Platform. All rights reserved.</p>
            <p>This platform is designed to advance research in fake news detection for African contexts.</p>
          </div>
        </div>
      </div>
    </div>
  )
}