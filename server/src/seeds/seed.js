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
  SAMPLE_ANNOUNCEMENTS,
  SAMPLE_TESTIMONIES
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
      `INSERT INTO users (name, email, password_hash, avatar, photo_url, role, bio, specialization, location, state, city, denomination, church_name, interests, accepting_seekers, max_pending_requests)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
       RETURNING id`,
      [TEST_USER.name, TEST_USER.email, passwordHash, TEST_USER.avatar, TEST_USER.profilePhoto,
       TEST_USER.role,
       'Spiritual guide dedicated to helping others find their path through prayer and scripture.',
       'General Guidance', 'Chicago, IL', TEST_USER.state, TEST_USER.city,
       TEST_USER.denomination, TEST_USER.churchName, TEST_USER.interests,
       TEST_USER.acceptingSeekers ?? true, TEST_USER.maxPendingRequests ?? 5]
    )
    const guideId = userResult.rows[0].id
    console.log(`   ✅ Test user created (id: ${guideId})`)
    console.log(`      Email: ${TEST_USER.email}`)
    console.log(`      Password: ${TEST_USER.password}\n`)

    // ---- Step 3b: Insert test seeker (Jordan Rivera) ----
    console.log('👤 Creating test seeker...')
    const seekerHash = await bcrypt.hash(TEST_SEEKER.password, 10)
    const seekerResult = await client.query(
      `INSERT INTO users (name, email, password_hash, avatar, photo_url, role, location, state, city, denomination, interests)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id`,
      [TEST_SEEKER.name, TEST_SEEKER.email, seekerHash, TEST_SEEKER.avatar, TEST_SEEKER.profilePhoto,
       TEST_SEEKER.role, TEST_SEEKER.location, TEST_SEEKER.state, TEST_SEEKER.city,
       TEST_SEEKER.denomination, TEST_SEEKER.interests]
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

    // ---- Step 12: Insert sample events ----
    console.log('\n📅 Inserting community events...')
    for (const evt of SAMPLE_EVENTS) {
      const creatorId = userIdMap[evt.creatorKey]
      const churchId = evt.churchName ? churchIdMap[evt.churchName] : null
      const result = await client.query(
        `INSERT INTO events (title, description, date_time, location, category, created_by, church_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [evt.title, evt.description, evt.dateTime, evt.location, evt.category, creatorId, churchId]
      )
      // Auto-RSVP the creator
      await client.query(
        'INSERT INTO event_rsvps (event_id, user_id) VALUES ($1, $2)',
        [result.rows[0].id, creatorId]
      )
      console.log(`   ✅ ${evt.title} (${evt.category})`)
    }

    // Also RSVP the guide and seeker to a couple extra events for demo variety
    // Event IDs are sequential: 1=Prayer Walk, 2=Game Night, 3=Cleanup, 4=Hiking, 5=Potluck
    // RSVP seeker (Jordan) to Prayer Walk (event 1)
    const eventsResult = await client.query('SELECT id FROM events ORDER BY id')
    const eventIds = eventsResult.rows.map(r => r.id)
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

    console.log('\n🎉 Database seeded successfully!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`   Users:          ${2 + AVAILABLE_PEOPLE.length + DISCOVERY_USERS.length}`)
    console.log(`   Churches:       ${CHURCHES.length} sample + ${realChurchCount} real`)
    console.log(`   Quotes:         ${BIBLE_QUOTES.length}`)
    console.log(`   Appointments:   ${SAMPLE_APPOINTMENTS.length}`)
    console.log(`   Verses:         ${SCRIPTURE_VERSES.length}`)
    console.log(`   Plans:          ${READING_PLANS.length} (${totalPlanDays} days)`)
    console.log(`   Connections:    6 (5 accepted, 1 pending)`)
    console.log(`   Favorites:      ${favCount} church favorites`)
    console.log(`   Events:         ${SAMPLE_EVENTS.length} (+ extra RSVPs)`)
    console.log(`   Announcements:  ${SAMPLE_ANNOUNCEMENTS.length}`)
    console.log(`   Testimonies:    ${SAMPLE_TESTIMONIES.length}`)
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
