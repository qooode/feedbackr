import { Link } from 'react-router-dom';
import { APP_NAME } from '../lib/config';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner container">
        <div className="site-footer-left">
          <span className="site-footer-brand">© {new Date().getFullYear()} {APP_NAME}</span>
        </div>
        <nav className="site-footer-links">
          <Link to="/privacy" className="site-footer-link">Privacy Policy</Link>
          <Link to="/terms" className="site-footer-link">Terms of Service</Link>
          <Link to="/cookies" className="site-footer-link">Cookie Policy</Link>
        </nav>
      </div>
    </footer>
  );
}
