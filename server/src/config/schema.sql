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
  phone_number    VARCHAR(20),
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
  id              SERIAL PRIMARY KEY,
  owner_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  person_id       INTEGER REFERENCES users(id) ON DELETE CASCADE,
  last_message    TEXT,
  last_time       VARCHAR(20),
  last_sender_id  INTEGER REFERENCES users(id) ON DELETE SET NULL,
  unread_count    INTEGER DEFAULT 0,
  is_group        BOOLEAN DEFAULT false,
  group_name      VARCHAR(100),
  created_by      INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_owner ON conversations(owner_id);
CREATE INDEX IF NOT EXISTS idx_conversations_person ON conversations(person_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_conversations_pair
  ON conversations(LEAST(owner_id, person_id), GREATEST(owner_id, person_id));

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
-- USER BLOCKS TABLE
-- ============================================================
-- Tracks which users have blocked each other.
-- Blocking is bidirectional: if A blocks B, both become invisible
-- to each other across the entire app (community, messages, etc).
-- All block checks happen server-side in SQL queries.

CREATE TABLE IF NOT EXISTS user_blocks (
  id          SERIAL PRIMARY KEY,
  blocker_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker ON user_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked ON user_blocks(blocked_id);

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
  state             VARCHAR(50),
  zip               VARCHAR(10) NOT NULL,
  phone             VARCHAR(20),
  website           TEXT,
  short_description TEXT,
  photo_url         TEXT,
  google_place_id   VARCHAR(255),
  sunday_school     BOOLEAN DEFAULT false,
  recommended_ages  VARCHAR(50),
  hours             VARCHAR(100),
  avg_worship       DECIMAL(2,1) DEFAULT NULL,
  avg_sermon        DECIMAL(2,1) DEFAULT NULL,
  avg_community     DECIMAL(2,1) DEFAULT NULL,
  avg_youth         DECIMAL(2,1) DEFAULT NULL,
  avg_children      DECIMAL(2,1) DEFAULT NULL,
  avg_biblestudy    DECIMAL(2,1) DEFAULT NULL,
  avg_parking       DECIMAL(2,1) DEFAULT NULL,
  avg_facilities    DECIMAL(2,1) DEFAULT NULL,
  overall_rating    DECIMAL(2,1) DEFAULT 0,
  review_count      INTEGER DEFAULT 0,
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_churches_city ON churches(city);
CREATE INDEX IF NOT EXISTS idx_churches_state ON churches(state);
CREATE INDEX IF NOT EXISTS idx_churches_zip ON churches(zip);
CREATE UNIQUE INDEX IF NOT EXISTS idx_churches_google_place_id ON churches(google_place_id) WHERE google_place_id IS NOT NULL;

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
  id                 SERIAL PRIMARY KEY,
  user_id            INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  church_id          INTEGER NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  rating             INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  rating_worship     INTEGER CHECK (rating_worship >= 1 AND rating_worship <= 5),
  rating_sermon      INTEGER CHECK (rating_sermon >= 1 AND rating_sermon <= 5),
  rating_community   INTEGER CHECK (rating_community >= 1 AND rating_community <= 5),
  rating_youth       INTEGER CHECK (rating_youth >= 1 AND rating_youth <= 5),
  rating_children    INTEGER CHECK (rating_children >= 1 AND rating_children <= 5),
  rating_biblestudy  INTEGER CHECK (rating_biblestudy >= 1 AND rating_biblestudy <= 5),
  rating_parking     INTEGER CHECK (rating_parking >= 1 AND rating_parking <= 5),
  rating_facilities  INTEGER CHECK (rating_facilities >= 1 AND rating_facilities <= 5),
  review_text        TEXT,
  created_at         TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at         TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
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
  status          VARCHAR(20) DEFAULT 'active'
                  CHECK (status IN ('active', 'answered')),
  type            VARCHAR(20) NOT NULL DEFAULT 'prayer'
                  CHECK (type IN ('prayer', 'testimony')),
  linked_prayer_id INTEGER REFERENCES prayer_requests(id) ON DELETE SET NULL,
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

-- ============================================================
-- EVENTS TABLE
-- ============================================================
-- Community events that users can browse, create, and RSVP to.
-- Optionally linked to a church.
--
-- Maps to: /api/events endpoints

CREATE TABLE IF NOT EXISTS events (
  id          SERIAL PRIMARY KEY,
  title       VARCHAR(200) NOT NULL,
  description TEXT,
  date_time   TIMESTAMP NOT NULL,
  location    VARCHAR(300),
  category    VARCHAR(50) NOT NULL DEFAULT 'Social'
              CHECK (category IN ('Social', 'Service/Mission', 'Youth', 'Worship', 'Active/Outdoor')),
  created_by  INTEGER REFERENCES users(id) ON DELETE CASCADE,
  church_id   INTEGER REFERENCES churches(id) ON DELETE SET NULL,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_date ON events(date_time);
CREATE INDEX IF NOT EXISTS idx_events_church ON events(church_id);

-- ============================================================
-- EVENT RSVPS TABLE
-- ============================================================
-- Tracks which users have RSVP'd to which events.
-- One RSVP per user per event (UNIQUE constraint).

CREATE TABLE IF NOT EXISTS event_rsvps (
  id         SERIAL PRIMARY KEY,
  event_id   INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_event_rsvps_event ON event_rsvps(event_id);
CREATE INDEX IF NOT EXISTS idx_event_rsvps_user ON event_rsvps(user_id);

-- ============================================================
-- CHURCH ANNOUNCEMENTS TABLE
-- ============================================================
-- Bulletin board announcements posted by guides for a church.
-- Categories help organize announcement types.
--
-- Maps to: /api/churches/:id/announcements endpoints

CREATE TABLE IF NOT EXISTS church_announcements (
  id         SERIAL PRIMARY KEY,
  church_id  INTEGER NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  author_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      VARCHAR(200) NOT NULL,
  message    TEXT NOT NULL,
  category   VARCHAR(50) NOT NULL DEFAULT 'Announcement'
             CHECK (category IN ('Announcement', 'Upcoming Sermon', 'Schedule Change', 'Church Need', 'Event')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_announcements_church ON church_announcements(church_id);

-- ============================================================
-- NOTIFICATIONS TABLE
-- ============================================================
-- In-app notifications for user activity (messages, connections,
-- prayers, events, appointments, church announcements).
-- Each notification belongs to one user and optionally references
-- a related entity so the frontend can navigate on tap.
--
-- Maps to: /api/notifications endpoints

CREATE TABLE IF NOT EXISTS notifications (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  actor_id        INTEGER REFERENCES users(id) ON DELETE SET NULL,
  type            VARCHAR(50) NOT NULL
                  CHECK (type IN (
                    'new_message',
                    'connection_request',
                    'connection_accepted',
                    'prayer_prayed',
                    'prayer_comment',
                    'testimony_celebration',
                    'event_rsvp',
                    'appointment_request',
                    'church_announcement'
                  )),
  title           VARCHAR(200) NOT NULL,
  body            TEXT,
  reference_type  VARCHAR(50),
  reference_id    INTEGER,
  is_read         BOOLEAN DEFAULT false,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- ============================================================
-- PASSWORD RESETS TABLE
-- ============================================================
-- Stores hashed 6-digit recovery codes for password reset flow.
-- Codes expire after 15 minutes. After 5 failed attempts the
-- record is locked for 30 minutes. Old codes are invalidated
-- when a new one is requested.
--
-- Maps to: /api/auth/forgot-password, verify-code, reset-password

CREATE TABLE IF NOT EXISTS password_resets (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code_hash       VARCHAR(255) NOT NULL,
  method          VARCHAR(10) NOT NULL CHECK (method IN ('email', 'phone')),
  expires_at      TIMESTAMP WITH TIME ZONE NOT NULL,
  used            BOOLEAN DEFAULT FALSE,
  attempts        INTEGER DEFAULT 0,
  locked_until    TIMESTAMP WITH TIME ZONE,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_resets_user ON password_resets(user_id);
