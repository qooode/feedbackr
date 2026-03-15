import { APP_NAME } from '../lib/config';
import { Link } from 'react-router-dom';
import { useEffect } from 'react';

export default function PrivacyPolicy() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const appName = APP_NAME;
  const lastUpdated = 'March 15, 2026';

  return (
    <div className="page">
      <div className="container legal-page">
        <div className="legal-header">
          <h1 className="legal-title">Privacy Policy</h1>
          <p className="legal-updated">Last updated: {lastUpdated}</p>
        </div>

        <div className="legal-body">
          <section className="legal-section">
            <h2>1. Introduction</h2>
            <p>
              Welcome to <strong>{appName}</strong>. We are committed to protecting your personal
              data and respecting your privacy in accordance with the General Data Protection
              Regulation (GDPR) (EU) 2016/679 and the ePrivacy Directive 2002/58/EC.
            </p>
            <p>
              This Privacy Policy explains how we collect, use, store, and protect your personal
              data when you use our feedback platform.
            </p>
          </section>

          <section className="legal-section">
            <h2>2. Data Controller</h2>
            <p>
              The data controller responsible for your personal data is the operator
              of <strong>{appName}</strong>. If you have any questions about data processing,
              you can contact us at the email address provided on our platform.
            </p>
          </section>

          <section className="legal-section">
            <h2>3. Personal Data We Collect</h2>
            <p>We collect the following types of personal data:</p>
            <ul>
              <li>
                <strong>Account Information (Discord OAuth):</strong> When you sign in
                via Discord, we receive your Discord username, email address, and avatar
                from Discord's API. This data is stored in our database to identify your account.
              </li>
              <li>
                <strong>Account Information (Email Registration, if enabled):</strong> If
                email/password registration is enabled, we store your email address, chosen
                display name, and a hashed password. Passwords are never stored in plain text.
              </li>
              <li>
                <strong>User-Generated Content:</strong> Feedback posts (title, body, category,
                priority, platform), comments, replies, votes, and favorites you create
                on the platform.
              </li>
              <li>
                <strong>AI Conversation Transcripts:</strong> When you use our AI-assisted
                feedback submission, the conversation between you and the AI assistant is
                stored alongside your post. This transcript is only visible to you and
                platform administrators.
              </li>
              <li>
                <strong>Notification Data:</strong> We store in-app notification records
                (comment alerts, status changes) linked to your account to keep you informed
                about activity on your posts.
              </li>
            </ul>
            <p className="legal-note">
              <strong>What we do NOT collect:</strong> We do not use analytics or advertising
              trackers and do not perform behavioral profiling. Note that Cloudflare, which
              proxies our traffic for security, does process IP addresses and may set
              security cookies (see Sections 6 and 10).
            </p>
          </section>

          <section className="legal-section">
            <h2>4. Lawful Basis for Processing</h2>
            <p>We process your personal data based on the following legal grounds under GDPR Article 6:</p>
            <ul>
              <li>
                <strong>Contract Performance (Art. 6(1)(b)):</strong> To provide the feedback
                platform service — authenticating your account, storing your submissions,
                processing votes, and delivering notifications.
              </li>
              <li>
                <strong>Legitimate Interest (Art. 6(1)(f)):</strong> For security purposes
                such as rate limiting (preventing spam and abuse) and enforcing ownership
                rules on content.
              </li>
            </ul>
            <p>
              We do not currently rely on consent as a lawful basis because we do not use
              any analytics, marketing, or non-essential tracking technologies.
            </p>
          </section>

          <section className="legal-section">
            <h2>5. How We Use Your Data</h2>
            <p>We use your personal data exclusively to:</p>
            <ul>
              <li>Authenticate your identity and manage your account</li>
              <li>Display your feedback posts, comments, and votes on the platform</li>
              <li>Show your display name and avatar next to your contributions</li>
              <li>Send you in-app notifications about comments on your posts, replies to your
                comments, and status changes on your submissions</li>
              <li>Process your feedback through our AI assistant to help structure your submission
                (the conversation is sent to an AI service for processing — see Section 6)</li>
              <li>Enforce rate limits to prevent spam and abuse</li>
              <li>Auto-promote designated administrators based on their email address</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>6. Third-Party Services</h2>
            <p>We share data with the following third-party services, and only to the extent necessary:</p>
            <ul>
              <li>
                <strong>Discord (OAuth Authentication):</strong> When you sign in via Discord,
                your browser is redirected to Discord's servers. Discord shares your username,
                email, and avatar with us. Discord's own{' '}
                <a href="https://discord.com/privacy" target="_blank" rel="noopener noreferrer" className="legal-link">
                  Privacy Policy
                </a>{' '}governs their handling of your data.
              </li>
              <li>
                <strong>OpenRouter.ai (AI Processing):</strong> When you use the AI-assisted
                feedback submission, your conversation messages are sent to OpenRouter.ai's API,
                which routes them to an AI model (currently Anthropic Claude) for processing.
                OpenRouter receives the text of your conversation but not your account details
                (email, username, or user ID). See{' '}
                <a href="https://openrouter.ai/privacy" target="_blank" rel="noopener noreferrer" className="legal-link">
                  OpenRouter's Privacy Policy
                </a>.
              </li>
              <li>
                <strong>Cloudflare (CDN &amp; Security):</strong> All traffic to our platform
                is routed through Cloudflare's global network. Cloudflare provides DDoS
                protection, web application firewall (WAF), and content delivery. Cloudflare
                processes your IP address and may set HTTP cookies for bot management and
                security verification (see Section 10). See{' '}
                <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener noreferrer" className="legal-link">
                  Cloudflare's Privacy Policy
                </a>.
              </li>
              <li>
                <strong>Google Fonts:</strong> We load the Inter font from Google Fonts. This
                means your browser makes a request to Google's servers when loading the page.
                See{' '}
                <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="legal-link">
                  Google's Privacy Policy
                </a>.
              </li>
            </ul>
            <p>
              We do <strong>not</strong> sell your personal data to any third party. We do not
              share your data with advertisers or marketing services.
            </p>
          </section>

          <section className="legal-section">
            <h2>7. International Data Transfers</h2>
            <p>
              Some of our third-party services (Cloudflare, Discord, OpenRouter, Google Fonts)
              may process data outside the EU/EEA. Cloudflare operates a global network and
              may route your request through the nearest data center, which could be outside
              the EU/EEA. These transfers are protected by the EU-US Data Privacy Framework,
              Standard Contractual Clauses (SCCs), or adequacy decisions as applicable under
              each provider's data processing agreements.
            </p>
          </section>

          <section className="legal-section">
            <h2>8. Data Retention</h2>
            <p>We retain your personal data only as long as necessary:</p>
            <ul>
              <li>
                <strong>Account data:</strong> Retained while your account is active. Deleted
                within 30 days of an account deletion request.
              </li>
              <li>
                <strong>Feedback posts, comments, and votes:</strong> Retained while your account
                is active or until you delete them. If you delete your account, your content will
                be removed.
              </li>
              <li>
                <strong>AI conversation transcripts:</strong> Stored alongside the feedback post
                they generated. Deleted when the post is deleted.
              </li>
              <li>
                <strong>Notification records:</strong> Retained until you delete them or your
                account is removed.
              </li>
              <li>
                <strong>Rate-limiting data:</strong> Stored in server memory only, automatically
                cleared on server restart, and expires within 60 seconds.
              </li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>9. Your Rights Under GDPR</h2>
            <p>You have the following rights regarding your personal data:</p>
            <ul>
              <li><strong>Right of Access (Art. 15):</strong> Request a copy of your personal data.</li>
              <li><strong>Right to Rectification (Art. 16):</strong> Correct inaccurate data (you can
                edit your posts and comments directly on the platform).</li>
              <li><strong>Right to Erasure (Art. 17):</strong> Request deletion of your data ("right to
                be forgotten"). You can delete your own posts, comments, and account.</li>
              <li><strong>Right to Restrict Processing (Art. 18):</strong> Limit how we use your data.</li>
              <li><strong>Right to Data Portability (Art. 20):</strong> Receive your data in a machine-readable format.</li>
              <li><strong>Right to Object (Art. 21):</strong> Object to processing based on legitimate interest.</li>
            </ul>
            <p>
              To exercise any of these rights, please contact us. We will respond within 30 days.
            </p>
          </section>

          <section className="legal-section">
            <h2>10. Cookies &amp; Browser Storage</h2>
            <p>
              Our application code does not set HTTP cookies directly. However,{' '}
              <strong>Cloudflare</strong>, which proxies all traffic to our platform, may set
              the following cookies for security purposes:
            </p>
            <ul>
              <li>
                <strong><code>__cf_bm</code></strong> (HTTP Cookie): Cloudflare Bot Management
                cookie. Used to distinguish humans from bots. Expires after 30 minutes. Set by
                Cloudflare, not by our application. Strictly necessary for security.
              </li>
              <li>
                <strong><code>cf_clearance</code></strong> (HTTP Cookie): Set if you complete
                a Cloudflare security challenge. Proves you passed the check so you are not
                challenged again. Strictly necessary for access.
              </li>
            </ul>
            <p>
              In addition, we use browser Local Storage and Session Storage for essential functions:
            </p>
            <ul>
              <li>
                <strong><code>pocketbase_auth</code></strong> (Local Storage): Your authentication
                token that keeps you logged in. Strictly necessary.
              </li>
              <li>
                <strong><code>oauth_provider</code></strong> (Local Storage): Temporary OAuth state
                during the Discord login flow. Deleted immediately after login completes.
              </li>
              <li>
                <strong><code>oauth_error</code></strong> (Session Storage): Temporarily stores
                an OAuth error message if login fails. Cleared when the error is displayed.
              </li>
              <li>
                <strong><code>feedbackr_cookie_consent</code></strong> (Local Storage): Records
                that you have seen the privacy notice. Strictly necessary.
              </li>
            </ul>
            <p>
              All cookies and storage items listed above are strictly necessary for the platform
              to function and are exempt from consent requirements under the ePrivacy Directive.
              For full details, see our{' '}
              <Link to="/cookies" className="legal-link">Cookie Policy</Link>.
            </p>
          </section>

          <section className="legal-section">
            <h2>11. Security</h2>
            <p>
              We implement appropriate technical measures to protect your data:
            </p>
            <ul>
              <li>Cloudflare DDoS protection, WAF, and bot management on all traffic</li>
              <li>Encrypted connections (HTTPS) for all data in transit</li>
              <li>Passwords, if email/password auth is enabled, are hashed using PocketBase's built-in bcrypt hashing</li>
              <li>OAuth authentication uses PKCE (Proof Key for Code Exchange) for secure authorization flows</li>
              <li>Server-side ownership enforcement prevents users from modifying other users' content</li>
              <li>Rate limiting prevents spam and abuse</li>
              <li>Email addresses are hidden from other users via server-side data enrichment hooks</li>
              <li>AI transcripts are only visible to the post author and administrators</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>12. Children's Privacy</h2>
            <p>
              Our service is not intended for children under 16 years of age. We do not
              knowingly collect personal data from children. If you believe a child has
              provided us with personal data, please contact us so we can remove it.
            </p>
          </section>

          <section className="legal-section">
            <h2>13. Supervisory Authority</h2>
            <p>
              If you believe your data protection rights have been violated, you have the right
              to lodge a complaint with your local Data Protection Authority (DPA) in your
              EU/EEA member state.
            </p>
          </section>

          <section className="legal-section">
            <h2>14. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of
              significant changes by posting a notice on the platform. The "Last updated" date
              at the top indicates the most recent revision.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
