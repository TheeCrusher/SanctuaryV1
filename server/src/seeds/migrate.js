// ============================================================
// Database Migration Script (Production-Safe)
// ============================================================
// Unlike seed.js, this script NEVER drops tables or deletes data.
// It only:
//   1. Creates tables if they don't already exist (from schema.sql)
//   2. Loads real church data if the churches table is empty
//
// Safe to run on every deploy — it checks before inserting.
//
// Run with: npm run migrate (from the server/ directory)
// ============================================================

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import dotenv from 'dotenv'
import pg from 'pg'

// Load environment variables
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

async function migrate() {
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  })

  try {
    await client.connect()
    console.log('📦 Connected to database\n')

    // ---- Step 1: Add missing columns to existing tables ----
    // Must run BEFORE schema.sql because schema.sql creates indexes
    // on new columns (like idx_churches_state). If the column doesn't
    // exist yet, the index creation fails. So we add columns first.
    console.log('🔧 Adding any missing columns to existing tables...')
    const columnMigrations = [
      'ALTER TABLE churches ADD COLUMN IF NOT EXISTS state VARCHAR(50)',
      'ALTER TABLE churches ADD COLUMN IF NOT EXISTS phone VARCHAR(20)',
      'ALTER TABLE churches ADD COLUMN IF NOT EXISTS website TEXT',
      'ALTER TABLE churches ADD COLUMN IF NOT EXISTS short_description TEXT',
      'ALTER TABLE churches ADD COLUMN IF NOT EXISTS photo_url TEXT',
      'ALTER TABLE churches ADD COLUMN IF NOT EXISTS google_place_id VARCHAR(255)',
      // Phase 2: Category averages on churches table
      'ALTER TABLE churches ADD COLUMN IF NOT EXISTS avg_worship DECIMAL(2,1)',
      'ALTER TABLE churches ADD COLUMN IF NOT EXISTS avg_sermon DECIMAL(2,1)',
      'ALTER TABLE churches ADD COLUMN IF NOT EXISTS avg_community DECIMAL(2,1)',
      'ALTER TABLE churches ADD COLUMN IF NOT EXISTS avg_youth DECIMAL(2,1)',
      'ALTER TABLE churches ADD COLUMN IF NOT EXISTS avg_children DECIMAL(2,1)',
      'ALTER TABLE churches ADD COLUMN IF NOT EXISTS avg_biblestudy DECIMAL(2,1)',
      'ALTER TABLE churches ADD COLUMN IF NOT EXISTS avg_parking DECIMAL(2,1)',
      'ALTER TABLE churches ADD COLUMN IF NOT EXISTS avg_facilities DECIMAL(2,1)',
      // Phase 2: Category ratings on church_reviews table
      'ALTER TABLE church_reviews ADD COLUMN IF NOT EXISTS rating_worship INTEGER',
      'ALTER TABLE church_reviews ADD COLUMN IF NOT EXISTS rating_sermon INTEGER',
      'ALTER TABLE church_reviews ADD COLUMN IF NOT EXISTS rating_community INTEGER',
      'ALTER TABLE church_reviews ADD COLUMN IF NOT EXISTS rating_youth INTEGER',
      'ALTER TABLE church_reviews ADD COLUMN IF NOT EXISTS rating_children INTEGER',
      'ALTER TABLE church_reviews ADD COLUMN IF NOT EXISTS rating_biblestudy INTEGER',
      'ALTER TABLE church_reviews ADD COLUMN IF NOT EXISTS rating_parking INTEGER',
      'ALTER TABLE church_reviews ADD COLUMN IF NOT EXISTS rating_facilities INTEGER',
      // Phase 3: Google rating + widen hours column
      'ALTER TABLE churches ADD COLUMN IF NOT EXISTS google_rating DECIMAL(2,1)',
      'ALTER TABLE churches ALTER COLUMN hours TYPE TEXT',
      // Users: phone_number (added in early session, missed in migration)
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20)',
      // Prayer requests: type + linked_prayer_id (Session 11: Testimonies)
      "ALTER TABLE prayer_requests ADD COLUMN IF NOT EXISTS type VARCHAR(20) NOT NULL DEFAULT 'prayer'",
      'ALTER TABLE prayer_requests ADD COLUMN IF NOT EXISTS linked_prayer_id INTEGER',
      // Session 21: Location fields on users table
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS state VARCHAR(2)',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS city VARCHAR(100)',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_church_id INTEGER',
      // Appointments rework: add 'declined' status
      `ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_status_check`,
      `ALTER TABLE appointments ADD CONSTRAINT appointments_status_check CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'declined'))`,
      // Appointments rework: expand notification types
      `ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check`,
      `ALTER TABLE notifications ADD CONSTRAINT notifications_type_check CHECK (type IN ('new_message', 'connection_request', 'connection_accepted', 'prayer_prayed', 'prayer_comment', 'testimony_celebration', 'event_rsvp', 'appointment_request', 'appointment_confirmed', 'appointment_declined', 'appointment_scheduled', 'church_announcement', 'waitlist_spot_open'))`,
      // Session 22: Guide discovery — availability settings on users table
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS accepting_seekers BOOLEAN DEFAULT true',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS max_pending_requests INTEGER DEFAULT 5',
      // Session 25: Digital events — new columns on events table
      "ALTER TABLE events ADD COLUMN IF NOT EXISTS event_type VARCHAR(20) NOT NULL DEFAULT 'in_person'",
      'ALTER TABLE events ADD COLUMN IF NOT EXISTS event_link TEXT',
      'ALTER TABLE events ADD COLUMN IF NOT EXISTS is_live BOOLEAN DEFAULT false',
      // Session 25: Expand events category CHECK to include digital categories
      'ALTER TABLE events DROP CONSTRAINT IF EXISTS events_category_check',
      `ALTER TABLE events ADD CONSTRAINT events_category_check CHECK (category IN ('Social', 'Service/Mission', 'Youth', 'Worship', 'Active/Outdoor', 'Sermons/Teachings', 'Prayer', 'Bible Study', 'General'))`,
      // Session 26: Notes linked to appointments
      'ALTER TABLE notes ADD COLUMN IF NOT EXISTS appointment_id INTEGER',
      // Session 27: Onboarding tour
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false',
    ]
    for (const sql of columnMigrations) {
      // Wrap in try/catch so it doesn't fail if churches table doesn't exist yet
      try { await client.query(sql) } catch (e) { /* table may not exist yet — that's OK */ }
    }
    console.log('   ✅ Column check complete\n')

    // ---- Step 2: Ensure all tables exist ----
    // schema.sql uses CREATE TABLE IF NOT EXISTS, so this is safe.
    // It will create any new tables without touching existing ones.
    // Now safe to run because missing columns were added above.
    console.log('📋 Ensuring all tables exist (CREATE IF NOT EXISTS)...')
    const schemaPath = join(__dirname, '..', 'config', 'schema.sql')
    const schema = readFileSync(schemaPath, 'utf8')
    await client.query(schema)
    console.log('   ✅ All tables verified\n')

    // ---- Step 2b: Fix onboarding for pre-existing users ----
    // When onboarding_completed was first added (DEFAULT false), all existing
    // users got false — triggering the tour for everyone. Set it to true for
    // users who existed before the feature was deployed (Feb 16, 2026).
    await client.query(
      `UPDATE users SET onboarding_completed = true
       WHERE onboarding_completed = false AND created_at < '2026-02-16'`
    )
    console.log('   ✅ Onboarding status fixed for existing users\n')

    // ---- Step 3: Load real churches if table is empty ----
    // Check how many churches are in the database already.
    // If there are churches, skip — don't insert duplicates.
    const countResult = await client.query('SELECT COUNT(*) FROM churches')
    const churchCount = parseInt(countResult.rows[0].count)

    if (churchCount > 0) {
      console.log(`⛪ Churches table already has ${churchCount} entries — skipping church import`)
    } else {
      console.log('⛪ Churches table is empty — loading real churches from JSON files...')
      const churchesDir = join(__dirname, 'churches')
      const churchFiles = ['churches_1.json', 'churches_2.json', 'churches_3.json', 'churches_4.json', 'churches_5.json']
      let realChurchCount = 0

      for (const file of churchFiles) {
        const filePath = join(churchesDir, file)
        const churches = JSON.parse(readFileSync(filePath, 'utf8'))

        for (const c of churches) {
          const zipMatch = c.address?.match(/(\d{5})/) || []
          const zip = zipMatch[1] || '00000'

          await client.query(
            `INSERT INTO churches (name, address, city, state, zip, phone, website, short_description, photo_url)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [c.name, c.address, c.city, c.state, zip, c.phone || null, c.website || null, c.short_description || null, c.photo_url || null]
          )
          realChurchCount++
        }
        console.log(`   ✅ ${file}: ${churches.length} churches loaded`)
      }
      console.log(`   ✅ Total: ${realChurchCount} churches loaded\n`)
    }

    console.log('\n✅ Migration complete!')

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message)
    console.error(error)
    process.exit(1)
  } finally {
    await client.end()
  }
}

migrate()
