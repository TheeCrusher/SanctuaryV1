-- ============================================================
-- Sanctuary Database Schema
-- ============================================================
-- This file defines all the tables for the Sanctuary app.
-- Each table maps to a data model in the React frontend.
-- Run this once to set up the database structure.
-- ============================================================

-- ============================================================
-- USERS TABLE
-- ============================================================
-- Stores all registered users (Guides and Seekers).
-- Currently the frontend has one hardcoded test user;
-- this table supports unlimited users.
--
-- Maps to: AppContext.jsx → user state + AVAILABLE_PEOPLE

CREATE TABLE IF NOT EXISTS users (
  id              SERIAL PRIMARY KEY,
  name            VARCHAR(100) NOT NULL,
  email           VARCHAR(255) UNIQUE NOT NULL,
  password_hash   VARCHAR(255) NOT NULL,
  avatar          VARCHAR(10) DEFAULT '🙏',
  photo_url       TEXT,
  role            VARCHAR(20) NOT NULL DEFAULT 'seeker'
                  CHECK (role IN ('guide', 'seeker', 'admin')),
  bio             TEXT,
  specialization  VARCHAR(100),
  location        VARCHAR(100),
  denomination    VARCHAR(100),
  church_name     VARCHAR(100),
  interests       TEXT[] DEFAULT '{}',
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ============================================================
-- APPOINTMENTS TABLE
-- ============================================================
-- Stores spiritual guidance sessions between guides and seekers.
-- guide_id links to the logged-in guide (users table).
-- seeker_name is free text for display. seeker_id links to a user account
-- when a Seeker books a session with a Guide.
--
-- Maps to: AppContext.jsx → appointments state
-- Replaces: IndexedDB storage in database.js

CREATE TABLE IF NOT EXISTS appointments (
  id                  SERIAL PRIMARY KEY,
  guide_id            INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seeker_id           INTEGER REFERENCES users(id) ON DELETE SET NULL,
  seeker_name         VARCHAR(100) NOT NULL,
  avatar              VARCHAR(10) DEFAULT '👤',
  date                DATE NOT NULL,
  time                TIME NOT NULL,
  duration            INTEGER NOT NULL CHECK (duration IN (30, 60, 90, 120)),
  type                VARCHAR(50) NOT NULL
                      CHECK (type IN ('Bible Study', 'Prayer Session',
                                      'Counseling', 'General Guidance')),
  notes               TEXT,
  status              VARCHAR(20) NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  recurrence_rule     VARCHAR(20) DEFAULT 'none'
                      CHECK (recurrence_rule IN ('none', 'weekly', 'biweekly', 'monthly')),
  series_id           UUID,
  recurrence_end_date DATE,
  created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appointments_guide ON appointments(guide_id);
CREATE INDEX IF NOT EXISTS idx_appointments_seeker ON appointments(seeker_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_appointments_series ON appointments(series_id);

-- ============================================================
-- CONVERSATIONS TABLE
-- ============================================================
-- A conversation between two users (e.g., a guide and a seeker).
-- owner_id = the user who owns this conversation view.
-- person_id = the other person in the conversation.
--
-- Maps to: AppContext.jsx → conversations state

CREATE TABLE IF NOT EXISTS conversations (
  id            SERIAL PRIMARY KEY,
  owner_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  person_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
  last_message  TEXT,
  last_time     VARCHAR(20),
  unread_count  INTEGER DEFAULT 0,
  is_group      BOOLEAN DEFAULT false,
  group_name    VARCHAR(100),
  created_by    INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_owner ON conversations(owner_id);

-- ============================================================
-- CONVERSATION PARTICIPANTS TABLE
-- ============================================================
-- For group conversations, tracks all members.

CREATE TABLE IF NOT EXISTS conversation_participants (
  id              SERIAL PRIMARY KEY,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_conv_participants_conv ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conv_participants_user ON conversation_participants(user_id);

-- ============================================================
-- MESSAGES TABLE
-- ============================================================
-- Individual messages within a conversation.
--
-- Maps to: AppContext.jsx → conversation.msgs array

CREATE TABLE IF NOT EXISTS messages (
  id              SERIAL PRIMARY KEY,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text            TEXT NOT NULL,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at);

-- ============================================================
-- USER CONNECTIONS TABLE
-- ============================================================
-- Tracks community connections between users.
-- requester_id = the user who sent the connection request.
-- recipient_id = the user who received it.
-- status: pending (awaiting response), accepted (in community), declined.
--
-- Maps to: /api/community endpoints

CREATE TABLE IF NOT EXISTS user_connections (
  id            SERIAL PRIMARY KEY,
  requester_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status        VARCHAR(20) NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(requester_id, recipient_id)
);

CREATE INDEX IF NOT EXISTS idx_connections_requester ON user_connections(requester_id);
CREATE INDEX IF NOT EXISTS idx_connections_recipient ON user_connections(recipient_id);
CREATE INDEX IF NOT EXISTS idx_connections_status ON user_connections(status);

-- ============================================================
-- CHURCHES TABLE
-- ============================================================
-- Stores church listings with ratings.
-- Ratings are stored as individual columns (not nested JSON)
-- because SQL works better with flat columns for filtering/sorting.
--
-- Maps to: AppContext.jsx → ALL_CHURCHES array

CREATE TABLE IF NOT EXISTS churches (
  id                SERIAL PRIMARY KEY,
  name              VARCHAR(200) NOT NULL,
  address           VARCHAR(300) NOT NULL,
  city              VARCHAR(100) NOT NULL,
  zip               VARCHAR(10) NOT NULL,
  sunday_school     BOOLEAN DEFAULT false,
  recommended_ages  VARCHAR(50),
  hours             VARCHAR(100),
  rating_singing    DECIMAL(2,1) DEFAULT 0,
  rating_preaching  DECIMAL(2,1) DEFAULT 0,
  rating_openness   DECIMAL(2,1) DEFAULT 0,
  rating_space      DECIMAL(2,1) DEFAULT 0,
  overall_rating    DECIMAL(2,1) DEFAULT 0,
  review_count      INTEGER DEFAULT 0,
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_churches_city ON churches(city);
CREATE INDEX IF NOT EXISTS idx_churches_zip ON churches(zip);

-- ============================================================
-- BIBLE QUOTES TABLE
-- ============================================================
-- Stores daily Bible quotes for the dashboard.
-- The app picks one based on the current date.
--
-- Maps to: AppContext.jsx → BIBLE_QUOTES array

CREATE TABLE IF NOT EXISTS bible_quotes (
  id    SERIAL PRIMARY KEY,
  text  TEXT NOT NULL,
  ref   VARCHAR(100) NOT NULL
);

-- ============================================================
-- NOTES TABLE
-- ============================================================
-- Personal journal entries for each user.
-- Tags stored as a PostgreSQL text array (e.g., {'Prayer','Scripture'}).
--
-- Maps to: AppContext.jsx → notes state

CREATE TABLE IF NOT EXISTS notes (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       VARCHAR(200) NOT NULL,
  content     TEXT NOT NULL,
  tags        TEXT[] DEFAULT '{}',
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notes_user ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_created ON notes(created_at DESC);

-- ============================================================
-- CHURCH FAVORITES TABLE
-- ============================================================
-- Tracks which churches a user has favorited.
-- Composite unique constraint prevents duplicate favorites.
--
-- Maps to: AppContext.jsx → favoriteChurchIds state

CREATE TABLE IF NOT EXISTS church_favorites (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  church_id   INTEGER NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, church_id)
);

CREATE INDEX IF NOT EXISTS idx_church_favorites_user ON church_favorites(user_id);

-- ============================================================
-- SCRIPTURE VERSES TABLE
-- ============================================================
-- Bible verses organized by category for the Scripture Study feature.

CREATE TABLE IF NOT EXISTS scripture_verses (
  id        SERIAL PRIMARY KEY,
  text      TEXT NOT NULL,
  reference VARCHAR(100) NOT NULL,
  category  VARCHAR(50) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_scripture_category ON scripture_verses(category);

-- ============================================================
-- READING PLANS TABLE
-- ============================================================
-- Multi-day reading plans (e.g., "Gospel of John - 21 Days").

CREATE TABLE IF NOT EXISTS reading_plans (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(200) NOT NULL,
  description TEXT,
  total_days  INTEGER NOT NULL
);

-- ============================================================
-- READING PLAN DAYS TABLE
-- ============================================================
-- Individual days within a reading plan.

CREATE TABLE IF NOT EXISTS reading_plan_days (
  id         SERIAL PRIMARY KEY,
  plan_id    INTEGER NOT NULL REFERENCES reading_plans(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  title      VARCHAR(200) NOT NULL,
  reference  VARCHAR(100) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_plan_days_plan ON reading_plan_days(plan_id);

-- ============================================================
-- USER VERSE BOOKMARKS TABLE
-- ============================================================
-- Tracks which scripture verses a user has bookmarked.

CREATE TABLE IF NOT EXISTS user_verse_bookmarks (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  verse_id   INTEGER NOT NULL REFERENCES scripture_verses(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, verse_id)
);

CREATE INDEX IF NOT EXISTS idx_verse_bookmarks_user ON user_verse_bookmarks(user_id);

-- ============================================================
-- USER READING PROGRESS TABLE
-- ============================================================
-- Tracks which days a user has completed in each reading plan.

CREATE TABLE IF NOT EXISTS user_reading_progress (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id         INTEGER NOT NULL REFERENCES reading_plans(id) ON DELETE CASCADE,
  completed_days  INTEGER[] DEFAULT '{}',
  started_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, plan_id)
);

CREATE INDEX IF NOT EXISTS idx_reading_progress_user ON user_reading_progress(user_id);

-- ============================================================
-- CHURCH REVIEWS TABLE
-- ============================================================
-- User-submitted reviews for churches with star ratings.
-- One review per user per church (UNIQUE constraint).

CREATE TABLE IF NOT EXISTS church_reviews (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  church_id   INTEGER NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  rating      INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, church_id)
);

CREATE INDEX IF NOT EXISTS idx_church_reviews_church ON church_reviews(church_id);
CREATE INDEX IF NOT EXISTS idx_church_reviews_user ON church_reviews(user_id);

-- ============================================================
-- PRAYER REQUESTS TABLE
-- ============================================================
-- Community prayer request board.

CREATE TABLE IF NOT EXISTS prayer_requests (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title         VARCHAR(200) NOT NULL,
  description   TEXT,
  category      VARCHAR(50) NOT NULL
                CHECK (category IN ('Health', 'Family', 'Guidance', 'Gratitude', 'Financial', 'Other')),
  is_anonymous  BOOLEAN DEFAULT false,
  prayer_count  INTEGER DEFAULT 0,
  status        VARCHAR(20) DEFAULT 'active'
                CHECK (status IN ('active', 'answered')),
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prayer_requests_user ON prayer_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_prayer_requests_status ON prayer_requests(status);

-- ============================================================
-- PRAYER INTERACTIONS TABLE
-- ============================================================
-- Tracks who prayed for a request and comments.

CREATE TABLE IF NOT EXISTS prayer_interactions (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  request_id    INTEGER NOT NULL REFERENCES prayer_requests(id) ON DELETE CASCADE,
  type          VARCHAR(20) NOT NULL CHECK (type IN ('prayed', 'comment')),
  comment_text  TEXT,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prayer_interactions_request ON prayer_interactions(request_id);
CREATE INDEX IF NOT EXISTS idx_prayer_interactions_user ON prayer_interactions(user_id);

-- ============================================================
-- BIBLE HIGHLIGHTS TABLE
-- ============================================================
-- Users can highlight individual verses with different colors.
-- One highlight per user per verse (UNIQUE constraint).

CREATE TABLE IF NOT EXISTS user_bible_highlights (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  book       VARCHAR(50) NOT NULL,
  chapter    INTEGER NOT NULL,
  verse      INTEGER NOT NULL,
  color      VARCHAR(20) NOT NULL DEFAULT 'yellow',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, book, chapter, verse)
);

CREATE INDEX IF NOT EXISTS idx_bible_highlights_user ON user_bible_highlights(user_id);

-- ============================================================
-- BIBLE BOOKMARKS TABLE
-- ============================================================
-- Users can bookmark specific locations in the Bible.

CREATE TABLE IF NOT EXISTS user_bible_bookmarks (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  book       VARCHAR(50) NOT NULL,
  chapter    INTEGER NOT NULL,
  verse      INTEGER DEFAULT NULL,
  note       TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, book, chapter, verse)
);

CREATE INDEX IF NOT EXISTS idx_bible_bookmarks_user ON user_bible_bookmarks(user_id);
