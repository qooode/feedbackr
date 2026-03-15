import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Check } from 'lucide-react';

const CONSENT_KEY = 'feedbackr_cookie_consent';
const CONSENT_VERSION = '1'; // bump when policy changes

function getConsent() {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.version !== CONSENT_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveConsent() {
  localStorage.setItem(CONSENT_KEY, JSON.stringify({
    version: CONSENT_VERSION,
    timestamp: new Date().toISOString(),
    acknowledged: true,
  }));
}

/**
 * Returns whether the user has acknowledged the cookie/storage notice.
 */
export function hasAcknowledgedConsent() {
  return getConsent() !== null;
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    const consent = getConsent();
    if (!consent) {
      // Small delay so the page renders first
      const t = setTimeout(() => {
        setVisible(true);
        requestAnimationFrame(() => setAnimateIn(true));
      }, 800);
      return () => clearTimeout(t);
    }
  }, []);

  const handleAcknowledge = useCallback(() => {
    saveConsent();
    setAnimateIn(false);
    setTimeout(() => setVisible(false), 300);
  }, []);

  if (!visible) return null;

  return (
    <div className={`cookie-banner-backdrop ${animateIn ? 'visible' : ''}`}>
      <div className={`cookie-banner ${animateIn ? 'visible' : ''}`}>
        {/* Header */}
        <div className="cookie-banner-header">
          <div className="cookie-banner-icon">
            <Shield size={18} />
          </div>
          <div>
            <h3 className="cookie-banner-title">Privacy Notice</h3>
            <p className="cookie-banner-subtitle">
              This site uses Cloudflare security cookies and browser Local Storage for
              essential functions only (keeping you logged in, bot protection). We do not
              use tracking, analytics, or advertising cookies. AI conversations are
              processed by{' '}
              <a href="https://openrouter.ai/privacy" target="_blank" rel="noopener noreferrer"
                className="cookie-banner-link">OpenRouter.ai</a>.
              Read our{' '}
              <Link to="/privacy" className="cookie-banner-link">Privacy Policy</Link>
              {' '}and{' '}
              <Link to="/cookies" className="cookie-banner-link">Cookie Policy</Link>
              {' '}for details.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="cookie-banner-actions">
          <button
            className="btn btn-primary btn-sm"
            onClick={handleAcknowledge}
            type="button"
          >
            <Check size={14} />
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
