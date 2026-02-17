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
