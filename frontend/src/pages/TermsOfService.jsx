import { APP_NAME } from '../lib/config';
import { Link } from 'react-router-dom';
import { useEffect } from 'react';

export default function TermsOfService() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const appName = APP_NAME;
  const lastUpdated = 'March 15, 2026';

  return (
    <div className="page">
      <div className="container legal-page">
        <div className="legal-header">
          <h1 className="legal-title">Terms of Service</h1>
          <p className="legal-updated">Last updated: {lastUpdated}</p>
        </div>

        <div className="legal-body">
          <section className="legal-section">
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing or using <strong>{appName}</strong> (the "Service"), you agree to
              be bound by these Terms of Service ("Terms"). If you do not agree to these Terms,
              please do not use the Service.
            </p>
          </section>

          <section className="legal-section">
            <h2>2. Description of Service</h2>
            <p>
              {appName} is a feedback platform that allows users to submit feedback, feature
              requests, and bug reports. The platform includes an AI-powered assistant (powered
              by third-party AI models via OpenRouter.ai) that helps users structure their
              feedback through a conversational interface. Users can also upvote ideas, comment
              on submissions, follow posts, and track the development status of feedback items
              through a public roadmap.
            </p>
          </section>

          <section className="legal-section">
            <h2>3. Account Registration</h2>
            <ul>
              <li>
                You sign in using Discord OAuth. If email/password registration is enabled,
                you may also create an account with your email address and a password. You
                are responsible for maintaining the security of your account credentials.
              </li>
              <li>
                You must provide accurate information. Impersonation or misrepresentation
                is prohibited.
              </li>
              <li>
                You must be at least 16 years old to use this Service.
              </li>
              <li>
                We may automatically assign administrator privileges to designated email
                addresses as configured by the platform operator.
              </li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>4. User Content</h2>
            <ul>
              <li>
                You retain ownership of the content you submit (feedback posts, comments,
                votes, etc.).
              </li>
              <li>
                By submitting content, you grant us a non-exclusive, worldwide, royalty-free
                license to use, display, and distribute your content within the Service.
              </li>
              <li>
                You may edit or delete your own posts and comments at any time. Administrators
                may also edit or remove content.
              </li>
              <li>
                AI-generated post drafts are based on your conversation with the AI assistant.
                The conversation transcript is stored with your post and is visible only to you
                and platform administrators.
              </li>
              <li>
                Content must not be illegal, abusive, defamatory, infringing on third-party
                rights, or otherwise harmful.
              </li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>5. AI-Assisted Features</h2>
            <ul>
              <li>
                The feedback submission process uses AI to help structure your input. Your
                conversation messages are sent to a third-party AI service (OpenRouter.ai)
                for processing.
              </li>
              <li>
                AI-generated content (titles, post bodies, duplicate detection) is provided
                as suggestions. You can review and edit all AI output before publishing.
              </li>
              <li>
                We do not guarantee the accuracy, completeness, or appropriateness of
                AI-generated content. You are responsible for reviewing the final post
                before publishing.
              </li>
              <li>
                Conversations are rate-limited to prevent abuse (a maximum number of messages
                per minute per user).
              </li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>6. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul>
              <li>Use the Service for any unlawful purpose</li>
              <li>Submit spam, malicious content, or automated bulk submissions</li>
              <li>Attempt to circumvent rate limits or abuse the AI assistant</li>
              <li>Attempt to gain unauthorized access to the Service or its systems</li>
              <li>Spoof fields such as author, status, priority, or vote counts (these are
                enforced server-side regardless)</li>
              <li>Harass, abuse, or intimidate other users</li>
              <li>Attempt to inject malicious instructions into the AI assistant</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>7. Moderation &amp; Content Removal</h2>
            <p>
              Administrators can review, edit, or remove any content. Administrators can also
              change the status, priority, and category of posts. We may suspend or terminate
              accounts that violate these Terms.
            </p>
          </section>

          <section className="legal-section">
            <h2>8. Notifications</h2>
            <p>
              When you participate on the platform (post feedback, comment, favorite a post),
              you may receive in-app notifications about:
            </p>
            <ul>
              <li>Comments on your posts</li>
              <li>Replies to your comments</li>
              <li>Status changes on your posts (e.g., moved to "In Review" or "Done")</li>
              <li>Activity on posts you have favorited or commented on</li>
            </ul>
            <p>You can mark notifications as read or delete them.</p>
          </section>

          <section className="legal-section">
            <h2>9. Privacy &amp; Data Protection</h2>
            <p>
              Your use of the Service is also governed by our{' '}
              <Link to="/privacy" className="legal-link">Privacy Policy</Link>,
              which describes how we collect, use, and protect your personal data in
              compliance with the GDPR.
            </p>
          </section>

          <section className="legal-section">
            <h2>10. Disclaimer of Warranties</h2>
            <p>
              The Service is provided "as is" and "as available" without warranties of any
              kind, either express or implied. This includes the AI-assisted features, which
              may produce inaccurate, incomplete, or inappropriate outputs.
            </p>
          </section>

          <section className="legal-section">
            <h2>11. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by applicable law, we shall not be liable for
              any indirect, incidental, special, consequential, or punitive damages arising
              out of or related to your use of the Service, including but not limited to
              damages arising from AI-generated content.
            </p>
          </section>

          <section className="legal-section">
            <h2>12. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of
              the European Union and the member state in which the operator is established,
              without regard to conflict of law principles. Any disputes shall be subject to
              the exclusive jurisdiction of the courts of that member state.
            </p>
          </section>

          <section className="legal-section">
            <h2>13. Changes to Terms</h2>
            <p>
              We may modify these Terms at any time. We will notify users of significant
              changes by posting a notice on the platform. Continued use of the Service
              after changes constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section className="legal-section">
            <h2>14. Contact</h2>
            <p>
              If you have any questions about these Terms, please contact us through the
              information provided on the platform.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
