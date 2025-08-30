import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Terms of Service | AfriBERTa NG Data Annotation Platform",
  description: "Terms of service for AfriBERTa NG fake news detection data annotation platform",
}

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <Image src="/logo.png" alt="AfriBERTa NG Logo" width={80} height={80} />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Terms of Service</h1>
          <p className="text-muted-foreground">AfriBERTa NG Data Annotation Platform</p>
          <p className="text-sm text-muted-foreground mt-2">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        {/* Navigation */}
        <div className="mb-8 text-center">
          <Link href="/" className="text-primary hover:underline mr-4">
            ← Back to Home
          </Link>
          <Link href="/privacy" className="text-primary hover:underline">
            View Privacy Policy
          </Link>
        </div>

        <div className="prose prose-lg max-w-none">
          {/* Introduction */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p className="mb-4">
              Welcome to AfriBERTa NG Data Annotation Platform (&quot;Platform,&quot; &quot;Service,&quot; &quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). These Terms of Service (&quot;Terms&quot;) govern your access to and use of our fake news detection data annotation platform.
            </p>
            <p className="mb-4">
              By accessing or using our Platform, you agree to be bound by these Terms. If you do not agree to these Terms, you may not access or use the Platform.
            </p>
          </section>

          {/* Platform Description */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Platform Description</h2>
            <p className="mb-4">
              AfriBERTa NG Data Annotation Platform is a professional system designed to facilitate the annotation of textual data for training machine learning models to detect fake news, with a particular focus on Nigerian and African contexts.
            </p>
            
            <h3 className="text-xl font-medium mb-3">2.1 Core Features</h3>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Data Annotation Tools:</strong> Interface for classifying and labeling news articles and text content</li>
              <li><strong>User Management:</strong> Role-based access with annotator and administrator roles</li>
              <li><strong>Progress Tracking:</strong> Performance metrics and annotation quality monitoring</li>
              <li><strong>Google Integration:</strong> Seamless access to data stored in Google Drive and Sheets</li>
              <li><strong>Payment Management:</strong> Tracking of compensation for annotation work</li>
            </ul>

            <h3 className="text-xl font-medium mb-3">2.2 Research Purpose</h3>
            <p className="mb-4">
              This platform is developed for academic and research purposes to advance the field of automatic fake news detection, particularly for African languages and contexts.
            </p>
          </section>

          {/* User Accounts */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
            
            <h3 className="text-xl font-medium mb-3">3.1 Account Creation</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>Accounts are created using Google OAuth authentication</li>
              <li>You must provide accurate and complete information</li>
              <li>You are responsible for maintaining account security</li>
              <li>One person may not maintain multiple accounts</li>
            </ul>

            <h3 className="text-xl font-medium mb-3">3.2 User Roles</h3>
            <p className="mb-4"><strong>Annotators:</strong></p>
            <ul className="list-disc pl-6 mb-4">
              <li>Access to annotation tools and assigned datasets</li>
              <li>Ability to view personal performance metrics</li>
              <li>Compensation tracking for completed work</li>
            </ul>

            <p className="mb-4"><strong>Administrators:</strong></p>
            <ul className="list-disc pl-6 mb-4">
              <li>Full platform access and user management</li>
              <li>Data configuration and export capabilities</li>
              <li>Payment management and quality assurance</li>
              <li>Access restricted to authorized email addresses</li>
            </ul>

            <h3 className="text-xl font-medium mb-3">3.3 Account Suspension</h3>
            <p className="mb-4">
              We reserve the right to suspend or terminate accounts that violate these Terms, engage in fraudulent activity, or compromise annotation quality.
            </p>
          </section>

          {/* Data Annotation Guidelines */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Data Annotation Guidelines</h2>
            
            <h3 className="text-xl font-medium mb-3">4.1 Annotation Standards</h3>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Accuracy:</strong> Provide honest, accurate annotations based on provided guidelines</li>
              <li><strong>Consistency:</strong> Follow established labeling criteria consistently</li>
              <li><strong>Completeness:</strong> Complete assigned annotation tasks thoroughly</li>
              <li><strong>Timeliness:</strong> Submit annotations within agreed timeframes</li>
            </ul>

            <h3 className="text-xl font-medium mb-3">4.2 Quality Assurance</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>Annotations may be subject to quality review</li>
              <li>Repeated low-quality work may result in account suspension</li>
              <li>Inter-annotator agreement may be measured for research purposes</li>
              <li>Feedback will be provided to help improve annotation quality</li>
            </ul>

            <h3 className="text-xl font-medium mb-3">4.3 Prohibited Practices</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>Random or careless annotation without proper consideration</li>
              <li>Copying annotations from other annotators</li>
              <li>Using automated tools to complete annotations</li>
              <li>Sharing login credentials with other individuals</li>
            </ul>
          </section>

          {/* Google Services Integration */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Google Services Integration</h2>
            
            <h3 className="text-xl font-medium mb-3">5.1 Required Permissions</h3>
            <p className="mb-4">To use this Platform, you must grant the following Google OAuth permissions:</p>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Basic Profile Access:</strong> For user identification and authentication</li>
              <li><strong>Google Drive (Read-only):</strong> To access annotation datasets stored in Drive</li>
              <li><strong>Google Sheets:</strong> To store annotation results and track progress</li>
            </ul>

            <h3 className="text-xl font-medium mb-3">5.2 Data Access</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>We only access Google services necessary for platform functionality</li>
              <li>Your Google data is accessed in accordance with our Privacy Policy</li>
              <li>You can revoke permissions at any time through your Google account settings</li>
              <li>Revoking permissions will terminate your access to the Platform</li>
            </ul>
          </section>

          {/* Compensation and Payments */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Compensation and Payments</h2>
            
            <h3 className="text-xl font-medium mb-3">6.1 Payment Structure</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>Compensation rates will be clearly communicated before annotation work begins</li>
              <li>Payments are typically based on quantity and quality of completed annotations</li>
              <li>Payment schedules and methods will be specified in separate agreements</li>
              <li>Only accurately completed annotations are eligible for compensation</li>
            </ul>

            <h3 className="text-xl font-medium mb-3">6.2 Payment Conditions</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>Payments are subject to quality review and approval</li>
              <li>Tax obligations are the responsibility of the annotator</li>
              <li>Payment disputes must be raised within 30 days of payment issuance</li>
            </ul>
          </section>

          {/* Intellectual Property */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Intellectual Property</h2>
            
            <h3 className="text-xl font-medium mb-3">7.1 Platform Ownership</h3>
            <p className="mb-4">
              The Platform, including its design, code, and functionality, is owned by the AfriBERTa NG project team and is protected by copyright and other intellectual property laws.
            </p>

            <h3 className="text-xl font-medium mb-3">7.2 Annotation Data</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>Original text data remains property of its original creators/publishers</li>
              <li>Annotation labels created by users may be used for research purposes</li>
              <li>Aggregated, anonymized annotation data may be published in academic research</li>
              <li>Individual annotator identities will not be disclosed in research publications</li>
            </ul>

            <h3 className="text-xl font-medium mb-3">7.3 Research Use</h3>
            <p className="mb-4">
              By using this Platform, you agree that anonymized annotation data may be used for academic research, publication, and the development of fake news detection models.
            </p>
          </section>

          {/* Privacy and Data Protection */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Privacy and Data Protection</h2>
            <p className="mb-4">
              Your privacy is important to us. Our collection, use, and protection of your personal information is governed by our Privacy Policy, which is incorporated into these Terms by reference.
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Personal data is collected only for platform functionality</li>
              <li>All session data is encrypted using industry-standard methods</li>
              <li>You have rights regarding your personal data as outlined in our Privacy Policy</li>
              <li>We comply with applicable data protection regulations</li>
            </ul>
          </section>

          {/* Platform Availability */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Platform Availability</h2>
            
            <h3 className="text-xl font-medium mb-3">9.1 Service Availability</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>We strive to maintain high platform availability but do not guarantee 100% uptime</li>
              <li>Scheduled maintenance will be announced in advance when possible</li>
              <li>We are not liable for losses due to platform downtime</li>
            </ul>

            <h3 className="text-xl font-medium mb-3">9.2 Platform Changes</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>We may modify platform features, functionality, or interface</li>
              <li>Significant changes will be communicated to users</li>
              <li>Continued use after changes constitutes acceptance</li>
            </ul>
          </section>

          {/* Prohibited Conduct */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Prohibited Conduct</h2>
            <p className="mb-4">You agree not to:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Violate any applicable laws or regulations</li>
              <li>Interfere with or disrupt the Platform or its servers</li>
              <li>Attempt to gain unauthorized access to the Platform or user accounts</li>
              <li>Upload malicious code or engage in hacking activities</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Use the Platform for any commercial purposes without authorization</li>
              <li>Misrepresent your identity or provide false information</li>
              <li>Violate the intellectual property rights of others</li>
            </ul>
          </section>

          {/* Disclaimers */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Disclaimers</h2>
            <p className="mb-4">
              THE PLATFORM IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. WE DISCLAIM ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT</li>
              <li>ACCURACY, RELIABILITY, OR COMPLETENESS OF PLATFORM CONTENT</li>
              <li>UNINTERRUPTED OR ERROR-FREE OPERATION</li>
              <li>SECURITY OF DATA OR COMMUNICATIONS</li>
            </ul>
          </section>

          {/* Limitation of Liability */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">12. Limitation of Liability</h2>
            <p className="mb-4">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, OR OTHER INTANGIBLE LOSSES.
            </p>
            <p className="mb-4">
              OUR TOTAL LIABILITY FOR ANY CLAIMS ARISING OUT OF OR RELATING TO THESE TERMS OR THE PLATFORM SHALL NOT EXCEED THE AMOUNT PAID BY YOU TO US IN THE TWELVE MONTHS PRECEDING THE CLAIM.
            </p>
          </section>

          {/* Termination */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">13. Termination</h2>
            
            <h3 className="text-xl font-medium mb-3">13.1 Termination by You</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>You may terminate your account at any time by revoking Google OAuth permissions</li>
              <li>Termination does not affect payments owed for completed work</li>
            </ul>

            <h3 className="text-xl font-medium mb-3">13.2 Termination by Us</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>We may terminate accounts for violation of these Terms</li>
              <li>We may discontinue the Platform with reasonable notice</li>
              <li>Upon termination, your access to the Platform will cease immediately</li>
            </ul>
          </section>

          {/* Governing Law */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">14. Governing Law and Dispute Resolution</h2>
            <p className="mb-4">
              These Terms are governed by and construed in accordance with applicable law. Any disputes arising from these Terms or the Platform will be resolved through good faith negotiation.
            </p>
          </section>

          {/* Changes to Terms */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">15. Changes to Terms</h2>
            <p className="mb-4">
              We may modify these Terms from time to time. We will notify users of material changes via email or platform notification. Continued use of the Platform after changes constitutes acceptance of the updated Terms.
            </p>
          </section>

          {/* Contact Information */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">16. Contact Information</h2>
            <p className="mb-4">
              If you have questions about these Terms, please contact us:
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
            <p>These Terms of Service are effective as of the last updated date above.</p>
          </div>
        </div>
      </div>
    </div>
  )
}