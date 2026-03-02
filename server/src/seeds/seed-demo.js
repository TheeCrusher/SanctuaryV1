// ============================================================
// Demo Data Seed Script (Production-Safe)
// ============================================================
// Populates the database with demo data for testing/demo purposes.
// Unlike seed.js, this script NEVER drops tables or deletes data.
// It only ADDS data, and checks for existing data first.
//
// Safe to run multiple times — skips if demo data already exists.
//
// Usage:
//   npm run seed-demo                              (local)
//   DATABASE_URL=<url> npm run seed-demo            (production)
//   DATABASE_URL=<url> NODE_ENV=production npm run seed-demo
// ============================================================

import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'
import pg from 'pg'

import {
  AVAILABLE_PEOPLE,
  DISCOVERY_USERS,
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

import { SCRIPTURE_VERSES } from './scriptureData.js'

dotenv.config()

async function seedDemo() {
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  })

  try {
    await client.connect()
    console.log('📦 Connected to database\n')

    // ---- Check if demo data already exists ----
    const demoCheck = await client.query(
      "SELECT id FROM users WHERE email = 'sarah.johnson@sanctuary.com'"
    )
    if (demoCheck.rows.length > 0) {
      console.log('⚠️  Demo data already exists! (Sarah Johnson found)')
      console.log('   To re-seed, you would need to remove existing demo users first.')
      console.log('   Exiting safely — no changes made.\n')
      return
    }

    // ---- Get existing test account IDs ----
    const guideResult = await client.query(
      "SELECT id FROM users WHERE email = 'test@sanctuary.com'"
    )
    const seekerResult = await client.query(
      "SELECT id FROM users WHERE email = 'jordan@sanctuary.com'"
    )
    if (guideResult.rows.length === 0 || seekerResult.rows.length === 0) {
      console.log('❌ Test accounts not found! Run migrate first (npm run migrate).')
      return
    }
    const guideId = guideResult.rows[0].id
    const seekerId = seekerResult.rows[0].id
    console.log(`   Found Pastor Mike (id: ${guideId}) and Jordan Rivera (id: ${seekerId})\n`)

    // ---- Step 1: Create demo users (AVAILABLE_PEOPLE) ----
    console.log('👥 Creating demo users...')
    const passwordHash = await bcrypt.hash('password123', 10)
    const peopleIds = []
    for (const person of AVAILABLE_PEOPLE) {
      const email = person.name.toLowerCase().replace(/\s+/g, '.') + '@sanctuary.com'
      const result = await client.query(
        `INSERT INTO users (name, email, password_hash, avatar, photo_url, role, denomination,
         church_name, interests, accepting_seekers, max_pending_requests, state, city, bio,
         specialization, location, onboarding_completed)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, true)
         RETURNING id`,
        [
          person.name, email, passwordHash, person.avatar, person.profilePhoto || null,
          person.role, person.denomination || null, person.churchName || null,
          person.interests || [], person.acceptingSeekers ?? true,
          person.maxPendingRequests ?? 5, person.state || null, person.city || null,
          person.bio || null, person.specialization || null,
          person.state && person.city ? `${person.city}, ${person.state}` : null
        ]
      )
      peopleIds.push(result.rows[0].id)
    }
    console.log(`   ✅ ${AVAILABLE_PEOPLE.length} demo users created`)

    // ---- Step 1b: Create discovery users ----
    const discoveryIds = {}
    for (const person of DISCOVERY_USERS) {
      const result = await client.query(
        `INSERT INTO users (name, email, password_hash, avatar, photo_url, role, bio,
         specialization, location, state, city, denomination, church_name, interests,
         accepting_seekers, max_pending_requests, onboarding_completed)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, true)
         RETURNING id`,
        [
          person.name, person.email, passwordHash, person.avatar, person.profilePhoto || null,
          person.role, person.bio || null, person.specialization || null,
          person.location || null, person.state || null, person.city || null,
          person.denomination || null, person.churchName || null, person.interests || [],
          person.acceptingSeekers ?? true, person.maxPendingRequests ?? 5
        ]
      )
      discoveryIds[person.name] = result.rows[0].id
    }
    console.log(`   ✅ ${DISCOVERY_USERS.length} discovery users created\n`)

    // ---- Build user ID lookup map ----
    const userIdMap = {
      guide: guideId,
      seeker: seekerId,
      david: discoveryIds['David Kim'],
      maria: discoveryIds['Maria Santos']
    }
    AVAILABLE_PEOPLE.forEach((person, i) => {
      userIdMap[person.name] = peopleIds[i]
    })

    // ---- Step 2: Community connections ----
    console.log('🤝 Creating community connections...')
    const connections = [
      // Pastor Mike's connections
      { from: guideId, to: peopleIds[0] },  // Sarah Johnson
      { from: guideId, to: peopleIds[2] },  // Emily Rodriguez
      { from: guideId, to: peopleIds[3] },  // James Wilson
      { from: guideId, to: peopleIds[4] },  // Grace Okafor
      { from: seekerId, to: guideId },       // Jordan ↔ Pastor Mike
    ]
    // Michael Chen → Pastor Mike (pending)
    await client.query(
      `INSERT INTO user_connections (requester_id, recipient_id, status) VALUES ($1, $2, 'pending')`,
      [peopleIds[1], guideId]
    )

    for (const conn of connections) {
      await client.query(
        `INSERT INTO user_connections (requester_id, recipient_id, status) VALUES ($1, $2, 'accepted')`,
        [conn.from, conn.to]
      )
    }

    // Extra connections for richer engagement
    const extraConnections = [
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
      { from: 'guide', to: 'Pastor Thomas Wright' },
      { from: 'guide', to: 'Pastor Daniel Reeves' },
      { from: 'guide', to: 'Olivia Bennett' },
      { from: 'guide', to: 'Nathan Brooks' },
      { from: 'guide', to: 'Rachel Kim' },
      { from: 'guide', to: 'Aisha Williams' },
      { from: 'guide', to: 'Caleb Washington' },
      { from: 'guide', to: 'Marcus Davis' },
      { from: 'Pastor Robert Hayes', to: 'Isaiah Reed' },
      { from: 'Minister Joy Adebayo', to: 'Isaiah Reed' },
      { from: 'Pastor Lisa Monroe', to: 'Hannah Lee' },
      { from: 'Pastor Lisa Monroe', to: "Megan O'Brien" },
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
      { from: 'Jasmine Torres', to: 'Rachel Kim' },
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
    console.log(`   ✅ ${5 + 1 + connCount} connections created\n`)

    // ---- Step 3: Sample appointments ----
    console.log('📅 Creating sample appointments...')
    for (const apt of SAMPLE_APPOINTMENTS) {
      await client.query(
        `INSERT INTO appointments (guide_id, seeker_name, avatar, date, time, duration, type, notes, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [guideId, apt.seekerName, apt.avatar, apt.date, apt.time, apt.duration, apt.type, apt.notes, apt.status]
      )
    }
    console.log(`   ✅ ${SAMPLE_APPOINTMENTS.length} appointments created\n`)

    // ---- Step 4: Events (in-person + digital) ----
    console.log('📅 Creating events...')
    const churchResult = await client.query('SELECT id, name FROM churches')
    const churchIdMap = {}
    for (const row of churchResult.rows) {
      churchIdMap[row.name] = row.id
    }

    const allEvents = [
      ...SAMPLE_EVENTS.map(e => ({ ...e, eventType: 'in_person', eventLink: null, isLive: false })),
      ...EXTRA_EVENTS.map(e => ({ ...e, eventType: 'in_person', eventLink: null, isLive: false })),
      ...SAMPLE_DIGITAL_EVENTS,
      ...EXTRA_DIGITAL_EVENTS,
    ]
    const eventIds = []
    for (const evt of allEvents) {
      const creatorId = userIdMap[evt.creatorKey]
      const churchId = evt.churchName ? churchIdMap[evt.churchName] : null
      const result = await client.query(
        `INSERT INTO events (title, description, date_time, location, category, event_type, event_link, is_live, created_by, church_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
        [evt.title, evt.description, evt.dateTime, evt.location || null, evt.category,
         evt.eventType || evt.eventType, evt.eventLink || null, evt.isLive || false, creatorId, churchId]
      )
      eventIds.push(result.rows[0].id)
      // Creator auto-RSVPs
      await client.query(
        'INSERT INTO event_rsvps (event_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [result.rows[0].id, creatorId]
      )
    }
    console.log(`   ✅ ${allEvents.length} events created`)

    // Spread RSVPs across events
    const rsvpPool = [seekerId, guideId, ...peopleIds].filter(Boolean)
    let rsvpCount = 0
    for (let i = 0; i < eventIds.length; i++) {
      const numRsvps = 4 + (i % 7)
      for (let j = 0; j < numRsvps && j < rsvpPool.length; j++) {
        const userId = rsvpPool[(i * 3 + j) % rsvpPool.length]
        await client.query(
          'INSERT INTO event_rsvps (event_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [eventIds[i], userId]
        )
        rsvpCount++
      }
    }
    console.log(`   ✅ ${rsvpCount} RSVPs spread across events\n`)

    // ---- Step 5: Church announcements ----
    console.log('📢 Creating church announcements...')
    for (const ann of SAMPLE_ANNOUNCEMENTS) {
      const authorId = userIdMap[ann.authorKey]
      const churchId = churchIdMap[ann.churchName]
      if (authorId && churchId) {
        await client.query(
          `INSERT INTO church_announcements (church_id, author_id, title, message, category)
           VALUES ($1, $2, $3, $4, $5)`,
          [churchId, authorId, ann.title, ann.message, ann.category]
        )
      }
    }
    console.log(`   ✅ ${SAMPLE_ANNOUNCEMENTS.length} announcements created\n`)

    // ---- Step 6: Prayer requests + testimonies ----
    console.log('🙏 Creating prayer requests & testimonies...')
    for (const test of SAMPLE_TESTIMONIES) {
      const userId = userIdMap[test.creatorKey]
      await client.query(
        `INSERT INTO prayer_requests (user_id, title, description, category, is_anonymous, type)
         VALUES ($1, $2, $3, $4, $5, 'testimony')`,
        [userId, test.title, test.description, test.category, test.isAnonymous]
      )
    }
    for (const prayer of SAMPLE_PRAYERS) {
      const userId = userIdMap[prayer.creatorKey]
      await client.query(
        `INSERT INTO prayer_requests (user_id, title, description, category, is_anonymous, type)
         VALUES ($1, $2, $3, $4, $5, 'prayer')`,
        [userId, prayer.title, prayer.description, prayer.category, prayer.isAnonymous]
      )
    }
    console.log(`   ✅ ${SAMPLE_TESTIMONIES.length} testimonies + ${SAMPLE_PRAYERS.length} prayers`)

    // Prayer interactions
    const prayerRows = await client.query('SELECT id FROM prayer_requests ORDER BY id')
    const prayerIds = prayerRows.rows.map(r => r.id)
    const interactors = [seekerId, guideId, ...peopleIds.slice(0, 20)].filter(Boolean)
    let interactionCount = 0
    for (let i = 0; i < prayerIds.length; i++) {
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
    console.log(`   ✅ ${interactionCount} prayer interactions\n`)

    // ---- Step 7: Conversations with messages ----
    console.log('💬 Creating conversations...')
    let convCount = 0
    let msgCount = 0
    for (const conv of SEED_CONVERSATIONS) {
      const user1Id = userIdMap[conv.user1]
      const user2Id = userIdMap[conv.user2]
      if (!user1Id || !user2Id) continue

      const ownerId = Math.min(user1Id, user2Id)
      const personId = Math.max(user1Id, user2Id)
      const lastMsg = conv.messages[conv.messages.length - 1]
      const lastSenderId = userIdMap[lastMsg.senderKey]
      const lastTime = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

      const convResult = await client.query(
        `INSERT INTO conversations (owner_id, person_id, last_message, last_time, last_sender_id)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (LEAST(owner_id, person_id), GREATEST(owner_id, person_id)) DO NOTHING
         RETURNING id`,
        [ownerId, personId, lastMsg.text, lastTime, lastSenderId]
      )
      if (convResult.rows.length === 0) continue  // Conversation already existed
      const convId = convResult.rows[0].id

      await client.query(
        'INSERT INTO conversation_participants (conversation_id, user_id) VALUES ($1, $2), ($1, $3)',
        [convId, user1Id, user2Id]
      )

      const now = Date.now()
      const msgSpacing = 3600000 * 2
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
    }
    console.log(`   ✅ ${convCount} conversations, ${msgCount} messages\n`)

    // ---- Step 8: Seed missing scripture verses ----
    // Production might only have 30 of 51 verses (Sessions before 24 had fewer)
    console.log('📜 Checking scripture verses...')
    const verseCount = await client.query('SELECT COUNT(*) FROM scripture_verses')
    const existing = parseInt(verseCount.rows[0].count)
    if (existing < SCRIPTURE_VERSES.length) {
      // Clear and re-insert all (safe since user progress references verse IDs, not content)
      await client.query('DELETE FROM scripture_verses')
      for (const verse of SCRIPTURE_VERSES) {
        await client.query(
          'INSERT INTO scripture_verses (text, reference, category) VALUES ($1, $2, $3)',
          [verse.text, verse.reference, verse.category]
        )
      }
      console.log(`   ✅ Updated: ${existing} → ${SCRIPTURE_VERSES.length} verses`)
    } else {
      console.log(`   ✅ Already has ${existing} verses — skipping`)
    }

    // ---- Step 9: Ensure Bible quotes exist ----
    const quoteCount = await client.query('SELECT COUNT(*) FROM bible_quotes')
    const existingQuotes = parseInt(quoteCount.rows[0].count)
    if (existingQuotes === 0) {
      for (const quote of BIBLE_QUOTES) {
        await client.query(
          'INSERT INTO bible_quotes (text, ref) VALUES ($1, $2)',
          [quote.text, quote.ref]
        )
      }
      console.log(`   ✅ ${BIBLE_QUOTES.length} Bible quotes inserted`)
    } else {
      console.log(`   ✅ Already has ${existingQuotes} Bible quotes — skipping`)
    }

    // ---- Step 10: Extended guide accounts (Session 36) ----
    console.log('\n🌟 Adding extended guide accounts...')

    // Idempotency: Pastor Carmen Delgado is the national guide with the highest follower target
    const extGuideCheck = await client.query(
      "SELECT id FROM users WHERE email = 'carmen.delgado@sanctuary.com'"
    )
    if (extGuideCheck.rows.length > 0) {
      console.log('   ⚠️  Extended guides already seeded — skipping.\n')
    } else {
      // ---- 10a: Guide user definitions ----
      const newGuideDefs = [
        // ── NATIONAL GUIDES (5) ─────────────────────────────────────
        {
          name: 'Rev. Dominique Fontaine',
          email: 'dominique.fontaine@sanctuary.com',
          denomination: 'Baptist',
          state: 'LA', city: 'New Orleans',
          bio: 'Internationally recognized revival preacher and author of three books on prayer and spiritual awakening. With 20 years of pastoral experience across four continents, Rev. Fontaine brings a global perspective to personal discipleship and intercession.',
          specialization: 'Revival & Prayer',
          acceptingSeekers: true, maxPendingRequests: 6,
          preferredChurchId: null, // First Baptist Church of New Orleans
          followerTarget: 40
        },
        {
          name: 'Dr. James Osei-Bonsu',
          email: 'james.osei.bonsu@sanctuary.com',
          denomination: 'AME',
          state: 'PA', city: 'Philadelphia',
          bio: 'Former hospice chaplain with 14 years walking families through end-of-life grief and profound loss. Dr. Osei-Bonsu specializes in lament theology and helps seekers rediscover hope on the other side of suffering.',
          specialization: 'Grief & Loss',
          acceptingSeekers: true, maxPendingRequests: 5,
          preferredChurchId: null, // Mother Bethel AME Philadelphia
          followerTarget: 35
        },
        {
          name: 'Pastor Carmen Delgado',
          email: 'carmen.delgado@sanctuary.com',
          denomination: 'Non-Denominational',
          state: 'CO', city: 'Denver',
          bio: 'Church planter and vocational discernment coach helping young professionals and creatives connect their work to their God-given calling. Her retreats have reached thousands across the country and she speaks at conferences nationwide.',
          specialization: 'Vocational Discernment',
          acceptingSeekers: true, maxPendingRequests: 6,
          preferredChurchId: null, // Red Rocks Church Denver
          followerTarget: 45
        },
        {
          name: 'Elder Nathaniel Pierce',
          email: 'nathaniel.pierce@sanctuary.com',
          denomination: 'Church of God in Christ',
          state: 'OR', city: 'Portland',
          bio: 'Ordained elder with a passion for scripture memorization, men\'s accountability, and financial discipleship. Elder Pierce has been discipling young men in the Pacific Northwest for over 15 years and leads regional leadership conferences.',
          specialization: 'Men\'s Discipleship',
          acceptingSeekers: false, maxPendingRequests: 5,
          preferredChurchId: null, // Greater Refuge Temple Portland
          followerTarget: 38
        },
        {
          name: 'Dr. Grace Huang',
          email: 'grace.huang@sanctuary.com',
          denomination: 'Episcopal',
          state: 'AZ', city: 'Phoenix',
          bio: 'Spiritual director trained in the Ignatian tradition with a doctorate in pastoral theology. Dr. Huang specializes in women\'s spiritual formation, marriage enrichment, and contemplative prayer — guiding seekers toward interior silence and discernment.',
          specialization: 'Spiritual Direction',
          acceptingSeekers: true, maxPendingRequests: 6,
          preferredChurchId: null, // Trinity Cathedral Phoenix
          followerTarget: 30
        },

        // ── REGIONAL GUIDES (4) ──────────────────────────────────────
        {
          name: 'Rev. Simone Adeyemi',
          email: 'simone.adeyemi@sanctuary.com',
          denomination: 'Baptist',
          state: 'MA', city: 'Boston',
          bio: 'Former campus minister at Boston University who now leads a vibrant new church plant in the South End. Rev. Adeyemi specializes in walking new believers through their first year of faith with an accessible, warm teaching style.',
          specialization: 'New Believer Formation',
          acceptingSeekers: true, maxPendingRequests: 5,
          preferredChurchId: null, // Twelfth Baptist Church Boston
          followerTarget: 20
        },
        {
          name: 'Rev. Marcus Holloway',
          email: 'marcus.holloway@sanctuary.com',
          denomination: 'AME',
          state: 'AL', city: 'Birmingham',
          bio: 'Social justice pastor and community organizer who grounds every conversation in Scripture and service. Rev. Holloway helps seekers understand the rich intersection of faith, history, and justice in the AME tradition.',
          specialization: 'Faith & Justice',
          acceptingSeekers: false, maxPendingRequests: 4,
          preferredChurchId: null, // 16th Street Baptist Church Birmingham
          followerTarget: 15
        },
        {
          name: 'Pastor Anna Kowalski',
          email: 'anna.kowalski@sanctuary.com',
          denomination: 'Lutheran',
          state: 'OH', city: 'Columbus',
          bio: 'Campus minister turned parish pastor with 10 years helping young adults navigate doubt, identity, and vocation through Lutheran grace theology. Known for her warm, no-pressure approach to the biggest spiritual questions.',
          specialization: 'Young Adult Ministry',
          acceptingSeekers: true, maxPendingRequests: 5,
          preferredChurchId: null, // Trinity Lutheran Church Columbus
          followerTarget: 18
        },
        {
          name: 'Rev. Diego Sandoval',
          email: 'diego.sandoval@sanctuary.com',
          denomination: 'Catholic',
          state: 'CA', city: 'Sacramento',
          bio: 'Permanent deacon and Catholic apologist who helps seekers go deeper into the intellectual and devotional riches of the Catholic faith. Rev. Sandoval leads popular Rosary groups and apologetics courses across Northern California.',
          specialization: 'Catholic Formation',
          acceptingSeekers: true, maxPendingRequests: 4,
          preferredChurchId: null, // Cathedral of the Blessed Sacrament Sacramento
          followerTarget: 22
        },

        // ── LOCAL GUIDES (2) — top seeker states: TX (#1), IL (#2) ──
        {
          name: 'Minister Keisha Freeman',
          email: 'keisha.freeman@sanctuary.com',
          denomination: 'Pentecostal',
          state: 'TX', city: 'Houston',
          bio: 'Spirit-filled women\'s ministry leader and prayer warrior with deep roots in Houston\'s faith community. Minister Freeman leads powerful prayer breakfasts and youth outreach programs, and is known for her fiery yet tender approach to discipleship.',
          specialization: 'Women\'s Prayer & Outreach',
          acceptingSeekers: true, maxPendingRequests: 4,
          preferredChurchId: churchIdMap['Lakewood Church'] || null,
          followerTarget: 10
        },
        {
          name: 'Pastor Jerome Watkins',
          email: 'jerome.watkins@sanctuary.com',
          denomination: 'Baptist',
          state: 'IL', city: 'Chicago',
          bio: 'Chicago-born and Chicago-rooted pastor who has served the south side for 12 years. Pastor Watkins runs a thriving men\'s accountability ministry and is known for his expository preaching through the Sermon on the Mount.',
          specialization: 'Expository Preaching & Men\'s Ministry',
          acceptingSeekers: true, maxPendingRequests: 4,
          preferredChurchId: churchIdMap['Willow Creek Church'] || null,
          followerTarget: 12
        },
      ]

      const newGuideIdMap = {}
      let guidesAdded = 0
      for (const g of newGuideDefs) {
        const result = await client.query(
          `INSERT INTO users (name, email, password_hash, avatar, photo_url, role, denomination,
           church_name, interests, accepting_seekers, max_pending_requests, state, city, bio,
           specialization, location, onboarding_completed, preferred_church_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, true, $17)
           ON CONFLICT (email) DO NOTHING
           RETURNING id`,
          [
            g.name, g.email, passwordHash, '🙏', null, 'guide', g.denomination, null, [],
            g.acceptingSeekers, g.maxPendingRequests, g.state, g.city, g.bio, g.specialization,
            `${g.city}, ${g.state}`, g.preferredChurchId || null
          ]
        )
        if (result.rows.length > 0) {
          newGuideIdMap[g.name] = result.rows[0].id
          guidesAdded++
        }
      }
      console.log(`   ✅ ${guidesAdded} new guide accounts created`)

      // ---- 10b: Events for each new guide ----
      console.log('   📅 Creating events for new guides...')
      const newGuideEvents = [
        // Rev. Dominique Fontaine — 1 in-person, 2 digital (national)
        { guideName: 'Rev. Dominique Fontaine', title: 'Prayer & Fasting Workshop',
          description: 'A hands-on workshop exploring the spiritual discipline of fasting paired with structured prayer, drawing from both Old and New Testament models.',
          dateTime: '2026-03-15T10:00:00', location: '1617 Magazine St, New Orleans, LA 70130',
          category: 'Prayer', eventType: 'in_person', eventLink: null, isLive: false },
        { guideName: 'Rev. Dominique Fontaine', title: 'Lenten Reflection Series',
          description: 'A live weekly series journeying through Lent with guided Scripture readings, reflection prompts, and communal prayer from across the globe.',
          dateTime: '2026-03-08T19:00:00', location: null,
          category: 'Worship', eventType: 'digital', eventLink: 'https://zoom.us/j/98765432100', isLive: true },
        { guideName: 'Rev. Dominique Fontaine', title: 'Faith in the Workplace Roundtable',
          description: 'An open roundtable for professionals exploring how to live out their faith in competitive, high-pressure work environments.',
          dateTime: '2026-04-12T12:00:00', location: null,
          category: 'General', eventType: 'digital', eventLink: 'https://zoom.us/j/11223344556', isLive: false },

        // Dr. James Osei-Bonsu — 1 in-person, 2 digital (national)
        { guideName: 'Dr. James Osei-Bonsu', title: 'Grief & Faith Support Group',
          description: 'A monthly in-person gathering for those navigating loss, illness, or transition — grounded in lament theology and community prayer.',
          dateTime: '2026-03-22T14:00:00', location: '2015 Chestnut St, Philadelphia, PA 19103',
          category: 'Prayer', eventType: 'in_person', eventLink: null, isLive: false },
        { guideName: 'Dr. James Osei-Bonsu', title: 'Healing Prayer Circle',
          description: 'A virtual gathering focused on intercessory and healing prayer, with teaching from the Psalms on lament and restoration.',
          dateTime: '2026-03-12T18:00:00', location: null,
          category: 'Prayer', eventType: 'digital', eventLink: 'https://zoom.us/j/22334455667', isLive: false },
        { guideName: 'Dr. James Osei-Bonsu', title: 'Spiritual Direction Open House',
          description: 'A live introductory session for anyone curious about one-on-one spiritual direction — what it is, how it works, and how to begin.',
          dateTime: '2026-04-05T15:00:00', location: null,
          category: 'General', eventType: 'digital', eventLink: 'https://zoom.us/j/33445566778', isLive: true },

        // Pastor Carmen Delgado — 1 in-person, 2 digital (national)
        { guideName: 'Pastor Carmen Delgado', title: 'Vocational Discernment Retreat',
          description: 'A full-day retreat helping professionals and creatives discover how their unique gifts align with God\'s calling for their lives.',
          dateTime: '2026-04-18T09:00:00', location: '500 Morrison Rd, Denver, CO 80216',
          category: 'General', eventType: 'in_person', eventLink: null, isLive: false },
        { guideName: 'Pastor Carmen Delgado', title: 'Contemplative Prayer Introduction',
          description: 'An online introduction to contemplative and centering prayer practices for busy people who want to slow down and listen to God.',
          dateTime: '2026-03-19T20:00:00', location: null,
          category: 'Prayer', eventType: 'digital', eventLink: 'https://zoom.us/j/44556677889', isLive: false },
        { guideName: 'Pastor Carmen Delgado', title: 'Community Outreach Planning',
          description: 'A collaborative session helping faith leaders and motivated seekers design and launch local outreach initiatives rooted in Scripture.',
          dateTime: '2026-05-01T17:00:00', location: null,
          category: 'Service/Mission', eventType: 'digital', eventLink: 'https://zoom.us/j/55667788990', isLive: false },

        // Elder Nathaniel Pierce — 1 in-person, 2 digital (national)
        { guideName: 'Elder Nathaniel Pierce', title: 'Men\'s Bible Study',
          description: 'An in-person men\'s group working through the book of Proverbs — practical wisdom for leadership, fatherhood, and integrity.',
          dateTime: '2026-03-25T07:00:00', location: '1122 SE Hawthorne Blvd, Portland, OR 97214',
          category: 'Bible Study', eventType: 'in_person', eventLink: null, isLive: false },
        { guideName: 'Elder Nathaniel Pierce', title: 'Scripture Memorization Challenge',
          description: 'A live group accountability session for participants memorizing 12 key passages over 30 days using proven repetition methods.',
          dateTime: '2026-04-02T19:00:00', location: null,
          category: 'Bible Study', eventType: 'digital', eventLink: 'https://zoom.us/j/66778899001', isLive: true },
        { guideName: 'Elder Nathaniel Pierce', title: 'Financial Stewardship & Faith',
          description: 'A biblical approach to money management, generosity, and financial freedom — connecting Scripture to real-world household decisions.',
          dateTime: '2026-05-07T18:00:00', location: null,
          category: 'General', eventType: 'digital', eventLink: 'https://zoom.us/j/77889900112', isLive: false },

        // Dr. Grace Huang — 1 in-person, 2 digital (national)
        { guideName: 'Dr. Grace Huang', title: 'Women\'s Discipleship Circle',
          description: 'A monthly women\'s gathering focused on deep spiritual friendship, shared study, and mutual accountability in the Episcopal tradition.',
          dateTime: '2026-04-08T10:00:00', location: '3300 N Central Ave, Phoenix, AZ 85012',
          category: 'General', eventType: 'in_person', eventLink: null, isLive: false },
        { guideName: 'Dr. Grace Huang', title: 'Marriage & Faith Seminar',
          description: 'A virtual seminar for couples exploring how spiritual practices, prayer, and shared Scripture can deepen both faith and partnership.',
          dateTime: '2026-03-29T16:00:00', location: null,
          category: 'General', eventType: 'digital', eventLink: 'https://zoom.us/j/88990011223', isLive: false },
        { guideName: 'Dr. Grace Huang', title: 'Youth Faith Mentorship Q&A',
          description: 'A live Q&A for teens and young adults navigating questions about faith, identity, and calling — no question is off the table.',
          dateTime: '2026-05-14T19:00:00', location: null,
          category: 'Youth', eventType: 'digital', eventLink: 'https://zoom.us/j/99001122334', isLive: true },

        // Rev. Simone Adeyemi — 2 in-person, 1 digital (regional/Northeast)
        { guideName: 'Rev. Simone Adeyemi', title: 'New Believers Q&A',
          description: 'A welcoming session for those who recently committed to faith — covering baptism, prayer, church community, and practical next steps.',
          dateTime: '2026-03-14T11:00:00', location: '190 Massachusetts Ave, Boston, MA 02115',
          category: 'General', eventType: 'in_person', eventLink: null, isLive: false },
        { guideName: 'Rev. Simone Adeyemi', title: 'Sunday Morning Bible Intensive',
          description: 'An in-depth Sunday study working verse-by-verse through Romans, suitable for all levels from new believers to seasoned students.',
          dateTime: '2026-04-26T09:00:00', location: '330 Tremont St, Boston, MA 02116',
          category: 'Bible Study', eventType: 'in_person', eventLink: null, isLive: false },
        { guideName: 'Rev. Simone Adeyemi', title: 'Intercessory Prayer Hour',
          description: 'A focused online prayer session for the church and community, rooted in the model of the early church in Acts.',
          dateTime: '2026-04-15T19:00:00', location: null,
          category: 'Prayer', eventType: 'digital', eventLink: 'https://zoom.us/j/10112233445', isLive: false },

        // Rev. Marcus Holloway — 2 in-person, 1 digital (regional/South)
        { guideName: 'Rev. Marcus Holloway', title: 'Community Outreach & Faith Walk',
          description: 'A neighborhood walk combining service and devotion — participants stop at community sites for prayer, reflection, and cleanup.',
          dateTime: '2026-03-21T08:00:00', location: '710 18th St N, Birmingham, AL 35203',
          category: 'Service/Mission', eventType: 'in_person', eventLink: null, isLive: false },
        { guideName: 'Rev. Marcus Holloway', title: 'Praise & Testimony Night',
          description: 'A vibrant evening of worship, testimony, and communal encouragement rooted in the AME tradition of spiritual resilience.',
          dateTime: '2026-04-25T18:00:00', location: '900 Richard Arrington Jr Blvd N, Birmingham, AL 35203',
          category: 'Worship', eventType: 'in_person', eventLink: null, isLive: false },
        { guideName: 'Rev. Marcus Holloway', title: 'AME Heritage & Worship',
          description: 'An online celebration of the African Methodist Episcopal tradition — its history, theology, and call to holistic justice and worship.',
          dateTime: '2026-05-10T15:00:00', location: null,
          category: 'Worship', eventType: 'digital', eventLink: 'https://zoom.us/j/20223344556', isLive: false },

        // Pastor Anna Kowalski — 2 in-person, 1 digital (regional/Midwest)
        { guideName: 'Pastor Anna Kowalski', title: 'Lutheran Study Circle',
          description: 'A warm, discussion-based study of Luther\'s Small Catechism — making classical Lutheran theology practical and alive for today.',
          dateTime: '2026-03-17T18:30:00', location: '444 N High St, Columbus, OH 43215',
          category: 'Bible Study', eventType: 'in_person', eventLink: null, isLive: false },
        { guideName: 'Pastor Anna Kowalski', title: 'Faith Through Seasons',
          description: 'A retreat exploring how the church calendar — Advent, Lent, Easter, Pentecost — shapes our spiritual lives throughout the year.',
          dateTime: '2026-04-29T09:00:00', location: '1200 Dublin Rd, Columbus, OH 43215',
          category: 'General', eventType: 'in_person', eventLink: null, isLive: false },
        { guideName: 'Pastor Anna Kowalski', title: 'Midwestern Faith & Family',
          description: 'An online session for Midwest families on passing faith to the next generation — practical, grace-filled, and Scripture-centered.',
          dateTime: '2026-05-20T19:00:00', location: null,
          category: 'General', eventType: 'digital', eventLink: 'https://zoom.us/j/30334455667', isLive: false },

        // Rev. Diego Sandoval — 2 in-person, 1 digital (regional/West)
        { guideName: 'Rev. Diego Sandoval', title: 'Catholic Apologetics Forum',
          description: 'An in-person forum exploring common objections to the Catholic faith with thoughtful, charitable responses rooted in Scripture and tradition.',
          dateTime: '2026-03-28T14:00:00', location: '1111 J St, Sacramento, CA 95814',
          category: 'Bible Study', eventType: 'in_person', eventLink: null, isLive: false },
        { guideName: 'Rev. Diego Sandoval', title: 'Rosary & Reflection',
          description: 'A quiet Saturday morning rosary gathering with guided meditation on the mysteries — open to all Catholics and the genuinely curious.',
          dateTime: '2026-04-22T07:00:00', location: '2305 Fair Oaks Blvd, Sacramento, CA 95825',
          category: 'Prayer', eventType: 'in_person', eventLink: null, isLive: false },
        { guideName: 'Rev. Diego Sandoval', title: 'Journey Through the Gospels',
          description: 'A 10-week online series on the four Gospels — reading them in harmony while uncovering the unique theological voice of each evangelist.',
          dateTime: '2026-05-28T18:00:00', location: null,
          category: 'Bible Study', eventType: 'digital', eventLink: 'https://zoom.us/j/40445566778', isLive: false },

        // Minister Keisha Freeman — 2 in-person, 1 digital (local/TX)
        { guideName: 'Minister Keisha Freeman', title: 'Women\'s Prayer Breakfast',
          description: 'A warm monthly gathering of women for fellowship, Scripture, and corporate prayer over breakfast in the heart of Houston.',
          dateTime: '2026-03-07T08:00:00', location: '5500 Bissonnet St, Houston, TX 77081',
          category: 'Prayer', eventType: 'in_person', eventLink: null, isLive: false },
        { guideName: 'Minister Keisha Freeman', title: 'Youth Mentorship Circle',
          description: 'An after-school faith mentorship program for Houston teens connecting biblical identity with practical life skills and community.',
          dateTime: '2026-04-11T14:00:00', location: '3800 Main St, Houston, TX 77002',
          category: 'Youth', eventType: 'in_person', eventLink: null, isLive: false },
        { guideName: 'Minister Keisha Freeman', title: 'Spirit & Life Q&A',
          description: 'A monthly live Q&A on the gifts of the Spirit, how to hear God\'s voice, and building a life of authentic prayer.',
          dateTime: '2026-05-05T19:00:00', location: null,
          category: 'Prayer', eventType: 'digital', eventLink: 'https://zoom.us/j/50556677889', isLive: false },

        // Pastor Jerome Watkins — 2 in-person, 1 digital (local/IL)
        { guideName: 'Pastor Jerome Watkins', title: 'Men\'s Accountability Group',
          description: 'A weekly early-morning men\'s group focused on Scripture, honest conversation, and holding each other to a higher standard in faith and life.',
          dateTime: '2026-03-10T06:30:00', location: '222 S Wabash Ave, Chicago, IL 60604',
          category: 'General', eventType: 'in_person', eventLink: null, isLive: false },
        { guideName: 'Pastor Jerome Watkins', title: 'Chicago Faith Summit',
          description: 'A half-day gathering of faith leaders and seekers across Chicago\'s south and west sides to pray, strategize, and strengthen the city\'s spiritual fabric.',
          dateTime: '2026-04-30T09:00:00', location: '444 N Michigan Ave, Chicago, IL 60611',
          category: 'General', eventType: 'in_person', eventLink: null, isLive: false },
        { guideName: 'Pastor Jerome Watkins', title: 'The Sermon on the Mount Deep Dive',
          description: 'A live verse-by-verse study of Matthew 5–7, exploring how Jesus\'s most famous sermon applies to everyday life in the modern city.',
          dateTime: '2026-03-20T19:00:00', location: null,
          category: 'Bible Study', eventType: 'digital', eventLink: 'https://zoom.us/j/60667788990', isLive: true },
      ]

      let eventsAdded = 0
      for (const evt of newGuideEvents) {
        const creatorId = newGuideIdMap[evt.guideName]
        if (!creatorId) continue
        const evtResult = await client.query(
          `INSERT INTO events (title, description, date_time, location, category, event_type, event_link, is_live, created_by, church_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
          [evt.title, evt.description, evt.dateTime, evt.location, evt.category,
           evt.eventType, evt.eventLink, evt.isLive, creatorId, null]
        )
        await client.query(
          'INSERT INTO event_rsvps (event_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [evtResult.rows[0].id, creatorId]
        )
        eventsAdded++
      }
      console.log(`   ✅ ${eventsAdded} guide events created`)

      // ---- 10c: Reviews ----
      console.log('   ⭐ Creating guide reviews...')
      // Build seeker name → id lookup from live DB (all demo users already inserted above)
      const seekerRows2 = await client.query(
        "SELECT id, name FROM users WHERE role = 'seeker' ORDER BY id"
      )
      const seekerIdByName = {}
      for (const row of seekerRows2.rows) {
        seekerIdByName[row.name] = row.id
      }

      const reviewDefs = [
        // Rev. Dominique Fontaine — 6 reviews (national)
        { guideName: 'Rev. Dominique Fontaine', seekerName: 'Sarah Johnson',   rating: 5, text: "Rev. Fontaine's teaching helped me find peace during one of the hardest seasons of my life. Her insight into Scripture is extraordinary." },
        { guideName: 'Rev. Dominique Fontaine', seekerName: 'Michael Chen',    rating: 5, text: "My prayer life has never been stronger. She walked me through fasting in a way I had never understood before." },
        { guideName: 'Rev. Dominique Fontaine', seekerName: 'Emily Rodriguez', rating: 4, text: "Life-changing sessions on faith and work. I now see my career as a form of ministry and service." },
        { guideName: 'Rev. Dominique Fontaine', seekerName: 'James Wilson',    rating: 5, text: "After years of spiritual drift, Rev. Fontaine helped me rediscover my calling. I cannot recommend her highly enough." },
        { guideName: 'Rev. Dominique Fontaine', seekerName: 'Rachel Kim',      rating: 4, text: "Very warm and very Spirit-led. Our sessions always left me with something concrete to practice the next day." },
        { guideName: 'Rev. Dominique Fontaine', seekerName: 'Nathan Brooks',   rating: 5, text: "One of the best guides I have worked with. She truly listens and brings the Word to life in deeply practical ways." },

        // Dr. James Osei-Bonsu — 6 reviews (national)
        { guideName: 'Dr. James Osei-Bonsu', seekerName: 'Priya Sharma',   rating: 5, text: "Dr. Osei-Bonsu walked alongside me through grief in a way no one else could. He is patient, wise, and deeply compassionate." },
        { guideName: 'Dr. James Osei-Bonsu', seekerName: 'Tyler Odom',     rating: 4, text: "His approach to grief from a faith lens was transformative. I came in broken and left with real, lasting hope." },
        { guideName: 'Dr. James Osei-Bonsu', seekerName: 'Aisha Williams', rating: 5, text: "One of the most gifted listeners I have encountered. My faith is stronger because of his patient guidance." },
        { guideName: 'Dr. James Osei-Bonsu', seekerName: 'Chris Martinez', rating: 4, text: "He helped me process a painful family loss without ever rushing me. I felt genuinely heard and cared for." },
        { guideName: 'Dr. James Osei-Bonsu', seekerName: 'Olivia Bennett', rating: 5, text: "Dr. Osei-Bonsu is the real deal. He knows his Scripture deeply and he truly knows people." },
        { guideName: 'Dr. James Osei-Bonsu', seekerName: 'Marcus Davis',   rating: 4, text: "I was skeptical going in but he met me right where I was. Very grateful for this experience." },

        // Pastor Carmen Delgado — 6 reviews (national)
        { guideName: 'Pastor Carmen Delgado', seekerName: 'Hannah Lee',      rating: 5, text: "Pastor Delgado helped me discern my career calling with such clarity and grace. I finally feel at peace about my direction." },
        { guideName: 'Pastor Carmen Delgado', seekerName: 'Caleb Washington', rating: 5, text: "Her retreats changed my walk with God completely. I went from going through the motions to on fire for my calling." },
        { guideName: 'Pastor Carmen Delgado', seekerName: 'Sofia Ramirez',   rating: 5, text: "Bilingual sessions, deep faith, amazing listener. She understands the tension between culture and calling like no one else." },
        { guideName: 'Pastor Carmen Delgado', seekerName: 'Elijah Brown',    rating: 4, text: "Helped me figure out what to do after retirement. I did not expect faith to provide such practical, grounded clarity." },
        { guideName: 'Pastor Carmen Delgado', seekerName: "Megan O'Brien",   rating: 5, text: "Absolutely transformative. Her contemplative prayer approach is exactly what my restless, chaotic mind needed." },
        { guideName: 'Pastor Carmen Delgado', seekerName: 'Isaiah Reed',     rating: 4, text: "I came in unsure about my future in ministry. I left with a clear, concrete plan. Pastor Delgado is a true gift." },

        // Elder Nathaniel Pierce — 6 reviews (national)
        { guideName: 'Elder Nathaniel Pierce', seekerName: 'Zoe Nakamura',   rating: 5, text: "Elder Pierce brought real discipline and depth to my scripture practice. I memorized more in three weeks than in the past five years." },
        { guideName: 'Elder Nathaniel Pierce', seekerName: 'Ethan Cooper',   rating: 4, text: "His men's ministry sessions gave me the accountability I desperately needed. No judgment, just grace and truth." },
        { guideName: 'Elder Nathaniel Pierce', seekerName: 'Destiny Harris', rating: 5, text: "He helped me build a prayer routine that actually sticks long-term. My kids have noticed the change in me." },
        { guideName: 'Elder Nathaniel Pierce', seekerName: 'Liam Fitzgerald', rating: 4, text: "Brilliant on stewardship and calling. Every session felt like seminary done right — practical and scripture-grounded." },
        { guideName: 'Elder Nathaniel Pierce', seekerName: 'Jasmine Torres', rating: 5, text: "Elder Pierce is steady, trustworthy, and profoundly wise. His financial faith session genuinely changed how I manage money." },
        { guideName: 'Elder Nathaniel Pierce', seekerName: 'Ryan Mitchell',  rating: 4, text: "Exactly what I needed as a new dad trying to lead my family spiritually. Practical and deeply grounded in Scripture." },

        // Dr. Grace Huang — 6 reviews (national)
        { guideName: 'Dr. Grace Huang', seekerName: 'Sarah Johnson',   rating: 4, text: "Dr. Huang is a wonderful spiritual director. She helped me reframe a painful season of my marriage with real wisdom." },
        { guideName: 'Dr. Grace Huang', seekerName: 'Emily Rodriguez', rating: 5, text: "Her women's discipleship sessions are outstanding. I have grown more spiritually in two months than in two years." },
        { guideName: 'Dr. Grace Huang', seekerName: 'James Wilson',    rating: 4, text: "My wife and I both connected deeply with her marriage faith seminar. Highly recommend for couples at any stage." },
        { guideName: 'Dr. Grace Huang', seekerName: 'Rachel Kim',      rating: 5, text: "Dr. Huang is calm, grounded, and brilliant. Her Episcopal prayer tradition has genuinely enriched my worship life." },
        { guideName: 'Dr. Grace Huang', seekerName: 'Nathan Brooks',   rating: 3, text: "Good sessions, though I would have liked more one-on-one focus at times. Still very helpful and affirming overall." },
        { guideName: 'Dr. Grace Huang', seekerName: 'Priya Sharma',   rating: 5, text: "Found a true spiritual home in her approach. She honors hard intellectual questions while keeping faith central." },

        // Rev. Simone Adeyemi — 5 reviews (regional/Northeast)
        { guideName: 'Rev. Simone Adeyemi', seekerName: 'Tyler Odom',     rating: 5, text: "Rev. Adeyemi met me in my first months of serious faith and helped me build a solid foundation I can actually stand on." },
        { guideName: 'Rev. Simone Adeyemi', seekerName: 'Aisha Williams', rating: 4, text: "Warm, Baptist-rooted, and deeply encouraging. She knows her Scripture and genuinely loves her people." },
        { guideName: 'Rev. Simone Adeyemi', seekerName: 'Chris Martinez', rating: 5, text: "Exactly what I needed as a new believer. She answered my hardest questions without ever making me feel small." },
        { guideName: 'Rev. Simone Adeyemi', seekerName: 'Olivia Bennett', rating: 4, text: "Her new believers approach is simply excellent. She has a real gift for making theology accessible and alive." },
        { guideName: 'Rev. Simone Adeyemi', seekerName: 'Marcus Davis',   rating: 4, text: "Good mentor. Helped me find a Bible study rhythm I could actually stick to week after week." },

        // Rev. Marcus Holloway — 4 reviews (regional/South)
        { guideName: 'Rev. Marcus Holloway', seekerName: 'Hannah Lee',      rating: 4, text: "Rev. Holloway connects community service with spiritual formation in a way I have never encountered before." },
        { guideName: 'Rev. Marcus Holloway', seekerName: 'Caleb Washington', rating: 5, text: "He challenged me to put my faith to work in my neighborhood. Our sessions were genuinely transformative." },
        { guideName: 'Rev. Marcus Holloway', seekerName: 'Sofia Ramirez',  rating: 4, text: "Warm and deeply rooted in the AME tradition. I left each session feeling called to something bigger than myself." },
        { guideName: 'Rev. Marcus Holloway', seekerName: 'Elijah Brown',   rating: 4, text: "As a veteran, I appreciated his ability to blend faith and service. He truly understands sacrifice and calling." },

        // Pastor Anna Kowalski — 5 reviews (regional/Midwest)
        { guideName: 'Pastor Anna Kowalski', seekerName: "Megan O'Brien",   rating: 5, text: "Pastor Kowalski is exactly what I needed after moving to a new city. She helped me find my footing spiritually and practically." },
        { guideName: 'Pastor Anna Kowalski', seekerName: 'Isaiah Reed',     rating: 4, text: "Lutheran tradition beautifully explained. She made me appreciate liturgy in a whole new way." },
        { guideName: 'Pastor Anna Kowalski', seekerName: 'Zoe Nakamura',   rating: 3, text: "Good guide, though our sessions felt a bit structured for my learning style. Her heart for people still shines through." },
        { guideName: 'Pastor Anna Kowalski', seekerName: 'Ethan Cooper',   rating: 4, text: "Her young adult ministry focus is exactly on point. She understands the faith struggles of my generation." },
        { guideName: 'Pastor Anna Kowalski', seekerName: 'Destiny Harris', rating: 5, text: "She helped me reimagine my role as a mom of faith. One of the most encouraging people I have ever met." },

        // Rev. Diego Sandoval — 4 reviews (regional/West)
        { guideName: 'Rev. Diego Sandoval', seekerName: 'Liam Fitzgerald', rating: 5, text: "Rev. Sandoval's apologetics sessions answered questions I had wrestled with for years. Sharp mind and humble heart." },
        { guideName: 'Rev. Diego Sandoval', seekerName: 'Jasmine Torres',  rating: 4, text: "I am a cradle Catholic who needed to go deeper. He gave me the tools to do that with real confidence." },
        { guideName: 'Rev. Diego Sandoval', seekerName: 'Ryan Mitchell',   rating: 4, text: "His Rosary and Reflection approach was calming and deeply meaningful. Would recommend to any Catholic seeker." },
        { guideName: 'Rev. Diego Sandoval', seekerName: 'Sarah Johnson',   rating: 3, text: "Good knowledge of tradition but I needed more emotional connection in our sessions to really open up." },

        // Minister Keisha Freeman — 4 reviews (local/TX)
        { guideName: 'Minister Keisha Freeman', seekerName: 'Michael Chen',    rating: 5, text: "Minister Freeman has a fire and a warmth that is rare. She helped me connect my daily struggles directly to God's word." },
        { guideName: 'Minister Keisha Freeman', seekerName: 'Emily Rodriguez', rating: 4, text: "Her women's prayer sessions are powerful. I left every session with renewed purpose and clear direction." },
        { guideName: 'Minister Keisha Freeman', seekerName: 'Rachel Kim',      rating: 5, text: "She is relatable, real, and deeply rooted. Exactly what I needed from a local guide here in Houston." },
        { guideName: 'Minister Keisha Freeman', seekerName: 'Nathan Brooks',   rating: 4, text: "Her sessions on prayer and identity were timely for me. She speaks truth with love and no pretense." },

        // Pastor Jerome Watkins — 3 reviews (local/IL)
        { guideName: 'Pastor Jerome Watkins', seekerName: 'Tyler Odom',     rating: 4, text: "Pastor Watkins runs a focused, no-fluff men's group. Pure accountability and Scripture — exactly what I needed." },
        { guideName: 'Pastor Jerome Watkins', seekerName: 'Aisha Williams', rating: 4, text: "His Chicago faith community is thriving. He helped me connect my faith to daily city life in a genuine way." },
        { guideName: 'Pastor Jerome Watkins', seekerName: 'Marcus Davis',   rating: 5, text: "I live in Chicago and wanted a local guide who truly knows this city. Pastor Watkins delivered completely." },
      ]

      let reviewsAdded = 0
      for (const rev of reviewDefs) {
        const gId = newGuideIdMap[rev.guideName]
        const sId = seekerIdByName[rev.seekerName]
        if (!gId || !sId) continue
        await client.query(
          `INSERT INTO guide_reviews (guide_id, seeker_id, appointment_id, rating, review_text)
           VALUES ($1, $2, NULL, $3, $4)
           ON CONFLICT (guide_id, seeker_id) DO NOTHING`,
          [gId, sId, rev.rating, rev.text]
        )
        reviewsAdded++
      }
      console.log(`   ✅ ${reviewsAdded} guide reviews inserted`)

      // Update overall_rating and review_count for each new guide
      for (const gId of Object.values(newGuideIdMap)) {
        await client.query(
          `UPDATE users
           SET overall_rating = COALESCE((SELECT ROUND(AVG(rating)::numeric, 2) FROM guide_reviews WHERE guide_id = $1), 0),
               review_count   = (SELECT COUNT(*) FROM guide_reviews WHERE guide_id = $1)
           WHERE id = $1`,
          [gId]
        )
      }
      console.log('   ✅ Guide ratings updated')

      // ---- 10d: Follows ----
      console.log('   👥 Creating guide follows...')
      const allUserRows2 = await client.query('SELECT id FROM users ORDER BY id')
      const allUserIds2 = allUserRows2.rows.map(r => r.id)

      // National guides get the most followers; different start offsets give variety
      const followTargets = [
        { name: 'Pastor Carmen Delgado',     count: 45 },
        { name: 'Rev. Dominique Fontaine',   count: 40 },
        { name: 'Elder Nathaniel Pierce',    count: 38 },
        { name: 'Dr. James Osei-Bonsu',      count: 35 },
        { name: 'Dr. Grace Huang',           count: 30 },
        { name: 'Rev. Diego Sandoval',       count: 22 },
        { name: 'Rev. Simone Adeyemi',       count: 20 },
        { name: 'Pastor Anna Kowalski',      count: 18 },
        { name: 'Rev. Marcus Holloway',      count: 15 },
        { name: 'Pastor Jerome Watkins',     count: 12 },
        { name: 'Minister Keisha Freeman',   count: 10 },
      ]

      let followsAdded = 0
      for (let gi = 0; gi < followTargets.length; gi++) {
        const { name, count } = followTargets[gi]
        const gId = newGuideIdMap[name]
        if (!gId) continue
        const eligible = allUserIds2.filter(id => id !== gId)
        const targetCount = Math.min(count, eligible.length)
        const offset = gi * 4  // stagger start so each guide gets a different follower mix
        for (let j = 0; j < targetCount; j++) {
          const followerId = eligible[(offset + j) % eligible.length]
          await client.query(
            'INSERT INTO guide_follows (follower_id, guide_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [followerId, gId]
          )
          followsAdded++
        }
      }
      console.log(`   ✅ ${followsAdded} guide follows inserted`)

      // Update follower_count for each new guide
      for (const gId of Object.values(newGuideIdMap)) {
        await client.query(
          `UPDATE users
           SET follower_count = (SELECT COUNT(*) FROM guide_follows WHERE guide_id = $1)
           WHERE id = $1`,
          [gId]
        )
      }
      console.log('   ✅ Follower counts updated')

      console.log('\n🌟 Extended guide seed complete!')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log(`   New guides:  ${guidesAdded}`)
      console.log(`   New events:  ${eventsAdded}`)
      console.log(`   Reviews:     ${reviewsAdded}`)
      console.log(`   Follows:     ${followsAdded}`)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    } // end extended guides block

    // ---- Step 11: Additional seekers for 3:1 seeker-to-guide ratio ----
    // Target: ~75 seekers / 25 guides. Currently 26 seekers exist → add 50 more.
    // Geographic spread ensures every guide (national/regional/local) has nearby seekers.
    console.log('\n👥 Adding extended seeker pool (3:1 ratio)...')

    const extSeekerCheck = await client.query(
      "SELECT id FROM users WHERE email = 'elena.vasquez@sanctuary.com'"
    )
    if (extSeekerCheck.rows.length > 0) {
      console.log('   ⚠️  Extended seekers already seeded — skipping.\n')
    } else {
      // Look up national guide IDs for the additional reviews below
      const nationalGuideEmails = {
        'Rev. Dominique Fontaine': 'dominique.fontaine@sanctuary.com',
        'Dr. James Osei-Bonsu':   'james.osei.bonsu@sanctuary.com',
        'Pastor Carmen Delgado':  'carmen.delgado@sanctuary.com',
        'Elder Nathaniel Pierce': 'nathaniel.pierce@sanctuary.com',
        'Dr. Grace Huang':        'grace.huang@sanctuary.com',
      }
      const extGuideIdMap = {}
      for (const [name, email] of Object.entries(nationalGuideEmails)) {
        const r = await client.query('SELECT id FROM users WHERE email = $1', [email])
        if (r.rows.length > 0) extGuideIdMap[name] = r.rows[0].id
      }

      const newSeekerDefs = [
        // ── NORTHEAST (10) ──────────────────────────────────────────────
        { name: 'Elena Vasquez',     state: 'NY', city: 'Brooklyn',      denomination: 'Catholic',         preferredChurchName: 'Brooklyn Tabernacle',
          bio: 'First-generation Puerto Rican school counselor navigating her return to faith after a decade away from church. Seeking a guide who understands cultural identity and spiritual longing.',
          interests: ['Community Service', 'Reading', 'Music'] },
        { name: 'Marcus Webb',       state: 'PA', city: 'Philadelphia',  denomination: 'Baptist',           preferredChurchName: null,
          bio: 'High school football coach and father of three seeking deeper purpose beyond the field. Recently recommitted to his faith and looking for mentorship in prayer and Scripture.',
          interests: ['Sports', 'Bible Study', 'Youth Ministry'] },
        { name: 'Natalie Chen',      state: 'MA', city: 'Cambridge',     denomination: 'Non-Denominational', preferredChurchName: null,
          bio: 'Harvard PhD student wrestling with how faith and science coexist. New to structured Christianity and asking every hard question along the way.',
          interests: ['Reading', 'Writing', 'Worship'] },
        { name: 'Derek Osei',        state: 'CT', city: 'Hartford',      denomination: 'Methodist',         preferredChurchName: null,
          bio: 'Ghanaian immigrant and physical therapist whose faith was renewed after a health crisis. Seeking guidance on integrating his cultural heritage with his Christian walk.',
          interests: ['Community Service', 'Bible Study', 'Travel'] },
        { name: 'Brianna Russo',     state: 'NJ', city: 'Newark',        denomination: 'Episcopal',         preferredChurchName: null,
          bio: 'Social worker and single mom who found solace in liturgical worship during a painful divorce. Looking for a guide to help her rebuild spiritually and reclaim joy.',
          interests: ['Worship', 'Reading', 'Volunteering'] },
        { name: 'James Okafor',      state: 'NY', city: 'Harlem',        denomination: 'AME',               preferredChurchName: 'Brooklyn Tabernacle',
          bio: 'Retired teacher and grandfather active in his AME congregation for 40 years, now seeking deeper one-on-one discipleship to finish strong in his faith.',
          interests: ['Bible Study', 'Community Service', 'Gardening'] },
        { name: 'Sophie Laurent',    state: 'ME', city: 'Portland',      denomination: 'Non-Denominational', preferredChurchName: null,
          bio: 'French-Canadian artist and new believer who encountered God through a near-drowning experience. Still processing what her faith means and how to live it.',
          interests: ['Painting', 'Hiking', 'Reading'] },
        { name: 'Thomas Griffith',   state: 'VT', city: 'Burlington',    denomination: 'Episcopal',         preferredChurchName: null,
          bio: 'Environmental scientist and lay reader at his local Episcopal parish, seeking a guide to help him connect contemplative prayer to his work in creation care.',
          interests: ['Hiking', 'Reading', 'Bible Study'] },
        { name: 'Aaliyah Monroe',    state: 'MD', city: 'Baltimore',     denomination: 'Baptist',           preferredChurchName: null,
          bio: 'Registered nurse and praise team leader whose busy schedule has left her spiritually depleted. Seeking guidance on sustaining inner life through a demanding calling.',
          interests: ['Worship', 'Music', 'Community Service'] },
        { name: 'Peter Kowalczyk',   state: 'PA', city: 'Pittsburgh',    denomination: 'Catholic',          preferredChurchName: null,
          bio: 'Steel-town-raised Catholic and steel worker rediscovering his faith through a men\'s ministry retreat. Looking for accountability and ongoing Scripture guidance.',
          interests: ['Sports', 'Bible Study', 'Volunteering'] },

        // ── SOUTH (13) ──────────────────────────────────────────────────
        { name: 'Darius Jackson',    state: 'LA', city: 'New Orleans',   denomination: 'Baptist',           preferredChurchName: null,
          bio: 'Jazz musician and music teacher who grew up in the church but drifted in his 20s. Back home in New Orleans and hungry to reconnect with his faith roots.',
          interests: ['Music', 'Community Service', 'Bible Study'] },
        { name: 'Kezia Montgomery',  state: 'AL', city: 'Birmingham',    denomination: 'AME',               preferredChurchName: null,
          bio: 'Elementary school principal with roots in Birmingham\'s civil rights legacy. Seeking a guide who can help her connect her calling to justice with a deeper prayer life.',
          interests: ['Community Service', 'Reading', 'Worship'] },
        { name: 'Samuel Perkins',    state: 'TN', city: 'Memphis',       denomination: 'Church of God in Christ', preferredChurchName: null,
          bio: 'Retired postal worker and grandfather of six recently diagnosed with a chronic illness, seeking peace through Scripture and community prayer.',
          interests: ['Bible Study', 'Gardening', 'Music'] },
        { name: 'Priscilla Owens',   state: 'VA', city: 'Richmond',      denomination: 'Presbyterian',      preferredChurchName: null,
          bio: 'Healthcare administrator and worship team member working through questions about vocation, burnout, and what it means to rest in God\'s grace.',
          interests: ['Worship', 'Reading', 'Community Service'] },
        { name: 'Andre Williams',    state: 'SC', city: 'Columbia',      denomination: 'Pentecostal',        preferredChurchName: null,
          bio: 'College senior studying pre-law who had a powerful spiritual experience at a campus revival. Wants to grow in prayer and discern whether God is calling him to ministry.',
          interests: ['Bible Study', 'Youth Ministry', 'Sports'] },
        { name: 'Tamara Bell',       state: 'GA', city: 'Savannah',      denomination: 'Baptist',           preferredChurchName: null,
          bio: 'Wedding photographer who sees beauty as a spiritual practice. Exploring how her faith can infuse her art and business with meaning.',
          interests: ['Painting', 'Travel', 'Worship'] },
        { name: 'Carlos Reyes',      state: 'TX', city: 'San Antonio',   denomination: 'Catholic',          preferredChurchName: null,
          bio: 'Bilingual electrician and father of four who attends Mass faithfully but craves more depth. Interested in exploring Catholic spiritual direction.',
          interests: ['Volunteering', 'Community Service', 'Bible Study'] },
        { name: 'Whitney Thomas',    state: 'MS', city: 'Jackson',       denomination: 'Baptist',           preferredChurchName: null,
          bio: 'High school English teacher and poet who grew up in the Black Baptist tradition and is now seeking a deeper interior prayer life to go alongside her public faith.',
          interests: ['Writing', 'Reading', 'Music'] },
        { name: 'Luis Menendez',     state: 'FL', city: 'Tampa',         denomination: 'Catholic',          preferredChurchName: null,
          bio: 'Cuban-American restaurant owner who returned to the Church after a period of addiction and recovery. Grateful and hungry to go deeper.',
          interests: ['Cooking', 'Community Service', 'Bible Study'] },
        { name: 'Jasmine Powell',    state: 'NC', city: 'Raleigh',       denomination: 'Non-Denominational', preferredChurchName: null,
          bio: 'Tech recruiter and new mother who wants to pass her faith to her daughter but feels ill-equipped. Looking for guidance on spiritual formation for families.',
          interests: ['Reading', 'Youth Ministry', 'Worship'] },
        { name: 'Elaine Dupree',     state: 'AR', city: 'Little Rock',   denomination: 'Methodist',         preferredChurchName: null,
          bio: 'Social work professor and foster care advocate who has walked with vulnerable families for 20 years. Seeking renewal for her own soul so she can continue the work.',
          interests: ['Community Service', 'Reading', 'Volunteering'] },
        { name: 'Kevin Odom',        state: 'OK', city: 'Tulsa',         denomination: 'Pentecostal',        preferredChurchName: null,
          bio: 'Former oilfield worker turned high school janitor and lay minister at his Pentecostal church. Seeking mentorship to step more fully into his calling.',
          interests: ['Bible Study', 'Music', 'Youth Ministry'] },
        { name: 'Rachel Nguyen',     state: 'TX', city: 'Houston',       denomination: 'Non-Denominational', preferredChurchName: 'Lakewood Church',
          bio: 'Vietnamese-American speech therapist and second-generation Christian navigating her faith outside of the ethnic church where she grew up.',
          interests: ['Reading', 'Worship', 'Community Service'] },

        // ── MIDWEST (12) ─────────────────────────────────────────────────
        { name: 'Noah Fischer',      state: 'OH', city: 'Columbus',      denomination: 'Lutheran',           preferredChurchName: null,
          bio: 'Software developer and new husband navigating the transition from a college faith community to finding his place in a parish as an adult.',
          interests: ['Bible Study', 'Photography', 'Reading'] },
        { name: 'Latoya Simmons',    state: 'OH', city: 'Cincinnati',    denomination: 'Baptist',            preferredChurchName: null,
          bio: 'NICU nurse and praise team vocalist who carries the weight of her patients home at night. Seeking spiritual direction to sustain her through a demanding, sacred calling.',
          interests: ['Worship', 'Music', 'Community Service'] },
        { name: 'Patrick Mahoney',   state: 'IN', city: 'Indianapolis',  denomination: 'Catholic',           preferredChurchName: null,
          bio: 'Former marine and high school history teacher exploring what faithful manhood looks like in a culture that has little patience for faith or sacrifice.',
          interests: ['Sports', 'Bible Study', 'Volunteering'] },
        { name: 'Yuki Tanaka',       state: 'MO', city: 'Kansas City',   denomination: 'Non-Denominational', preferredChurchName: null,
          bio: 'Japanese-American graphic designer who came to faith through a Korean church. Now searching for a spiritual home that honors both her cultural roots and creative identity.',
          interests: ['Painting', 'Photography', 'Worship'] },
        { name: 'Dominique Petersen', state: 'WI', city: 'Milwaukee',    denomination: 'Methodist',          preferredChurchName: null,
          bio: 'Community organizer and foster parent who runs a faith-based afterschool program in Milwaukee. Needs a guide to help her sustain the work without burning out.',
          interests: ['Community Service', 'Youth Ministry', 'Reading'] },
        { name: 'Isaiah Chambers',   state: 'MO', city: 'St. Louis',     denomination: 'Pentecostal',        preferredChurchName: null,
          bio: 'Aspiring worship leader and seminary student discerning a call to full-time ministry after a dramatic personal conversion three years ago.',
          interests: ['Music', 'Worship', 'Bible Study'] },
        { name: 'Cassandra Hill',    state: 'MI', city: 'Lansing',       denomination: 'AME',                preferredChurchName: null,
          bio: 'State government policy analyst and lifelong AME member seeking deeper personal prayer after years of corporate, institutional faith.',
          interests: ['Reading', 'Writing', 'Community Service'] },
        { name: 'Ben Kowalski',      state: 'IL', city: 'Chicago',       denomination: 'Lutheran',           preferredChurchName: 'Willow Creek Church',
          bio: 'Chicago public defender who relies on his Lutheran heritage to anchor him through work that is morally exhausting. Wants deeper roots to sustain him.',
          interests: ['Reading', 'Bible Study', 'Sports'] },
        { name: 'Nadia Petrov',      state: 'MN', city: 'St. Paul',      denomination: 'Non-Denominational', preferredChurchName: null,
          bio: 'Ukrainian-American nurse who fled war and found faith in a refugee resettlement program. Still new to Christianity and full of questions and gratitude in equal measure.',
          interests: ['Community Service', 'Worship', 'Reading'] },
        { name: 'Elijah Moss',       state: 'KS', city: 'Wichita',       denomination: 'Baptist',            preferredChurchName: null,
          bio: 'Aircraft mechanic and father who started reading the Bible alone during a long night shift and has not stopped. Looking for community and guidance to go deeper.',
          interests: ['Bible Study', 'Sports', 'Hiking'] },
        { name: 'Tanya Rivers',      state: 'ND', city: 'Fargo',         denomination: 'Lutheran',           preferredChurchName: null,
          bio: 'Rural nurse practitioner who serves as the medical care for a 300-mile stretch of North Dakota. Her faith is the only constant in a deeply isolated landscape.',
          interests: ['Hiking', 'Reading', 'Bible Study'] },
        { name: 'Marcus Young',      state: 'IL', city: 'Springfield',   denomination: 'Baptist',            preferredChurchName: null,
          bio: 'Illinois state trooper and part-time preacher at a small country church. Seeking mentorship to sharpen his theological grounding as he grows into his calling.',
          interests: ['Bible Study', 'Community Service', 'Sports'] },

        // ── WEST (15) ────────────────────────────────────────────────────
        { name: 'Jade Nguyen',       state: 'AZ', city: 'Phoenix',       denomination: 'Episcopal',          preferredChurchName: null,
          bio: 'Vietnamese-American ER nurse and contemplative who discovered the Episcopal tradition through a friend\'s wedding. Drawn to liturgy as a form of healing and order.',
          interests: ['Worship', 'Reading', 'Hiking'] },
        { name: 'Connor Sullivan',   state: 'NV', city: 'Las Vegas',     denomination: 'Catholic',           preferredChurchName: null,
          bio: 'Vegas-born hospitality manager who stepped away from the Church in his 20s. A close friend\'s death brought him back, and he is figuring out what staying looks like.',
          interests: ['Sports', 'Travel', 'Bible Study'] },
        { name: 'Aaliya Hassan',     state: 'UT', city: 'Salt Lake City', denomination: 'Non-Denominational', preferredChurchName: null,
          bio: 'Somali-American refugee advocate and new believer who converted from Islam two years ago. Seeking a patient, scripturally grounded guide to walk with her through foundational faith questions.',
          interests: ['Community Service', 'Reading', 'Writing'] },
        { name: 'Roberto Fuentes',   state: 'CA', city: 'Sacramento',    denomination: 'Catholic',           preferredChurchName: null,
          bio: 'Mexican-American small business owner and Sunday school teacher at his parish. Seeking deeper one-on-one spiritual direction to grow beyond what Sunday morning provides.',
          interests: ['Community Service', 'Bible Study', 'Cooking'] },
        { name: 'Amara Okonkwo',     state: 'OR', city: 'Portland',      denomination: 'AME',                preferredChurchName: null,
          bio: 'Nigerian-American pediatrician raising her family far from her AME faith community of origin. Seeking a guide to help sustain her spiritual roots in a new place.',
          interests: ['Community Service', 'Reading', 'Hiking'] },
        { name: 'Devin Harris',      state: 'IL', city: 'Chicago',       denomination: 'Baptist',            preferredChurchName: 'Holy Name Cathedral',
          bio: 'Chicago public school teacher and basketball coach who grew up in the church but lost his way in college. Recently returned to faith and looking for accountability.',
          interests: ['Sports', 'Youth Ministry', 'Bible Study'] },
        { name: 'Marissa Castillo',  state: 'TX', city: 'Houston',       denomination: 'Non-Denominational', preferredChurchName: 'Lakewood Church',
          bio: 'Bilingual elementary school teacher and new mother who wants to build a solid spiritual foundation for her family. New to Houston and seeking a guide and faith community.',
          interests: ['Youth Ministry', 'Worship', 'Reading'] },
        { name: 'Lena Park',         state: 'WA', city: 'Tacoma',        denomination: 'Presbyterian',       preferredChurchName: null,
          bio: 'Korean-American social worker and foster care recruiter who grew up in a Korean Presbyterian church but is now finding her own faith identity apart from her parents\'.',
          interests: ['Community Service', 'Reading', 'Writing'] },
        { name: 'Gabriel Torres',    state: 'NM', city: 'Albuquerque',   denomination: 'Catholic',           preferredChurchName: null,
          bio: 'Navajo-Hispanic high school teacher who integrates indigenous spirituality with Catholic tradition. Seeking a guide who respects complexity without collapsing it.',
          interests: ['Writing', 'Hiking', 'Community Service'] },
        { name: 'Faith Osei',        state: 'CA', city: 'San Diego',     denomination: 'Non-Denominational', preferredChurchName: null,
          bio: 'Ghanaian-American pediatric nurse and first-time mom who wants to pass on a vibrant faith to her daughter. Seeking a guide who takes generational discipleship seriously.',
          interests: ['Bible Study', 'Worship', 'Youth Ministry'] },
        { name: 'Tyler Brooks',      state: 'ID', city: 'Boise',         denomination: 'Non-Denominational', preferredChurchName: null,
          bio: 'Former NCAA basketball player turned youth director at a fast-growing church plant. Wants mentorship in theological depth to match his relational gifts.',
          interests: ['Sports', 'Youth Ministry', 'Bible Study'] },
        { name: 'Camille Broussard', state: 'HI', city: 'Honolulu',      denomination: 'Methodist',          preferredChurchName: null,
          bio: 'Creole-Hawaiian middle school teacher and worship leader who lives at the intersection of several faith and cultural traditions. Seeking integration and clarity.',
          interests: ['Music', 'Worship', 'Community Service'] },
        { name: 'Marco Reyes',       state: 'AZ', city: 'Tucson',        denomination: 'Catholic',           preferredChurchName: null,
          bio: 'Mexican-American border patrol agent wrestling with the moral complexity of his work and his faith. Seeking a guide who can hold the tension with him without easy answers.',
          interests: ['Bible Study', 'Hiking', 'Sports'] },
        { name: 'Josephine Nakamura', state: 'CO', city: 'Boulder',      denomination: 'Episcopal',          preferredChurchName: null,
          bio: 'Japanese-American environmental attorney who practices centering prayer and attends an Episcopal church. Looking for ongoing spiritual direction to sustain her justice work.',
          interests: ['Hiking', 'Reading', 'Worship'] },
        { name: 'Elias Moreno',      state: 'MT', city: 'Billings',      denomination: 'Non-Denominational', preferredChurchName: null,
          bio: 'Montana rancher and volunteer fire chaplain who ministers informally to his community. Seeking theological grounding and accountability for a calling with no official structure.',
          interests: ['Community Service', 'Bible Study', 'Hiking'] },
      ]

      // Resolve preferred_church_id for each seeker
      const newSeekerIdMap = {}
      let seekersAdded = 0
      for (const s of newSeekerDefs) {
        const churchId = s.preferredChurchName ? (churchIdMap[s.preferredChurchName] || null) : null
        const result = await client.query(
          `INSERT INTO users (name, email, password_hash, avatar, photo_url, role, bio, location,
           state, city, denomination, interests, accepting_seekers, max_pending_requests,
           onboarding_completed, preferred_church_id)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,true,5,true,$13)
           ON CONFLICT (email) DO NOTHING
           RETURNING id`,
          [
            s.name,
            s.name.toLowerCase().replace(/['']/g, '').replace(/\s+/g, '.') + '@sanctuary.com',
            passwordHash, '🙏', null, 'seeker',
            s.bio, `${s.city}, ${s.state}`,
            s.state, s.city, s.denomination,
            s.interests || [],
            churchId
          ]
        )
        if (result.rows.length > 0) {
          newSeekerIdMap[s.name] = result.rows[0].id
          seekersAdded++
        }
      }
      console.log(`   ✅ ${seekersAdded} new seekers created`)

      // ---- 11b: Additional reviews for national guides (2 per guide) ----
      // Uses new seekers with geographic affinity — makes ratings feel earned
      console.log('   ⭐ Adding supplemental reviews for national guides...')
      const suppReviews = [
        { guideName: 'Rev. Dominique Fontaine', seekerName: 'Darius Jackson',   rating: 5, text: "As a New Orleans musician who grew up in the church, I have heard a lot of preaching. Rev. Fontaine is the real thing — Spirit-led and practically grounded in equal measure." },
        { guideName: 'Rev. Dominique Fontaine', seekerName: 'Kezia Montgomery',  rating: 4, text: "Her teaching on prayer has given me new language I am now bringing into my school and my AME roots. Genuinely transformative sessions." },
        { guideName: 'Dr. James Osei-Bonsu',   seekerName: 'Samuel Perkins',    rating: 5, text: "After my diagnosis, I did not know how to hold faith and fear at the same time. Dr. Osei-Bonsu taught me lament in a way that gave me permission to feel both." },
        { guideName: 'Dr. James Osei-Bonsu',   seekerName: 'Priscilla Owens',   rating: 4, text: "Helped me articulate grief I had been carrying silently for years. His approach to lament theology is rare and desperately needed." },
        { guideName: 'Pastor Carmen Delgado',  seekerName: 'Jade Nguyen',       rating: 5, text: "I came to Pastor Delgado burned out and directionless. She helped me see my ER work as sacred vocation. Completely reoriented my sense of purpose." },
        { guideName: 'Pastor Carmen Delgado',  seekerName: 'Noah Fischer',      rating: 4, text: "Her vocational discernment sessions gave me language for something I could not name before. I finally feel settled about my direction." },
        { guideName: 'Elder Nathaniel Pierce', seekerName: 'Devin Harris',      rating: 5, text: "Elder Pierce helped me build the Scripture and accountability foundation I needed after years away from faith. He does not sugarcoat, and I am better for it." },
        { guideName: 'Elder Nathaniel Pierce', seekerName: 'Connor Sullivan',   rating: 4, text: "His financial stewardship sessions hit different when you have been irresponsible with money for years. Practical, biblical, and never condescending." },
        { guideName: 'Dr. Grace Huang',        seekerName: 'Amara Okonkwo',    rating: 5, text: "As a physician and mother far from my faith community, I needed a guide who could hold complexity. Dr. Huang does that with remarkable grace." },
        { guideName: 'Dr. Grace Huang',        seekerName: 'Josephine Nakamura', rating: 4, text: "Her Ignatian approach opened dimensions of my Episcopal faith I had never accessed. Our sessions were quietly, deeply life-changing." },
      ]

      let suppReviewsAdded = 0
      for (const rev of suppReviews) {
        const gId = extGuideIdMap[rev.guideName]
        const sId = newSeekerIdMap[rev.seekerName]
        if (!gId || !sId) continue
        await client.query(
          `INSERT INTO guide_reviews (guide_id, seeker_id, appointment_id, rating, review_text)
           VALUES ($1, $2, NULL, $3, $4)
           ON CONFLICT (guide_id, seeker_id) DO NOTHING`,
          [gId, sId, rev.rating, rev.text]
        )
        suppReviewsAdded++
      }
      // Re-update ratings for national guides that got new reviews
      for (const gId of Object.values(extGuideIdMap)) {
        await client.query(
          `UPDATE users
           SET overall_rating = COALESCE((SELECT ROUND(AVG(rating)::numeric, 2) FROM guide_reviews WHERE guide_id = $1), 0),
               review_count   = (SELECT COUNT(*) FROM guide_reviews WHERE guide_id = $1)
           WHERE id = $1`,
          [gId]
        )
      }
      console.log(`   ✅ ${suppReviewsAdded} supplemental reviews added + ratings updated`)

      // ---- 11c: Prayer requests & testimonies from new seekers ----
      console.log('   🙏 Adding prayer requests from new seekers...')
      const newSeekerPrayers = [
        { seekerName: 'Darius Jackson',    type: 'prayer',    category: 'Guidance', isAnonymous: false,
          title: 'Returning to Faith After Years Away',
          description: 'Asking for prayer as I find my way back to the church after nearly a decade away. The music never left me but the community did — praying for courage to stay this time.' },
        { seekerName: 'Samuel Perkins',    type: 'prayer',    category: 'Health',   isAnonymous: false,
          title: 'Living Well With Chronic Illness',
          description: 'Recently diagnosed and learning to trust God in a body that is changing. Praying for peace, provision, and the grace to be present with my grandchildren.' },
        { seekerName: 'Aaliya Hassan',     type: 'prayer',    category: 'Guidance', isAnonymous: true,
          title: 'A New Believer Seeking Wisdom',
          description: 'Converted two years ago and still learning what it means to follow Jesus. Some family members do not understand. Praying for courage and clarity.' },
        { seekerName: 'Latoya Simmons',    type: 'prayer',    category: 'Other',    isAnonymous: false,
          title: 'Strength for NICU Nurses',
          description: 'Praying for every nurse and care worker who holds a fragile life in their hands. This work is sacred and sometimes it breaks you. Asking for renewal and resilience.' },
        { seekerName: 'Tamara Bell',       type: 'testimony', category: 'Gratitude', isAnonymous: false,
          title: 'Finding Beauty as a Spiritual Practice',
          description: 'After the hardest year of my life, I picked up a camera and started photographing sunrises. I was not looking for God but I found Him in every one. Grateful beyond words.' },
        { seekerName: 'Nadia Petrov',      type: 'testimony', category: 'Other',    isAnonymous: false,
          title: 'From Refugee Camp to Faith Community',
          description: 'I came to America with nothing. A church gave me food, then language classes, then a Bible. I did not believe then — I do now. God is not absent from suffering. He was there the whole time.' },
        { seekerName: 'Elias Moreno',      type: 'prayer',    category: 'Guidance', isAnonymous: false,
          title: 'Calling Without Credentials',
          description: 'I serve as an informal chaplain to ranchers and first responders in rural Montana. No seminary, no credentials — just a sense that this is what I am supposed to do. Praying for clarity and courage.' },
        { seekerName: 'Marco Reyes',       type: 'prayer',    category: 'Other',    isAnonymous: true,
          title: 'Faith and Difficult Work',
          description: 'My work puts me in situations where the right thing is not always clear. Praying for wisdom, integrity, and the strength to hold my faith and my duties at the same time.' },
      ]

      let newPrayersAdded = 0
      for (const p of newSeekerPrayers) {
        const userId = newSeekerIdMap[p.seekerName]
        if (!userId) continue
        await client.query(
          `INSERT INTO prayer_requests (user_id, title, description, category, is_anonymous, type)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [userId, p.title, p.description, p.category, p.isAnonymous, p.type]
        )
        newPrayersAdded++
      }
      console.log(`   ✅ ${newPrayersAdded} new prayer requests / testimonies added`)

      // ---- 11d: Additional follows — new seekers follow top national guides ----
      console.log('   👥 Adding follows from new seekers to top guides...')
      const newSeekerIds = Object.values(newSeekerIdMap)
      // Also follow regional & local guides using a rotating offset
      const allNewGuideRows = await client.query(
        `SELECT id FROM users WHERE email IN (
          'dominique.fontaine@sanctuary.com','james.osei.bonsu@sanctuary.com',
          'carmen.delgado@sanctuary.com','nathaniel.pierce@sanctuary.com',
          'grace.huang@sanctuary.com','simone.adeyemi@sanctuary.com',
          'marcus.holloway@sanctuary.com','anna.kowalski@sanctuary.com',
          'diego.sandoval@sanctuary.com','keisha.freeman@sanctuary.com',
          'jerome.watkins@sanctuary.com'
        ) ORDER BY id`
      )
      const allNewGuideIds = allNewGuideRows.rows.map(r => r.id)

      let newFollowsAdded = 0
      for (let gi = 0; gi < allNewGuideIds.length; gi++) {
        const gId = allNewGuideIds[gi]
        // National guides (first 5) get most new followers; regional & local get fewer
        const followCount = gi < 5 ? Math.min(35, newSeekerIds.length)
                          : gi < 9 ? Math.min(15, newSeekerIds.length)
                          : Math.min(8, newSeekerIds.length)
        const offset = gi * 3
        const eligible = newSeekerIds.filter(id => id !== gId)
        for (let j = 0; j < followCount; j++) {
          const followerId = eligible[(offset + j) % eligible.length]
          await client.query(
            'INSERT INTO guide_follows (follower_id, guide_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [followerId, gId]
          )
          newFollowsAdded++
        }
      }
      // Re-update follower_count for all new guides
      for (const gId of allNewGuideIds) {
        await client.query(
          `UPDATE users
           SET follower_count = (SELECT COUNT(*) FROM guide_follows WHERE guide_id = $1)
           WHERE id = $1`,
          [gId]
        )
      }
      console.log(`   ✅ ${newFollowsAdded} additional follows added + follower counts updated`)

      console.log('\n👥 Extended seeker seed complete!')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log(`   New seekers:    ${seekersAdded}`)
      console.log(`   Supp. reviews:  ${suppReviewsAdded}`)
      console.log(`   New prayers:    ${newPrayersAdded}`)
      console.log(`   New follows:    ${newFollowsAdded}`)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    } // end extended seekers block

    // ---- Step 12: Community Activity Fill (Session 36) ----
    // Adds prayers, guide posts, event RSVPs, connections,
    // prayer interactions, and appointments so the app feels lived-in.
    console.log('\n🏘️  Adding community activity...')

    const activityCheck = await client.query(
      `SELECT id FROM prayer_requests WHERE title = 'Navigating Doubt as a New Believer'`
    )
    if (activityCheck.rows.length > 0) {
      console.log('   ⚠️  Community activity already seeded — skipping.\n')
    } else {
      // Helper: look up user id by email (uses already-connected client)
      const uidByEmail = async (email) => {
        const r = await client.query('SELECT id FROM users WHERE email=$1', [email])
        return r.rows[0]?.id || null
      }

      // Build a full id map for all users we reference
      const u = {
        pastorMike:        await uidByEmail('test@sanctuary.com'),
        jordan:            await uidByEmail('jordan@sanctuary.com'),
        graceOkafor:       await uidByEmail('grace.okafor@sanctuary.com'),
        joyAdebayo:        await uidByEmail('minister.joy.adebayo@sanctuary.com'),
        lisaMonroe:        await uidByEmail('pastor.lisa.monroe@sanctuary.com'),
        // Step 10 new guides
        dominique:         await uidByEmail('dominique.fontaine@sanctuary.com'),
        jamesOsei:         await uidByEmail('james.osei.bonsu@sanctuary.com'),
        carmen:            await uidByEmail('carmen.delgado@sanctuary.com'),
        nathaniel:         await uidByEmail('nathaniel.pierce@sanctuary.com'),
        graceHuang:        await uidByEmail('grace.huang@sanctuary.com'),
        simone:            await uidByEmail('simone.adeyemi@sanctuary.com'),
        marcusHolloway:    await uidByEmail('marcus.holloway@sanctuary.com'),
        annaKowalski:      await uidByEmail('anna.kowalski@sanctuary.com'),
        diegoSandoval:     await uidByEmail('diego.sandoval@sanctuary.com'),
        keishaFreeman:     await uidByEmail('keisha.freeman@sanctuary.com'),
        jeromeWatkins:     await uidByEmail('jerome.watkins@sanctuary.com'),
        // Original seekers
        sarahJohnson:      await uidByEmail('sarah.johnson@sanctuary.com'),
        michaelChen:       await uidByEmail('michael.chen@sanctuary.com'),
        emilyRodriguez:    await uidByEmail('emily.rodriguez@sanctuary.com'),
        jamesWilson:       await uidByEmail('james.wilson@sanctuary.com'),
        rachelKim:         await uidByEmail('rachel.kim@sanctuary.com'),
        nathanBrooks:      await uidByEmail('nathan.brooks@sanctuary.com'),
        priyaSharma:       await uidByEmail('priya.sharma@sanctuary.com'),
        tylerOdom:         await uidByEmail('tyler.odom@sanctuary.com'),
        aishaWilliams:     await uidByEmail('aisha.williams@sanctuary.com'),
        chrisMartinez:     await uidByEmail('chris.martinez@sanctuary.com'),
        oliviaBennett:     await uidByEmail('olivia.bennett@sanctuary.com'),
        marcusDavis:       await uidByEmail('marcus.davis@sanctuary.com'),
        hannahLee:         await uidByEmail('hannah.lee@sanctuary.com'),
        calebWashington:   await uidByEmail('caleb.washington@sanctuary.com'),
        sofiaRamirez:      await uidByEmail('sofia.ramirez@sanctuary.com'),
        elijahBrown:       await uidByEmail('elijah.brown@sanctuary.com'),
        meganObrien:       await uidByEmail('megan.obrien@sanctuary.com'),
        isaiahReed:        await uidByEmail('isaiah.reed@sanctuary.com'),
        zoeNakamura:       await uidByEmail('zoe.nakamura@sanctuary.com'),
        ethanCooper:       await uidByEmail('ethan.cooper@sanctuary.com'),
        destinyHarris:     await uidByEmail('destiny.harris@sanctuary.com'),
        liamFitzgerald:    await uidByEmail('liam.fitzgerald@sanctuary.com'),
        jasmineTorres:     await uidByEmail('jasmine.torres@sanctuary.com'),
        ryanMitchell:      await uidByEmail('ryan.mitchell@sanctuary.com'),
        // Step 11 new seekers
        elenaVasquez:      await uidByEmail('elena.vasquez@sanctuary.com'),
        marcusWebb:        await uidByEmail('marcus.webb@sanctuary.com'),
        natalieChen:       await uidByEmail('natalie.chen@sanctuary.com'),
        derekOsei:         await uidByEmail('derek.osei@sanctuary.com'),
        priscillaOwens:    await uidByEmail('priscilla.owens@sanctuary.com'),
        keziaM:            await uidByEmail('kezia.montgomery@sanctuary.com'),
        samuelPerkins:     await uidByEmail('samuel.perkins@sanctuary.com'),
        imaniOkafor:       await uidByEmail('imani.okafor@sanctuary.com'),
        dariusJackson:     await uidByEmail('darius.jackson@sanctuary.com'),
        vivianBrooks:      await uidByEmail('vivian.brooks@sanctuary.com'),
        andreThompson:     await uidByEmail('andre.thompson@sanctuary.com'),
        keziaMonroe:       await uidByEmail('kezia.monroe@sanctuary.com'),
        deonSimmons:       await uidByEmail('deon.simmons@sanctuary.com'),
        tamaraBell:        await uidByEmail('tamara.bell@sanctuary.com'),
        carlosReyes:       await uidByEmail('carlos.reyes@sanctuary.com'),
        whitneyThomas:     await uidByEmail('whitney.thomas@sanctuary.com'),
        luisMenendez:      await uidByEmail('luis.menendez@sanctuary.com'),
        jasminePowel:      await uidByEmail('jasmine.powell@sanctuary.com'),
        elaineDupree:      await uidByEmail('elaine.dupree@sanctuary.com'),
        kevinOdom:         await uidByEmail('kevin.odom@sanctuary.com'),
        rachelNguyen:      await uidByEmail('rachel.nguyen@sanctuary.com'),
        noahFischer:       await uidByEmail('noah.fischer@sanctuary.com'),
        latoyaSimmons:     await uidByEmail('latoya.simmons@sanctuary.com'),
        patrickMahoney:    await uidByEmail('patrick.mahoney@sanctuary.com'),
        yukiTanaka:        await uidByEmail('yuki.tanaka@sanctuary.com'),
        dominiquePeterson: await uidByEmail('dominique.petersen@sanctuary.com'),
        isaiahChambers:    await uidByEmail('isaiah.chambers@sanctuary.com'),
        cassandraHill:     await uidByEmail('cassandra.hill@sanctuary.com'),
        benKowalski:       await uidByEmail('ben.kowalski@sanctuary.com'),
        nadiaPetrov:       await uidByEmail('nadia.petrov@sanctuary.com'),
        elijahMoss:        await uidByEmail('elijah.moss@sanctuary.com'),
        tanyaRivers:       await uidByEmail('tanya.rivers@sanctuary.com'),
        marcusYoung:       await uidByEmail('marcus.young@sanctuary.com'),
        jadeNguyen:        await uidByEmail('jade.nguyen@sanctuary.com'),
        connorSullivan:    await uidByEmail('connor.sullivan@sanctuary.com'),
        aaliyaHassan:      await uidByEmail('aaliya.hassan@sanctuary.com'),
        robertoFuentes:    await uidByEmail('roberto.fuentes@sanctuary.com'),
        amaraOkonkwo:      await uidByEmail('amara.okonkwo@sanctuary.com'),
        devinHarris:       await uidByEmail('devin.harris@sanctuary.com'),
        marissaCastillo:   await uidByEmail('marissa.castillo@sanctuary.com'),
        lenaPark:          await uidByEmail('lena.park@sanctuary.com'),
        gabrielTorres:     await uidByEmail('gabriel.torres@sanctuary.com'),
        faithOsei:         await uidByEmail('faith.osei@sanctuary.com'),
        tylerBrooks:       await uidByEmail('tyler.brooks@sanctuary.com'),
        camilleBroussard:  await uidByEmail('camille.broussard@sanctuary.com'),
        marcoReyes:        await uidByEmail('marco.reyes@sanctuary.com'),
        josephineNakamura: await uidByEmail('josephine.nakamura@sanctuary.com'),
        eliasMoreno:       await uidByEmail('elias.moreno@sanctuary.com'),
      }

      // ---- 12a: Prayer requests & testimonies ----
      console.log('   🙏 Adding prayer requests and testimonies...')
      const prayerDefs12 = [
        // Original seekers
        { userId: u.michaelChen, type: 'prayer', category: 'Guidance', isAnonymous: false,
          title: 'Navigating Doubt as a New Believer',
          description: 'I came to faith later in life and I carry a lot of intellectual questions. Not looking to abandon faith — I want to go deeper. Praying for a community that holds tension without demanding easy answers.' },
        { userId: u.emilyRodriguez, type: 'prayer', category: 'Family', isAnonymous: false,
          title: 'Healing in My Marriage',
          description: 'My husband and I are in a hard season. We both love God but we cannot seem to love each other well right now. Asking for prayer for patience, humility, and grace to hear each other again.' },
        { userId: u.jamesWilson, type: 'prayer', category: 'Guidance', isAnonymous: false,
          title: 'Discerning a Career Change',
          description: 'I have been in finance for 15 years and feel called to something else — something that matters more. Praying for clarity and the courage to take the first step even before I see the whole staircase.' },
        { userId: u.rachelKim, type: 'testimony', category: 'Gratitude', isAnonymous: false,
          title: 'God Showed Up in the Waiting',
          description: 'I waited three years for a job I believed God had promised me. When it finally came it was better than I imagined and I understood the delay. He is always working even when I cannot see it.' },
        { userId: u.nathanBrooks, type: 'prayer', category: 'Family', isAnonymous: false,
          title: 'Praying for My Prodigal Son',
          description: 'My 24-year-old son walked away from faith two years ago. We still talk but barely. I pray for him every morning. Asking others to stand with me.' },
        { userId: u.priyaSharma, type: 'prayer', category: 'Health', isAnonymous: false,
          title: 'Peace Through Chronic Pain',
          description: 'I have lived with an autoimmune condition for six years. Some days are harder than others. Praying for healing but also for the grace to find joy and purpose in every season.' },
        { userId: u.tylerOdom, type: 'prayer', category: 'Guidance', isAnonymous: false,
          title: 'Finding My Place in the Church',
          description: 'I genuinely want to serve but do not know where I fit. I have tried a few things and nothing has clicked yet. Praying for discernment and for leaders who will help me discover my gifts.' },
        { userId: u.aishaWilliams, type: 'testimony', category: 'Gratitude', isAnonymous: false,
          title: 'Six Months Clean — God Did This',
          description: 'I never thought I would say this publicly but here it is: six months sober, and I did not do it alone. God and a small community of people who would not give up on me brought me back. Grateful does not begin to cover it.' },
        { userId: u.chrisMartinez, type: 'prayer', category: 'Family', isAnonymous: true,
          title: 'Family Tension Around Faith',
          description: 'Some members of my family see my faith as a phase. The holidays are particularly hard. Praying for peace and for relationships that do not require me to pretend.' },
        { userId: u.oliviaBennett, type: 'prayer', category: 'Guidance', isAnonymous: false,
          title: 'What Does Faithful Leadership Look Like?',
          description: 'I just accepted a promotion and I am asking God how to lead well. Not just efficiently but justly and with integrity. Praying for wisdom and for humility to keep learning.' },
        { userId: u.marcusDavis, type: 'prayer', category: 'Other', isAnonymous: false,
          title: 'Grief After Losing My Father',
          description: 'My dad passed three months ago and I still reach for my phone to call him. He was my first example of what a man of faith looked like. I am learning to grieve as one who has hope.' },
        { userId: u.hannahLee, type: 'prayer', category: 'Guidance', isAnonymous: false,
          title: 'Afraid to Step Into Calling',
          description: 'I know what God is asking me to do and I am terrified. The platform feels too big. The stakes feel too high. Praying for the obedience to say yes before I feel ready.' },
        { userId: u.calebWashington, type: 'testimony', category: 'Gratitude', isAnonymous: false,
          title: 'From Skeptic to Believer',
          description: 'I spent most of my adult life dismissing Christianity. A friend did not argue me into faith — he just lived it in front of me for years until I had to take it seriously. I am two years in and I am still learning to say thank you.' },
        { userId: u.sofiaRamirez, type: 'prayer', category: 'Other', isAnonymous: false,
          title: 'Caught Between Two Worlds',
          description: 'I am first-generation American and my faith looks different from my family\'s back home. I love them and I love God and sometimes those feel like they are pulling in opposite directions. Praying for integration.' },
        { userId: u.elijahBrown, type: 'prayer', category: 'Guidance', isAnonymous: false,
          title: 'What Now? Faith After Retirement',
          description: 'I gave 40 years to a career and now I have more time than purpose. God has been nudging me toward something and I am trying to listen. Praying for patience in the discernment process.' },
        { userId: u.meganObrien, type: 'prayer', category: 'Health', isAnonymous: false,
          title: 'Anxiety and Faith',
          description: 'I have struggled with anxiety for most of my adult life. I believe God is bigger than it but some days my body does not seem to agree. Praying for peace that surpasses understanding and for the community to hold me when I cannot hold myself.' },
        { userId: u.isaiahReed, type: 'prayer', category: 'Guidance', isAnonymous: false,
          title: 'Stepping Into Full-Time Ministry',
          description: 'I have been bivocational for four years. I feel God calling me to step out fully. The finances do not make sense yet. Praying for clarity and provision.' },
        { userId: u.zoeNakamura, type: 'prayer', category: 'Family', isAnonymous: false,
          title: 'Raising Faithful Kids in a Distracted World',
          description: 'My children are 8 and 11 and the culture is loud. Praying for wisdom on how to cultivate their faith without forcing it — and for the grace to model what I am asking them to believe.' },
        { userId: u.ethanCooper, type: 'prayer', category: 'Other', isAnonymous: true,
          title: 'Loneliness in the Church',
          description: 'I attend faithfully every week and I am not sure anyone would notice if I stopped. Praying for real community — not programs but people who actually know my name.' },
        { userId: u.destinyHarris, type: 'testimony', category: 'Gratitude', isAnonymous: false,
          title: 'Prayer Changed My Mornings',
          description: 'A year ago I started waking up 20 minutes earlier to pray. I did not feel like it. I barely knew what to say. But something in me has shifted — a groundedness I have never had before. The practice became the grace.' },
        { userId: u.liamFitzgerald, type: 'prayer', category: 'Guidance', isAnonymous: false,
          title: 'Faith and Finances',
          description: 'I made some poor decisions in my 20s and I am still paying for them. Trying to be faithful with what I have while digging out of debt. Praying for wisdom and for freedom from shame.' },
        { userId: u.jasmineTorres, type: 'prayer', category: 'Other', isAnonymous: false,
          title: 'Trusting God With My Fertility Journey',
          description: 'We have been trying to start a family for two years. I believe God has a plan. Some days I believe it more than others. Praying for faith that holds even in the waiting.' },
        { userId: u.ryanMitchell, type: 'prayer', category: 'Family', isAnonymous: false,
          title: 'New Dad Trying to Lead Well',
          description: 'I have a 6-month-old and I have never wanted anything more than to give her a solid spiritual foundation. Praying for wisdom on how to lead a family in faith when I am still figuring so much out myself.' },
        { userId: u.jordan, type: 'prayer', category: 'Guidance', isAnonymous: false,
          title: 'Finding the Right Guide',
          description: 'I have been looking for a spiritual director for a while and the process is harder than I expected. Praying for the right connection — someone who can meet me where I am.' },
        // New seekers (Step 11)
        { userId: u.natalieChen, type: 'prayer', category: 'Guidance', isAnonymous: false,
          title: 'Faith and Science — Can They Coexist?',
          description: 'I am a PhD student in biology and I am taking faith seriously for the first time. I have more questions than answers and I keep being told I am asking too many. Praying for a community brave enough to hold complexity.' },
        { userId: u.imaniOkafor, type: 'testimony', category: 'Gratitude', isAnonymous: false,
          title: 'Paint as Prayer',
          description: 'I spent three years painting murals across Harlem and I did not understand why some of them felt like worship. Now I think I do. Every wall was a conversation with God I did not know I was having.' },
        { userId: u.vivianBrooks, type: 'prayer', category: 'Other', isAnonymous: false,
          title: 'Silence in a Noisy City',
          description: 'I work in federal policy in DC. The noise never stops. I am craving contemplative space — real silence, real stillness — and I cannot seem to find it. Praying for those who can help me build that interior life.' },
        { userId: u.keziaMonroe, type: 'prayer', category: 'Guidance', isAnonymous: false,
          title: 'Honoring the Faith of My Forebears',
          description: 'My great-grandmother was an AME deaconess who marched in Birmingham in 1963. I want to carry that legacy faithfully but sometimes I do not know what it asks of me right now. Praying for wisdom.' },
        { userId: u.whitneyThomas, type: 'prayer', category: 'Other', isAnonymous: false,
          title: 'The Interior Life Behind the Public Faith',
          description: 'I teach and I testify and I sing in the choir. But my private prayer life feels shallow compared to my public faith. Praying for depth in secret as much as I have visibility in public.' },
        { userId: u.jasminePowel, type: 'prayer', category: 'Family', isAnonymous: false,
          title: 'Raising a Daughter in Faith When Mine Feels Shaky',
          description: 'I have a 14-month-old and I want to pass something real to her. But I am still figuring out what I actually believe myself. Praying for guides and community who can help me build before I am asked to give.' },
        { userId: u.noahFischer, type: 'prayer', category: 'Guidance', isAnonymous: false,
          title: 'From College Faith to Adult Faith',
          description: 'My faith was shaped entirely by the campus ministry where I went to college. Now I am 28 and married and in a real church and it feels like starting over. Praying for patience in the transition.' },
        { userId: u.dominiquePeterson, type: 'prayer', category: 'Health', isAnonymous: false,
          title: 'Sustaining the Work Without Burning Out',
          description: 'I run an afterschool program for at-risk kids in Milwaukee and I love it. I also have nothing left at the end of the day. Praying for renewal and for the wisdom to receive care so I can keep giving it.' },
        { userId: u.cassandraHill, type: 'prayer', category: 'Guidance', isAnonymous: false,
          title: 'Corporate Faith vs. Personal Prayer',
          description: 'I have been an AME member my whole life and I value corporate worship. But I realize I have never really developed a personal, interior prayer life. That changes now. Asking for accountability.' },
        { userId: u.tanyaRivers, type: 'prayer', category: 'Other', isAnonymous: false,
          title: 'Faith in the Wilderness',
          description: 'I cover three hundred miles of North Dakota alone. The landscape and the isolation have taught me things about God I could not have learned in a city. But loneliness is real. Praying for community that can cross distance.' },
        { userId: u.robertoFuentes, type: 'prayer', category: 'Family', isAnonymous: false,
          title: 'More Than Sunday Morning',
          description: 'I teach Sunday school and I love it. But I know I am giving my class more than I have been given myself. Praying for one-on-one direction that helps me go deeper so I can lead others into depth.' },
        { userId: u.faithOsei, type: 'prayer', category: 'Family', isAnonymous: false,
          title: 'Passing It On',
          description: 'I am a first-time mom and I feel the weight of being the first generation in my family to raise a child in faith. Praying for guides who take intergenerational discipleship as seriously as I do.' },
        { userId: u.tylerBrooks, type: 'prayer', category: 'Guidance', isAnonymous: false,
          title: 'Depth to Match the Gift',
          description: 'I can build relationships. I can get teenagers to trust me. What I cannot yet do is give them the theological depth they deserve. Praying for mentors who will help me close that gap.' },
        { userId: u.camilleBroussard, type: 'prayer', category: 'Guidance', isAnonymous: false,
          title: 'Integration — All of Who I Am',
          description: 'I live at the intersection of Creole, Hawaiian, Christian, and worship leader. I have never found a spiritual director who could hold all of that. Praying that God sends someone who will not ask me to simplify.' },
        // Guides sharing to the community
        { userId: u.dominique, type: 'testimony', category: 'Gratitude', isAnonymous: false,
          title: 'What Happens When You Fast With Others',
          description: 'I led a 21-day fast last Lent with 40 people across 12 countries. We had never met. We prayed together every morning at 6 AM. What God did in that space could not have happened any other way. Grateful to still be learning what prayer can do.' },
        { userId: u.jamesOsei, type: 'prayer', category: 'Other', isAnonymous: false,
          title: 'Praying for the Grieving',
          description: 'I ask for prayer for every person I walk with through loss. My ministry takes me into sacred and painful places. I need intercession for the wisdom to stay present without losing myself. Please stand with me.' },
        { userId: u.jeromeWatkins, type: 'prayer', category: 'Other', isAnonymous: false,
          title: 'Praying for Chicago\'s South Side',
          description: 'My city is beautiful and my city is hurting. I ask for prayer for the families and young men I minister to on the south side. God is moving here. Believe that with me.' },
        { userId: u.keishaFreeman, type: 'testimony', category: 'Gratitude', isAnonymous: false,
          title: 'Twenty Years of Women\'s Ministry',
          description: 'I started a prayer breakfast 20 years ago in my kitchen with four women. This month we had 80. God turned a kitchen table into a movement. I take no credit. All I did was show up and make coffee.' },
        { userId: u.annaKowalski, type: 'prayer', category: 'Guidance', isAnonymous: false,
          title: 'For the Doubters in My Congregation',
          description: 'I pastor a congregation where honest doubt is welcome. Some weeks that is heavy. I am praying for wisdom to hold questions without easy answers and to model the kind of faith that can survive them.' },
      ]

      let prayers12Added = 0
      const prayerIds12 = []
      for (const p of prayerDefs12) {
        if (!p.userId) continue
        const r = await client.query(
          `INSERT INTO prayer_requests (user_id, title, description, category, is_anonymous, type)
           VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
          [p.userId, p.title, p.description, p.category, p.isAnonymous, p.type]
        )
        prayerIds12.push({ id: r.rows[0].id, userId: p.userId })
        prayers12Added++
      }
      console.log(`   ✅ ${prayers12Added} prayers/testimonies added`)

      // ---- 12b: Guide posts (2 per new guide) ----
      console.log('   📝 Adding guide posts...')
      const guidePosts12 = [
        { userId: u.dominique, postType: 'devotional', scriptureRef: 'Isaiah 58:6-7',
          title: 'Fasting Is Not About Missing Meals',
          content: 'True fasting, Isaiah tells us, is not about what we withhold from our bodies. It is about what we release into the world — broken chains, shared bread, the seen made of the hidden. The hunger that matters is the one that drives us toward others.\n\nWhen I fast, I am training my will to want what God wants. That discipline does not end when the fast does. That is the point.' },
        { userId: u.dominique, postType: 'scripture', scriptureRef: 'Mark 1:35',
          title: 'He Withdrew to a Lonely Place',
          content: 'The most effective person who ever lived still found it necessary to get away. Before the crowds. Before the miracles. Before the hard conversations. Jesus rose early and went to a lonely place to pray.\n\nIf the Son of God needed silence before service, what makes you think you do not? Your output will only ever be as deep as your interior life.' },
        { userId: u.jamesOsei, postType: 'reflection', scriptureRef: 'Psalm 88:1',
          title: 'The Darkest Psalm Is Still a Prayer',
          content: 'Psalm 88 is the only lament in the psalter that does not resolve. No "but I will praise you." No dawn after the darkness. Just raw, unresolved grief addressed to God.\n\nI bring this to my grief sessions often. The fact that it made it into Scripture means God is not afraid of your unresolved pain. You do not have to wrap it up before you bring it to him.' },
        { userId: u.jamesOsei, postType: 'devotional', scriptureRef: 'Romans 8:26',
          title: 'When You Do Not Know How to Pray',
          content: 'There are seasons when grief strips language. You open your mouth and nothing comes out that feels adequate. Paul says the Spirit intercedes for us in those moments with groans that words cannot express.\n\nYou do not have to have the right words. You just have to show up. The Spirit handles the translation.' },
        { userId: u.carmen, postType: 'devotional', scriptureRef: 'Jeremiah 29:11',
          title: 'The Calling Is Not Always Clear Before the Step',
          content: 'I get asked constantly how I knew I was called to this work. The honest answer is I did not — not fully. I knew enough to take the next step. And then the next one opened up.\n\nVocational discernment is not a map. It is a conversation. You do not get the whole route before you start walking. You get the next step and the courage to take it.' },
        { userId: u.carmen, postType: 'general', scriptureRef: null,
          title: 'On Working With What You Have Been Given',
          content: 'The people who most transformed my life were not the ones with the most impressive credentials. They were the ones who used what they had, where they were, with everything they had.\n\nYour gifts are not waiting for a bigger platform. They are being formed by the current one. Use them now.' },
        { userId: u.nathaniel, postType: 'scripture', scriptureRef: 'Proverbs 4:23',
          title: 'Guard Your Heart — Everything Flows From There',
          content: 'Solomon was not speaking metaphorically. He was speaking medically, spiritually, and practically. What enters your heart shapes your thoughts. Your thoughts shape your words. Your words shape your life.\n\nThe men I disciple who struggle most are the ones who have not learned to guard the gate. Scripture memory is one of the best guards I know. You cannot be surprised by a thought you have already displaced.' },
        { userId: u.nathaniel, postType: 'reflection', scriptureRef: 'Malachi 3:10',
          title: 'The Tithe Is a Test — and a Training',
          content: 'God challenges us to test him in this one area. Give the first 10% and watch what happens. I have given this counsel to hundreds of men over 15 years and the ones who try it — even when the math does not make sense — consistently report that something shifts.\n\nNot always in their bank account. Always in their heart.' },
        { userId: u.graceHuang, postType: 'reflection', scriptureRef: 'Luke 10:42',
          title: 'One Thing Is Necessary',
          content: 'Martha was busy. Her work was real and her service was genuine. But Jesus did not commend the activity — he commended the sitting. He called it the "one thing necessary."\n\nIgnatian prayer has taught me to sit before I serve. The doing comes after the being. When I reverse that order, the doing hollows out. The sitting is the thing.' },
        { userId: u.graceHuang, postType: 'devotional', scriptureRef: 'Philippians 4:7',
          title: 'Peace That Passes Understanding',
          content: 'Paul wrote this from prison. That context has never left me.\n\nThe peace he describes is not the absence of difficulty. It is a quality of interior life that circumstances cannot reach. That is what contemplative prayer is training us toward — not emotional numbness, but a peace with deep enough roots that the storms above do not disturb it.' },
        { userId: u.simone, postType: 'devotional', scriptureRef: 'Acts 2:42',
          title: 'What the Early Church Got Right',
          content: 'They devoted themselves to teaching, fellowship, breaking bread, and prayer. Four things. Not programs. Not a building. Not a brand. Four things, done consistently, in community.\n\nI come back to this verse every time I feel the pressure to add more. It is a permission slip to go deeper with less.' },
        { userId: u.simone, postType: 'reflection', scriptureRef: '1 Peter 2:2',
          title: 'For the New Believers',
          content: 'Like newborn babies, crave pure spiritual milk. Peter did not say "figure it out" or "catch up fast." He said crave. The posture of a new believer is an appetite, not a deficit.\n\nIf you are new to faith, your questions are not embarrassing. They are exactly right. Keep asking them.' },
        { userId: u.marcusHolloway, postType: 'reflection', scriptureRef: 'Micah 6:8',
          title: 'Three Things — Not One',
          content: 'Do justice. Love mercy. Walk humbly. The prophet did not rank them. He held them together.\n\nI have watched faith communities collapse into either justice without mercy, or mercy without justice, or humility that is really just passivity. The three belong together. When one is absent, the others distort.' },
        { userId: u.marcusHolloway, postType: 'devotional', scriptureRef: 'Matthew 25:40',
          title: 'Serving the Hidden Face of Christ',
          content: 'Every Sunday I preach. Every Monday I walk the neighborhood. The Monday work has taught me more about the Sunday text than any commentary I have read.\n\nWhen you serve the vulnerable, you are not doing charity. You are encountering Christ. That is not metaphor. He said it himself.' },
        { userId: u.annaKowalski, postType: 'devotional', scriptureRef: 'Romans 8:1',
          title: 'There Is Now No Condemnation',
          content: 'Luther called this the heart of the Gospel and I have spent 10 years watching it land differently for different people. For the self-critical, it is permission to breathe. For the comfortable, it is a call to examine what they have made peace with too quickly.\n\nThere is no condemnation. Not less condemnation. Not condemnation managed. None.' },
        { userId: u.annaKowalski, postType: 'reflection', scriptureRef: null,
          title: 'On Doubting Your Way Into Deeper Faith',
          content: 'Every person of strong faith I know has been through a serious season of doubt. Not despite their faith — through it. Doubt is not the opposite of faith. Certainty might be.\n\nIf you are in a hard season of questions, you are in good company. Faith that has never been tested has never been faith. It has been assumption.' },
        { userId: u.diegoSandoval, postType: 'devotional', scriptureRef: 'Luke 1:38',
          title: 'Let It Be Done to Me',
          content: 'Mary\'s response to the impossible was not full understanding. It was full surrender. "Let it be done to me according to your word." She said yes before she could see how.\n\nThe Rosary returns me to this scene every time. The first mystery is not the miracle — it is the obedience. The yes before the yes makes sense.' },
        { userId: u.diegoSandoval, postType: 'scripture', scriptureRef: 'John 6:68',
          title: 'Lord, to Whom Shall We Go?',
          content: 'When the crowd walked away from the hard teaching, Jesus turned to the twelve. Peter\'s response has stayed with me for years: "Lord, to whom shall we go? You have the words of eternal life."\n\nPeter did not say he understood everything. He said there was nowhere else to go. That is not blind faith — it is faith that has compared the alternatives and found them wanting.' },
        { userId: u.keishaFreeman, postType: 'devotional', scriptureRef: '1 Thessalonians 5:17',
          title: 'Pray Without Ceasing — Here Is What That Actually Means',
          content: 'It does not mean get on your knees all day. It means carry on an ongoing conversation with God about everything — your commute, your frustrations, your groceries, your fears.\n\nPrayer without ceasing is a posture, not a position. You turn everything toward him. Every ordinary moment becomes a sacred one.' },
        { userId: u.keishaFreeman, postType: 'reflection', scriptureRef: null,
          title: 'On Women Who Pray Together',
          content: 'I have watched God do things in prayer circles that did not happen in any service or program. There is something about women interceding together, honestly and without performance, that breaks things open.\n\nDo not underestimate what happens when two or three gather in his name. I have seen it too many times to have any doubt.' },
        { userId: u.jeromeWatkins, postType: 'scripture', scriptureRef: 'Matthew 5:3',
          title: 'Blessed Are the Poor in Spirit — What Jesus Actually Said',
          content: 'The word poor here is ptochos — not just poor but completely destitute. Emptied out. At the end of your own resources.\n\nJesus opened the greatest sermon ever preached by calling the spiritually bankrupt blessed. Not when they get it together. Now. The kingdom belongs to those who know they do not have enough to get in on their own.' },
        { userId: u.jeromeWatkins, postType: 'reflection', scriptureRef: null,
          title: 'What Chicago Taught Me About the Church',
          content: 'This city is hard and this city is holy. I have seen more genuine faith on the south side than I have seen in a lot of sanctuaries. Faith that costs something is different from faith that is comfortable.\n\nI am grateful every day that I did not take a safer call. The church in challenging places is often the most alive.' },
      ]

      let posts12Added = 0
      for (const p of guidePosts12) {
        if (!p.userId) continue
        await client.query(
          `INSERT INTO guide_posts (user_id, title, content, post_type, scripture_ref)
           VALUES ($1,$2,$3,$4,$5)`,
          [p.userId, p.title, p.content, p.postType, p.scriptureRef || null]
        )
        posts12Added++
      }
      console.log(`   ✅ ${posts12Added} guide posts added`)

      // ---- 12c: Event RSVPs ----
      console.log('   📅 Adding event RSVPs...')
      const eventsResult12 = await client.query(`
        SELECT e.id, e.category, e.event_type, u.state AS guide_state
        FROM events e JOIN users u ON u.id = e.created_by
        WHERE u.email IN (
          'dominique.fontaine@sanctuary.com','james.osei.bonsu@sanctuary.com',
          'carmen.delgado@sanctuary.com','nathaniel.pierce@sanctuary.com',
          'grace.huang@sanctuary.com','simone.adeyemi@sanctuary.com',
          'marcus.holloway@sanctuary.com','anna.kowalski@sanctuary.com',
          'diego.sandoval@sanctuary.com','keisha.freeman@sanctuary.com',
          'jerome.watkins@sanctuary.com'
        ) ORDER BY e.id
      `)
      const seekerPool12 = [
        { id: u.jordan, state: 'IL' }, { id: u.sarahJohnson, state: 'IL' },
        { id: u.michaelChen, state: 'CA' }, { id: u.emilyRodriguez, state: 'TX' },
        { id: u.jamesWilson, state: 'IL' }, { id: u.rachelKim, state: 'NY' },
        { id: u.nathanBrooks, state: 'GA' }, { id: u.priyaSharma, state: 'TX' },
        { id: u.tylerOdom, state: 'FL' }, { id: u.aishaWilliams, state: 'GA' },
        { id: u.chrisMartinez, state: 'TX' }, { id: u.oliviaBennett, state: 'NY' },
        { id: u.marcusDavis, state: 'CA' }, { id: u.hannahLee, state: 'OH' },
        { id: u.calebWashington, state: 'GA' }, { id: u.sofiaRamirez, state: 'TX' },
        { id: u.elijahBrown, state: 'FL' }, { id: u.meganObrien, state: 'IL' },
        { id: u.isaiahReed, state: 'TX' }, { id: u.zoeNakamura, state: 'CA' },
        { id: u.ethanCooper, state: 'OH' }, { id: u.destinyHarris, state: 'TX' },
        { id: u.liamFitzgerald, state: 'NY' }, { id: u.jasmineTorres, state: 'TX' },
        { id: u.ryanMitchell, state: 'OH' }, { id: u.elenaVasquez, state: 'NY' },
        { id: u.marcusWebb, state: 'PA' }, { id: u.natalieChen, state: 'MA' },
        { id: u.derekOsei, state: 'CT' }, { id: u.priscillaOwens, state: 'NJ' },
        { id: u.keziaM, state: 'MD' }, { id: u.samuelPerkins, state: 'VA' },
        { id: u.imaniOkafor, state: 'NY' }, { id: u.dariusJackson, state: 'LA' },
        { id: u.vivianBrooks, state: 'DC' }, { id: u.andreThompson, state: 'GA' },
        { id: u.keziaMonroe, state: 'AL' }, { id: u.deonSimmons, state: 'TN' },
        { id: u.tamaraBell, state: 'GA' }, { id: u.carlosReyes, state: 'TX' },
        { id: u.whitneyThomas, state: 'MS' }, { id: u.luisMenendez, state: 'FL' },
        { id: u.jasminePowel, state: 'NC' }, { id: u.elaineDupree, state: 'AR' },
        { id: u.kevinOdom, state: 'OK' }, { id: u.rachelNguyen, state: 'TX' },
        { id: u.noahFischer, state: 'OH' }, { id: u.latoyaSimmons, state: 'OH' },
        { id: u.patrickMahoney, state: 'IN' }, { id: u.yukiTanaka, state: 'MO' },
        { id: u.dominiquePeterson, state: 'WI' }, { id: u.isaiahChambers, state: 'MO' },
        { id: u.cassandraHill, state: 'MI' }, { id: u.benKowalski, state: 'IL' },
        { id: u.nadiaPetrov, state: 'MN' }, { id: u.elijahMoss, state: 'KS' },
        { id: u.tanyaRivers, state: 'ND' }, { id: u.marcusYoung, state: 'IL' },
        { id: u.jadeNguyen, state: 'AZ' }, { id: u.connorSullivan, state: 'NV' },
        { id: u.aaliyaHassan, state: 'UT' }, { id: u.robertoFuentes, state: 'CA' },
        { id: u.amaraOkonkwo, state: 'OR' }, { id: u.devinHarris, state: 'IL' },
        { id: u.marissaCastillo, state: 'TX' }, { id: u.lenaPark, state: 'WA' },
        { id: u.gabrielTorres, state: 'NM' }, { id: u.faithOsei, state: 'CA' },
        { id: u.tylerBrooks, state: 'ID' }, { id: u.camilleBroussard, state: 'HI' },
        { id: u.marcoReyes, state: 'AZ' }, { id: u.josephineNakamura, state: 'CO' },
        { id: u.eliasMoreno, state: 'MT' },
      ].filter(s => s.id !== null)
      const neighbors12 = {
        LA:['MS','TX','AR'], PA:['NJ','NY','MD','DE','OH','WV'],
        CO:['WY','NE','KS','NM','AZ','UT'], OR:['WA','ID','CA','NV'],
        AZ:['CA','NV','UT','NM'], MA:['CT','RI','NH','VT','NY'],
        AL:['MS','TN','GA','FL'], OH:['PA','WV','KY','IN','MI'],
        CA:['OR','NV','AZ'], TX:['NM','OK','AR','LA'],
        IL:['WI','IN','MO','IA','KY'],
      }

      let rsvps12Added = 0
      for (const evt of eventsResult12.rows) {
        let candidates = evt.event_type === 'in_person'
          ? seekerPool12.filter(s => [evt.guide_state, ...(neighbors12[evt.guide_state] || [])].includes(s.state))
          : seekerPool12
        const shuffled = [...candidates].sort((a, b) => ((evt.id * 31 + (a.id || 0)) % 100) - ((evt.id * 31 + (b.id || 0)) % 100))
        const selected = shuffled.slice(0, evt.event_type === 'in_person' ? 7 : 10)
        for (const s of selected) {
          await client.query(
            'INSERT INTO event_rsvps (event_id, user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
            [evt.id, s.id]
          )
          rsvps12Added++
        }
      }
      console.log(`   ✅ ${rsvps12Added} event RSVPs added`)

      // ---- 12d: Connections ----
      console.log('   🤝 Adding community connections...')
      const connPairs12 = [
        [u.jordan, u.jamesWilson], [u.jordan, u.meganObrien], [u.jordan, u.benKowalski],
        [u.meganObrien, u.benKowalski], [u.jamesWilson, u.marcusYoung], [u.benKowalski, u.devinHarris],
        [u.emilyRodriguez, u.rachelNguyen], [u.emilyRodriguez, u.marissaCastillo],
        [u.rachelNguyen, u.marissaCastillo], [u.isaiahReed, u.destinyHarris],
        [u.rachelKim, u.elenaVasquez], [u.rachelKim, u.imaniOkafor], [u.elenaVasquez, u.liamFitzgerald],
        [u.hannahLee, u.noahFischer], [u.hannahLee, u.latoyaSimmons], [u.ethanCooper, u.ryanMitchell],
        [u.noahFischer, u.ethanCooper],
        [u.nathanBrooks, u.aishaWilliams], [u.nathanBrooks, u.calebWashington],
        [u.aishaWilliams, u.andreThompson],
        [u.sofiaRamirez, u.jasmineTorres], [u.sofiaRamirez, u.carlosReyes],
        [u.chrisMartinez, u.isaiahReed], [u.priyaSharma, u.destinyHarris],
        [u.michaelChen, u.zoeNakamura], [u.michaelChen, u.robertoFuentes],
        [u.marcusDavis, u.faithOsei],
        [u.elaineDupree, u.deonSimmons], [u.patrickMahoney, u.hannahLee],
        [u.dominiquePeterson, u.cassandraHill], [u.keziaM, u.vivianBrooks],
        [u.priscillaOwens, u.derekOsei], [u.samuelPerkins, u.marcusWebb],
        [u.jadeNguyen, u.marcoReyes], [u.josephineNakamura, u.eliasMoreno],
        // Seeker → Guide connections
        [u.jordan, u.pastorMike], [u.sarahJohnson, u.pastorMike],
        [u.michaelChen, u.dominique], [u.emilyRodriguez, u.carmen],
        [u.jamesWilson, u.nathaniel], [u.rachelKim, u.graceHuang],
        [u.priyaSharma, u.jamesOsei], [u.natalieChen, u.simone],
        [u.keziaMonroe, u.marcusHolloway], [u.noahFischer, u.annaKowalski],
        [u.liamFitzgerald, u.diegoSandoval], [u.rachelNguyen, u.keishaFreeman],
        [u.benKowalski, u.jeromeWatkins], [u.devinHarris, u.jeromeWatkins],
        [u.marissaCastillo, u.keishaFreeman], [u.connorSullivan, u.diegoSandoval],
        [u.vivianBrooks, u.graceHuang],
      ]

      let conns12Added = 0
      for (const [a, b] of connPairs12) {
        if (!a || !b || a === b) continue
        await client.query(
          `INSERT INTO user_connections (requester_id, recipient_id, status)
           VALUES ($1,$2,'accepted') ON CONFLICT DO NOTHING`,
          [a, b]
        )
        conns12Added++
      }
      console.log(`   ✅ ${conns12Added} connections added`)

      // ---- 12e: Prayer interactions ----
      console.log('   🙏 Adding prayer interactions...')
      const allPrayers12 = await client.query(
        'SELECT id, user_id FROM prayer_requests ORDER BY id'
      )
      const interactors12 = [
        u.dominique, u.jamesOsei, u.carmen, u.nathaniel, u.graceHuang,
        u.simone, u.marcusHolloway, u.annaKowalski, u.keishaFreeman, u.jeromeWatkins,
        u.pastorMike, u.graceOkafor, u.joyAdebayo, u.lisaMonroe,
        u.sarahJohnson, u.aishaWilliams, u.marcusDavis, u.destinyHarris,
        u.calebWashington, u.natalieChen, u.vivianBrooks, u.keziaM,
        u.latoyaSimmons, u.noahFischer, u.faithOsei,
      ].filter(Boolean)

      let interactions12Added = 0
      for (let i = 0; i < allPrayers12.rows.length; i++) {
        const prayer = allPrayers12.rows[i]
        const count = 3 + (i % 4)
        for (let j = 0; j < count; j++) {
          const actor = interactors12[(i * 7 + j) % interactors12.length]
          if (!actor || actor === prayer.user_id) continue
          await client.query(
            `INSERT INTO prayer_interactions (user_id, request_id, type)
             VALUES ($1,$2,'prayed') ON CONFLICT DO NOTHING`,
            [actor, prayer.id]
          )
          interactions12Added++
        }
      }
      console.log(`   ✅ ${interactions12Added} prayer interactions added`)

      // ---- 12f: Appointments ----
      console.log('   📆 Adding appointments...')
      const apptDefs12 = [
        // Completed (past)
        { guideId: u.pastorMike, seekerId: u.jordan, seekerName: 'Jordan Rivera',
          date: '2026-01-15', time: '10:00', duration: 60, type: 'General Guidance',
          status: 'completed', notes: 'First session — introductions, setting direction for the year.' },
        { guideId: u.pastorMike, seekerId: u.sarahJohnson, seekerName: 'Sarah Johnson',
          date: '2026-01-22', time: '14:00', duration: 60, type: 'Bible Study',
          status: 'completed', notes: 'Worked through Psalm 23 — she returned to this passage at a difficult moment.' },
        { guideId: u.dominique, seekerId: u.michaelChen, seekerName: 'Michael Chen',
          date: '2026-02-01', time: '09:00', duration: 90, type: 'Prayer Session',
          status: 'completed', notes: 'Introductory session on fasting prayer. Michael is a strong candidate for deeper direction.' },
        { guideId: u.dominique, seekerId: u.emilyRodriguez, seekerName: 'Emily Rodriguez',
          date: '2026-02-10', time: '11:00', duration: 60, type: 'General Guidance',
          status: 'completed', notes: 'Vocational questions — faith and career integration. Good progress.' },
        { guideId: u.jamesOsei, seekerId: u.marcusDavis, seekerName: 'Marcus Davis',
          date: '2026-01-28', time: '15:00', duration: 60, type: 'Counseling',
          status: 'completed', notes: 'Grief session following his father\'s passing. He is processing well with honesty.' },
        { guideId: u.carmen, seekerId: u.hannahLee, seekerName: 'Hannah Lee',
          date: '2026-02-05', time: '13:00', duration: 60, type: 'General Guidance',
          status: 'completed', notes: 'Career calling discernment. Hannah is close to a decision and needs courage more than clarity.' },
        { guideId: u.carmen, seekerId: u.isaiahReed, seekerName: 'Isaiah Reed',
          date: '2026-02-12', time: '16:00', duration: 90, type: 'General Guidance',
          status: 'completed', notes: 'Ministry transition planning. Isaiah is ready — he needs a concrete timeline.' },
        { guideId: u.nathaniel, seekerId: u.liamFitzgerald, seekerName: 'Liam Fitzgerald',
          date: '2026-01-20', time: '07:00', duration: 60, type: 'Bible Study',
          status: 'completed', notes: 'Stewardship and Scripture memorization. Liam committed to Proverbs 4 this month.' },
        { guideId: u.graceHuang, seekerId: u.rachelKim, seekerName: 'Rachel Kim',
          date: '2026-02-03', time: '10:00', duration: 60, type: 'Counseling',
          status: 'completed', notes: 'Marriage enrichment — Rachel working through communication patterns with her husband.' },
        { guideId: u.simone, seekerId: u.natalieChen, seekerName: 'Natalie Chen',
          date: '2026-02-08', time: '12:00', duration: 60, type: 'General Guidance',
          status: 'completed', notes: 'Faith foundations for a new believer who asks excellent questions. Assigned C.S. Lewis for next session.' },
        { guideId: u.marcusHolloway, seekerId: u.keziaMonroe, seekerName: 'Kezia Monroe',
          date: '2026-02-14', time: '14:00', duration: 60, type: 'General Guidance',
          status: 'completed', notes: 'Faith and justice integration — she wants to honor the civil rights legacy of her grandparents.' },
        { guideId: u.annaKowalski, seekerId: u.noahFischer, seekerName: 'Noah Fischer',
          date: '2026-02-06', time: '18:00', duration: 60, type: 'General Guidance',
          status: 'completed', notes: 'Transitioning from campus faith to adult parish life. Referred him to a Lutheran congregation near him.' },
        { guideId: u.diegoSandoval, seekerId: u.connorSullivan, seekerName: 'Connor Sullivan',
          date: '2026-01-25', time: '11:00', duration: 90, type: 'General Guidance',
          status: 'completed', notes: 'Returning Catholic seeking re-entry. Starting with the basics — Mass, confession, Scripture.' },
        { guideId: u.keishaFreeman, seekerId: u.rachelNguyen, seekerName: 'Rachel Nguyen',
          date: '2026-02-15', time: '09:00', duration: 60, type: 'Prayer Session',
          status: 'completed', notes: 'Identity and faith — navigating being second-generation Christian outside the ethnic church.' },
        { guideId: u.jeromeWatkins, seekerId: u.benKowalski, seekerName: 'Ben Kowalski',
          date: '2026-02-18', time: '07:00', duration: 60, type: 'Bible Study',
          status: 'completed', notes: 'Sermon on the Mount deep dive — Ben connected hard with the Beatitudes.' },
        // Confirmed upcoming
        { guideId: u.pastorMike, seekerId: u.jordan, seekerName: 'Jordan Rivera',
          date: '2026-03-12', time: '10:00', duration: 60, type: 'General Guidance',
          status: 'confirmed', notes: 'Second session — continuing to build direction.' },
        { guideId: u.dominique, seekerId: u.michaelChen, seekerName: 'Michael Chen',
          date: '2026-03-08', time: '09:00', duration: 60, type: 'Prayer Session',
          status: 'confirmed', notes: 'Follow-up on the 5-day fast. Debrief and next steps.' },
        { guideId: u.jamesOsei, seekerId: u.priyaSharma, seekerName: 'Priya Sharma',
          date: '2026-03-18', time: '15:00', duration: 60, type: 'Counseling',
          status: 'confirmed', notes: 'Ongoing grief support — chronic illness and faith.' },
        { guideId: u.carmen, seekerId: u.sofiaRamirez, seekerName: 'Sofia Ramirez',
          date: '2026-03-25', time: '13:00', duration: 60, type: 'General Guidance',
          status: 'confirmed', notes: 'Vocational discernment — bilingual ministry calling.' },
        { guideId: u.nathaniel, seekerId: u.ryanMitchell, seekerName: 'Ryan Mitchell',
          date: '2026-04-02', time: '07:00', duration: 60, type: 'Bible Study',
          status: 'confirmed', notes: 'Family leadership and Scripture — new dad finding his footing.' },
        { guideId: u.graceHuang, seekerId: u.vivianBrooks, seekerName: 'Vivian Brooks',
          date: '2026-03-29', time: '10:00', duration: 90, type: 'General Guidance',
          status: 'confirmed', notes: 'Contemplative prayer introduction — she is craving silence.' },
        { guideId: u.simone, seekerId: u.dariusJackson, seekerName: 'Darius Jackson',
          date: '2026-04-05', time: '11:00', duration: 60, type: 'General Guidance',
          status: 'confirmed', notes: 'Re-entry into faith — helping him find a faith community in New Orleans.' },
        { guideId: u.keishaFreeman, seekerId: u.marissaCastillo, seekerName: 'Marissa Castillo',
          date: '2026-03-14', time: '09:00', duration: 60, type: 'Prayer Session',
          status: 'confirmed', notes: 'New mother building family spiritual foundation.' },
        { guideId: u.jeromeWatkins, seekerId: u.devinHarris, seekerName: 'Devin Harris',
          date: '2026-03-20', time: '07:00', duration: 60, type: 'General Guidance',
          status: 'confirmed', notes: 'Accountability and re-commitment — Chicago south side.' },
        // Pending
        { guideId: u.graceHuang, seekerId: u.faithOsei, seekerName: 'Faith Osei',
          date: '2026-04-10', time: '10:00', duration: 60, type: 'General Guidance',
          status: 'pending', notes: '' },
        { guideId: u.nathaniel, seekerId: u.devinHarris, seekerName: 'Devin Harris',
          date: '2026-04-15', time: '07:00', duration: 60, type: 'Bible Study',
          status: 'pending', notes: '' },
        { guideId: u.annaKowalski, seekerId: u.dominiquePeterson, seekerName: 'Dominique Petersen',
          date: '2026-04-22', time: '18:00', duration: 60, type: 'Counseling',
          status: 'pending', notes: '' },
      ]

      let appts12Added = 0
      for (const a of apptDefs12) {
        if (!a.guideId || !a.seekerId) continue
        await client.query(
          `INSERT INTO appointments
           (guide_id, seeker_id, seeker_name, avatar, date, time, duration, type, notes, status, recurrence_rule)
           VALUES ($1,$2,$3,'🙏',$4,$5,$6,$7,$8,$9,'none')`,
          [a.guideId, a.seekerId, a.seekerName, a.date, a.time, a.duration, a.type, a.notes || '', a.status]
        )
        appts12Added++
      }
      console.log(`   ✅ ${appts12Added} appointments added`)

      console.log('\n🏘️  Community activity complete!')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log(`   Prayers/testimonies: ${prayers12Added}`)
      console.log(`   Guide posts:         ${posts12Added}`)
      console.log(`   Event RSVPs:         ${rsvps12Added}`)
      console.log(`   Connections:         ${conns12Added}`)
      console.log(`   Prayer interactions: ${interactions12Added}`)
      console.log(`   Appointments:        ${appts12Added}`)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    } // end activity block

    // ---- Summary ----
    console.log('\n🎉 Demo data seeded successfully!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`   Demo users:     ${AVAILABLE_PEOPLE.length + DISCOVERY_USERS.length}`)
    console.log(`   Connections:    ${5 + 1 + connCount}`)
    console.log(`   Appointments:   ${SAMPLE_APPOINTMENTS.length}`)
    console.log(`   Events:         ${allEvents.length}`)
    console.log(`   RSVPs:          ${rsvpCount}`)
    console.log(`   Announcements:  ${SAMPLE_ANNOUNCEMENTS.length}`)
    console.log(`   Prayers:        ${SAMPLE_PRAYERS.length} + ${SAMPLE_TESTIMONIES.length} testimonies`)
    console.log(`   Interactions:   ${interactionCount}`)
    console.log(`   Conversations:  ${convCount} (${msgCount} messages)`)
    console.log(`   Verses:         ${SCRIPTURE_VERSES.length}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  } catch (error) {
    console.error('\n❌ Demo seed failed:', error.message)
    console.error(error)
    process.exit(1)
  } finally {
    await client.end()
  }
}

seedDemo()
