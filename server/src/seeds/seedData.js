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
  profilePhoto: 'https://randomuser.me/api/portraits/men/32.jpg',
  role: 'guide',
  state: 'IL',
  city: 'Chicago',
  denomination: 'Non-denominational',
  churchName: 'Willow Creek Church',
  interests: ['Bible Study', 'Worship', 'Youth Ministry', 'Volunteering'],
  acceptingSeekers: true,
  maxPendingRequests: 3
}

// Test seeker account (Jordan Rivera)
// Password will be hashed with bcrypt before inserting
export const TEST_SEEKER = {
  name: 'Jordan Rivera',
  email: 'jordan@sanctuary.com',
  password: 'Sanctuary123',
  avatar: '🙏',
  profilePhoto: 'https://randomuser.me/api/portraits/men/85.jpg',
  role: 'seeker',
  state: 'IL',
  city: 'Chicago',
  location: 'Chicago, IL',
  denomination: 'Catholic',
  interests: ['Hiking', 'Sports', 'Reading', 'Travel', 'Community Service']
}

// Available people for conversations
// These become user accounts in the database
export const AVAILABLE_PEOPLE = [
  { name: 'Sarah Johnson', avatar: '👩', profilePhoto: 'https://randomuser.me/api/portraits/women/44.jpg', role: 'seeker', denomination: 'Baptist', churchName: 'Holy Name Cathedral', interests: ['Reading', 'Music', 'Bible Study'] },
  { name: 'Michael Chen', avatar: '👨', profilePhoto: 'https://randomuser.me/api/portraits/men/75.jpg', role: 'seeker', denomination: 'Methodist', interests: ['Hiking', 'Photography', 'Community Service'] },
  { name: 'Emily Rodriguez', avatar: '👩‍🦱', profilePhoto: 'https://randomuser.me/api/portraits/women/63.jpg', role: 'seeker', denomination: 'Catholic', churchName: 'New Life Assembly', interests: ['Painting', 'Worship', 'Cooking'] },
  { name: 'James Wilson', avatar: '👨‍🦳', profilePhoto: 'https://randomuser.me/api/portraits/men/52.jpg', role: 'seeker', denomination: 'Presbyterian', interests: ['Sports', 'Gardening', 'Travel'] },
  { name: 'Grace Okafor', avatar: '👩', profilePhoto: 'https://randomuser.me/api/portraits/women/25.jpg', role: 'guide', denomination: 'Pentecostal', churchName: 'Faith Community Church', interests: ['Bible Study', 'Youth Ministry', 'Writing', 'Music'], acceptingSeekers: true, maxPendingRequests: 5 },

  // --- New Guides ---
  { name: 'Pastor Thomas Wright', avatar: '👨‍🦱', profilePhoto: 'https://randomuser.me/api/portraits/men/41.jpg', role: 'guide', bio: 'Senior pastor with 15 years leading a vibrant congregation in Atlanta.', specialization: 'Marriage & Family', state: 'GA', city: 'Atlanta', denomination: 'Baptist', churchName: 'Lakewood Church', interests: ['Bible Study', 'Counseling', 'Community Service', 'Music'], acceptingSeekers: true, maxPendingRequests: 8 },
  { name: 'Rev. Angela Pierce', avatar: '👩‍🦱', profilePhoto: 'https://randomuser.me/api/portraits/women/37.jpg', role: 'guide', bio: 'Associate minister focused on women\'s ministry and spiritual wellness.', specialization: 'Women\'s Ministry', state: 'CA', city: 'Los Angeles', denomination: 'AME', interests: ['Worship', 'Writing', 'Counseling', 'Volunteering'], acceptingSeekers: true, maxPendingRequests: 5 },
  { name: 'Pastor Daniel Reeves', avatar: '🧔', profilePhoto: 'https://randomuser.me/api/portraits/men/22.jpg', role: 'guide', bio: 'Passionate about discipleship and helping new believers grow in their faith.', specialization: 'Discipleship', state: 'TN', city: 'Nashville', denomination: 'Methodist', churchName: 'Brooklyn Tabernacle', interests: ['Bible Study', 'Music', 'Hiking', 'Youth Ministry'], acceptingSeekers: true, maxPendingRequests: 4 },
  { name: 'Sister Catherine Tran', avatar: '👩', profilePhoto: 'https://randomuser.me/api/portraits/women/51.jpg', role: 'guide', bio: 'Contemplative prayer guide and retreat facilitator for over a decade.', specialization: 'Prayer & Meditation', state: 'WA', city: 'Seattle', denomination: 'Catholic', churchName: 'Holy Name Cathedral', interests: ['Reading', 'Painting', 'Bible Study', 'Worship'], acceptingSeekers: true, maxPendingRequests: 6 },
  { name: 'Elder Marcus Thompson', avatar: '👨‍🦳', profilePhoto: 'https://randomuser.me/api/portraits/men/67.jpg', role: 'guide', bio: 'Church elder and mentor with a heart for young men finding their purpose.', specialization: 'Men\'s Ministry', state: 'NY', city: 'Brooklyn', denomination: 'Pentecostal', churchName: 'Brooklyn Tabernacle', interests: ['Sports', 'Community Service', 'Bible Study', 'Volunteering'], acceptingSeekers: true, maxPendingRequests: 10 },

  // --- New Seekers ---
  { name: 'Rachel Kim', avatar: '👩', profilePhoto: 'https://randomuser.me/api/portraits/women/15.jpg', role: 'seeker', state: 'TX', city: 'Houston', denomination: 'Non-denominational', churchName: 'Lakewood Church', interests: ['Music', 'Cooking', 'Bible Study', 'Travel'] },
  { name: 'Nathan Brooks', avatar: '👨', profilePhoto: 'https://randomuser.me/api/portraits/men/45.jpg', role: 'seeker', bio: 'Recently moved to Chicago and looking for a faith community.', state: 'IL', city: 'Chicago', denomination: 'Baptist', churchName: 'Willow Creek Church', interests: ['Sports', 'Photography', 'Community Service'] },
  { name: 'Priya Sharma', avatar: '👩‍🦱', profilePhoto: 'https://randomuser.me/api/portraits/women/82.jpg', role: 'seeker', state: 'CA', city: 'San Francisco', denomination: 'Non-denominational', interests: ['Reading', 'Hiking', 'Worship', 'Writing'] },
  { name: 'Tyler Odom', avatar: '👦', profilePhoto: 'https://randomuser.me/api/portraits/men/11.jpg', role: 'seeker', bio: 'College junior studying theology and exploring different denominations.', state: 'FL', city: 'Orlando', denomination: 'Methodist', interests: ['Hiking', 'Music', 'Youth Ministry', 'Gardening'] },
  { name: 'Aisha Williams', avatar: '👩‍🦱', profilePhoto: 'https://randomuser.me/api/portraits/women/33.jpg', role: 'seeker', state: 'GA', city: 'Atlanta', denomination: 'Baptist', interests: ['Volunteering', 'Cooking', 'Worship', 'Community Service'] },
  { name: 'Chris Martinez', avatar: '👨', profilePhoto: 'https://randomuser.me/api/portraits/men/91.jpg', role: 'seeker', state: 'AZ', city: 'Phoenix', denomination: 'Catholic', interests: ['Sports', 'Travel', 'Photography', 'Reading'] },

  // --- Session 26: New Guides (5) ---
  { name: 'Pastor Robert Hayes', avatar: '👨‍🦱', profilePhoto: 'https://randomuser.me/api/portraits/men/55.jpg', role: 'guide', bio: 'Former chaplain now pastoring a growing church in Houston. Specializes in grief and loss counseling.', specialization: 'Grief & Recovery', state: 'TX', city: 'Houston', denomination: 'Baptist', churchName: 'Lakewood Church', interests: ['Counseling', 'Bible Study', 'Community Service', 'Writing'], acceptingSeekers: true, maxPendingRequests: 6 },
  { name: 'Minister Joy Adebayo', avatar: '👩', profilePhoto: 'https://randomuser.me/api/portraits/women/72.jpg', role: 'guide', bio: 'Worship leader and spiritual mentor passionate about helping people find their voice in faith.', specialization: 'Worship & Creative Arts', state: 'TX', city: 'Dallas', denomination: 'Non-denominational', interests: ['Music', 'Worship', 'Youth Ministry', 'Painting'], acceptingSeekers: true, maxPendingRequests: 7 },
  { name: 'Rev. Samuel Kim', avatar: '👨', profilePhoto: 'https://randomuser.me/api/portraits/men/36.jpg', role: 'guide', bio: 'Bilingual pastor serving multicultural congregations for over 12 years.', specialization: 'Multicultural Ministry', state: 'WA', city: 'Seattle', denomination: 'Presbyterian', interests: ['Bible Study', 'Travel', 'Reading', 'Community Service'], acceptingSeekers: true, maxPendingRequests: 5 },
  { name: 'Pastor Lisa Monroe', avatar: '👩‍🦱', profilePhoto: 'https://randomuser.me/api/portraits/women/42.jpg', role: 'guide', bio: 'College campus minister who loves walking with young adults through big life transitions.', specialization: 'Young Adult Ministry', state: 'MN', city: 'Minneapolis', denomination: 'Lutheran', interests: ['Hiking', 'Counseling', 'Writing', 'Bible Study'], acceptingSeekers: true, maxPendingRequests: 8 },
  { name: 'Deacon Carlos Vega', avatar: '👨', profilePhoto: 'https://randomuser.me/api/portraits/men/18.jpg', role: 'guide', bio: 'Bilingual deacon with a heart for immigrant families and faith formation.', specialization: 'Family Ministry', state: 'TX', city: 'San Antonio', denomination: 'Catholic', interests: ['Volunteering', 'Community Service', 'Sports', 'Cooking'], acceptingSeekers: true, maxPendingRequests: 4 },

  // --- Session 26: New Seekers (12) ---
  { name: 'Olivia Bennett', avatar: '👩', profilePhoto: 'https://randomuser.me/api/portraits/women/20.jpg', role: 'seeker', bio: 'Nurse and mom of two, looking for deeper community and spiritual growth.', state: 'TN', city: 'Nashville', denomination: 'Methodist', interests: ['Reading', 'Cooking', 'Worship', 'Volunteering'] },
  { name: 'Marcus Davis', avatar: '👨', profilePhoto: 'https://randomuser.me/api/portraits/men/34.jpg', role: 'seeker', bio: 'Youth basketball coach seeking mentorship in faith leadership.', state: 'IL', city: 'Chicago', denomination: 'Baptist', churchName: 'Willow Creek Church', interests: ['Sports', 'Youth Ministry', 'Music', 'Community Service'] },
  { name: 'Hannah Lee', avatar: '👩', profilePhoto: 'https://randomuser.me/api/portraits/women/55.jpg', role: 'seeker', bio: 'Grad student exploring how faith intersects with social justice.', state: 'OR', city: 'Portland', denomination: 'Non-denominational', interests: ['Reading', 'Hiking', 'Writing', 'Volunteering'] },
  { name: 'Caleb Washington', avatar: '👨', profilePhoto: 'https://randomuser.me/api/portraits/men/14.jpg', role: 'seeker', bio: 'Recently baptized and excited to grow in my walk with Christ.', state: 'GA', city: 'Atlanta', denomination: 'Pentecostal', interests: ['Music', 'Sports', 'Bible Study', 'Travel'] },
  { name: 'Sofia Ramirez', avatar: '👩‍🦱', profilePhoto: 'https://randomuser.me/api/portraits/women/47.jpg', role: 'seeker', bio: 'Bilingual teacher passionate about integrating faith and education.', state: 'FL', city: 'Miami', denomination: 'Catholic', interests: ['Reading', 'Cooking', 'Community Service', 'Music'] },
  { name: 'Elijah Brown', avatar: '👨', profilePhoto: 'https://randomuser.me/api/portraits/men/62.jpg', role: 'seeker', bio: 'Retired military, finding peace and purpose through faith.', state: 'NC', city: 'Charlotte', denomination: 'AME', interests: ['Hiking', 'Gardening', 'Bible Study', 'Volunteering'] },
  { name: 'Megan O\'Brien', avatar: '👩', profilePhoto: 'https://randomuser.me/api/portraits/women/28.jpg', role: 'seeker', bio: 'Freelance designer who just moved to Denver and looking for a church home.', state: 'CO', city: 'Denver', denomination: 'Lutheran', interests: ['Painting', 'Photography', 'Worship', 'Hiking'] },
  { name: 'Isaiah Reed', avatar: '👨', profilePhoto: 'https://randomuser.me/api/portraits/men/8.jpg', role: 'seeker', bio: 'High school music teacher exploring how to lead worship at my church.', state: 'TX', city: 'Dallas', denomination: 'Baptist', interests: ['Music', 'Worship', 'Youth Ministry', 'Sports'] },
  { name: 'Zoe Nakamura', avatar: '👩', profilePhoto: 'https://randomuser.me/api/portraits/women/10.jpg', role: 'seeker', bio: 'Yoga instructor and new believer learning to blend mindfulness with prayer.', state: 'CA', city: 'Los Angeles', denomination: 'Non-denominational', interests: ['Hiking', 'Reading', 'Worship', 'Cooking'] },
  { name: 'Ethan Cooper', avatar: '👨', profilePhoto: 'https://randomuser.me/api/portraits/men/3.jpg', role: 'seeker', bio: 'Software engineer exploring faith after years away from church.', state: 'TX', city: 'Austin', denomination: 'Methodist', interests: ['Reading', 'Photography', 'Hiking', 'Music'] },
  { name: 'Destiny Harris', avatar: '👩‍🦱', profilePhoto: 'https://randomuser.me/api/portraits/women/57.jpg', role: 'seeker', bio: 'Single mom building a strong spiritual foundation for my family.', state: 'MI', city: 'Detroit', denomination: 'Pentecostal', interests: ['Cooking', 'Music', 'Bible Study', 'Community Service'] },
  { name: 'Liam Fitzgerald', avatar: '👨', profilePhoto: 'https://randomuser.me/api/portraits/men/88.jpg', role: 'seeker', bio: 'Seminary student looking for real community outside the classroom.', state: 'MA', city: 'Boston', denomination: 'Presbyterian', interests: ['Reading', 'Writing', 'Bible Study', 'Travel'] },

  // --- Session 26: Final 3 to reach 40 users ---
  { name: 'Pastor David Okonkwo', avatar: '👨', profilePhoto: 'https://randomuser.me/api/portraits/men/47.jpg', role: 'guide', bio: 'Energetic evangelist and church planter with a passion for reaching the unchurched.', specialization: 'Evangelism', state: 'NC', city: 'Charlotte', denomination: 'Pentecostal', interests: ['Community Service', 'Music', 'Volunteering', 'Bible Study'], acceptingSeekers: true, maxPendingRequests: 6 },
  { name: 'Jasmine Torres', avatar: '👩', profilePhoto: 'https://randomuser.me/api/portraits/women/65.jpg', role: 'seeker', bio: 'Young professional navigating life and faith in the big city.', state: 'TX', city: 'Houston', denomination: 'Catholic', interests: ['Cooking', 'Travel', 'Worship', 'Volunteering'] },
  { name: 'Ryan Mitchell', avatar: '👨', profilePhoto: 'https://randomuser.me/api/portraits/men/29.jpg', role: 'seeker', bio: 'Firefighter and new dad looking for a men\'s group and spiritual accountability.', state: 'MN', city: 'Minneapolis', denomination: 'Lutheran', interests: ['Sports', 'Hiking', 'Community Service', 'Bible Study'] }
]

// Church listings
// Maps to: AppContext.jsx → ALL_CHURCHES
export const CHURCHES = [
  {
    name: 'Willow Creek Church',
    address: '67 E Wacker Dr',
    city: 'Chicago',
    state: 'IL',
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
    state: 'IL',
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
    state: 'NY',
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
    state: 'TX',
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
    state: 'DC',
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
    profilePhoto: 'https://randomuser.me/api/portraits/men/79.jpg',
    role: 'seeker',
    bio: 'College student exploring my faith journey.',
    state: 'TX',
    city: 'Austin',
    location: 'Austin, TX',
    denomination: 'Non-denominational',
    churchName: 'Willow Creek Church',
    interests: ['Bible Study', 'Worship', 'Hiking', 'Music']
  },
  {
    name: 'Maria Santos',
    email: 'maria@sanctuary.com',
    avatar: '👩',
    profilePhoto: 'https://randomuser.me/api/portraits/women/68.jpg',
    role: 'guide',
    bio: 'Youth pastor with 10 years of experience in community building.',
    specialization: 'Youth Ministry',
    state: 'FL',
    city: 'Miami',
    location: 'Miami, FL',
    denomination: 'Catholic',
    churchName: 'Holy Name Cathedral',
    interests: ['Youth Ministry', 'Volunteering', 'Community Service', 'Music'],
    acceptingSeekers: false
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
  { userKey: 'Sarah Johnson', churchName: 'Holy Name Cathedral' },
  // New users
  { userKey: 'Pastor Thomas Wright', churchName: 'Lakewood Church' },
  { userKey: 'Elder Marcus Thompson', churchName: 'Brooklyn Tabernacle' },
  { userKey: 'Sister Catherine Tran', churchName: 'Holy Name Cathedral' },
  { userKey: 'Nathan Brooks', churchName: 'Willow Creek Church' },
  { userKey: 'Rachel Kim', churchName: 'Lakewood Church' },
  { userKey: 'Aisha Williams', churchName: 'Willow Creek Church' },
  { userKey: 'Chris Martinez', churchName: 'National Cathedral' },
  // Session 26 new users
  { userKey: 'Pastor Robert Hayes', churchName: 'Lakewood Church' },
  { userKey: 'Minister Joy Adebayo', churchName: 'Lakewood Church' },
  { userKey: 'Rev. Samuel Kim', churchName: 'Holy Name Cathedral' },
  { userKey: 'Pastor Lisa Monroe', churchName: 'Willow Creek Church' },
  { userKey: 'Deacon Carlos Vega', churchName: 'Holy Name Cathedral' },
  { userKey: 'Marcus Davis', churchName: 'Willow Creek Church' },
  { userKey: 'Olivia Bennett', churchName: 'Lakewood Church' },
  { userKey: 'Caleb Washington', churchName: 'Lakewood Church' },
  { userKey: 'Sofia Ramirez', churchName: 'Holy Name Cathedral' },
  { userKey: 'Destiny Harris', churchName: 'Brooklyn Tabernacle' },
  { userKey: 'Isaiah Reed', churchName: 'Lakewood Church' },
  { userKey: 'Liam Fitzgerald', churchName: 'National Cathedral' },
  { userKey: 'Pastor David Okonkwo', churchName: 'Brooklyn Tabernacle' },
  { userKey: 'Jasmine Torres', churchName: 'Lakewood Church' },
  { userKey: 'Ryan Mitchell', churchName: 'Willow Creek Church' }
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
// Digital Events
// ============================================================
// Sample digital events (livestreams, recorded content).
// eventType, eventLink, and isLive are the new fields for digital events.
export const SAMPLE_DIGITAL_EVENTS = [
  {
    title: 'Sunday Morning Livestream',
    description: 'Join us live for our regular Sunday morning worship service, streamed from Willow Creek Church. Worship, prayer, and a message from Pastor Mike.',
    dateTime: '2026-02-16 10:00:00',
    category: 'Worship',
    eventType: 'digital',
    eventLink: 'https://youtube.com/live/sanctuary-sunday',
    isLive: true,
    creatorKey: 'guide',
    churchName: 'Willow Creek Church'
  },
  {
    title: 'Faith Foundations: Gospel of John',
    description: 'A recorded series walking through the Gospel of John. Watch at your own pace and discuss in the community.',
    dateTime: '2026-02-10 12:00:00',
    category: 'Sermons/Teachings',
    eventType: 'digital',
    eventLink: 'https://youtube.com/watch?v=gospel-of-john',
    isLive: false,
    creatorKey: 'Pastor Daniel Reeves',
    churchName: 'Brooklyn Tabernacle'
  },
  {
    title: 'Online Prayer Circle',
    description: 'A weekly prayer gathering via Zoom. Everyone is welcome to share requests and pray together in a safe, supportive space.',
    dateTime: '2026-02-18 19:00:00',
    category: 'Prayer',
    eventType: 'digital',
    eventLink: 'https://zoom.us/j/sanctuary-prayer',
    isLive: true,
    creatorKey: 'Sister Catherine Tran',
    churchName: null
  },
  {
    title: 'Intro to Psalms - Bible Study',
    description: 'A recorded deep-dive into the Book of Psalms. Great for personal study or small group discussion.',
    dateTime: '2026-02-12 09:00:00',
    category: 'Bible Study',
    eventType: 'digital',
    eventLink: 'https://youtube.com/watch?v=psalms-study',
    isLive: false,
    creatorKey: 'Elder Marcus Thompson',
    churchName: null
  },
  {
    title: 'Evening Worship & Praise',
    description: 'Live worship session streaming from Atlanta. Grab your Bible and worship with us from anywhere!',
    dateTime: '2026-02-21 20:00:00',
    category: 'Worship',
    eventType: 'digital',
    eventLink: 'https://youtube.com/live/evening-worship',
    isLive: true,
    creatorKey: 'Pastor Thomas Wright',
    churchName: 'Lakewood Church'
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
  },
  {
    title: 'My marriage was restored!',
    description: 'My husband and I were on the brink of divorce. Through counseling with our pastor and the prayers of this community, we recommitted to each other. God is a God of restoration!',
    category: 'Gratitude',
    creatorKey: 'Olivia Bennett',
    isAnonymous: false
  },
  {
    title: 'Baptized last Sunday!',
    description: 'After two years of searching, I finally gave my life to Christ and was baptized at my church. Thank you to everyone who walked this journey with me.',
    category: 'Gratitude',
    creatorKey: 'Caleb Washington',
    isAnonymous: false
  },
  {
    title: 'Addiction-free for one year',
    description: 'One year sober today. I could not have done it without faith, my small group, and the constant prayers from this community. If you are struggling, please reach out.',
    category: 'Gratitude',
    creatorKey: 'Elijah Brown',
    isAnonymous: false
  },
  {
    title: 'Daughter accepted to college!',
    description: 'We have been praying for my daughter\'s future for years. She just received a full scholarship to study nursing. God provides!',
    category: 'Gratitude',
    creatorKey: 'Destiny Harris',
    isAnonymous: false
  }
]

// ============================================================
// Prayer Requests
// ============================================================
// These are seeded as prayer_requests with type='prayer'.
// They appear in the "Prayers" tab on the Prayer Board.
export const SAMPLE_PRAYERS = [
  {
    title: 'Prayers for my father\'s surgery',
    description: 'My dad is having heart surgery next Tuesday. Please pray for a successful operation and a smooth recovery. He is 72 and means the world to our family.',
    category: 'Health',
    creatorKey: 'Sofia Ramirez',
    isAnonymous: false
  },
  {
    title: 'Struggling with anxiety',
    description: 'I have been dealing with severe anxiety lately and it is affecting my work and relationships. Please pray for peace and clarity.',
    category: 'Health',
    creatorKey: 'Hannah Lee',
    isAnonymous: false
  },
  {
    title: 'Pray for my marriage',
    description: 'My wife and I are going through a rough season. We love each other but communication has broken down. Please lift us up.',
    category: 'Family',
    creatorKey: 'Marcus Davis',
    isAnonymous: false
  },
  {
    title: 'Job interview this Friday',
    description: 'I have a big job interview coming up. I have been unemployed for 4 months and really need this to work out. Praying for favor and confidence.',
    category: 'Financial',
    creatorKey: 'Ethan Cooper',
    isAnonymous: false
  },
  {
    title: 'Guidance for a big decision',
    description: 'I am trying to decide whether to move across the country for a new opportunity or stay close to family. Please pray for wisdom and discernment.',
    category: 'Guidance',
    creatorKey: 'Megan O\'Brien',
    isAnonymous: false
  },
  {
    title: 'Please pray for my son',
    description: 'My teenage son has been pulling away from faith and making some concerning choices. Praying he finds his way back.',
    category: 'Family',
    creatorKey: 'guide',
    isAnonymous: false
  },
  {
    title: 'Healing from grief',
    description: 'I lost my grandmother last month and the grief has been overwhelming. She was my rock. Please pray for comfort and strength.',
    category: 'Health',
    creatorKey: 'Zoe Nakamura',
    isAnonymous: false
  },
  {
    title: 'Struggling with faith',
    description: 'I have been going through a season of doubt. I want to believe but everything feels distant. Please pray I find my way through this.',
    category: 'Other',
    creatorKey: 'Liam Fitzgerald',
    isAnonymous: false
  }
]

// ============================================================
// Extra In-Person Events (Session 26)
// ============================================================
export const EXTRA_EVENTS = [
  {
    title: 'Women\'s Brunch & Bible Study',
    description: 'Ladies, join us for a morning of fellowship, brunch, and a study on Proverbs 31. Bring a friend!',
    dateTime: '2026-02-21 10:00:00',
    location: 'Lakewood Church Fellowship Hall',
    category: 'Social',
    creatorKey: 'Minister Joy Adebayo',
    churchName: 'Lakewood Church'
  },
  {
    title: 'Men\'s Breakfast Fellowship',
    description: 'Monthly men\'s breakfast. Good food, great conversation, and a short devotional. All men welcome.',
    dateTime: '2026-03-07 08:00:00',
    location: 'Willow Creek Church Cafe',
    category: 'Social',
    creatorKey: 'Pastor Robert Hayes',
    churchName: 'Willow Creek Church'
  },
  {
    title: 'Community Food Drive',
    description: 'Help us collect non-perishable food items for local families in need. Drop-off at the church lobby or join us for sorting and delivery.',
    dateTime: '2026-02-25 09:00:00',
    location: 'Holy Name Cathedral Lobby',
    category: 'Service/Mission',
    creatorKey: 'Deacon Carlos Vega',
    churchName: 'Holy Name Cathedral'
  }
]

// ============================================================
// Extra Digital Events (Session 26)
// ============================================================
export const EXTRA_DIGITAL_EVENTS = [
  {
    title: 'Parenting Through Faith',
    description: 'A recorded talk on raising children with spiritual values in a modern world. Practical tips and encouragement for parents.',
    dateTime: '2026-02-14 12:00:00',
    category: 'Sermons/Teachings',
    eventType: 'digital',
    eventLink: 'https://youtube.com/watch?v=parenting-faith',
    isLive: false,
    creatorKey: 'Pastor Lisa Monroe',
    churchName: null
  },
  {
    title: 'Midweek Worship Night',
    description: 'Live worship session every Wednesday. Unplug, tune in, and let the music carry you into God\'s presence.',
    dateTime: '2026-02-19 20:00:00',
    category: 'Worship',
    eventType: 'digital',
    eventLink: 'https://youtube.com/live/midweek-worship',
    isLive: true,
    creatorKey: 'Minister Joy Adebayo',
    churchName: null
  }
]

// ============================================================
// Seed Conversations (Session 26)
// ============================================================
// Each conversation has two user keys and an array of messages.
// Messages are in chronological order. senderKey = which user sent it.
// These get turned into conversations + conversation_participants + messages rows.

export const SEED_CONVERSATIONS = [
  // --- Jordan Rivera's conversations ---
  {
    user1: 'seeker',       // Jordan
    user2: 'Grace Okafor',
    messages: [
      { senderKey: 'seeker', text: 'Hi Grace! I saw your profile and noticed you lead Bible studies. I have been wanting to get deeper into scripture.' },
      { senderKey: 'Grace Okafor', text: 'Hey Jordan! Welcome! I would love to help. Are you currently in a reading plan or just exploring on your own?' },
      { senderKey: 'seeker', text: 'Mostly on my own right now. I started the Gospel of John plan on the app but I have a lot of questions as I go.' },
      { senderKey: 'Grace Okafor', text: 'That is actually a great place to start. John really focuses on who Jesus is. What chapters are you on?' },
      { senderKey: 'seeker', text: 'Just finished chapter 3. The conversation with Nicodemus is so interesting but also confusing at parts.' },
      { senderKey: 'Grace Okafor', text: 'Born again is one of those phrases everyone uses but few understand in context! Would you want to meet up sometime this week to talk through it?' },
      { senderKey: 'seeker', text: 'That would be amazing, thank you! I am free most evenings.' }
    ]
  },
  {
    user1: 'seeker',       // Jordan
    user2: 'Nathan Brooks',
    messages: [
      { senderKey: 'Nathan Brooks', text: 'Hey Jordan! I just moved to Chicago and saw we go to the same church area. Do you know anyone at Willow Creek?' },
      { senderKey: 'seeker', text: 'Welcome to Chicago! I do not attend Willow Creek myself but Pastor Mike on here is great. He has been my guide for a while now.' },
      { senderKey: 'Nathan Brooks', text: 'Nice, I have seen his profile. Chicago is a big change from where I came from. Trying to find my people you know?' },
      { senderKey: 'seeker', text: 'I totally get it. It took me a while too. Have you checked out the events on here? The prayer walk coming up is a good way to meet folks.' },
      { senderKey: 'Nathan Brooks', text: 'Just RSVPd! Thanks for the tip. We should grab coffee sometime.' },
      { senderKey: 'seeker', text: 'For sure! There is a great spot on Michigan Ave. Let me know when you are free.' }
    ]
  },
  {
    user1: 'seeker',       // Jordan
    user2: 'Sofia Ramirez',
    messages: [
      { senderKey: 'seeker', text: 'Hi Sofia! I noticed we are both Catholic. How long have you been on Sanctuary?' },
      { senderKey: 'Sofia Ramirez', text: 'Hey Jordan! Just a few weeks. I am in Miami and honestly was looking for more faith-based community beyond just Sunday mass.' },
      { senderKey: 'seeker', text: 'Same! I grew up going to mass but felt like I wanted something more personal. This app has been great for that.' },
      { senderKey: 'Sofia Ramirez', text: 'That is exactly how I feel. The prayer board has been so encouraging. I posted about my dad\'s surgery and the support was overwhelming.' },
      { senderKey: 'seeker', text: 'I saw that and prayed for him! How is he doing?' },
      { senderKey: 'Sofia Ramirez', text: 'Surgery is next week. We are nervous but trusting God. Thank you for praying, it really means a lot.' },
      { senderKey: 'seeker', text: 'Of course. Keep us posted. Your family is in my prayers.' }
    ]
  },
  {
    user1: 'seeker',       // Jordan
    user2: 'Sarah Johnson',
    messages: [
      { senderKey: 'Sarah Johnson', text: 'Hi Jordan! Pastor Mike mentioned you might be interested in the worship team. Is that true?' },
      { senderKey: 'seeker', text: 'He did? Ha, I mentioned I used to play guitar but I am super rusty. I have not played in a worship setting in years.' },
      { senderKey: 'Sarah Johnson', text: 'No pressure! We are very chill about it. A few of us meet on Thursdays to practice. You should come check it out.' },
      { senderKey: 'seeker', text: 'That actually sounds fun. I will dust off the guitar this weekend and see if my fingers still work lol.' },
      { senderKey: 'Sarah Johnson', text: 'Haha trust me, we have all been there. I will send you the details for Thursday.' }
    ]
  },

  // --- Pastor Mike's conversations ---
  {
    user1: 'guide',        // Pastor Mike
    user2: 'Pastor Thomas Wright',
    messages: [
      { senderKey: 'Pastor Thomas Wright', text: 'Hey Mike! Saw your profile on here. Always good to connect with fellow pastors. How long have you been at Willow Creek?' },
      { senderKey: 'guide', text: 'Thomas! Good to meet you brother. Going on 8 years now. I see you are out in Atlanta, how is ministry going down there?' },
      { senderKey: 'Pastor Thomas Wright', text: 'Blessed and busy. We just launched a marriage ministry that has been really impactful. Lots of couples coming in.' },
      { senderKey: 'guide', text: 'That is awesome. Marriage and family is so needed right now. I have been thinking about starting something similar here.' },
      { senderKey: 'Pastor Thomas Wright', text: 'Happy to share what we have learned. We made some mistakes early on but found a good rhythm. Maybe we can set up a call?' },
      { senderKey: 'guide', text: 'I would love that. Let me check my schedule and I will set up an appointment through the app.' },
      { senderKey: 'Pastor Thomas Wright', text: 'Sounds good! Also, your seeker Jordan seems really engaged. You are doing good work with him.' },
      { senderKey: 'guide', text: 'He is great. Really hungry to learn and grow. Those are the ones that keep you going in ministry.' }
    ]
  },
  {
    user1: 'guide',        // Pastor Mike
    user2: 'Pastor Daniel Reeves',
    messages: [
      { senderKey: 'guide', text: 'Daniel! Welcome to the app. How is Nashville treating you?' },
      { senderKey: 'Pastor Daniel Reeves', text: 'Mike! Nashville is wonderful. The music scene here really enriches our worship. How are things in Chicago?' },
      { senderKey: 'guide', text: 'Cold but the community is warm haha. I saw you specialize in discipleship. That is something I want to get better at structuring.' },
      { senderKey: 'Pastor Daniel Reeves', text: 'It is honestly my favorite part of ministry. One on one is where the real growth happens. Small groups are great but nothing beats personal investment.' },
      { senderKey: 'guide', text: 'Amen to that. I have been doing more one on one sessions through this app and it is been really rewarding.' }
    ]
  },
  {
    user1: 'guide',        // Pastor Mike
    user2: 'Marcus Davis',
    messages: [
      { senderKey: 'Marcus Davis', text: 'Pastor Mike! I coach youth basketball here in Chicago and I have been wanting to find a way to integrate faith into my coaching. Any advice?' },
      { senderKey: 'guide', text: 'Marcus, that is a great heart to have. Sports ministry is so powerful for reaching young people. What age group do you coach?' },
      { senderKey: 'Marcus Davis', text: 'High school, mostly 14 to 17. Some of these kids are dealing with a lot at home and basketball is their escape.' },
      { senderKey: 'guide', text: 'I hear you. You do not have to make it overtly religious. Just being a consistent, caring adult in their lives IS ministry. Maybe start with a team devotional before games?' },
      { senderKey: 'Marcus Davis', text: 'I like that idea. Short and simple, nothing forced. A couple of the kids have actually asked me about faith on their own.' },
      { senderKey: 'guide', text: 'That is the Holy Spirit at work brother. When they come to you, be ready. Would you want to set up a session to talk through some approaches?' },
      { senderKey: 'Marcus Davis', text: 'Absolutely. I will book something this week. Thank you Pastor Mike.' }
    ]
  },
  {
    user1: 'guide',        // Pastor Mike
    user2: 'Olivia Bennett',
    messages: [
      { senderKey: 'Olivia Bennett', text: 'Hi Pastor Mike! A friend recommended I connect with you. I am a nurse in Nashville and a mom of two, trying to find balance between work, family, and growing spiritually.' },
      { senderKey: 'guide', text: 'Hi Olivia! That sounds like a lot on your plate. First off, the fact that you are even thinking about spiritual growth while juggling all that says a lot about your heart.' },
      { senderKey: 'Olivia Bennett', text: 'Thank you, that means a lot. Some days I feel like I am failing at everything. I barely have time to read my Bible.' },
      { senderKey: 'guide', text: 'Grace, not guilt. God sees your faithfulness in the small moments. Even a five minute prayer during your lunch break counts. Have you tried the reading plans on the app?' },
      { senderKey: 'Olivia Bennett', text: 'I started the Psalms of Comfort one and it has been so good. Short enough that I can do it on my break.' },
      { senderKey: 'guide', text: 'Perfect! Psalms is like a spiritual first aid kit. Keep at it and do not be hard on yourself. God meets us where we are, not where we think we should be.' }
    ]
  },
  {
    user1: 'guide',        // Pastor Mike
    user2: 'Rachel Kim',
    messages: [
      { senderKey: 'Rachel Kim', text: 'Pastor Mike, I have a question. I have been attending a non-denominational church but grew up in a traditional Korean church. Sometimes I feel caught between two worlds.' },
      { senderKey: 'guide', text: 'That is actually more common than you think Rachel. A lot of people navigate between their cultural faith traditions and finding their own path. What feels different between the two?' },
      { senderKey: 'Rachel Kim', text: 'The Korean church was very structured and community focused. My current church is more relaxed but I miss the closeness.' },
      { senderKey: 'guide', text: 'You do not have to choose one or the other. You can honor your roots while exploring what speaks to your heart now. Have you tried connecting with others from similar backgrounds on here?' },
      { senderKey: 'Rachel Kim', text: 'Not yet, but that is a good idea. I will look into it. Thank you for listening.' }
    ]
  },
  {
    user1: 'guide',        // Pastor Mike
    user2: 'Aisha Williams',
    messages: [
      { senderKey: 'Aisha Williams', text: 'Good morning Pastor Mike! I wanted to ask about volunteering. I feel called to serve but I am not sure where to start.' },
      { senderKey: 'guide', text: 'Morning Aisha! I love that you are feeling that call. What are you passionate about? Sometimes our gifts point us to where we should serve.' },
      { senderKey: 'Aisha Williams', text: 'I love cooking and I have always wanted to do something with food, like a community meal program.' },
      { senderKey: 'guide', text: 'There is actually a food drive coming up at Holy Name Cathedral. And we do a monthly potluck at Willow Creek. Both could be great starting points!' },
      { senderKey: 'Aisha Williams', text: 'I saw the potluck event! I already RSVPd. Maybe I can help organize the food for it?' },
      { senderKey: 'guide', text: 'Absolutely, I will connect you with our events coordinator. Your gift of hospitality is going to bless a lot of people Aisha.' }
    ]
  },
  {
    user1: 'guide',        // Pastor Mike
    user2: 'Caleb Washington',
    messages: [
      { senderKey: 'Caleb Washington', text: 'Pastor Mike! I just got baptized last month and I am on fire for God but everyone keeps telling me it will fade. Is that true?' },
      { senderKey: 'guide', text: 'Caleb! Congratulations on your baptism! That excitement is real and it is a gift. Will it look different in 6 months? Maybe. But that does not mean it fades, it matures.' },
      { senderKey: 'Caleb Washington', text: 'That is encouraging. I just want to make sure I keep growing. I signed up for the Gospel of John reading plan.' },
      { senderKey: 'guide', text: 'Great choice. Here is my advice: surround yourself with people who challenge your faith. Stay in the Word daily even if it is just a few verses. And stay connected here. Community is everything.' },
      { senderKey: 'Caleb Washington', text: 'Will do. Thank you Pastor Mike. This app has been such a blessing.' }
    ]
  }
]
