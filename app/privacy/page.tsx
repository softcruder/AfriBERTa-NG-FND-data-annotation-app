import { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Privacy Policy | AfriBERTa NG",
  description: "Privacy policy for the AfriBERTa NG data annotation platform",
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-4xl font-bold text-foreground mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p className="mb-4">
              AfriBERTa NG (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) operates the data annotation platform 
              for fake news detection research. This Privacy Policy explains how we collect, use, 
              disclose, and safeguard your information when you use our service.
            </p>
            <p className="mb-4">
              We are committed to protecting your privacy and ensuring the security of your personal 
              information. By using our platform, you agree to the collection and use of information 
              in accordance with this policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
            
            <h3 className="text-xl font-medium mb-3">2.1 Personal Information</h3>
            <p className="mb-4">We may collect the following personal information:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Name and contact information (email address)</li>
              <li>Google account information (when using Google OAuth)</li>
              <li>Professional affiliation and role</li>
              <li>Authentication credentials</li>
            </ul>

            <h3 className="text-xl font-medium mb-3">2.2 Usage Data</h3>
            <p className="mb-4">We automatically collect certain information when you use our platform:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Annotation activities and progress</li>
              <li>Login timestamps and session duration</li>
              <li>Platform interaction data</li>
              <li>Device and browser information</li>
              <li>IP address and location data (general location only)</li>
            </ul>

            <h3 className="text-xl font-medium mb-3">2.3 Annotation Data</h3>
            <p className="mb-4">
              All annotation work, including text classifications, quality assessments, 
              and feedback provided through our platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
            <p className="mb-4">We use the collected information for the following purposes:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Providing and maintaining our annotation platform</li>
              <li>Authenticating users and managing access controls</li>
              <li>Tracking annotation progress and quality metrics</li>
              <li>Processing payments to annotators</li>
              <li>Improving platform functionality and user experience</li>
              <li>Conducting research on fake news detection</li>
              <li>Communicating with users about platform updates</li>
              <li>Ensuring platform security and preventing misuse</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Data Storage and Security</h2>
            
            <h3 className="text-xl font-medium mb-3">4.1 Google Drive Integration</h3>
            <p className="mb-4">
              Our platform integrates with Google Drive for data storage and management. 
              Administrator accounts have access to configure Google Drive connections, 
              while annotators access data through controlled, read-only mechanisms.
            </p>

            <h3 className="text-xl font-medium mb-3">4.2 Security Measures</h3>
            <p className="mb-4">We implement appropriate security measures including:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Encrypted data transmission (HTTPS/TLS)</li>
              <li>Secure authentication via Google OAuth 2.0</li>
              <li>Role-based access controls</li>
              <li>Regular security assessments</li>
              <li>Limited data retention policies</li>
            </ul>

            <h3 className="text-xl font-medium mb-3">4.3 Data Retention</h3>
            <p className="mb-4">
              We retain personal information only as long as necessary for the purposes 
              outlined in this policy or as required by law. Annotation data may be 
              retained for research purposes in anonymized form.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Data Sharing and Disclosure</h2>
            <p className="mb-4">We do not sell, trade, or otherwise transfer your personal information to third parties except:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>With your explicit consent</li>
              <li>To comply with legal obligations</li>
              <li>To protect our rights and the safety of users</li>
              <li>For legitimate research purposes (anonymized data only)</li>
              <li>With trusted service providers who assist in platform operations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Google API Services</h2>
            <p className="mb-4">
              Our platform uses Google API Services for authentication and data access. 
              Google&apos;s privacy policy applies to any information collected by Google. 
              We limit our use of Google user data to the minimum necessary for platform functionality.
            </p>
            <p className="mb-4">
              Users can revoke access to their Google account at any time through their 
              Google Account settings.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Your Rights</h2>
            <p className="mb-4">You have the right to:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Access your personal information</li>
              <li>Correct inaccurate or incomplete data</li>
              <li>Request deletion of your personal information</li>
              <li>Object to processing of your personal information</li>
              <li>Data portability (where technically feasible)</li>
              <li>Withdraw consent at any time</li>
            </ul>
            <p className="mb-4">
              To exercise these rights, please contact us using the information provided below.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Children&apos;s Privacy</h2>
            <p className="mb-4">
              Our platform is not intended for children under 13 years of age. We do not 
              knowingly collect personal information from children under 13. If we become 
              aware that we have collected personal information from a child under 13, 
              we will take steps to delete such information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. International Data Transfers</h2>
            <p className="mb-4">
              Your information may be transferred to and processed in countries other than 
              your country of residence. We ensure that such transfers are conducted in 
              accordance with applicable data protection laws and provide appropriate safeguards.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Changes to This Privacy Policy</h2>
            <p className="mb-4">
              We may update this Privacy Policy from time to time. We will notify users of 
              any material changes by posting the new Privacy Policy on this page and updating 
              the &quot;Last updated&quot; date. Continued use of the platform after changes constitutes 
              acceptance of the updated policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Contact Information</h2>
            <p className="mb-4">
              If you have any questions about this Privacy Policy or our privacy practices, 
              please contact us through the platform or at the contact information provided 
              in our Terms of Service.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}