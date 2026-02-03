# Backchannel

A local-first tool that helps you find professional connections between job candidates and your existing network. Discover who you already know that has worked with a candidate—before you reach out for a reference.

## The Problem

You're evaluating a candidate. You want to do a backchannel reference—talk to someone who's actually worked with them. But manually cross-referencing their work history against your 500+ LinkedIn connections? That's hours of clicking through profiles.

Backchannel automates this. Import your connections, and when you're evaluating a candidate, instantly see which of your colleagues overlapped with them at the same companies.

## Features

- **Import LinkedIn Connections** - Upload your connections export (CSV)
- **Profile Enrichment** - Fetch work history for your network
- **Candidate Analysis** - Enter a candidate's LinkedIn URL
- **Overlap Detection** - Find colleagues at the same companies during the same time
- **One-Click Outreach** - Draft emails to colleagues for references

## Quick Start

```bash
# Install Bun if you haven't: https://bun.sh
curl -fsSL https://bun.sh/install | bash

# Clone and setup
git clone https://github.com/yourusername/backchannel.git
cd backchannel
bun install
bun run db:migrate
bun run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Configuration

1. **Settings** (gear icon) → Enter your current company name
2. **LinkedIn Session Cookie** (see below)
3. **Gemini API Key**: Get one free at [Google AI Studio](https://aistudio.google.com/apikey)

#### Getting Your LinkedIn Session Cookie

1. Open [linkedin.com](https://www.linkedin.com) in Chrome and log in
2. Open DevTools: `F12` (or `Cmd+Option+I` on Mac)
3. Go to **Application** tab → **Cookies** → **linkedin.com**
4. Find the cookie named `li_at`
5. Double-click the **Value** column and copy the entire string
6. Paste it into Backchannel's Settings

The cookie looks something like `AQEDAT...` (a long alphanumeric string). This is your authenticated session—treat it like a password.

### Usage

1. Export connections from LinkedIn (Settings → Data Privacy → Get a copy → Connections)
2. Import the CSV in the **Network** tab
3. Click **Enrich All** to fetch work histories
4. Go to **Check** tab, paste a candidate's LinkedIn URL
5. See who in your network worked with them

## Tech Stack

[Bun](https://bun.sh) + [Hono](https://hono.dev) + [Vite](https://vitejs.dev) + [React](https://react.dev) + SQLite + [Puppeteer](https://pptr.dev) + [Gemini AI](https://ai.google.dev)

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│  Your Browser                                               │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐   │
│  │   Network   │  │    Check     │  │     History     │   │
│  │  Import CSV │  │  Find overlaps│  │  Past searches  │   │
│  └─────────────┘  └──────────────┘  └─────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Local Server (localhost:3000)                              │
│  ┌──────────┐  ┌──────────────┐  ┌────────────────────┐   │
│  │  SQLite  │  │  Puppeteer   │  │    Gemini AI       │   │
│  │  (local) │  │  (your session)│ │  (parse profiles)  │   │
│  └──────────┘  └──────────────┘  └────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## On "Scraping" vs Personal Automation

This tool doesn't scrape LinkedIn in the traditional sense. Here's the distinction:

**Traditional scraping:**
- Uses fake accounts or no authentication
- Harvests data from profiles you don't have access to
- Operates at scale for commercial purposes
- Stores and redistributes data

**What Backchannel does:**
- Uses *your own* authenticated session
- Only accesses profiles *you* can already view manually
- Runs locally on *your* machine
- Data never leaves your computer
- Automates what you could do by hand (just faster)

Think of it like using a password manager that auto-fills forms, or an email client that fetches your messages. You're not bypassing any access controls—you're automating your own manual workflow.

That said, LinkedIn's Terms of Service are broad and could be interpreted to prohibit any automation. We recommend:

- Keep rate limits reasonable (default 2 seconds between requests)
- Use for personal reference checks, not bulk data collection
- Don't redistribute any data
- Understand that you use this at your own discretion

## Project Structure

```
backchannel/
├── client/                 # React frontend
│   └── src/
│       ├── components/     # UI components
│       └── lib/            # API client
├── server/                 # Hono backend
│   └── src/
│       ├── db/             # SQLite schema
│       ├── lib/            # LinkedIn automation, AI parsing
│       └── routes/         # API endpoints
└── network.db              # Local database (gitignored)
```

## Security Notes

All data stays local:

- **Session cookie** and **API key** stored in local SQLite
- **Database file** is gitignored—never committed
- **No external servers**—everything runs on localhost

Recommendations:
- Run only on machines you control
- If you suspect your session is compromised, revoke it in LinkedIn settings

## Development

```bash
bun run dev          # Start server (serves pre-built client)
bun run dev:dual     # Start both with HMR
bun run build        # Build client for production
bun test server/src  # Run tests
```

## License

MIT
