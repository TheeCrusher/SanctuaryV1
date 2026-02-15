// ============================================================
// Database Seed Script
// ============================================================
// This script sets up the database from scratch:
// 1. Creates all tables (from schema.sql)
// 2. Inserts the test user and available people
// 3. Inserts churches, Bible quotes, and sample appointments
//
// Run with: npm run seed (from the server/ directory)
//
// IMPORTANT: This script drops and recreates tables,
// so all existing data will be lost! Only use during
// development setup.
// ============================================================

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'
import pg from 'pg'

import {
  TEST_USER,
  TEST_SEEKER,
  AVAILABLE_PEOPLE,
  DISCOVERY_USERS,
  SEED_CHURCH_FAVORITES,
  CHURCHES,
  BIBLE_QUOTES,
  SAMPLE_APPOINTMENTS,
  SAMPLE_EVENTS,
  SAMPLE_DIGITAL_EVENTS,
  SAMPLE_ANNOUNCEMENTS,
  SAMPLE_TESTIMONIES,
  SAMPLE_PRAYERS,
  EXTRA_EVENTS,
  EXTRA_DIGITAL_EVENTS,
  SEED_CONVERSATIONS
} from './seedData.js'

import { SCRIPTURE_VERSES, READING_PLANS } from './scriptureData.js'

// Load environment variables
dotenv.config()

// Get the directory of this file (needed for reading schema.sql)
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

async function seed() {
  // Create a direct database connection (not a pool, since this is a one-time script)
  // SSL is required for cloud databases (Render) but not for local Docker
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  })

  try {
    await client.connect()
    console.log('📦 Connected to database\n')

    // ---- Step 1: Drop existing tables and recreate ----
    console.log('🗑️  Dropping existing tables...')
    await client.query(`
      DROP TABLE IF EXISTS user_study_streaks CASCADE;
      DROP TABLE IF EXISTS user_memorization_stats CASCADE;
      DROP TABLE IF EXISTS guide_waitlist CASCADE;
      DROP TABLE IF EXISTS password_resets CASCADE;
      DROP TABLE IF EXISTS notifications CASCADE;
      DROP TABLE IF EXISTS church_announcements CASCADE;
      DROP TABLE IF EXISTS event_rsvps CASCADE;
      DROP TABLE IF EXISTS events CASCADE;
      DROP TABLE IF EXISTS user_blocks CASCADE;
      DROP TABLE IF EXISTS user_connections CASCADE;
      DROP TABLE IF EXISTS user_bible_bookmarks CASCADE;
      DROP TABLE IF EXISTS user_bible_highlights CASCADE;
      DROP TABLE IF EXISTS prayer_interactions CASCADE;
      DROP TABLE IF EXISTS prayer_requests CASCADE;
      DROP TABLE IF EXISTS church_reviews CASCADE;
      DROP TABLE IF EXISTS user_reading_progress CASCADE;
      DROP TABLE IF EXISTS user_verse_bookmarks CASCADE;
      DROP TABLE IF EXISTS reading_plan_days CASCADE;
      DROP TABLE IF EXISTS reading_plans CASCADE;
      DROP TABLE IF EXISTS scripture_verses CASCADE;
      DROP TABLE IF EXISTS church_favorites CASCADE;
      DROP TABLE IF EXISTS notes CASCADE;
      DROP TABLE IF EXISTS conversation_participants CASCADE;
      DROP TABLE IF EXISTS messages CASCADE;
      DROP TABLE IF EXISTS conversations CASCADE;
      DROP TABLE IF EXISTS appointments CASCADE;
      DROP TABLE IF EXISTS churches CASCADE;
      DROP TABLE IF EXISTS bible_quotes CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `)

    // ---- Step 2: Run schema.sql to create tables ----
    console.log('📋 Creating tables from schema.sql...')
    const schemaPath = join(__dirname, '..', 'config', 'schema.sql')
    const schema = readFileSync(schemaPath, 'utf8')
    await client.query(schema)
    console.log('   ✅ 23 tables created\n')

    // ---- Step 3: Insert test user ----
    console.log('👤 Creating test user...')
    const passwordHash = await bcrypt.hash(TEST_USER.password, 10)
    const userResult = await client.query(
      `INSERT INTO users (name, email, password_hash, avatar, photo_url, role, bio, specialization, location, state, city, denomination, church_name, interests, accepting_seekers, max_pending_requests, onboarding_completed)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
       RETURNING id`,
      [TEST_USER.name, TEST_USER.email, passwordHash, TEST_USER.avatar, TEST_USER.profilePhoto,
       TEST_USER.role,
       'Spiritual guide dedicated to helping others find their path through prayer and scripture.',
       'General Guidance', 'Chicago, IL', TEST_USER.state, TEST_USER.city,
       TEST_USER.denomination, TEST_USER.churchName, TEST_USER.interests,
       TEST_USER.acceptingSeekers ?? true, TEST_USER.maxPendingRequests ?? 5, true]
    )
    const guideId = userResult.rows[0].id
    console.log(`   ✅ Test user created (id: ${guideId})`)
    console.log(`      Email: ${TEST_USER.email}`)
    console.log(`      Password: ${TEST_USER.password}\n`)

    // ---- Step 3b: Insert test seeker (Jordan Rivera) ----
    console.log('👤 Creating test seeker...')
    const seekerHash = await bcrypt.hash(TEST_SEEKER.password, 10)
    const seekerResult = await client.query(
      `INSERT INTO users (name, email, password_hash, avatar, photo_url, role, location, state, city, denomination, interests, onboarding_completed)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING id`,
      [TEST_SEEKER.name, TEST_SEEKER.email, seekerHash, TEST_SEEKER.avatar, TEST_SEEKER.profilePhoto,
       TEST_SEEKER.role, TEST_SEEKER.location, TEST_SEEKER.state, TEST_SEEKER.city,
       TEST_SEEKER.denomination, TEST_SEEKER.interests, true]
    )
    const seekerId = seekerResult.rows[0].id
    console.log(`   ✅ Test seeker created (id: ${seekerId})`)
    console.log(`      Email: ${TEST_SEEKER.email}`)
    console.log(`      Password: ${TEST_SEEKER.password}\n`)

    // ---- Step 4: Insert available people as users ----
    console.log('👥 Creating available people...')
    const peopleIds = []
    for (const person of AVAILABLE_PEOPLE) {
      // Give each person a dummy password (they're demo accounts)
      const hash = await bcrypt.hash('password123', 10)
      const result = await client.query(
        `INSERT INTO users (name, email, password_hash, avatar, photo_url, role, denomination, church_name, interests, accepting_seekers, max_pending_requests, state, city, bio, specialization, location)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
         RETURNING id`,
        [
          person.name,
          person.name.toLowerCase().replace(/\s+/g, '.') + '@sanctuary.com',
          hash,
          person.avatar,
          person.profilePhoto || null,
          person.role,
          person.denomination || null,
          person.churchName || null,
          person.interests || [],
          person.acceptingSeekers ?? true,
          person.maxPendingRequests ?? 5,
          person.state || null,
          person.city || null,
          person.bio || null,
          person.specialization || null,
          person.state && person.city ? `${person.city}, ${person.state}` : null
        ]
      )
      peopleIds.push(result.rows[0].id)
      console.log(`   ✅ ${person.name} (${person.role})`)
    }
    console.log('')

    // ---- Step 5: Insert sample churches (original 5 for demo data) ----
    console.log('⛪ Inserting sample churches...')
    for (const church of CHURCHES) {
      await client.query(
        `INSERT INTO churches (name, address, city, zip, sunday_school, recommended_ages,
         hours, overall_rating, review_count)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          church.name, church.address, church.city, church.zip,
          church.sundaySchool, church.recommendedAges, church.hours,
          church.overallRating, church.reviewCount
        ]
      )
      console.log(`   ✅ ${church.name} (${church.city})`)
    }

    // ---- Step 5b: Insert real churches from JSON files ----
    // These are 1,575 real churches across all 50 US states,
    // stored in 5 JSON files (10 states each, alphabetically).
    console.log('\n⛪ Loading real churches from JSON files...')
    const churchesDir = join(__dirname, 'churches')
    const churchFiles = ['churches_1.json', 'churches_2.json', 'churches_3.json', 'churches_4.json', 'churches_5.json']
    let realChurchCount = 0

    for (const file of churchFiles) {
      const filePath = join(churchesDir, file)
      const churches = JSON.parse(readFileSync(filePath, 'utf8'))

      for (const c of churches) {
        // Extract zip code from address (e.g., "Nashville, TN 37207" → "37207")
        const zipMatch = c.address?.match(/(\d{5})/) || []
        const zip = zipMatch[1] || '00000'

        // Truncate phone to 20 chars if it has extra text
        let phone = c.phone || null
        if (phone && phone.length > 20) {
          phone = phone.replace(/\s*\(.*$/, '').substring(0, 20)
        }

        await client.query(
          `INSERT INTO churches (name, address, city, state, zip, phone, website, short_description, photo_url)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [c.name, c.address, c.city, c.state, zip, phone, c.website || null, c.short_description || null, c.photo_url || null]
        )
        realChurchCount++
      }
      console.log(`   ✅ ${file}: ${churches.length} churches loaded`)
    }
    console.log(`   ✅ Total real churches: ${realChurchCount}`)
    console.log('')

    // ---- Step 6: Insert Bible quotes ----
    console.log('📖 Inserting Bible quotes...')
    for (const quote of BIBLE_QUOTES) {
      await client.query(
        'INSERT INTO bible_quotes (text, ref) VALUES ($1, $2)',
        [quote.text, quote.ref]
      )
    }
    console.log(`   ✅ ${BIBLE_QUOTES.length} quotes inserted\n`)

    // ---- Step 7: Insert sample appointments ----
    console.log('📅 Inserting sample appointments...')
    for (const apt of SAMPLE_APPOINTMENTS) {
      await client.query(
        `INSERT INTO appointments (guide_id, seeker_name, avatar, date, time, duration, type, notes, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [guideId, apt.seekerName, apt.avatar, apt.date, apt.time, apt.duration, apt.type, apt.notes, apt.status]
      )
      console.log(`   ✅ ${apt.seekerName} - ${apt.type} (${apt.status})`)
    }

    // ---- Step 8: Insert scripture verses ----
    console.log('\n📜 Inserting scripture verses...')
    for (const verse of SCRIPTURE_VERSES) {
      await client.query(
        'INSERT INTO scripture_verses (text, reference, category) VALUES ($1, $2, $3)',
        [verse.text, verse.reference, verse.category]
      )
    }
    console.log(`   ✅ ${SCRIPTURE_VERSES.length} verses inserted`)

    // ---- Step 9: Insert reading plans ----
    console.log('\n📖 Inserting reading plans...')
    let totalPlanDays = 0
    for (const plan of READING_PLANS) {
      const planResult = await client.query(
        'INSERT INTO reading_plans (name, description, total_days) VALUES ($1, $2, $3) RETURNING id',
        [plan.name, plan.description, plan.totalDays]
      )
      const planId = planResult.rows[0].id

      for (const day of plan.days) {
        await client.query(
          'INSERT INTO reading_plan_days (plan_id, day_number, title, reference) VALUES ($1, $2, $3, $4)',
          [planId, day.dayNumber, day.title, day.reference]
        )
        totalPlanDays++
      }
      console.log(`   ✅ ${plan.name} (${plan.totalDays} days)`)
    }

    // ---- Step 10: Insert sample community connections ----
    // peopleIds[0] = Sarah Johnson (seeker)
    // peopleIds[1] = Michael Chen (seeker)
    // peopleIds[2] = Emily Rodriguez (seeker)
    // peopleIds[3] = James Wilson (seeker)
    // peopleIds[4] = Grace Okafor (guide)
    console.log('\n🤝 Inserting community connections...')

    // Test user connected to Sarah Johnson (accepted)
    await client.query(
      `INSERT INTO user_connections (requester_id, recipient_id, status) VALUES ($1, $2, 'accepted')`,
      [guideId, peopleIds[0]]
    )
    console.log('   ✅ Pastor Mike ↔ Sarah Johnson (accepted)')

    // Test user connected to Emily Rodriguez (accepted)
    await client.query(
      `INSERT INTO user_connections (requester_id, recipient_id, status) VALUES ($1, $2, 'accepted')`,
      [guideId, peopleIds[2]]
    )
    console.log('   ✅ Pastor Mike ↔ Emily Rodriguez (accepted)')

    // Test user connected to James Wilson (accepted)
    await client.query(
      `INSERT INTO user_connections (requester_id, recipient_id, status) VALUES ($1, $2, 'accepted')`,
      [guideId, peopleIds[3]]
    )
    console.log('   ✅ Pastor Mike ↔ James Wilson (accepted)')

    // Test user connected to Grace Okafor (accepted)
    await client.query(
      `INSERT INTO user_connections (requester_id, recipient_id, status) VALUES ($1, $2, 'accepted')`,
      [guideId, peopleIds[4]]
    )
    console.log('   ✅ Pastor Mike ↔ Grace Okafor (accepted)')

    // Michael Chen sent a pending request to test user
    await client.query(
      `INSERT INTO user_connections (requester_id, recipient_id, status) VALUES ($1, $2, 'pending')`,
      [peopleIds[1], guideId]
    )
    console.log('   ✅ Michael Chen → Pastor Mike (pending)')

    // Jordan Rivera connected to Pastor Mike (accepted)
    await client.query(
      `INSERT INTO user_connections (requester_id, recipient_id, status) VALUES ($1, $2, 'accepted')`,
      [seekerId, guideId]
    )
    console.log('   ✅ Jordan Rivera ↔ Pastor Mike (accepted)')

    // ---- Step 10b: Insert discovery users (unconnected) ----
    console.log('\n🔍 Creating discovery users (unconnected)...')
    const discoveryIds = {}
    for (const person of DISCOVERY_USERS) {
      const hash = await bcrypt.hash('password123', 10)
      const result = await client.query(
        `INSERT INTO users (name, email, password_hash, avatar, photo_url, role, bio, specialization, location, state, city, denomination, church_name, interests, accepting_seekers, max_pending_requests)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
         RETURNING id`,
        [
          person.name, person.email, hash, person.avatar, person.profilePhoto || null,
          person.role,
          person.bio || null, person.specialization || null, person.location || null,
          person.state || null, person.city || null,
          person.denomination || null, person.churchName || null, person.interests || [],
          person.acceptingSeekers ?? true, person.maxPendingRequests ?? 5
        ]
      )
      discoveryIds[person.name] = result.rows[0].id
      console.log(`   ✅ ${person.name} (${person.role}) — NOT connected to anyone`)
    }

    // ---- Step 11: Insert church favorites ----
    console.log('\n❤️  Inserting church favorites...')
    // Build lookup maps: userName → userId, churchName → churchId
    const userIdMap = {
      guide: guideId,
      seeker: seekerId,
      david: discoveryIds['David Kim'],
      maria: discoveryIds['Maria Santos']
    }
    // Also map AVAILABLE_PEOPLE by name
    AVAILABLE_PEOPLE.forEach((person, i) => {
      userIdMap[person.name] = peopleIds[i]
    })

    // Get church IDs by name
    const churchResult = await client.query('SELECT id, name FROM churches')
    const churchIdMap = {}
    for (const row of churchResult.rows) {
      churchIdMap[row.name] = row.id
    }

    let favCount = 0
    for (const fav of SEED_CHURCH_FAVORITES) {
      const userId = userIdMap[fav.userKey]
      const churchId = churchIdMap[fav.churchName]
      if (userId && churchId) {
        await client.query(
          'INSERT INTO church_favorites (user_id, church_id) VALUES ($1, $2)',
          [userId, churchId]
        )
        favCount++
        console.log(`   ✅ ${fav.userKey} ❤️ ${fav.churchName}`)
      }
    }

    // ---- Step 12: Insert sample events (in-person + digital) ----
    console.log('\n📅 Inserting community events...')
    for (const evt of SAMPLE_EVENTS) {
      const creatorId = userIdMap[evt.creatorKey]
      const churchId = evt.churchName ? churchIdMap[evt.churchName] : null
      const result = await client.query(
        `INSERT INTO events (title, description, date_time, location, category, event_type, event_link, is_live, created_by, church_id)
         VALUES ($1, $2, $3, $4, $5, 'in_person', NULL, false, $6, $7) RETURNING id`,
        [evt.title, evt.description, evt.dateTime, evt.location, evt.category, creatorId, churchId]
      )
      await client.query(
        'INSERT INTO event_rsvps (event_id, user_id) VALUES ($1, $2)',
        [result.rows[0].id, creatorId]
      )
      console.log(`   ✅ ${evt.title} (${evt.category})`)
    }

    // Insert digital events
    console.log('\n📹 Inserting digital events...')
    for (const evt of SAMPLE_DIGITAL_EVENTS) {
      const creatorId = userIdMap[evt.creatorKey]
      const churchId = evt.churchName ? churchIdMap[evt.churchName] : null
      const result = await client.query(
        `INSERT INTO events (title, description, date_time, category, event_type, event_link, is_live, created_by, church_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
        [evt.title, evt.description, evt.dateTime, evt.category, evt.eventType, evt.eventLink, evt.isLive, creatorId, churchId]
      )
      await client.query(
        'INSERT INTO event_rsvps (event_id, user_id) VALUES ($1, $2)',
        [result.rows[0].id, creatorId]
      )
      console.log(`   ✅ ${evt.title} (${evt.category} - ${evt.isLive ? 'Live' : 'Recorded'})`)
    }

    // Also RSVP the guide and seeker to a couple extra events for demo variety
    const eventsResult = await client.query('SELECT id FROM events ORDER BY id')
    const eventIds = eventsResult.rows.map(r => r.id)
    // RSVP seeker (Jordan) to Prayer Walk (event 1)
    await client.query(
      'INSERT INTO event_rsvps (event_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [eventIds[0], seekerId]
    )
    // RSVP seeker to Potluck (event 5)
    await client.query(
      'INSERT INTO event_rsvps (event_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [eventIds[4], seekerId]
    )
    // RSVP guide to Game Night (event 2)
    await client.query(
      'INSERT INTO event_rsvps (event_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [eventIds[1], guideId]
    )
    console.log('   ✅ Extra RSVPs for guide and seeker')

    // ---- Step 13: Insert sample announcements ----
    console.log('\n📢 Inserting church announcements...')
    for (const ann of SAMPLE_ANNOUNCEMENTS) {
      const authorId = userIdMap[ann.authorKey]
      const churchId = churchIdMap[ann.churchName]
      await client.query(
        `INSERT INTO church_announcements (church_id, author_id, title, message, category)
         VALUES ($1, $2, $3, $4, $5)`,
        [churchId, authorId, ann.title, ann.message, ann.category]
      )
      console.log(`   ✅ ${ann.title} (${ann.category})`)
    }

    // ---- Step 14: Insert sample testimonies ----
    console.log('\n🎉 Inserting testimonies...')
    for (const test of SAMPLE_TESTIMONIES) {
      const userId = userIdMap[test.creatorKey]
      await client.query(
        `INSERT INTO prayer_requests (user_id, title, description, category, is_anonymous, type)
         VALUES ($1, $2, $3, $4, $5, 'testimony')`,
        [userId, test.title, test.description, test.category, test.isAnonymous]
      )
      console.log(`   ✅ ${test.title}`)
    }

    // ---- Step 15: Insert prayer requests ----
    console.log('\n🙏 Inserting prayer requests...')
    for (const prayer of SAMPLE_PRAYERS) {
      const userId = userIdMap[prayer.creatorKey]
      await client.query(
        `INSERT INTO prayer_requests (user_id, title, description, category, is_anonymous, type)
         VALUES ($1, $2, $3, $4, $5, 'prayer')`,
        [userId, prayer.title, prayer.description, prayer.category, prayer.isAnonymous]
      )
      console.log(`   ✅ ${prayer.title}`)
    }

    // ---- Step 15b: Add prayer interactions (likes/praying) for engagement ----
    console.log('\n💛 Adding prayer interactions...')
    const prayerRows = await client.query('SELECT id FROM prayer_requests ORDER BY id')
    const prayerIds = prayerRows.rows.map(r => r.id)
    // Spread interactions across prayers from various users
    const interactors = [
      seekerId, guideId, peopleIds[0], peopleIds[2], peopleIds[4],
      ...peopleIds.slice(10, 16), ...peopleIds.slice(16, 28)
    ].filter(Boolean)
    let interactionCount = 0
    for (let i = 0; i < prayerIds.length; i++) {
      // Each prayer gets 3-8 random "praying" interactions
      const numInteractions = 3 + (i % 6)
      for (let j = 0; j < numInteractions && j < interactors.length; j++) {
        const interactorId = interactors[(i + j) % interactors.length]
        await client.query(
          'INSERT INTO prayer_interactions (request_id, user_id, type) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
          [prayerIds[i], interactorId, 'prayed']
        )
        interactionCount++
      }
    }
    console.log(`   ✅ ${interactionCount} prayer interactions added`)

    // ---- Step 16: Insert extra events (Session 26) ----
    console.log('\n📅 Inserting extra in-person events...')
    for (const evt of EXTRA_EVENTS) {
      const creatorId = userIdMap[evt.creatorKey]
      const churchId = evt.churchName ? churchIdMap[evt.churchName] : null
      const result = await client.query(
        `INSERT INTO events (title, description, date_time, location, category, event_type, event_link, is_live, created_by, church_id)
         VALUES ($1, $2, $3, $4, $5, 'in_person', NULL, false, $6, $7) RETURNING id`,
        [evt.title, evt.description, evt.dateTime, evt.location, evt.category, creatorId, churchId]
      )
      await client.query(
        'INSERT INTO event_rsvps (event_id, user_id) VALUES ($1, $2)',
        [result.rows[0].id, creatorId]
      )
      console.log(`   ✅ ${evt.title} (${evt.category})`)
    }

    console.log('\n📹 Inserting extra digital events...')
    for (const evt of EXTRA_DIGITAL_EVENTS) {
      const creatorId = userIdMap[evt.creatorKey]
      const churchId = evt.churchName ? churchIdMap[evt.churchName] : null
      const result = await client.query(
        `INSERT INTO events (title, description, date_time, category, event_type, event_link, is_live, created_by, church_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
        [evt.title, evt.description, evt.dateTime, evt.category, evt.eventType, evt.eventLink, evt.isLive, creatorId, churchId]
      )
      await client.query(
        'INSERT INTO event_rsvps (event_id, user_id) VALUES ($1, $2)',
        [result.rows[0].id, creatorId]
      )
      console.log(`   ✅ ${evt.title} (${evt.category} - ${evt.isLive ? 'Live' : 'Recorded'})`)
    }

    // ---- Step 17: Spread RSVPs across all events for engagement ----
    console.log('\n🎟️  Spreading RSVPs across events...')
    const allEventsResult = await client.query('SELECT id FROM events ORDER BY id')
    const allEventIds = allEventsResult.rows.map(r => r.id)
    // Build a pool of user IDs to RSVP (mix of old and new users)
    const rsvpPool = [seekerId, guideId, ...peopleIds].filter(Boolean)
    let rsvpCount = 0
    for (let i = 0; i < allEventIds.length; i++) {
      // Each event gets 4-10 RSVPs from various users
      const numRsvps = 4 + (i % 7)
      for (let j = 0; j < numRsvps && j < rsvpPool.length; j++) {
        const userId = rsvpPool[(i * 3 + j) % rsvpPool.length]
        await client.query(
          'INSERT INTO event_rsvps (event_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [allEventIds[i], userId]
        )
        rsvpCount++
      }
    }
    console.log(`   ✅ ${rsvpCount} RSVPs spread across ${allEventIds.length} events`)

    // ---- Step 18: More community connections for engagement ----
    console.log('\n🤝 Adding extra community connections...')
    const extraConnections = [
      // --- Jordan Rivera (seeker) — 3 guides + 7 seekers = 10 total ---
      // (already has: Pastor Mike via Step 10)
      { from: 'seeker', to: 'Grace Okafor' },
      { from: 'seeker', to: 'Pastor Robert Hayes' },
      { from: 'seeker', to: 'Minister Joy Adebayo' },
      { from: 'seeker', to: 'Sarah Johnson' },
      { from: 'seeker', to: 'Nathan Brooks' },
      { from: 'seeker', to: 'Caleb Washington' },
      { from: 'seeker', to: 'Sofia Ramirez' },
      { from: 'seeker', to: 'Marcus Davis' },
      { from: 'seeker', to: 'Olivia Bennett' },
      { from: 'seeker', to: 'Jasmine Torres' },

      // --- Pastor Mike (guide) — 3 guides + 8 seekers = 11 total ---
      // (already has: Grace Okafor, Sarah Johnson, Emily Rodriguez, James Wilson, Jordan Rivera, + pending Michael Chen via Step 10)
      { from: 'guide', to: 'Pastor Thomas Wright' },
      { from: 'guide', to: 'Pastor Daniel Reeves' },
      { from: 'guide', to: 'Olivia Bennett' },
      { from: 'guide', to: 'Nathan Brooks' },
      { from: 'guide', to: 'Rachel Kim' },
      { from: 'guide', to: 'Aisha Williams' },
      { from: 'guide', to: 'Caleb Washington' },
      { from: 'guide', to: 'Marcus Davis' },

      // --- Other cross-connections for general engagement ---
      { from: 'Pastor Robert Hayes', to: 'Isaiah Reed' },
      { from: 'Minister Joy Adebayo', to: 'Isaiah Reed' },
      { from: 'Pastor Lisa Monroe', to: 'Hannah Lee' },
      { from: 'Pastor Lisa Monroe', to: 'Megan O\'Brien' },
      { from: 'Pastor Lisa Monroe', to: 'Ryan Mitchell' },
      { from: 'Deacon Carlos Vega', to: 'Sofia Ramirez' },
      { from: 'Rev. Samuel Kim', to: 'Liam Fitzgerald' },
      { from: 'Pastor David Okonkwo', to: 'Elijah Brown' },
      { from: 'Pastor David Okonkwo', to: 'Caleb Washington' },
      { from: 'Marcus Davis', to: 'Nathan Brooks' },
      { from: 'Destiny Harris', to: 'Aisha Williams' },
      { from: 'Ethan Cooper', to: 'Tyler Odom' },
      { from: 'Zoe Nakamura', to: 'Priya Sharma' },
      { from: 'Elijah Brown', to: 'Caleb Washington' },
      { from: 'Sofia Ramirez', to: 'Emily Rodriguez' },
      { from: 'Hannah Lee', to: 'Grace Okafor' },
      { from: 'Liam Fitzgerald', to: 'Ryan Mitchell' },
      { from: 'Jasmine Torres', to: 'Rachel Kim' }
    ]
    let connCount = 0
    for (const conn of extraConnections) {
      const fromId = userIdMap[conn.from]
      const toId = userIdMap[conn.to]
      if (fromId && toId) {
        await client.query(
          `INSERT INTO user_connections (requester_id, recipient_id, status) VALUES ($1, $2, 'accepted') ON CONFLICT DO NOTHING`,
          [fromId, toId]
        )
        connCount++
      }
    }
    console.log(`   ✅ ${connCount} extra connections added`)

    // ---- Step 19: Seed conversations with messages ----
    console.log('\n💬 Inserting seed conversations...')
    let convCount = 0
    let msgCount = 0
    for (const conv of SEED_CONVERSATIONS) {
      const user1Id = userIdMap[conv.user1]
      const user2Id = userIdMap[conv.user2]
      if (!user1Id || !user2Id) continue

      // Create the conversation row (owner_id = LEAST, person_id = GREATEST to match unique index)
      const ownerId = Math.min(user1Id, user2Id)
      const personId = Math.max(user1Id, user2Id)
      const lastMsg = conv.messages[conv.messages.length - 1]
      const lastSenderId = userIdMap[lastMsg.senderKey]

      // last_time is VARCHAR(20), so use short format like "2:30 PM"
      const lastTime = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      const convResult = await client.query(
        `INSERT INTO conversations (owner_id, person_id, last_message, last_time, last_sender_id)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [ownerId, personId, lastMsg.text, lastTime, lastSenderId]
      )
      const convId = convResult.rows[0].id

      // Add both participants
      await client.query(
        'INSERT INTO conversation_participants (conversation_id, user_id) VALUES ($1, $2), ($1, $3)',
        [convId, user1Id, user2Id]
      )

      // Insert messages with staggered timestamps (spread over the last few days)
      const now = Date.now()
      const msgSpacing = 3600000 * 2 // 2 hours between messages
      const startTime = now - (conv.messages.length * msgSpacing)
      for (let i = 0; i < conv.messages.length; i++) {
        const msg = conv.messages[i]
        const senderId = userIdMap[msg.senderKey]
        const msgTime = new Date(startTime + (i * msgSpacing)).toISOString()
        await client.query(
          'INSERT INTO messages (conversation_id, sender_id, text, created_at) VALUES ($1, $2, $3, $4)',
          [convId, senderId, msg.text, msgTime]
        )
        msgCount++
      }
      convCount++

      // Log the conversation pair
      const name1 = conv.user1 === 'guide' ? 'Pastor Mike' : conv.user1 === 'seeker' ? 'Jordan Rivera' : conv.user1
      const name2 = conv.user2 === 'guide' ? 'Pastor Mike' : conv.user2 === 'seeker' ? 'Jordan Rivera' : conv.user2
      console.log(`   ✅ ${name1} ↔ ${name2} (${conv.messages.length} messages)`)
    }
    console.log(`   📊 ${convCount} conversations, ${msgCount} messages total`)

    const totalConnections = 6 + connCount
    const totalEvents = SAMPLE_EVENTS.length + SAMPLE_DIGITAL_EVENTS.length + EXTRA_EVENTS.length + EXTRA_DIGITAL_EVENTS.length

    console.log('\n🎉 Database seeded successfully!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`   Users:          ${2 + AVAILABLE_PEOPLE.length + DISCOVERY_USERS.length}`)
    console.log(`   Churches:       ${CHURCHES.length} sample + ${realChurchCount} real`)
    console.log(`   Quotes:         ${BIBLE_QUOTES.length}`)
    console.log(`   Appointments:   ${SAMPLE_APPOINTMENTS.length}`)
    console.log(`   Verses:         ${SCRIPTURE_VERSES.length}`)
    console.log(`   Plans:          ${READING_PLANS.length} (${totalPlanDays} days)`)
    console.log(`   Connections:    ${totalConnections} (${totalConnections - 1} accepted, 1 pending)`)
    console.log(`   Favorites:      ${favCount} church favorites`)
    console.log(`   Events:         ${totalEvents} total (${SAMPLE_EVENTS.length + EXTRA_EVENTS.length} in-person + ${SAMPLE_DIGITAL_EVENTS.length + EXTRA_DIGITAL_EVENTS.length} digital)`)
    console.log(`   RSVPs:          ${rsvpCount}+ spread across events`)
    console.log(`   Announcements:  ${SAMPLE_ANNOUNCEMENTS.length}`)
    console.log(`   Prayers:        ${SAMPLE_PRAYERS.length} requests + ${SAMPLE_TESTIMONIES.length} testimonies`)
    console.log(`   Interactions:   ${interactionCount} prayer interactions`)
    console.log(`   Conversations:  ${convCount} (${msgCount} messages)`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  } catch (error) {
    console.error('\n❌ Seeding failed:', error.message)
    console.error(error)
    process.exit(1)
  } finally {
    await client.end()
  }
}

seed()
