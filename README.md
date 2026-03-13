<div align="center">
  <h1>💬 Feedbackr</h1>
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

The AI asks smart follow-up questions, auto-generates structured posts (title, category, priority, description), checks for duplicates, and lets users review before publishing. Admins manage everything with a drag-and-drop Kanban board.

### Why?

Every existing feedback tool uses a boring form. Users skip fields, write vague titles, and don't provide enough detail. Feedbackr solves this by letting users **talk naturally** while the AI extracts all the details for them.

## Features

- 🤖 **AI Chat Submission** — Users describe feedback naturally, AI asks follow-ups and generates structured posts
- 🔍 **Duplicate Detection** — Finds similar existing posts, offers to merge instead of creating duplicates
- 📋 **Public Board** — Filterable, searchable board with upvoting, categories, and status tracking
- 📊 **Admin Kanban** — Drag-and-drop board (New → In Review → Processing → Done → Dropped → Later)
- 🔐 **Discord OAuth + Email Auth** — Zero-friction login
- 🛡️ **Secure** — API key server-side only, rate-limited, input validation, admin protection
- 📦 **Single Container** — Everything in one Docker image, no external databases
- ⚡ **Zero Setup** — Collections auto-created on first boot, admin auto-promoted from env var

## Deploy on Coolify

> **This is the recommended way.** Clone from GitHub, set env vars, deploy. That's it.

1. **Fork/clone this repo** to your GitHub
2. In Coolify: **New Project → Add Resource → Docker (Dockerfile)**
3. Point to your repo
4. **Set these environment variables:**

| Variable | Required | Description |
|---|---|---|
| `OPENROUTER_API_KEY` | ✅ | Your [OpenRouter](https://openrouter.ai) API key |
| `PB_SUPERUSER_EMAIL` | ✅ | Email for PocketBase admin account |
| `PB_SUPERUSER_PASSWORD` | ✅ | Password for PocketBase admin account |
| `ADMIN_EMAILS` | ✅ | Your email (gets auto-promoted to admin on first login) |
| `AI_MODEL` | | AI model (default: `anthropic/claude-sonnet-4`) |
| `APP_URL` | | Your domain URL |

5. **Add persistent storage:** Mount volume to `/pb/pb_data`
6. **Set port:** 8090
7. **Deploy!** 🚀

After deploying:
- Visit your domain — the app is ready
- Log in with email or Discord — you'll be auto-promoted to admin
- Access PocketBase admin at `yourdomain.com/_/` with the superuser credentials you set

### Setting up Discord OAuth (optional)

1. Go to [Discord Developer Portal](https://discord.com/developers/applications) → New Application
2. OAuth2 → Add redirect: `https://yourdomain.com/api/oauth2-redirect`
3. Copy Client ID and Client Secret
4. Go to PocketBase admin (`yourdomain.com/_/`) → Collections → users → ⚙️ → Auth Providers → Enable Discord
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
| `OPENROUTER_API_KEY` | ✅ | — | [OpenRouter](https://openrouter.ai) API key |
| `PB_SUPERUSER_EMAIL` | ✅ | — | PocketBase admin panel login email |
| `PB_SUPERUSER_PASSWORD` | ✅ | — | PocketBase admin panel login password |
| `ADMIN_EMAILS` | ✅ | — | Comma-separated emails to auto-promote to admin |
| `AI_MODEL` | | `anthropic/claude-sonnet-4` | Any model from [OpenRouter models](https://openrouter.ai/models) |
| `APP_URL` | | `http://localhost:8090` | Your public URL |

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

## Security

### How the AI Key is Protected
- The `OPENROUTER_API_KEY` is **only** accessible in PocketBase's server-side JS hooks
- The frontend **never** sees the API key — all AI calls go through `/api/feedbackr/*` routes
- Requests are authenticated — must be logged in to use AI features
- **20 message cap** per conversation
- **2000 character limit** per message
- System prompt explicitly prevents instruction injection

### How Admin Access Works
- `ADMIN_EMAILS` env var contains a comma-separated list of emails
- When a user logs in with a matching email, they're **auto-promoted** to `is_admin = true`
- The `is_admin` field is **protected by a server-side hook** — users cannot set it on themselves
- API rules enforce `@request.auth.is_admin = true` for all admin-only operations
- The PocketBase admin panel at `/_/` is separate and requires superuser credentials

### API Rules
```
posts:     list/view = everyone, create = logged in, update/delete = admin only
comments:  list/view = everyone, create = logged in, update/delete = own or admin
votes:     list = everyone, create = logged in, delete = own only
```

## Tech Stack

| Layer | Tech |
|---|---|
| Backend | [PocketBase](https://pocketbase.io) — Go binary, SQLite, REST API, auth |
| Frontend | React 19 + Vite 6 |
| AI | [OpenRouter](https://openrouter.ai) — any model |
| Drag & Drop | [@hello-pangea/dnd](https://github.com/hello-pangea/dnd) |
| Icons | [Lucide React](https://lucide.dev) |
| Styling | Vanilla CSS — Dark Glass theme |

## Contributing

PRs welcome! Please open an issue first to discuss what you'd like to change.

## License

[MIT](LICENSE)
