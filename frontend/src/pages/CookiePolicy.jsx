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
              <strong>{appName} does not use HTTP cookies at all.</strong> We use browser
              Local Storage and Session Storage exclusively for features that are strictly
              necessary for the platform to function. Because all stored data falls under
              the "strictly necessary" exemption of the ePrivacy Directive (2002/58/EC),
              no consent is required for these items.
            </p>
            <p className="legal-note">
              We do not use any analytics, advertising, marketing, or tracking technologies.
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
                    <th>Storage Type</th>
                    <th>Purpose</th>
                    <th>Duration</th>
                    <th>Strictly Necessary?</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code>pocketbase_auth</code></td>
                    <td>Local Storage</td>
                    <td>
                      Stores your authentication token and basic account record so you stay
                      logged in between page loads and browser sessions.
                    </td>
                    <td>Until logout or token expiry</td>
                    <td>Yes</td>
                  </tr>
                  <tr>
                    <td><code>oauth_provider</code></td>
                    <td>Local Storage</td>
                    <td>
                      Temporarily holds OAuth state (provider name, PKCE code verifier,
                      redirect URL) during the Discord login redirect flow. Required for
                      secure authentication.
                    </td>
                    <td>Deleted immediately after login</td>
                    <td>Yes</td>
                  </tr>
                  <tr>
                    <td><code>oauth_error</code></td>
                    <td>Session Storage</td>
                    <td>
                      Temporarily stores an error message if Discord login fails, so it
                      can be displayed to you after the redirect.
                    </td>
                    <td>Cleared when displayed (same session)</td>
                    <td>Yes</td>
                  </tr>
                  <tr>
                    <td><code>feedbackr_cookie_consent</code></td>
                    <td>Local Storage</td>
                    <td>
                      Records your cookie consent banner preferences (version, timestamp,
                      and category selections).
                    </td>
                    <td>Persistent</td>
                    <td>Yes</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="legal-section">
            <h2>4. Third-Party Storage</h2>
            <p>
              When you sign in via Discord OAuth, your browser is redirected to Discord's
              website. Discord may set its own cookies during this redirect. These cookies
              are governed by{' '}
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
              We load the Inter font from Google Fonts. Google may use cookies or cache
              headers when serving font files. See{' '}
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
              We do not embed any other third-party scripts, advertising pixels, social
              media widgets, or analytics tools.
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

        <div className="legal-footer-nav">
          <Link to="/privacy" className="legal-link">Privacy Policy</Link>
          <span className="legal-footer-sep">·</span>
          <Link to="/terms" className="legal-link">Terms of Service</Link>
          <span className="legal-footer-sep">·</span>
          <Link to="/" className="legal-link">Back to Board</Link>
        </div>
      </div>
    </div>
  );
}
