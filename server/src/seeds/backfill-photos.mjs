// =============================================================================
// BACKFILL PHOTOS — one-time script to add randomuser.me photos to seed users
// =============================================================================
// Run locally:  node src/seeds/backfill-photos.mjs
// Run in prod:  DATABASE_URL=<render_url> NODE_ENV=production node src/seeds/backfill-photos.mjs
// =============================================================================

import 'dotenv/config'
import pg from 'pg'

const { Client } = pg

const client = new Client({
  connectionString: process.env.DATABASE_URL || 'postgresql://sanctuary_user:sanctuary_dev_pass@localhost:5432/sanctuary'
})

// All users that were created without photos. Only updates rows where photo_url IS NULL.
const PHOTO_UPDATES = {
  // ── Original AVAILABLE_PEOPLE from seedData.js (already have photos — listed for reference) ──

  // ── Extended Guides (Step 10 of seed-demo.js) ──
  'dominique.fontaine@sanctuary.com': 'https://randomuser.me/api/portraits/women/58.jpg',
  'james.osei.bonsu@sanctuary.com':   'https://randomuser.me/api/portraits/men/60.jpg',
  'carmen.delgado@sanctuary.com':     'https://randomuser.me/api/portraits/women/35.jpg',
  'nathaniel.pierce@sanctuary.com':   'https://randomuser.me/api/portraits/men/70.jpg',
  'grace.huang@sanctuary.com':        'https://randomuser.me/api/portraits/women/49.jpg',
  'simone.adeyemi@sanctuary.com':     'https://randomuser.me/api/portraits/women/23.jpg',
  'marcus.holloway@sanctuary.com':    'https://randomuser.me/api/portraits/men/28.jpg',
  'anna.kowalski@sanctuary.com':      'https://randomuser.me/api/portraits/women/19.jpg',
  'diego.sandoval@sanctuary.com':     'https://randomuser.me/api/portraits/men/46.jpg',
  'keisha.freeman@sanctuary.com':     'https://randomuser.me/api/portraits/women/83.jpg',
  'jerome.watkins@sanctuary.com':     'https://randomuser.me/api/portraits/men/34.jpg',

  // ── Extended Seekers (Step 11 of seed-demo.js) ──
  'elena.vasquez@sanctuary.com':      'https://randomuser.me/api/portraits/women/27.jpg',
  'marcus.webb@sanctuary.com':        'https://randomuser.me/api/portraits/men/39.jpg',
  'natalie.chen@sanctuary.com':       'https://randomuser.me/api/portraits/women/53.jpg',
  'derek.osei@sanctuary.com':         'https://randomuser.me/api/portraits/men/14.jpg',
  'brianna.russo@sanctuary.com':      'https://randomuser.me/api/portraits/women/10.jpg',
  'james.okafor@sanctuary.com':       'https://randomuser.me/api/portraits/men/18.jpg',
  'sophie.laurent@sanctuary.com':     'https://randomuser.me/api/portraits/women/66.jpg',
  'thomas.griffith@sanctuary.com':    'https://randomuser.me/api/portraits/men/57.jpg',
  'aaliyah.monroe@sanctuary.com':     'https://randomuser.me/api/portraits/women/29.jpg',
  'peter.kowalczyk@sanctuary.com':    'https://randomuser.me/api/portraits/men/93.jpg',
  'darius.jackson@sanctuary.com':     'https://randomuser.me/api/portraits/men/30.jpg',
  'kezia.montgomery@sanctuary.com':   'https://randomuser.me/api/portraits/women/40.jpg',
  'samuel.perkins@sanctuary.com':     'https://randomuser.me/api/portraits/men/64.jpg',
  'priscilla.owens@sanctuary.com':    'https://randomuser.me/api/portraits/women/56.jpg',
  'andre.williams@sanctuary.com':     'https://randomuser.me/api/portraits/men/20.jpg',
  'tamara.bell@sanctuary.com':        'https://randomuser.me/api/portraits/women/77.jpg',
  'carlos.reyes@sanctuary.com':       'https://randomuser.me/api/portraits/men/48.jpg',
  'whitney.thomas@sanctuary.com':     'https://randomuser.me/api/portraits/women/16.jpg',
  'luis.menendez@sanctuary.com':      'https://randomuser.me/api/portraits/men/25.jpg',
  'jasmine.powell@sanctuary.com':     'https://randomuser.me/api/portraits/women/69.jpg',
  'elaine.dupree@sanctuary.com':      'https://randomuser.me/api/portraits/women/54.jpg',
  'kevin.odom@sanctuary.com':         'https://randomuser.me/api/portraits/men/82.jpg',
  'rachel.nguyen@sanctuary.com':      'https://randomuser.me/api/portraits/women/43.jpg',
  'noah.fischer@sanctuary.com':       'https://randomuser.me/api/portraits/men/13.jpg',
  'latoya.simmons@sanctuary.com':     'https://randomuser.me/api/portraits/women/61.jpg',
  'patrick.mahoney@sanctuary.com':    'https://randomuser.me/api/portraits/men/88.jpg',
  'yuki.tanaka@sanctuary.com':        'https://randomuser.me/api/portraits/women/79.jpg',
  'dominique.petersen@sanctuary.com': 'https://randomuser.me/api/portraits/women/74.jpg',
  'isaiah.chambers@sanctuary.com':    'https://randomuser.me/api/portraits/men/56.jpg',
  'cassandra.hill@sanctuary.com':     'https://randomuser.me/api/portraits/women/38.jpg',
  'ben.kowalski@sanctuary.com':       'https://randomuser.me/api/portraits/men/43.jpg',
  'nadia.petrov@sanctuary.com':       'https://randomuser.me/api/portraits/women/47.jpg',
  'elijah.moss@sanctuary.com':        'https://randomuser.me/api/portraits/men/77.jpg',
  'tanya.rivers@sanctuary.com':       'https://randomuser.me/api/portraits/women/87.jpg',
  'marcus.young@sanctuary.com':       'https://randomuser.me/api/portraits/men/84.jpg',
  'jade.nguyen@sanctuary.com':        'https://randomuser.me/api/portraits/women/7.jpg',
  'connor.sullivan@sanctuary.com':    'https://randomuser.me/api/portraits/men/96.jpg',
  'aaliya.hassan@sanctuary.com':      'https://randomuser.me/api/portraits/women/31.jpg',
  'roberto.fuentes@sanctuary.com':    'https://randomuser.me/api/portraits/men/5.jpg',
  'amara.okonkwo@sanctuary.com':      'https://randomuser.me/api/portraits/women/60.jpg',
  'devin.harris@sanctuary.com':       'https://randomuser.me/api/portraits/men/1.jpg',
  'marissa.castillo@sanctuary.com':   'https://randomuser.me/api/portraits/women/93.jpg',
  'lena.park@sanctuary.com':          'https://randomuser.me/api/portraits/women/26.jpg',
  'gabriel.torres@sanctuary.com':     'https://randomuser.me/api/portraits/men/50.jpg',
  'faith.osei@sanctuary.com':         'https://randomuser.me/api/portraits/women/80.jpg',
  'tyler.brooks@sanctuary.com':       'https://randomuser.me/api/portraits/men/95.jpg',
  'camille.broussard@sanctuary.com':  'https://randomuser.me/api/portraits/women/90.jpg',
  'marco.reyes@sanctuary.com':        'https://randomuser.me/api/portraits/men/62.jpg',
  'josephine.nakamura@sanctuary.com': 'https://randomuser.me/api/portraits/women/86.jpg',
  'elias.moreno@sanctuary.com':       'https://randomuser.me/api/portraits/men/72.jpg',
}

async function run() {
  await client.connect()
  console.log('📦 Connected to database\n')
  console.log('📸 Backfilling photos for seed users...\n')

  let updated = 0
  let skipped = 0

  for (const [email, url] of Object.entries(PHOTO_UPDATES)) {
    const r = await client.query(
      'UPDATE users SET photo_url = $2 WHERE email = $1 AND photo_url IS NULL RETURNING name',
      [email, url]
    )
    if (r.rowCount > 0) {
      console.log(`   ✅ ${r.rows[0].name}`)
      updated++
    } else {
      skipped++
    }
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`   Updated: ${updated} users`)
  console.log(`   Skipped: ${skipped} (already had photos or not found)`)
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)

  await client.end()
}

run().catch(err => {
  console.error('Error:', err.message)
  process.exit(1)
})
