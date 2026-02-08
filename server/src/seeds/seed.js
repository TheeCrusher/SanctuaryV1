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
  AVAILABLE_PEOPLE,
  CHURCHES,
  BIBLE_QUOTES,
  SAMPLE_APPOINTMENTS
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
    console.log('   ✅ 20 tables created\n')

    // ---- Step 3: Insert test user ----
    console.log('👤 Creating test user...')
    const passwordHash = await bcrypt.hash(TEST_USER.password, 10)
    const userResult = await client.query(
      `INSERT INTO users (name, email, password_hash, avatar, role, bio, specialization, location, denomination, church_name, interests)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id`,
      [TEST_USER.name, TEST_USER.email, passwordHash, TEST_USER.avatar, TEST_USER.role,
       'Spiritual guide dedicated to helping others find their path through prayer and scripture.',
       'General Guidance', 'Atlanta, GA',
       TEST_USER.denomination, TEST_USER.churchName, TEST_USER.interests]
    )
    const guideId = userResult.rows[0].id
    console.log(`   ✅ Test user created (id: ${guideId})`)
    console.log(`      Email: ${TEST_USER.email}`)
    console.log(`      Password: ${TEST_USER.password}\n`)

    // ---- Step 4: Insert available people as users ----
    console.log('👥 Creating available people...')
    const peopleIds = []
    for (const person of AVAILABLE_PEOPLE) {
      // Give each person a dummy password (they're demo accounts)
      const hash = await bcrypt.hash('password123', 10)
      const result = await client.query(
        `INSERT INTO users (name, email, password_hash, avatar, role, denomination, church_name, interests)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id`,
        [
          person.name,
          person.name.toLowerCase().replace(/\s+/g, '.') + '@sanctuary.com',
          hash,
          person.avatar,
          person.role,
          person.denomination || null,
          person.churchName || null,
          person.interests || []
        ]
      )
      peopleIds.push(result.rows[0].id)
      console.log(`   ✅ ${person.name} (${person.role})`)
    }
    console.log('')

    // ---- Step 5: Insert churches ----
    console.log('⛪ Inserting churches...')
    for (const church of CHURCHES) {
      await client.query(
        `INSERT INTO churches (name, address, city, zip, sunday_school, recommended_ages,
         hours, rating_singing, rating_preaching, rating_openness, rating_space,
         overall_rating, review_count)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          church.name, church.address, church.city, church.zip,
          church.sundaySchool, church.recommendedAges, church.hours,
          church.ratingSinging, church.ratingPreaching, church.ratingOpenness,
          church.ratingSpace, church.overallRating, church.reviewCount
        ]
      )
      console.log(`   ✅ ${church.name} (${church.city})`)
    }
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
    // peopleIds[4] = Grace Okafor (guide)
    console.log('\n🤝 Inserting community connections...')

    // Test user connected to Sarah Johnson (accepted)
    await client.query(
      `INSERT INTO user_connections (requester_id, recipient_id, status) VALUES ($1, $2, 'accepted')`,
      [guideId, peopleIds[0]]
    )
    console.log('   ✅ Spiritual Guide ↔ Sarah Johnson (accepted)')

    // Test user connected to Grace Okafor (accepted)
    await client.query(
      `INSERT INTO user_connections (requester_id, recipient_id, status) VALUES ($1, $2, 'accepted')`,
      [guideId, peopleIds[4]]
    )
    console.log('   ✅ Spiritual Guide ↔ Grace Okafor (accepted)')

    // Michael Chen sent a pending request to test user
    await client.query(
      `INSERT INTO user_connections (requester_id, recipient_id, status) VALUES ($1, $2, 'pending')`,
      [peopleIds[1], guideId]
    )
    console.log('   ✅ Michael Chen → Spiritual Guide (pending)')

    console.log('\n🎉 Database seeded successfully!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`   Users:        ${1 + AVAILABLE_PEOPLE.length}`)
    console.log(`   Churches:     ${CHURCHES.length}`)
    console.log(`   Quotes:       ${BIBLE_QUOTES.length}`)
    console.log(`   Appointments: ${SAMPLE_APPOINTMENTS.length}`)
    console.log(`   Verses:       ${SCRIPTURE_VERSES.length}`)
    console.log(`   Plans:        ${READING_PLANS.length} (${totalPlanDays} days)`)
    console.log(`   Connections:  3 (2 accepted, 1 pending)`)
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
