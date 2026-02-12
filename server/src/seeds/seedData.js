// ============================================================
// Seed Data
// ============================================================
// This file contains all the initial data for the Sanctuary app.
// It's copied from the hardcoded data in:
//   src/context/AppContext.jsx
//
// This data gets inserted into PostgreSQL by seed.js
// ============================================================

// Test user account (the spiritual guide)
// Password will be hashed with bcrypt before inserting
export const TEST_USER = {
  name: 'Pastor Mike',
  email: 'test@sanctuary.com',
  password: 'Sanctuary123',
  avatar: '🙏',
  role: 'guide',
  denomination: 'Non-denominational',
  churchName: 'Willow Creek Church',
  interests: ['Bible Study', 'Worship', 'Youth Ministry', 'Volunteering']
}

// Test seeker account (Jordan Rivera)
// Password will be hashed with bcrypt before inserting
export const TEST_SEEKER = {
  name: 'Jordan Rivera',
  email: 'jordan@sanctuary.com',
  password: 'Sanctuary123',
  avatar: '🙏',
  role: 'seeker',
  location: 'St. Louis',
  denomination: 'Catholic',
  interests: ['Hiking', 'Sports', 'Reading', 'Travel', 'Community Service']
}

// Available people for conversations
// These become user accounts in the database
export const AVAILABLE_PEOPLE = [
  { name: 'Sarah Johnson', avatar: '👩', role: 'seeker', denomination: 'Baptist', churchName: 'Holy Name Cathedral', interests: ['Reading', 'Music', 'Bible Study'] },
  { name: 'Michael Chen', avatar: '👨', role: 'seeker', denomination: 'Methodist', interests: ['Hiking', 'Photography', 'Community Service'] },
  { name: 'Emily Rodriguez', avatar: '👩‍🦱', role: 'seeker', denomination: 'Catholic', churchName: 'New Life Assembly', interests: ['Painting', 'Worship', 'Cooking'] },
  { name: 'James Wilson', avatar: '👨‍🦳', role: 'seeker', denomination: 'Presbyterian', interests: ['Sports', 'Gardening', 'Travel'] },
  { name: 'Grace Okafor', avatar: '👩', role: 'guide', denomination: 'Pentecostal', churchName: 'Faith Community Church', interests: ['Bible Study', 'Youth Ministry', 'Writing', 'Music'] }
]

// Church listings
// Maps to: AppContext.jsx → ALL_CHURCHES
export const CHURCHES = [
  {
    name: 'Willow Creek Church',
    address: '67 E Wacker Dr',
    city: 'Chicago',
    zip: '60601',
    sundaySchool: true,
    recommendedAges: 'Ages 3–12',
    hours: 'Sun 9:00 & 11:00 AM',
    overallRating: 4.5,
    reviewCount: 88
  },
  {
    name: 'Holy Name Cathedral',
    address: '1555 N State Pkwy',
    city: 'Chicago',
    zip: '60610',
    sundaySchool: true,
    recommendedAges: 'Ages 5–14',
    hours: 'Sun 8:00 & 10:30 AM',
    overallRating: 4.5,
    reviewCount: 142
  },
  {
    name: 'Brooklyn Tabernacle',
    address: '11 Atlantic Ave',
    city: 'Brooklyn',
    zip: '11217',
    sundaySchool: true,
    recommendedAges: 'Ages 3–12',
    hours: 'Sun 9:00 & 11:30 AM',
    overallRating: 4.8,
    reviewCount: 445
  },
  {
    name: 'Lakewood Church',
    address: '3700 Lake Mercer Dr',
    city: 'Houston',
    zip: '77054',
    sundaySchool: true,
    recommendedAges: 'Ages 3–16',
    hours: 'Sun 8:45 & 10:45 AM',
    overallRating: 4.8,
    reviewCount: 621
  },
  {
    name: 'National Cathedral',
    address: '3001 Massachusetts Ave NW',
    city: 'Washington',
    zip: '20016',
    sundaySchool: true,
    recommendedAges: 'Ages 5–16',
    hours: 'Sun 8:30 & 11:00 AM',
    overallRating: 4.8,
    reviewCount: 267
  }
]

// Bible quotes for daily inspiration
// Maps to: AppContext.jsx → BIBLE_QUOTES
export const BIBLE_QUOTES = [
  { text: "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.", ref: "John 3:16" },
  { text: "I can do all things through Christ who strengthens me.", ref: "Philippians 4:13" },
  { text: "The Lord is my shepherd; I shall not want.", ref: "Psalm 23:1" },
  { text: "Be strong and courageous. The Lord your God is with you wherever you go.", ref: "Joshua 1:9" },
  { text: "Trust in the Lord with all your heart and lean not on your own understanding.", ref: "Proverbs 3:5" },
  { text: "He has made everything beautiful in its time.", ref: "Ecclesiastes 3:11" },
  { text: "For I know the plans I have for you — plans to prosper you and not to harm you.", ref: "Jeremiah 29:11" },
  { text: "The Lord bless you and keep you; the Lord make His face shine upon you.", ref: "Numbers 6:24–25" },
  { text: "Greater love has no one than this: to lay down one's life for one's friends.", ref: "John 15:13" },
  { text: "Be still and know that I am God.", ref: "Psalm 46:10" },
  { text: "The steadfast love of the Lord never ceases; His mercies are new every morning.", ref: "Lamentations 3:22–23" },
  { text: "For nothing is impossible with God.", ref: "Matthew 19:26" },
  { text: "Let all that you do be done in love.", ref: "1 Corinthians 16:14" },
  { text: "He heals the brokenhearted and binds up their wounds.", ref: "Psalm 147:3" },
  { text: "Cast all your anxiety on Him because He cares for you.", ref: "1 Peter 5:7" },
  { text: "Walk by faith, not by sight.", ref: "2 Corinthians 5:7" },
  { text: "Delight yourself in the Lord, and He will give you the desires of your heart.", ref: "Psalm 37:4" },
  { text: "My peace I give to you, not as the world gives.", ref: "John 14:27" },
  { text: "Seek first His kingdom and His righteousness, and all these things shall be added.", ref: "Matthew 6:33" },
  { text: "The joy of the Lord is your strength.", ref: "Nehemiah 8:10" },
  { text: "Fear not, for I am with you; be not dismayed, for I am your God.", ref: "Isaiah 41:10" }
]

// Sample appointments for the demo
// These link to the test user (guide_id will be set during seeding)
// Discovery seed users — NOT connected to anyone, so they appear in "Suggested for You"
// David shares interests with Pastor Mike (Bible Study, Worship)
// Maria shares denomination with Jordan (Catholic) and interests with Pastor Mike (Youth Ministry)
export const DISCOVERY_USERS = [
  {
    name: 'David Kim',
    email: 'david@sanctuary.com',
    avatar: '👨',
    role: 'seeker',
    bio: 'College student exploring my faith journey.',
    location: 'Austin, TX',
    denomination: 'Non-denominational',
    churchName: 'Willow Creek Church',
    interests: ['Bible Study', 'Worship', 'Hiking', 'Music']
  },
  {
    name: 'Maria Santos',
    email: 'maria@sanctuary.com',
    avatar: '👩',
    role: 'guide',
    bio: 'Youth pastor with 10 years of experience in community building.',
    specialization: 'Youth Ministry',
    location: 'Miami, FL',
    denomination: 'Catholic',
    churchName: 'Holy Name Cathedral',
    interests: ['Youth Ministry', 'Volunteering', 'Community Service', 'Music']
  }
]

// Church favorites — links users to churches they've favorited
// Format: { userKey, churchName } — resolved to IDs during seeding
// userKey: 'guide', 'seeker', 'david', 'maria', or a name from AVAILABLE_PEOPLE
export const SEED_CHURCH_FAVORITES = [
  { userKey: 'guide', churchName: 'Willow Creek Church' },
  { userKey: 'seeker', churchName: 'Willow Creek Church' },
  { userKey: 'seeker', churchName: 'Holy Name Cathedral' },
  { userKey: 'david', churchName: 'Willow Creek Church' },
  { userKey: 'maria', churchName: 'Holy Name Cathedral' },
  { userKey: 'maria', churchName: 'Willow Creek Church' },
  { userKey: 'Emily Rodriguez', churchName: 'Willow Creek Church' },
  { userKey: 'Grace Okafor', churchName: 'Willow Creek Church' },
  { userKey: 'Sarah Johnson', churchName: 'Holy Name Cathedral' }
]

export const SAMPLE_APPOINTMENTS = [
  {
    seekerName: 'Ben Dover',
    avatar: '👤',
    date: '2026-02-05',
    time: '17:30',
    duration: 60,
    type: 'Bible Study',
    notes: 'Tell me about the burning bush',
    status: 'confirmed'
  },
  {
    seekerName: 'Phil Macrackin',
    avatar: '👤',
    date: '2026-02-07',
    time: '17:30',
    duration: 60,
    type: 'Bible Study',
    notes: 'Did Jesus really walk on water? Let\'s discuss',
    status: 'pending'
  }
]

// ============================================================
// Community Events
// ============================================================
// Sample events for the Community Events feature.
// creatorKey maps to userIdMap in seed.js (e.g., 'guide', 'seeker', 'maria', or a full name)
// churchName maps to churchIdMap (null = informal event, no church)
export const SAMPLE_EVENTS = [
  {
    title: 'Community Prayer Walk',
    description: 'Join us for a peaceful prayer walk through Grant Park. All are welcome! We will meet at the main fountain and walk together for about an hour.',
    dateTime: '2026-02-15 10:00:00',
    location: 'Grant Park, Chicago',
    category: 'Worship',
    creatorKey: 'guide',
    churchName: 'Willow Creek Church'
  },
  {
    title: 'Youth Game Night',
    description: 'Fun-filled evening with board games, snacks, and fellowship for teens and young adults ages 13-25.',
    dateTime: '2026-02-20 18:30:00',
    location: 'Holy Name Cathedral Hall',
    category: 'Youth',
    creatorKey: 'maria',
    churchName: 'Holy Name Cathedral'
  },
  {
    title: 'Neighborhood Cleanup',
    description: 'Let\'s serve our community! Gloves and bags provided. Meet in the church parking lot.',
    dateTime: '2026-02-22 09:00:00',
    location: 'Willow Creek Church Parking Lot',
    category: 'Service/Mission',
    creatorKey: 'Grace Okafor',
    churchName: 'Willow Creek Church'
  },
  {
    title: 'Hiking & Devotional',
    description: 'A morning hike followed by a short outdoor devotional. Moderate trail, about 3 miles. Bring water!',
    dateTime: '2026-03-01 08:00:00',
    location: 'Starved Rock State Park',
    category: 'Active/Outdoor',
    creatorKey: 'david',
    churchName: null
  },
  {
    title: 'Potluck Fellowship Dinner',
    description: 'Bring a dish to share and enjoy an evening of food and community. Sign up sheet for dishes in the lobby.',
    dateTime: '2026-02-28 17:00:00',
    location: 'Willow Creek Church Fellowship Hall',
    category: 'Social',
    creatorKey: 'guide',
    churchName: 'Willow Creek Church'
  }
]

// ============================================================
// Church Announcements (Bulletin Board)
// ============================================================
// Seed announcements for the bulletin board on ChurchDetail.
// authorKey maps to userIdMap in seed.js.
// Only guides should post announcements in the app, but seed data sets them up.
export const SAMPLE_ANNOUNCEMENTS = [
  {
    churchName: 'Willow Creek Church',
    authorKey: 'guide',
    title: 'New Service Time Starting March',
    message: 'Beginning March 1st, our Sunday morning service times will change to 9:30 AM and 11:30 AM. Wednesday evening services remain at 7:00 PM.',
    category: 'Schedule Change'
  },
  {
    churchName: 'Willow Creek Church',
    authorKey: 'guide',
    title: 'Volunteers Needed for Spring Festival',
    message: 'We need 20 volunteers for our annual Spring Festival on March 15th. Sign up at the welcome desk or contact the office.',
    category: 'Church Need'
  },
  {
    churchName: 'Holy Name Cathedral',
    authorKey: 'maria',
    title: 'Youth Retreat Registration Open',
    message: 'Registration is now open for our spring youth retreat, April 10-12. Cost is $75 per student. Scholarships available.',
    category: 'Announcement'
  },
  {
    churchName: 'Willow Creek Church',
    authorKey: 'Grace Okafor',
    title: 'This Sunday: Guest Speaker Rev. Thomas',
    message: 'We are excited to welcome Reverend James Thomas as our guest speaker this Sunday. He will be sharing on "Finding Rest in a Restless World."',
    category: 'Upcoming Sermon'
  }
]

// ============================================================
// Testimonies (Praise Reports)
// ============================================================
// These are seeded as prayer_requests with type='testimony'.
// They appear in the "Testimonies" tab on the Prayer Board.
export const SAMPLE_TESTIMONIES = [
  {
    title: 'God answered my prayer for healing!',
    description: 'After months of treatment and prayer from this community, I am officially in remission. Thank you all for your prayers and support. God is faithful!',
    category: 'Gratitude',
    creatorKey: 'Sarah Johnson',
    isAnonymous: false
  },
  {
    title: 'New job after months of searching',
    description: 'I posted a prayer request here 3 months ago about finding employment. I am happy to share that I received an offer this week for my dream position. Never stop praying!',
    category: 'Gratitude',
    creatorKey: 'seeker',
    isAnonymous: false
  }
]
