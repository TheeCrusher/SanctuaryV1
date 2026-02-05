import { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { initDB, saveAppointment, saveAllAppointments, loadAllAppointments } from '../utils/database'

// ============================================================================
// CONTEXT SETUP
// ============================================================================

// Create the context - this is the "container" for our shared state
const AppContext = createContext(null)

// Custom hook to use our context (makes it easier to access from components)
export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}

// ============================================================================
// CONSTANTS & INITIAL DATA
// ============================================================================

const TEST_EMAIL = 'test@sanctuary.com'
const TEST_PASSWORD = 'Sanctuary123'

// Bible quotes for daily inspiration
const BIBLE_QUOTES = [
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
  { text: "Fear not, for I am with you; be not dismayed, for I am your God.", ref: "Isaiah 41:10" },
]

// Available people for starting new conversations
const AVAILABLE_PEOPLE = [
  { id: 101, name: "Sarah Johnson", avatar: "👩", role: "Seeker" },
  { id: 102, name: "Michael Chen", avatar: "👨", role: "Seeker" },
  { id: 103, name: "Emily Rodriguez", avatar: "👩‍🦱", role: "Seeker" },
  { id: 104, name: "James Wilson", avatar: "👨‍🦳", role: "Seeker" },
  { id: 105, name: "Grace Okafor", avatar: "👩", role: "Guide" }
]

// Sample churches data
const ALL_CHURCHES = [
  { id: 1, name: "Willow Creek Church", address: "67 E Wacker Dr", city: "Chicago", zip: "60601", sundaySchool: true, recommendedAges: "Ages 3–12", hours: "Sun 9:00 & 11:00 AM", ratings: { singing: 4.5, preaching: 5.0, openness: 4.0, space: 4.5 }, overallRating: 4.5, reviewCount: 88, rated: true },
  { id: 2, name: "Holy Name Cathedral", address: "1555 N State Pkwy", city: "Chicago", zip: "60610", sundaySchool: true, recommendedAges: "Ages 5–14", hours: "Sun 8:00 & 10:30 AM", ratings: { singing: 4.0, preaching: 4.5, openness: 4.5, space: 5.0 }, overallRating: 4.5, reviewCount: 142, rated: true },
  { id: 8, name: "Brooklyn Tabernacle", address: "11 Atlantic Ave", city: "Brooklyn", zip: "11217", sundaySchool: true, recommendedAges: "Ages 3–12", hours: "Sun 9:00 & 11:30 AM", ratings: { singing: 5.0, preaching: 5.0, openness: 4.5, space: 4.0 }, overallRating: 4.8, reviewCount: 445, rated: true },
  { id: 12, name: "Lakewood Church", address: "3700 Lake Mercer Dr", city: "Houston", zip: "77054", sundaySchool: true, recommendedAges: "Ages 3–16", hours: "Sun 8:45 & 10:45 AM", ratings: { singing: 5.0, preaching: 5.0, openness: 4.5, space: 5.0 }, overallRating: 4.8, reviewCount: 621, rated: true },
  { id: 35, name: "National Cathedral", address: "3001 Massachusetts Ave NW", city: "Washington", zip: "20016", sundaySchool: true, recommendedAges: "Ages 5–16", hours: "Sun 8:30 & 11:00 AM", ratings: { singing: 5.0, preaching: 5.0, openness: 4.5, space: 5.0 }, overallRating: 4.8, reviewCount: 267, rated: true }
]

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Get a consistent daily quote based on the date
function getDailyQuote() {
  const today = new Date()
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()
  return BIBLE_QUOTES[seed % BIBLE_QUOTES.length]
}

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

export function AppProvider({ children }) {
  // ----- USER STATE -----
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // ----- APPOINTMENTS STATE -----
  const [appointments, setAppointments] = useState([])

  // ----- CONVERSATIONS STATE -----
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)

  // ----- CHURCHES STATE -----
  const [churches] = useState(ALL_CHURCHES)
  const [churchSearchQuery, setChurchSearchQuery] = useState('')

  // ----- MODAL STATE -----
  const [modal, setModal] = useState(null)

  // =========================================================================
  // INITIALIZATION
  // =========================================================================

  useEffect(() => {
    async function initialize() {
      try {
        // Initialize the IndexedDB database
        await initDB()

        // Check if sample data needs to be loaded
        const hasInitialized = localStorage.getItem('sanctuarySampleDataLoaded')

        if (!hasInitialized) {
          // Load sample appointments for demo purposes
          const sampleAppointments = [
            {
              id: 1738465200000,
              name: "Ben Dover",
              avatar: "👤",
              date: "2026-02-05",
              time: "17:30",
              duration: "60",
              type: "Bible Study",
              notes: "Tell me about the burning bush",
              status: "confirmed"
            },
            {
              id: 1738638000000,
              name: "Phil Macrackin",
              avatar: "👤",
              date: "2026-02-07",
              time: "17:30",
              duration: "60",
              type: "Bible Study",
              notes: "Did Jesus really walk on water? Let's discuss",
              status: "pending"
            }
          ]

          await saveAllAppointments(sampleAppointments)
          localStorage.setItem('sanctuarySampleDataLoaded', 'true')
          setAppointments(sampleAppointments)
        } else {
          // Load existing appointments from IndexedDB
          const loadedAppointments = await loadAllAppointments()
          setAppointments(loadedAppointments)
        }
      } catch (error) {
        console.error('Failed to initialize:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initialize()
  }, [])

  // =========================================================================
  // AUTHENTICATION FUNCTIONS
  // =========================================================================

  function login(email, password) {
    if (email === TEST_EMAIL && password === TEST_PASSWORD) {
      const userData = {
        name: "Spiritual Guide",
        email: email,
        avatar: "🙏",
        photoUrl: null
      }
      setUser(userData)
      return { success: true }
    }
    return { success: false, error: "Invalid credentials. Try: test@sanctuary.com / Sanctuary123" }
  }

  function logout() {
    setUser(null)
    setSelectedConversation(null)
    setModal(null)
  }

  function updateUserPhoto(photoUrl) {
    if (user) {
      setUser({ ...user, photoUrl })
    }
  }

  // =========================================================================
  // APPOINTMENT FUNCTIONS
  // =========================================================================

  async function createAppointment(appointmentData) {
    const newAppointment = {
      id: Date.now(),
      avatar: "👤",
      status: "pending",
      ...appointmentData
    }

    const updatedAppointments = [...appointments, newAppointment]
    setAppointments(updatedAppointments)
    await saveAppointment(newAppointment)

    return newAppointment
  }

  async function confirmAppointment(id) {
    const updatedAppointments = appointments.map(apt =>
      apt.id === id && apt.status === "pending"
        ? { ...apt, status: "confirmed" }
        : apt
    )
    setAppointments(updatedAppointments)

    const apt = updatedAppointments.find(a => a.id === id)
    if (apt) await saveAppointment(apt)
  }

  async function completeAppointment(id) {
    const updatedAppointments = appointments.map(apt =>
      apt.id === id && apt.status !== "completed"
        ? { ...apt, status: "completed" }
        : apt
    )
    setAppointments(updatedAppointments)

    const apt = updatedAppointments.find(a => a.id === id)
    if (apt) await saveAppointment(apt)
  }

  // Computed values for appointments
  const upcomingCount = appointments.filter(a => a.status !== "completed").length
  const completedCount = appointments.filter(a => a.status === "completed").length
  const uniqueSeekersCount = [...new Set(appointments.map(a => a.name))].length

  // =========================================================================
  // CONVERSATION FUNCTIONS
  // =========================================================================

  function startNewConversation(personId) {
    const person = AVAILABLE_PEOPLE.find(p => p.id === personId)
    if (!person) return null

    // Check if conversation already exists
    let conv = conversations.find(c => c.personId === person.id)

    if (!conv) {
      conv = {
        id: Date.now(),
        personId: person.id,
        name: person.name,
        avatar: person.avatar,
        last: "Tap to start a conversation",
        time: "Now",
        unread: 0,
        msgs: []
      }
      setConversations([...conversations, conv])
    }

    setSelectedConversation(conv)
    return conv
  }

  function selectConversation(id) {
    const conv = conversations.find(c => c.id === id)
    if (conv) {
      setSelectedConversation(conv)
      return conv
    }
    return null
  }

  function sendMessage(text) {
    if (!text.trim() || !selectedConversation) return

    const newMessage = {
      id: Date.now(),
      sender: "You",
      text: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      own: true
    }

    const updatedConv = {
      ...selectedConversation,
      msgs: [...selectedConversation.msgs, newMessage],
      last: text.trim(),
      time: "Just now"
    }

    setConversations(conversations.map(c =>
      c.id === selectedConversation.id ? updatedConv : c
    ))
    setSelectedConversation(updatedConv)
  }

  // =========================================================================
  // CHURCH SEARCH
  // =========================================================================

  const filteredChurches = churchSearchQuery
    ? churches.filter(c =>
        c.city.toLowerCase().includes(churchSearchQuery.toLowerCase()) ||
        c.zip.includes(churchSearchQuery)
      )
    : churches

  // =========================================================================
  // CONTEXT VALUE
  // =========================================================================

  const value = {
    // User
    user,
    isLoading,
    login,
    logout,
    updateUserPhoto,

    // Appointments
    appointments,
    createAppointment,
    confirmAppointment,
    completeAppointment,
    upcomingCount,
    completedCount,
    uniqueSeekersCount,

    // Conversations
    conversations,
    selectedConversation,
    availablePeople: AVAILABLE_PEOPLE,
    startNewConversation,
    selectConversation,
    sendMessage,
    setSelectedConversation,

    // Churches
    churches: filteredChurches,
    allChurches: ALL_CHURCHES,
    churchSearchQuery,
    setChurchSearchQuery,

    // Modal
    modal,
    setModal,

    // Utils
    getDailyQuote
  }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}

export default AppContext
