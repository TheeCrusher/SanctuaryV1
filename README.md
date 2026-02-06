# Sanctuary

A spiritual guidance app connecting guides with seekers. Built with React + Vite frontend and Node.js + Express + PostgreSQL backend.

## Test Credentials
- **Email:** test@sanctuary.com
- **Password:** Sanctuary123

## Quick Start

```bash
# 1. Start PostgreSQL (Docker)
docker compose up -d

# 2. Seed the database (17 tables + sample data)
cd server && npm run seed

# 3. Start the backend (Express + Socket.io on port 3001)
cd server && npm run dev

# 4. Start the frontend (Vite on port 5173, in a new terminal)
npm run dev
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite 5, React Router v6, React Context, Plain CSS, Lucide React, socket.io-client |
| Backend | Node.js, Express 5, PostgreSQL 16, JWT auth, bcryptjs, Socket.io |
| Database | PostgreSQL in Docker (sanctuary-db) |
| Dev Tools | nodemon (auto-restart), morgan (request logging) |

## Features

### Core (Session 1-2)
- JWT authentication (login/register)
- Dashboard with daily Bible quote and stats
- Appointments management (create, confirm, complete)
- Messaging system (conversations + messages)
- Church directory with search and favorites
- Session Notes (journaling with tags)
- Scripture Study (verses, bookmarks, reading plans with progress)
- Splash screen, Bottom navigation (5 tabs)

### Session 3 Features (8 new)
1. **Dark Mode** - CSS variables theming, toggle in Profile, localStorage persistence
2. **User Profiles** - Bio, specialization, location fields; public profile view
3. **Church Reviews** - Star ratings + text reviews, auto-recalculate church rating
4. **Prayer Board** - Community prayer requests, pray button, comments, anonymous posting
5. **Recurring Appointments** - Weekly/biweekly/monthly, series UUID linking, cancel single or series
6. **Calendar View** - Visual CSS Grid month calendar, colored dots, day detail panel
7. **Google Calendar Sync** - "Add to Google Calendar" URL + .ics file download
8. **Real-Time Messaging** - Socket.io WebSockets, typing indicators, online/offline dots

## Project Structure

```
/workspaces/SanctuaryV1/
├── src/                          # React frontend
│   ├── components/
│   │   ├── common/               # Avatar, Badge, Card, EmptyState, Modal
│   │   ├── layout/               # BottomNav
│   │   └── screens/              # 25+ page components
│   ├── context/
│   │   ├── AppContext.jsx         # Global state (API + Socket.io)
│   │   └── ThemeContext.jsx       # Dark mode
│   ├── utils/
│   │   ├── api.js                # REST API helper
│   │   └── socket.js             # Socket.io client
│   ├── App.jsx                   # Routes
│   ├── main.jsx                  # Entry point
│   └── index.css                 # All styles (30 sections)
├── server/                       # Express backend
│   └── src/
│       ├── config/
│       │   ├── db.js             # PostgreSQL pool
│       │   └── schema.sql        # 17 tables
│       ├── middleware/auth.js     # JWT middleware
│       ├── routes/               # 11 route modules
│       ├── seeds/                # Seed script + data
│       ├── socket.js             # Socket.io server
│       └── index.js              # Express + HTTP + Socket.io entry
├── vite.config.js                # Vite config with /api + /socket.io proxy
└── docker-compose.yml            # PostgreSQL container
```

## Database (17 Tables)
users, appointments, conversations, conversation_participants, messages, churches, bible_quotes, notes, church_favorites, church_reviews, scripture_verses, reading_plans, reading_plan_days, user_verse_bookmarks, user_reading_progress, prayer_requests, prayer_interactions
