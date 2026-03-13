/**
 * App-wide configuration derived from environment variables.
 *
 * Set these in your .env (or docker-compose environment):
 *   VITE_APP_NAME  – custom name shown in the navbar & browser tab  (default: "feedbackr")
 *   VITE_LOGO_URL  – URL to a custom logo image (PNG/SVG/etc.)       (default: built-in SVG icon)
 */

export const APP_NAME  = import.meta.env.VITE_APP_NAME  || 'feedbackr';
export const LOGO_URL  = import.meta.env.VITE_LOGO_URL  || '';
