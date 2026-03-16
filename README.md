<div align="center">
  <h1>Feedbackr</h1>
  <p><strong>AI-powered feedback board — users chat naturally, AI generates structured posts.</strong></p>
  <p>Self-hosted · Open source · Single Docker container · Zero manual setup</p>
  <br />
  <p>
    <a href="#deploy-on-coolify">Deploy on Coolify</a> ·
    <a href="#deploy-with-docker">Deploy with Docker</a> ·
    <a href="#environment-variables">Configuration</a>
  </p>
</div>

---

## What Is This?

Feedbackr is a self-hosted feedback board (like [Canny](https://canny.io) or [Featurebase](https://featurebase.app)) with a twist: **users submit feedback by chatting with an AI assistant** instead of filling out forms.

The AI asks smart follow-up questions, auto-generates structured posts (title, category, priority, platform, description), checks for duplicates via a two-stage detection system (keyword pre-filter + AI semantic judge), and lets users review before publishing. Admins manage everything with a drag-and-drop Kanban board.

### Why?

Every existing feedback tool uses a boring form. Users skip fields, write vague titles, and don't provide enough detail. Feedbackr solves this by letting users **talk naturally** while the AI extracts all the details for them.

## Features

### Core

- **AI Chat Submission** — Users describe feedback naturally with quick-reply option buttons, AI asks follow-ups and generates structured posts (title, body, category, priority, platform)
- **Two-Stage Duplicate Detection** — Keyword pre-filter finds candidates, then AI semantic judge confirms true duplicates before publishing
- **Public Board** — Filterable, searchable board with upvoting, categories, platform tags, status tracking, and infinite scroll
- **Admin Kanban** — Drag-and-drop board with columns: New → In Review → Processing → Done → Released → Dropped → Later
- **Public Roadmap** — Three-column view (Planned / In Progress / Complete) with category filtering, so users see what's coming
- **Changelog** — Versioned update entries with Markdown body, optional cover images, and linked feedback posts. Timeline-style layout

### User Features

- **Threaded Comments** — Top-level comments with one-level replies on every post. Edit and delete your own comments
- **Post Editing** — Authors can edit their own post title and body. Admins can edit everything
- **Post Deletion** — Authors and admins can delete posts with inline confirmation
- **Notification System** — Real-time bell icon with unread count. Notifications for:
  - Status changes on your posts (e.g. New → Processing)
  - New comments on posts you authored, favorited, or commented on
  - Replies to your comments
- **Favorites** — Bookmark posts you want to follow. Get notified when someone comments on them
- **My Feedback Page** — Three tabs:
  - **My Posts** — All your submissions with status filter (All / Active / Completed / Closed)
  - **Favorites** — All your bookmarked posts in one place
  - **Activity** — Full notification history with status change and comment activity
- **Community Sidebar** — Top contributors leaderboard, recently shipped items, and "At a Glance" stats with ship rate

### Auth

- **Discord OAuth** — One-click login via Discord (configured in PocketBase admin after first boot)
- **Email + Password Auth** — Traditional registration and login (conditionally shown based on PocketBase auth settings)
- **Cookie Consent** — GDPR-friendly cookie consent banner

### Admin

- **Auto-Admin Promotion** — Emails in `ADMIN_EMAILS` are automatically promoted to admin on login
- **Kanban Management** — Drag-and-drop status management across all columns
- **Field Protection** — Non-admins cannot modify status, priority, category, platform, vote count, or comment count on posts

### Security

- **Server-side AI Key** — `OPENROUTER_API_KEY` never exposed to the frontend. All AI calls go through `/api/feedbackr/*` routes
- **Rate Limiting** — Configurable per-user rate limits for AI calls, post creation, comments, and votes
- **Input Validation** — Message length caps (25,000 chars), conversation length caps (40 messages), total payload caps (32,000 chars)
- **Ownership Enforcement** — Server-side hooks enforce that users can only edit/delete their own content
- **Email Privacy** — User emails are hidden from other users via `onRecordEnrich` hooks
- **AI Transcript Privacy** — AI conversation transcripts only visible to post author and admins
- **Admin Field Lock** — `is_admin` field protected by a server-side hook; users cannot set it on themselves

### Branding

- **Custom Branding** — Set a custom app name and logo via `VITE_APP_NAME` and `VITE_LOGO_URL` environment variables
- **Dark Glass Theme** — Modern dark theme with glassmorphism design out of the box

### Legal Pages

- **Privacy Policy**, **Terms of Service**, and **Cookie Policy** pages built in, accessible via footer links

## Deploy on Coolify

> **This is the recommended way.** Clone from GitHub, set env vars, deploy. That's it.

1. **Fork/clone this repo** to your GitHub
2. In Coolify: **New Project → Add Resource → Docker (Dockerfile)**
3. Point to your repo
4. **Set these environment variables:**

| Variable | Required | Description |
|---|---|---|
| `OPENROUTER_API_KEY` | Yes | Your [OpenRouter](https://openrouter.ai) API key |
| `PB_SUPERUSER_EMAIL` | Yes | Email for PocketBase admin account |
| `PB_SUPERUSER_PASSWORD` | Yes | Password for PocketBase admin account |
| `ADMIN_EMAILS` | Yes | Your email (gets auto-promoted to admin on first login) |
| `AI_MODEL` | | AI model (default: `anthropic/claude-sonnet-4`) |
| `APP_URL` | | Your domain URL |

5. **Add persistent storage:** Mount volume to `/pb/pb_data`
6. **Set port:** 8090
7. **Deploy!**

After deploying:
- Visit your domain — the app is ready
- Log in with email or Discord — you'll be auto-promoted to admin
- Access PocketBase admin at `yourdomain.com/_/` with the superuser credentials you set

### Setting up Discord OAuth (optional)

1. Go to [Discord Developer Portal](https://discord.com/developers/applications) → New Application
2. OAuth2 → Add redirect: `https://yourdomain.com/api/oauth2-redirect`
3. Copy Client ID and Client Secret
4. Go to PocketBase admin (`yourdomain.com/_/`) → Collections → users → Settings → Auth Providers → Enable Discord
5. Paste Client ID and Secret → Save

## Deploy with Docker

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/feedbackr.git
cd feedbackr

# 2. Copy and edit the env file
cp .env.example .env
# Edit .env with your values

# 3. Build and run
docker compose up -d
```

Visit `http://localhost:8090` — everything runs in a single container.

## Local Development

```bash
# 1. Clone
git clone https://github.com/YOUR_USERNAME/feedbackr.git
cd feedbackr

# 2. Download PocketBase (macOS example)
cd pocketbase
wget https://github.com/pocketbase/pocketbase/releases/download/v0.25.9/pocketbase_0.25.9_darwin_amd64.zip
unzip pocketbase_*.zip && rm pocketbase_*.zip

# 3. Set env vars and start PocketBase
export OPENROUTER_API_KEY="sk-or-v1-your-key"
export ADMIN_EMAILS="you@example.com"
./pocketbase serve

# 4. In another terminal — start frontend
cd ../frontend
npm install
npm run dev
```

Frontend at `http://localhost:5173` — auto-proxies API to PocketBase at `:8090`.

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `OPENROUTER_API_KEY` | Yes | — | [OpenRouter](https://openrouter.ai) API key |
| `PB_SUPERUSER_EMAIL` | Yes | — | PocketBase admin panel login email |
| `PB_SUPERUSER_PASSWORD` | Yes | — | PocketBase admin panel login password |
| `ADMIN_EMAILS` | Yes | — | Comma-separated emails to auto-promote to admin |
| `AI_MODEL` | | `anthropic/claude-sonnet-4` | Any model from [OpenRouter models](https://openrouter.ai/models) |
| `APP_URL` | | `http://localhost:8090` | Your public URL (also used as OpenRouter referer header) |
| `RATE_WINDOW_SEC` | | `60` | Rate limit time window in seconds |
| `RATE_MAX_AI` | | `15` | Max AI requests per user per window |
| `RATE_MAX_CREATE` | | `20` | Max create operations (posts/comments) per user per window |
| `VITE_APP_NAME` | | `feedbackr` | Custom name shown in navbar and browser tab |
| `VITE_LOGO_URL` | | *(built-in SVG icon)* | URL to a custom logo image (PNG/SVG) |

> **Note:** `VITE_*` variables are baked into the frontend at build time. When using Docker, pass them as build args (the `docker-compose.yml` handles this automatically).

## Architecture

```
┌─────────────────────────────────────┐
│           Single Container          │
│                                     │
│  ┌───────────┐  ┌───────────────┐   │
│  │  React    │  │  PocketBase   │   │
│  │  (static) │  │  (Go binary)  │   │
│  │  ────────>│  │               │   │
│  │  pb_public│  │  ┌──────────┐ │   │
│  └───────────┘  │  │ pb_hooks │ │   │
│                 │  │ (AI proxy)│ │   │
│                 │  └─────┬────┘ │   │
│                 │        │      │   │
│                 │  ┌─────▼────┐ │   │
│                 │  │  SQLite  │ │   │
│                 │  │ (pb_data)│ │   │
│                 │  └──────────┘ │   │
│                 └───────────────┘   │
└─────────────────────────────────────┘
         │                    │
         │                    ▼
         │            OpenRouter API
         ▼            (server-side only)
    Users / Admins
```

### How It Works

1. **Frontend** — React SPA built with Vite, served as static files from PocketBase's `pb_public` directory
2. **Backend** — PocketBase handles auth, database (SQLite), file storage, and REST API
3. **Server Hooks** — JavaScript hooks in `pb_hooks/` handle AI proxy routes, rate limiting, ownership enforcement, vote/comment count sync, notifications, and admin auto-promotion
4. **AI** — All AI calls (chat, generate, duplicate detection) go through server-side hooks to OpenRouter, keeping the API key secure
5. **Migrations** — Database schema (collections, fields, API rules) auto-created on first boot via `pb_migrations/`

### Database Collections

| Collection | Purpose |
|---|---|
| `users` | User accounts with `is_admin` flag, name, avatar |
| `posts` | Feedback submissions with title, body, category, priority, platform, status, vote/comment counts, AI transcript |
| `comments` | Threaded comments with `parent` field for one-level replies |
| `votes` | One vote per user per post (user + post unique pair) |
| `favorites` | Bookmarked posts per user |
| `notifications` | Status change, comment, and reply notifications |
| `changelogs` | Versioned update entries with linked posts |

### API Routes (Custom)

| Route | Purpose |
|---|---|
| `POST /api/feedbackr/chat` | AI conversation (authenticated, rate-limited) |
| `POST /api/feedbackr/generate` | Generate structured post from conversation (authenticated, rate-limited) |
| `POST /api/feedbackr/similar` | Two-stage duplicate detection (keyword + AI) |

## Security

### How the AI Key is Protected
- The `OPENROUTER_API_KEY` is **only** accessible in PocketBase's server-side JS hooks
- The frontend **never** sees the API key — all AI calls go through `/api/feedbackr/*` routes
- Requests are authenticated — must be logged in to use AI features
- **40 message cap** per conversation
- **25,000 character limit** per message
- **32,000 character total payload cap** per conversation
- System prompt explicitly prevents instruction injection

### How Admin Access Works
- `ADMIN_EMAILS` env var contains a comma-separated list of emails
- When a user logs in with a matching email, they're **auto-promoted** to `is_admin = true`
- The `is_admin` field is **protected by a server-side hook** — users cannot set it on themselves
- API rules enforce `@request.auth.is_admin = true` for all admin-only operations
- The PocketBase admin panel at `/_/` is separate and requires superuser credentials

### Ownership Enforcement
- Users can only edit/delete their **own** posts and comments
- Non-admins editing posts can only change title and body — status, priority, category, platform, vote count, comment count, and author are locked server-side
- Non-admins editing comments can only change body — author, post, parent, and AI merged flag are locked server-side
- Vote deletion restricted to the user who cast the vote
- Favorite deletion restricted to the owning user
- Notification updates restricted to the owning user (can only toggle `read`)

### API Rules
```
posts:          list/view = everyone, create = logged in, update/delete = own or admin
comments:       list/view = everyone, create = logged in, update/delete = own or admin
votes:          list = everyone, create = logged in, delete = own only
favorites:      list = own only, create = logged in, delete = own only
notifications:  list = own only, create = system only, update/delete = own only
changelogs:     list/view = everyone, create/update/delete = admin only
```

### Data Privacy
- **Email addresses** are stripped from user records when viewed by other users (via `onRecordEnrich` hook)
- **AI transcripts** are only visible to the post author and admins (stripped via `onRecordEnrich` hook)

## Pages

| Route | Page | Access |
|---|---|---|
| `/` | Feedback Board — filterable/searchable feed with infinite scroll and community sidebar | Public |
| `/submit` | AI Chat Submission — conversational feedback flow with quick-reply buttons and duplicate detection | Logged in |
| `/post/:id` | Post Detail — full post with vote bar, favorites, markdown body, threaded comments | Public (comment requires login) |
| `/my-feedback` | My Feedback — personal posts, favorites, and activity/notification history | Logged in |
| `/admin` | Admin Kanban — drag-and-drop status management | Admin only |
| `/changelog` | Changelog — versioned updates with timeline UI | Public |
| `/roadmap` | Roadmap — three-column view of planned/in-progress/complete items | Public |
| `/privacy` | Privacy Policy | Public |
| `/terms` | Terms of Service | Public |
| `/cookies` | Cookie Policy | Public |

## Tech Stack

| Layer | Tech |
|---|---|
| Backend | [PocketBase](https://pocketbase.io) v0.25.9 — Go binary, SQLite, REST API, realtime, auth |
| Frontend | React 19 + Vite 6 |
| Routing | React Router v7 |
| AI | [OpenRouter](https://openrouter.ai) — any model (default: Claude Sonnet 4) |
| Drag & Drop | [@hello-pangea/dnd](https://github.com/hello-pangea/dnd) |
| Markdown | [react-markdown](https://github.com/remarkjs/react-markdown) |
| Icons | [Lucide React](https://lucide.dev) |
| Styling | Vanilla CSS — Dark Glass theme |
| Container | Alpine Linux + multi-stage Docker build |

## Contributing

PRs welcome! Please open an issue first to discuss what you'd like to change.

## License

[MIT](LICENSE)
