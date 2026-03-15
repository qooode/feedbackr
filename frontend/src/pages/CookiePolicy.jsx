import { APP_NAME } from '../lib/config';
import { Link } from 'react-router-dom';
import { useEffect } from 'react';

export default function CookiePolicy() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const appName = APP_NAME;
  const lastUpdated = 'March 15, 2026';

  return (
    <div className="page">
      <div className="container legal-page">
        <div className="legal-header">
          <h1 className="legal-title">Cookie Policy</h1>
          <p className="legal-updated">Last updated: {lastUpdated}</p>
        </div>

        <div className="legal-body">
          <section className="legal-section">
            <h2>1. What Are Cookies?</h2>
            <p>
              Cookies are small text files placed on your device by websites. Similar
              technologies include Local Storage and Session Storage, which allow websites
              to store data in your browser.
            </p>
          </section>

          <section className="legal-section">
            <h2>2. Our Approach</h2>
            <p>
              <strong>{appName} itself does not set HTTP cookies.</strong> However, we use
              Cloudflare as our CDN and security proxy, and Cloudflare may set strictly
              necessary cookies for bot detection and security challenges. We also use
              browser Local Storage and Session Storage for essential platform functions.
            </p>
            <p>
              Because all stored data (both Cloudflare cookies and our browser storage) is
              strictly necessary, it falls under the exemption of the ePrivacy Directive
              (2002/58/EC) and no consent is required.
            </p>
            <p className="legal-note">
              We do not use any analytics, advertising, marketing, or tracking cookies.
              There is nothing optional to accept or reject.
            </p>
          </section>

          <section className="legal-section">
            <h2>3. What We Store in Your Browser</h2>

            <div className="legal-table-wrapper">
              <table className="legal-table">
                <thead>
                  <tr>
                    <th>Key</th>
                    <th>Type</th>
                    <th>Purpose</th>
                    <th>Duration</th>
                    <th>Set By</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code>__cf_bm</code></td>
                    <td>HTTP Cookie</td>
                    <td>
                      Cloudflare Bot Management. Distinguishes humans from bots to
                      protect the platform from automated abuse.
                    </td>
                    <td>30 minutes</td>
                    <td>Cloudflare</td>
                  </tr>
                  <tr>
                    <td><code>cf_clearance</code></td>
                    <td>HTTP Cookie</td>
                    <td>
                      Set after you pass a Cloudflare security challenge. Proves you
                      have been verified so you are not challenged again.
                    </td>
                    <td>Up to 24 hours</td>
                    <td>Cloudflare</td>
                  </tr>
                  <tr>
                    <td><code>pocketbase_auth</code></td>
                    <td>Local Storage</td>
                    <td>
                      Stores your authentication token and basic account record so you stay
                      logged in between page loads and browser sessions.
                    </td>
                    <td>Until logout or token expiry</td>
                    <td>Our app</td>
                  </tr>
                  <tr>
                    <td><code>oauth_provider</code></td>
                    <td>Local Storage</td>
                    <td>
                      Temporarily holds OAuth state (provider name, PKCE code verifier,
                      redirect URL) during the Discord login redirect flow.
                    </td>
                    <td>Deleted immediately after login</td>
                    <td>Our app</td>
                  </tr>
                  <tr>
                    <td><code>oauth_error</code></td>
                    <td>Session Storage</td>
                    <td>
                      Temporarily stores an error message if Discord login fails, so it
                      can be displayed to you after the redirect.
                    </td>
                    <td>Cleared when displayed (same session)</td>
                    <td>Our app</td>
                  </tr>
                  <tr>
                    <td><code>feedbackr_cookie_consent</code></td>
                    <td>Local Storage</td>
                    <td>
                      Records that you have seen the privacy notice.
                    </td>
                    <td>Persistent</td>
                    <td>Our app</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>
              All items above are strictly necessary for platform operation or security.
              None are used for tracking, analytics, or advertising.
            </p>
          </section>

          <section className="legal-section">
            <h2>4. Third-Party Cookies &amp; Storage</h2>
            <p>
              <strong>Cloudflare:</strong> All traffic to our platform passes through Cloudflare's
              network. Cloudflare sets the <code>__cf_bm</code> and <code>cf_clearance</code>{' '}
              cookies described above. Cloudflare also processes your IP address for security
              purposes (DDoS mitigation, bot detection). See{' '}
              <a
                href="https://www.cloudflare.com/privacypolicy/"
                target="_blank"
                rel="noopener noreferrer"
                className="legal-link"
              >
                Cloudflare's Privacy Policy
              </a>.
            </p>
            <p>
              <strong>Discord:</strong> When you sign in via Discord OAuth, your browser is
              redirected to Discord's website. Discord may set its own cookies during this
              redirect. These cookies are governed by{' '}
              <a
                href="https://discord.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="legal-link"
              >
                Discord's Privacy Policy
              </a>.
            </p>
            <p>
              <strong>Google Fonts:</strong> We load the Inter font from Google Fonts. Google
              may use cookies or cache headers when serving font files. See{' '}
              <a
                href="https://developers.google.com/fonts/faq/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="legal-link"
              >
                Google Fonts Privacy FAQ
              </a>.
            </p>
            <p>
              We do not embed any advertising pixels, social media widgets, or analytics tools.
            </p>
          </section>

          <section className="legal-section">
            <h2>5. Managing Stored Data</h2>
            <p>You can clear all data stored by {appName} at any time by:</p>
            <ul>
              <li>
                <strong>Logging out:</strong> Clears your authentication token.
              </li>
              <li>
                <strong>Browser settings:</strong> Go to your browser's Developer Tools
                (usually F12), navigate to the Application or Storage tab, and clear
                Local Storage and Session Storage for this site.
              </li>
              <li>
                <strong>Clearing all site data:</strong> Most browsers allow you to clear
                all data for a specific site in their privacy/security settings.
              </li>
            </ul>
            <p>
              Note that clearing your authentication token will log you out, and you will
              need to sign in again.
            </p>
          </section>

          <section className="legal-section">
            <h2>6. Your Rights</h2>
            <p>
              Under the GDPR, you have the right to access, rectify, or delete your data,
              as well as other rights detailed in our{' '}
              <Link to="/privacy" className="legal-link">Privacy Policy</Link>.
            </p>
          </section>

          <section className="legal-section">
            <h2>7. Changes to This Policy</h2>
            <p>
              We may update this Cookie Policy if we add new storage mechanisms or
              third-party integrations. If we introduce any non-essential storage, we will
              update our consent mechanism accordingly. The "Last updated" date at the top
              reflects the most recent revision.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
