import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Strip the `crossorigin` attribute Vite adds to <link> and <script> tags.
// When deployed behind a reverse proxy (Cloudflare, Traefik, Coolify…)
// that doesn't echo CORS headers for same-origin assets, the browser
// makes a CORS request, fails silently, and drops the CSS/JS — users see
// unstyled HTML. Since PocketBase serves everything same-origin, the
// attribute is unnecessary.
function removeCrossOrigin() {
  return {
    name: 'remove-crossorigin',
    enforce: 'post',
    transformIndexHtml(html) {
      // Vite injects crossorigin on its bundled <script> and <link> tags.
      // Remove it from those (local assets) but keep it on external preconnects.
      return html
        .replace(/<script type="module" crossorigin/g, '<script type="module"')
        .replace(/<link rel="stylesheet" crossorigin/g, '<link rel="stylesheet"')
    },
  }
}

export default defineConfig({
  plugins: [react(), removeCrossOrigin()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8090',
        changeOrigin: true,
      },
      '/_': {
        target: 'http://127.0.0.1:8090',
        changeOrigin: true,
      },
    },
  },
})
