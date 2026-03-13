import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { APP_NAME } from './lib/config';
import './index.css';

// Set browser tab title & meta description from env
document.title = APP_NAME;
const metaDesc = document.querySelector('meta[name="description"]');
if (metaDesc) {
  metaDesc.setAttribute('content', `${APP_NAME} — AI-powered feedback board. Submit feedback through a conversational AI assistant, upvote ideas, and track progress.`);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
