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

    // ---- Step 2: Load real churches if table is empty ----
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
