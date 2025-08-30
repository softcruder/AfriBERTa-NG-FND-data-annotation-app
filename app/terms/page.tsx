import { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Terms of Service | AfriBERTa NG",
  description: "Terms of service for the AfriBERTa NG data annotation platform",
}

export default function TermsPage() {
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
          <h1 className="text-4xl font-bold text-foreground mb-2">Terms of Service</h1>
          <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p className="mb-4">
              By accessing and using the AfriBERTa NG data annotation platform (&quot;Platform&quot;, &quot;Service&quot;), 
              you accept and agree to be bound by the terms and provision of this agreement 
              (&quot;Terms of Service&quot;, &quot;Agreement&quot;).
            </p>
            <p className="mb-4">
              If you do not agree to abide by the above, please do not use this service. 
              These terms apply to all users of the platform, including annotators, 
              administrators, and quality assurance personnel.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
            <p className="mb-4">
              AfriBERTa NG is a data annotation platform designed for fake news detection research. 
              The platform provides tools for:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Text annotation and classification</li>
              <li>Quality assurance and review processes</li>
              <li>Progress tracking and performance monitoring</li>
              <li>Payment management for annotators</li>
              <li>Data export and analysis capabilities</li>
            </ul>
            <p className="mb-4">
              The platform integrates with Google Drive for data storage and management, 
              requiring appropriate authentication and authorization.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. User Accounts and Authentication</h2>
            
            <h3 className="text-xl font-medium mb-3">3.1 Account Creation</h3>
            <p className="mb-4">
              Users must authenticate through Google OAuth to access the platform. 
              By creating an account, you warrant that you are at least 18 years of age 
              and have the legal capacity to enter into this agreement.
            </p>

            <h3 className="text-xl font-medium mb-3">3.2 Account Security</h3>
            <p className="mb-4">
              You are responsible for maintaining the confidentiality of your account 
              and for all activities that occur under your account. You agree to immediately 
              notify us of any unauthorized use of your account.
            </p>

            <h3 className="text-xl font-medium mb-3">3.3 User Roles</h3>
            <p className="mb-4">The platform supports different user roles with varying permissions:</p>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Annotators:</strong> Perform data annotation tasks</li>
              <li><strong>Quality Assurance:</strong> Review and validate annotations</li>
              <li><strong>Administrators:</strong> Manage platform configuration and user access</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Acceptable Use Policy</h2>
            
            <h3 className="text-xl font-medium mb-3">4.1 Permitted Uses</h3>
            <p className="mb-4">You may use the platform solely for:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Legitimate data annotation and research purposes</li>
              <li>Quality assurance activities</li>
              <li>Platform administration (if authorized)</li>
              <li>Educational and academic research</li>
            </ul>

            <h3 className="text-xl font-medium mb-3">4.2 Prohibited Activities</h3>
            <p className="mb-4">You agree not to:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Attempt to gain unauthorized access to any part of the platform</li>
              <li>Interfere with or disrupt the platform&apos;s operation</li>
              <li>Use automated tools to access the platform without permission</li>
              <li>Share your account credentials with others</li>
              <li>Submit false, misleading, or malicious annotations</li>
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe on intellectual property rights</li>
              <li>Attempt to reverse engineer or extract platform algorithms</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Data and Content</h2>
            
            <h3 className="text-xl font-medium mb-3">5.1 Annotation Data</h3>
            <p className="mb-4">
              All annotations, classifications, and quality assessments you provide through 
              the platform become part of the research dataset. You grant us a worldwide, 
              royalty-free license to use this data for research and platform improvement purposes.
            </p>

            <h3 className="text-xl font-medium mb-3">5.2 Data Accuracy</h3>
            <p className="mb-4">
              You agree to provide accurate, honest, and high-quality annotations to the best 
              of your ability. Deliberately providing incorrect annotations may result in 
              account suspension and forfeiture of compensation.
            </p>

            <h3 className="text-xl font-medium mb-3">5.3 Confidentiality</h3>
            <p className="mb-4">
              Some annotation tasks may involve sensitive or confidential information. 
              You agree to maintain confidentiality and not disclose such information 
              to unauthorized parties.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Payment Terms (For Annotators)</h2>
            
            <h3 className="text-xl font-medium mb-3">6.1 Compensation</h3>
            <p className="mb-4">
              Annotators may receive compensation based on completed work, quality metrics, 
              and agreed-upon rates. Payment terms will be communicated separately and 
              may vary by project or user agreement.
            </p>

            <h3 className="text-xl font-medium mb-3">6.2 Payment Processing</h3>
            <p className="mb-4">
              Payments are processed according to the schedule and methods specified 
              in your annotator agreement. You are responsible for providing accurate 
              payment information and any applicable tax obligations.
            </p>

            <h3 className="text-xl font-medium mb-3">6.3 Quality Requirements</h3>
            <p className="mb-4">
              Compensation is contingent upon meeting quality standards and completion 
              requirements. Work that fails to meet quality thresholds may not be compensated.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Intellectual Property</h2>
            
            <h3 className="text-xl font-medium mb-3">7.1 Platform Ownership</h3>
            <p className="mb-4">
              The platform, including its design, functionality, and underlying technology, 
              is owned by us and protected by intellectual property laws. You may not 
              reproduce, modify, or distribute the platform without permission.
            </p>

            <h3 className="text-xl font-medium mb-3">7.2 User Content</h3>
            <p className="mb-4">
              You retain ownership of any original content you submit, but grant us the 
              rights necessary to operate the platform and conduct research using your 
              annotations and feedback.
            </p>

            <h3 className="text-xl font-medium mb-3">7.3 Research Data</h3>
            <p className="mb-4">
              Aggregated and anonymized data from the platform may be used for academic 
              research, publications, and platform improvements. Individual user data 
              will not be disclosed without consent.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Privacy and Data Protection</h2>
            <p className="mb-4">
              Your privacy is important to us. Our collection, use, and protection of your 
              personal information is governed by our Privacy Policy, which is incorporated 
              into these terms by reference. Please review our Privacy Policy to understand 
              our practices.
            </p>
            <p className="mb-4">
              We comply with applicable data protection regulations and implement appropriate 
              security measures to protect your information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Platform Availability and Modifications</h2>
            
            <h3 className="text-xl font-medium mb-3">9.1 Service Availability</h3>
            <p className="mb-4">
              We strive to maintain platform availability but do not guarantee uninterrupted 
              service. Scheduled maintenance, updates, and unforeseen technical issues may 
              cause temporary service disruptions.
            </p>

            <h3 className="text-xl font-medium mb-3">9.2 Platform Modifications</h3>
            <p className="mb-4">
              We reserve the right to modify, update, or discontinue features of the platform 
              at any time. We will provide reasonable notice of significant changes that 
              affect user functionality.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Limitation of Liability</h2>
            <p className="mb-4">
              To the maximum extent permitted by law, we shall not be liable for any indirect, 
              incidental, special, consequential, or punitive damages, including but not limited 
              to loss of profits, data, or use, arising from your use of the platform.
            </p>
            <p className="mb-4">
              Our total liability for any claim arising from these terms or your use of the 
              platform shall not exceed the amount you have paid us in the 12 months preceding 
              the claim.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Termination</h2>
            
            <h3 className="text-xl font-medium mb-3">11.1 User Termination</h3>
            <p className="mb-4">
              You may terminate your account at any time by discontinuing use of the platform 
              and requesting account deletion through our support channels.
            </p>

            <h3 className="text-xl font-medium mb-3">11.2 Our Right to Terminate</h3>
            <p className="mb-4">
              We may suspend or terminate your account immediately if you violate these terms, 
              engage in prohibited activities, or if we determine that continued access poses 
              a risk to the platform or other users.
            </p>

            <h3 className="text-xl font-medium mb-3">11.3 Effect of Termination</h3>
            <p className="mb-4">
              Upon termination, your right to access and use the platform ceases immediately. 
              Data and annotations you provided may be retained for research purposes in 
              accordance with our Privacy Policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">12. Dispute Resolution</h2>
            <p className="mb-4">
              Any disputes arising from these terms or your use of the platform will be 
              resolved through binding arbitration in accordance with applicable arbitration 
              rules, rather than in court, except that you may assert claims in small claims 
              court if your claims qualify.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">13. Changes to Terms</h2>
            <p className="mb-4">
              We may modify these terms at any time by posting the revised terms on the platform. 
              Your continued use of the platform after such modifications constitutes acceptance 
              of the updated terms. We will provide notice of material changes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">14. Governing Law</h2>
            <p className="mb-4">
              These terms are governed by and construed in accordance with applicable laws, 
              without regard to conflict of law principles. Any legal action or proceeding 
              shall be brought in the appropriate jurisdiction.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">15. Contact Information</h2>
            <p className="mb-4">
              If you have any questions about these Terms of Service, please contact us 
              through the platform&apos;s support channels or at the contact information 
              provided on our website.
            </p>
            <p className="mb-4">
              For technical support, privacy concerns, or general inquiries, please use 
              the appropriate support channels within the platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">16. Severability</h2>
            <p className="mb-4">
              If any provision of these terms is held to be invalid or unenforceable, 
              the remaining provisions will remain in full force and effect. The invalid 
              or unenforceable provision will be replaced with a valid provision that 
              most closely approximates the intent of the original provision.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}