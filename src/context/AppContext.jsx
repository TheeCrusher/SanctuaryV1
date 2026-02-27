import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { api, getToken, setToken, removeToken, getChurchToken, setChurchToken, removeChurchToken, churchApi } from '../utils/api'
import { connectSocket, disconnectSocket, getSocket } from '../utils/socket'

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
  const [availablePeople, setAvailablePeople] = useState([])

  // ----- CHURCHES STATE -----
  const [churches, setChurches] = useState([])
  const [churchSearchQuery, setChurchSearchQuery] = useState('')

  // ----- DAILY QUOTE STATE -----
  const [dailyQuote, setDailyQuote] = useState({ text: '', ref: '' })

  // ----- NOTES STATE -----
  const [notes, setNotes] = useState([])

  // ----- CHURCH FAVORITES STATE -----
  const [favoriteChurchIds, setFavoriteChurchIds] = useState(new Set())

  // ----- SCRIPTURE STATE -----
  const [scriptureDailyVerse, setScriptureDailyVerse] = useState(null)
  const [scriptureVerses, setScriptureVerses] = useState([])
  const [scriptureBookmarkIds, setScriptureBookmarkIds] = useState(new Set())
  const [readingPlans, setReadingPlans] = useState([])
  const [memorizationStats, setMemorizationStats] = useState({ streak: { current: 0, longest: 0 }, verseStats: [] })

  // ----- BIBLE READER STATE -----
  const [bibleHighlights, setBibleHighlights] = useState([])
  const [bibleBookmarks, setBibleBookmarks] = useState([])

  // ----- MODAL STATE -----
  const [modal, setModal] = useState(null)

  // ----- USER ACTION MENU STATE -----
  // { userId, userName, photoUrl, avatar, showMessage } or null
  const [userActionMenu, setUserActionMenu] = useState(null)

  function showUserActionMenu({ userId, userName, photoUrl, avatar, showMessage = true }) {
    setUserActionMenu({ userId, userName, photoUrl, avatar, showMessage })
  }

  function hideUserActionMenu() {
    setUserActionMenu(null)
  }

  // ----- CHURCH ACCOUNT STATE -----
  const [churchAccount, setChurchAccount] = useState(null)

  // ----- NOTIFICATIONS STATE -----
  const [notifications, setNotifications] = useState([])
  const [unreadNotifCount, setUnreadNotifCount] = useState(0)

  // ----- REAL-TIME STATE -----
  const [onlineUsers, setOnlineUsers] = useState(new Set())
  const [typingUsers, setTypingUsers] = useState({}) // { conversationId: [{ userId, userName }] }
  const selectedConvRef = useRef(null)

  // Keep ref in sync with state so socket callbacks can read latest value
  useEffect(() => {
    selectedConvRef.current = selectedConversation
  }, [selectedConversation])

  // =========================================================================
  // SOCKET EVENT LISTENERS
  // =========================================================================

  function setupSocketListeners(socket) {
    socket.on('online_users', ({ userIds }) => {
      setOnlineUsers(new Set(userIds))
    })

    socket.on('user_online', ({ userId }) => {
      setOnlineUsers(prev => new Set([...prev, userId]))
    })

    socket.on('user_offline', ({ userId }) => {
      setOnlineUsers(prev => {
        const next = new Set(prev)
        next.delete(userId)
        return next
      })
    })

    socket.on('new_message', ({ conversationId, message }) => {
      // If we're currently viewing this conversation, add the message
      const currentConv = selectedConvRef.current
      if (currentConv && currentConv.id === conversationId) {
        setSelectedConversation(prev => {
          if (!prev || prev.id !== conversationId) return prev
          return { ...prev, msgs: [...prev.msgs, message] }
        })
      }

      // Update conversations list (last message preview)
      setConversations(prev => prev.map(c =>
        c.id === conversationId
          ? { ...c, last: message.text, time: 'Just now', unread: currentConv?.id === conversationId ? 0 : (c.unread || 0) + 1 }
          : c
      ))
    })

    socket.on('user_typing', ({ conversationId, userId, userName }) => {
      setTypingUsers(prev => {
        const current = prev[conversationId] || []
        if (current.find(t => t.userId === userId)) return prev
        return { ...prev, [conversationId]: [...current, { userId, userName }] }
      })
    })

    socket.on('user_stop_typing', ({ conversationId, userId }) => {
      setTypingUsers(prev => {
        const current = prev[conversationId] || []
        return { ...prev, [conversationId]: current.filter(t => t.userId !== userId) }
      })
    })

    // Real-time notification badge update
    socket.on('new_notification', ({ notification, unreadCount }) => {
      setNotifications(prev => [notification, ...prev])
      setUnreadNotifCount(unreadCount)
    })
  }

  // =========================================================================
  // LOAD ALL DATA (called after login or session restore)
  // =========================================================================
  // Fetches all 5 data types in parallel using Promise.all.
  // This is much faster than fetching one at a time because
  // all requests happen simultaneously.

  async function loadAllData(userObj) {
    try {
      // Build church query params from user's location
      const churchParams = new URLSearchParams()
      if (userObj?.state) {
        churchParams.set('state', userObj.state)
      }
      if (userObj?.city) {
        churchParams.set('city', userObj.city)
      }
      if (userObj?.preferredChurchId) {
        churchParams.set('preferredChurchId', userObj.preferredChurchId)
      }
      const churchQuery = churchParams.toString()
      const churchUrl = `/churches${churchQuery ? '?' + churchQuery : ''}`

      const [
        appointmentsRes,
        conversationsRes,
        churchesRes,
        quoteRes,
        peopleRes,
        notesRes,
        favoritesRes,
        dailyVerseRes,
        versesRes,
        verseBookmarksRes,
        plansRes,
        bibleHighlightsRes,
        bibleBookmarksRes,
        unreadCountRes,
        memoStatsRes
      ] = await Promise.all([
        api.get('/appointments'),
        api.get('/conversations'),
        api.get(churchUrl),
        api.get('/quotes/daily'),
        api.get('/users/available'),
        api.get('/notes'),
        api.get('/favorites'),
        api.get('/scripture/daily'),
        api.get('/scripture/verses'),
        api.get('/scripture/bookmarks'),
        api.get('/scripture/plans'),
        api.get('/bible/highlights'),
        api.get('/bible/bookmarks'),
        api.get('/notifications/unread-count'),
        api.get('/scripture/memorization/stats')
      ])

      setAppointments(appointmentsRes.appointments)
      setConversations(conversationsRes.conversations)

      // Handle preferred church — prepend if not already in the list
      let churchList = churchesRes.churches
      if (churchesRes.preferred) {
        const prefId = churchesRes.preferred.id
        if (!churchList.find(c => c.id === prefId)) {
          churchList = [churchesRes.preferred, ...churchList]
        }
      }
      setChurches(churchList)

      setDailyQuote(quoteRes.quote)
      setAvailablePeople(peopleRes.people)
      setNotes(notesRes.notes)
      setFavoriteChurchIds(new Set(favoritesRes.favoriteIds))
      setScriptureDailyVerse(dailyVerseRes.verse)
      setScriptureVerses(versesRes.verses)
      setScriptureBookmarkIds(new Set(verseBookmarksRes.bookmarkIds))
      setReadingPlans(plansRes.plans)
      setBibleHighlights(bibleHighlightsRes.highlights)
      setBibleBookmarks(bibleBookmarksRes.bookmarks)
      setUnreadNotifCount(unreadCountRes.count)
      setMemorizationStats(memoStatsRes)
    } catch (error) {
      // ignore — individual screens handle their own error states
    }
  }

  // =========================================================================
  // INITIALIZATION (runs once when the app starts)
  // =========================================================================
  // Checks if the user has a saved JWT token in localStorage.
  // If yes, restores their session by fetching their profile.
  // If no (or token is expired), shows the login screen.

  useEffect(() => {
    async function initialize() {
      const token = getToken()

      if (!token) {
        // No saved token = not logged in
        setIsLoading(false)
        return
      }

      try {
        // Try to restore the session using the saved token
        const { user: userData } = await api.get('/users/me')
        setUser(userData)

        // Session restored! Now load all the user's data
        await loadAllData(userData)

        // Connect WebSocket for real-time messaging
        const sock = connectSocket()
        if (sock) setupSocketListeners(sock)
      } catch (error) {
        // Token is invalid or expired -- clear it
        removeToken()
      }

      // Check for church session (separate from user session)
      const cToken = getChurchToken()
      if (cToken) {
        try {
          const { churchAccount: acct } = await churchApi.get('/church-auth/me')
          setChurchAccount(acct)
        } catch {
          removeChurchToken()
        }
      }

      setIsLoading(false)
    }

    initialize()
  }, [])

  // =========================================================================
  // AUTHENTICATION FUNCTIONS
  // =========================================================================

  async function register(name, email, password, role, phoneNumber) {
    try {
      const data = await api.post('/auth/register', { name, email, password, role, phoneNumber })
      setToken(data.token)
      setUser(data.user)
      await loadAllData(data.user)
      const sock = connectSocket()
      if (sock) setupSocketListeners(sock)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  async function login(email, password) {
    try {
      // Call the login API endpoint
      const data = await api.post('/auth/login', { email, password })

      // Save the JWT token so the user stays logged in across refreshes
      setToken(data.token)

      // Set the user in state
      setUser(data.user)

      // Load all the user's data (appointments, churches, etc.)
      await loadAllData(data.user)

      // Connect WebSocket for real-time messaging
      const sock = connectSocket()
      if (sock) setupSocketListeners(sock)

      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  function logout() {
    // Disconnect WebSocket
    disconnectSocket()

    // Remove the JWT token from localStorage
    removeToken()

    // Clear all state so nothing from the old session lingers
    setUser(null)
    setAppointments([])
    setConversations([])
    setSelectedConversation(null)
    setAvailablePeople([])
    setChurches([])
    setDailyQuote({ text: '', ref: '' })
    setChurchSearchQuery('')
    setModal(null)
    setNotes([])
    setFavoriteChurchIds(new Set())
    setScriptureDailyVerse(null)
    setScriptureVerses([])
    setScriptureBookmarkIds(new Set())
    setReadingPlans([])
    setOnlineUsers(new Set())
    setTypingUsers({})
    setNotifications([])
    setUnreadNotifCount(0)
  }

  // =========================================================================
  // CHURCH ACCOUNT AUTHENTICATION
  // =========================================================================

  async function churchLogin(email, password) {
    try {
      const data = await churchApi.post('/church-auth/login', { email, password })
      setChurchToken(data.token)
      setChurchAccount(data.churchAccount)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  function churchLogout() {
    removeChurchToken()
    setChurchAccount(null)
  }

  async function updateUserPhoto(photoUrl) {
    try {
      const { user: updatedUser } = await api.put('/users/me', { photoUrl })
      setUser(updatedUser)
    } catch (error) {
      // ignore
    }
  }

  async function updateProfile(data) {
    try {
      const { user: updatedUser } = await api.put('/users/me', data)
      setUser(updatedUser)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // =========================================================================
  // APPOINTMENT FUNCTIONS
  // =========================================================================

  async function createAppointment(appointmentData) {
    try {
      const { appointments: newApts } = await api.post('/appointments', appointmentData)
      setAppointments(prev => [...prev, ...newApts])
      return newApts
    } catch (error) {
      throw error
    }
  }

  async function confirmAppointment(id) {
    try {
      const { appointment } = await api.patch(`/appointments/${id}/status`, { status: 'confirmed' })
      setAppointments(prev => prev.map(apt => apt.id === id ? appointment : apt))
    } catch (error) {
      throw error
    }
  }

  async function declineAppointment(id) {
    try {
      const { appointment } = await api.patch(`/appointments/${id}/status`, { status: 'declined' })
      setAppointments(prev => prev.map(apt => apt.id === id ? appointment : apt))
    } catch (error) {
      throw error
    }
  }

  async function completeAppointment(id) {
    try {
      const { appointment } = await api.patch(`/appointments/${id}/status`, { status: 'completed' })
      setAppointments(prev => prev.map(apt => apt.id === id ? appointment : apt))
      return appointment
    } catch (error) {
      // ignore
    }
  }

  async function cancelAppointment(id) {
    try {
      await api.delete(`/appointments/${id}`)
      setAppointments(prev => prev.filter(apt => apt.id !== id))
    } catch (error) {
      // ignore
    }
  }

  async function cancelSeries(seriesId) {
    try {
      const { appointments: cancelled } = await api.delete(`/appointments/series/${seriesId}`)
      const cancelledIds = new Set(cancelled.map(a => a.id))
      setAppointments(prev => prev.filter(apt => !cancelledIds.has(apt.id)))
    } catch (error) {
      // ignore
    }
  }

  // Computed values for appointments (same logic as before)
  const upcomingCount = appointments.filter(a => a.status !== "completed" && a.status !== "declined").length
  const completedCount = appointments.filter(a => a.status === "completed").length

  // =========================================================================
  // CONVERSATION FUNCTIONS
  // =========================================================================

  async function startNewConversation(personId) {
    try {
      const { conversation } = await api.post('/conversations', { personId })

      // Set as selected conversation immediately
      const convWithMsgs = { ...conversation, msgs: [] }
      setSelectedConversation(convWithMsgs)

      // Add to conversations list if it's new
      setConversations(prev => {
        const exists = prev.find(c => c.id === conversation.id)
        if (exists) return prev
        return [...prev, conversation]
      })

      // Load any existing messages
      try {
        const { messages } = await api.get(`/conversations/${conversation.id}/messages`)
        setSelectedConversation(prev =>
          prev && prev.id === conversation.id ? { ...prev, msgs: messages } : prev
        )
      } catch (err) {
        // ignore
      }

      return convWithMsgs
    } catch (error) {
      return null
    }
  }

  async function selectConversation(id) {
    const conv = conversations.find(c => c.id === id)
    if (!conv) return null

    // Set selected immediately so Chat screen can render
    setSelectedConversation({ ...conv, msgs: [] })

    try {
      // Fetch messages from the API
      const { messages } = await api.get(`/conversations/${id}/messages`)
      const convWithMsgs = { ...conv, msgs: messages }
      setSelectedConversation(convWithMsgs)

      // Clear unread count in the conversations list
      setConversations(prev => prev.map(c =>
        c.id === id ? { ...c, unread: 0 } : c
      ))

      return convWithMsgs
    } catch (error) {
      return conv
    }
  }

  async function sendMessage(text) {
    if (!text.trim() || !selectedConversation) return

    try {
      const { message } = await api.post(
        `/conversations/${selectedConversation.id}/messages`,
        { text: text.trim() }
      )

      // Add the new message to the selected conversation
      const updatedConv = {
        ...selectedConversation,
        msgs: [...selectedConversation.msgs, message],
        last: text.trim(),
        time: "Just now"
      }

      setSelectedConversation(updatedConv)

      // Update the conversations list (last message preview)
      setConversations(prev => prev.map(c =>
        c.id === selectedConversation.id
          ? { ...c, last: text.trim(), time: "Just now" }
          : c
      ))

      // Broadcast via socket for real-time delivery
      const socket = getSocket()
      if (socket) {
        socket.emit('send_message', {
          conversationId: selectedConversation.id,
          message
        })
        // Stop typing indicator
        socket.emit('typing_stop', { conversationId: selectedConversation.id })
      }
    } catch (error) {
      // ignore
    }
  }

  // Typing indicator helpers
  function emitTypingStart(conversationId) {
    const socket = getSocket()
    if (socket) socket.emit('typing_start', { conversationId })
  }

  function emitTypingStop(conversationId) {
    const socket = getSocket()
    if (socket) socket.emit('typing_stop', { conversationId })
  }

  // Join/leave conversation room for real-time
  function joinConversationRoom(conversationId) {
    const socket = getSocket()
    if (socket) socket.emit('join_conversation', { conversationId })
  }

  function leaveConversationRoom(conversationId) {
    const socket = getSocket()
    if (socket) socket.emit('leave_conversation', { conversationId })
  }

  // =========================================================================
  // CHURCH SEARCH (server-side with pagination)
  // =========================================================================
  // Church search is powered by Google Places API.
  // The backend searches Google, checks our local DB for each result,
  // and returns merged data (Google info + Sanctuary ratings if available).

  const [churchSearchResults, setChurchSearchResults] = useState([])

  async function searchChurches(query) {
    if (!query.trim()) {
      setChurchSearchResults([])
      return
    }
    const data = await api.get(`/churches/search?q=${encodeURIComponent(query)}`)
    setChurchSearchResults(data.results)
  }

  // Reload churches based on user's current location.
  // Called after the user updates their state/city in Account Details.
  async function reloadChurches(userObj) {
    const params = new URLSearchParams()
    if (userObj?.state) params.set('state', userObj.state)
    if (userObj?.city) params.set('city', userObj.city)
    if (userObj?.preferredChurchId) params.set('preferredChurchId', userObj.preferredChurchId)
    const query = params.toString()
    const res = await api.get(`/churches${query ? '?' + query : ''}`)
    let churchList = res.churches
    if (res.preferred) {
      const prefId = res.preferred.id
      if (!churchList.find(c => c.id === prefId)) {
        churchList = [res.preferred, ...churchList]
      }
    }
    setChurches(churchList)
  }

  // Save a church from Google search results to our database.
  // Called when a user taps a church that isn't in Sanctuary yet.
  // Returns the new church object with its Sanctuary ID.
  async function saveChurchFromGoogle(churchData) {
    const data = await api.post('/churches/save-from-google', churchData)
    return data.church
  }

  // Keep the old filtered list for backwards compatibility (favorites filter, etc.)
  const filteredChurches = churchSearchQuery
    ? churches.filter(c =>
        c.city.toLowerCase().includes(churchSearchQuery.toLowerCase()) ||
        c.zip.includes(churchSearchQuery)
      )
    : churches

  // =========================================================================
  // NOTES FUNCTIONS
  // =========================================================================

  async function createNote(noteData) {
    const { note } = await api.post('/notes', noteData)
    setNotes(prev => [note, ...prev])
    return note
  }

  async function updateNote(id, noteData) {
    const { note } = await api.put(`/notes/${id}`, noteData)
    setNotes(prev => prev.map(n => n.id === id ? note : n))
    return note
  }

  async function deleteNote(id) {
    await api.delete(`/notes/${id}`)
    setNotes(prev => prev.filter(n => n.id !== id))
  }

  // =========================================================================
  // CHURCH FAVORITES FUNCTIONS
  // =========================================================================

  async function toggleFavoriteChurch(churchId) {
    const isFav = favoriteChurchIds.has(churchId)
    // Optimistic update — change UI immediately, revert if API fails
    setFavoriteChurchIds(prev => {
      const next = new Set(prev)
      if (isFav) next.delete(churchId)
      else next.add(churchId)
      return next
    })
    try {
      if (isFav) {
        await api.delete(`/favorites/${churchId}`)
      } else {
        await api.post(`/favorites/${churchId}`)
      }
    } catch (error) {
      // Revert on failure
      setFavoriteChurchIds(prev => {
        const next = new Set(prev)
        if (isFav) next.add(churchId)
        else next.delete(churchId)
        return next
      })
    }
  }

  function isChurchFavorited(churchId) {
    return favoriteChurchIds.has(churchId)
  }

  // =========================================================================
  // SCRIPTURE FUNCTIONS
  // =========================================================================

  async function toggleVerseBookmark(verseId) {
    const isBookmarked = scriptureBookmarkIds.has(verseId)
    setScriptureBookmarkIds(prev => {
      const next = new Set(prev)
      if (isBookmarked) next.delete(verseId)
      else next.add(verseId)
      return next
    })
    try {
      if (isBookmarked) await api.delete(`/scripture/bookmarks/${verseId}`)
      else await api.post(`/scripture/bookmarks/${verseId}`)
    } catch (error) {
      setScriptureBookmarkIds(prev => {
        const next = new Set(prev)
        if (isBookmarked) next.add(verseId)
        else next.delete(verseId)
        return next
      })
    }
  }

  async function getRandomVerse() {
    const { verse } = await api.get('/scripture/verses/random')
    return verse
  }

  async function getReadingPlanDetail(planId) {
    const { plan } = await api.get(`/scripture/plans/${planId}`)
    return plan
  }

  async function getReadingProgress(planId) {
    const { progress } = await api.get(`/scripture/plans/${planId}/progress`)
    return progress
  }

  async function markDayComplete(planId, dayNumber) {
    const { progress } = await api.post(`/scripture/plans/${planId}/progress`, { dayNumber })
    return progress
  }

  async function createCustomPlan(name, category, duration) {
    const { plan } = await api.post('/scripture/plans/custom', { name, category, duration })
    setReadingPlans(prev => [plan, ...prev])
    return plan
  }

  async function createSurprisePlan(duration = 7) {
    const { plan } = await api.post('/scripture/plans/surprise', { duration })
    setReadingPlans(prev => [plan, ...prev])
    return plan
  }

  async function deleteCustomPlan(planId) {
    await api.delete(`/scripture/plans/${planId}`)
    setReadingPlans(prev => prev.filter(p => p.id !== planId))
  }

  async function recordGameRound(verseId, mode, correct) {
    const data = await api.post('/scripture/memorization/record', { verseId, mode, correct })
    setMemorizationStats(prev => ({ ...prev, streak: data.streak }))
    return data
  }

  // =========================================================================
  // BIBLE HIGHLIGHTS & BOOKMARKS
  // =========================================================================

  async function addBibleHighlight(book, chapter, verse, color = 'yellow') {
    const { highlight } = await api.post('/bible/highlights', { book, chapter, verse, color })
    // Replace if exists (same verse), otherwise add
    setBibleHighlights(prev => {
      const filtered = prev.filter(h => !(h.book === book && h.chapter === chapter && h.verse === verse))
      return [highlight, ...filtered]
    })
    return highlight
  }

  async function removeBibleHighlight(id) {
    await api.delete(`/bible/highlights/${id}`)
    setBibleHighlights(prev => prev.filter(h => h.id !== id))
  }

  async function updateBibleHighlight(id, color) {
    const { highlight } = await api.put(`/bible/highlights/${id}`, { color })
    setBibleHighlights(prev => prev.map(h => h.id === id ? highlight : h))
    return highlight
  }

  async function addBibleBookmark(book, chapter, verse = null, note = '') {
    const { bookmark } = await api.post('/bible/bookmarks', { book, chapter, verse, note })
    // Replace if exists (same location), otherwise add
    setBibleBookmarks(prev => {
      const filtered = prev.filter(b => !(b.book === book && b.chapter === chapter && b.verse === verse))
      return [bookmark, ...filtered]
    })
    return bookmark
  }

  async function removeBibleBookmark(id) {
    await api.delete(`/bible/bookmarks/${id}`)
    setBibleBookmarks(prev => prev.filter(b => b.id !== id))
  }

  // =========================================================================
  // NOTIFICATION FUNCTIONS
  // =========================================================================

  async function fetchNotifications() {
    try {
      const data = await api.get('/notifications')
      setNotifications(data.notifications)
      setUnreadNotifCount(data.unreadCount)
    } catch (error) {
      // ignore
    }
  }

  async function markNotificationRead(id) {
    try {
      await api.patch(`/notifications/${id}/read`)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
      setUnreadNotifCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      // ignore
    }
  }

  async function markAllNotificationsRead() {
    try {
      await api.patch('/notifications/read-all')
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadNotifCount(0)
    } catch (error) {
      // ignore
    }
  }

  async function deleteNotification(id) {
    try {
      const removed = notifications.find(n => n.id === id)
      await api.delete(`/notifications/${id}`)
      setNotifications(prev => prev.filter(n => n.id !== id))
      if (removed && !removed.isRead) {
        setUnreadNotifCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      // ignore
    }
  }

  // =========================================================================
  // CONTEXT VALUE
  // =========================================================================
  // This is what every screen gets when it calls useApp().
  // The interface is identical to before -- screens don't know
  // the data now comes from an API instead of hardcoded arrays.

  const value = {
    // User
    user,
    isLoading,
    register,
    login,
    logout,
    updateUserPhoto,
    updateProfile,

    // Appointments
    appointments,
    createAppointment,
    confirmAppointment,
    declineAppointment,
    completeAppointment,
    cancelAppointment,
    cancelSeries,
    upcomingCount,
    completedCount,

    // Conversations
    conversations,
    selectedConversation,
    availablePeople,
    startNewConversation,
    selectConversation,
    sendMessage,
    setSelectedConversation,

    // Real-time
    onlineUsers,
    typingUsers,
    emitTypingStart,
    emitTypingStop,
    joinConversationRoom,
    leaveConversationRoom,

    // Churches
    churches: filteredChurches,
    allChurches: churches,
    churchSearchQuery,
    setChurchSearchQuery,
    searchChurches,
    saveChurchFromGoogle,
    churchSearchResults,
    reloadChurches,

    // Notes
    notes,
    createNote,
    updateNote,
    deleteNote,

    // Church Favorites
    favoriteChurchIds,
    toggleFavoriteChurch,
    isChurchFavorited,

    // Scripture
    scriptureDailyVerse,
    scriptureVerses,
    scriptureBookmarkIds,
    readingPlans,
    toggleVerseBookmark,
    getRandomVerse,
    getReadingPlanDetail,
    getReadingProgress,
    markDayComplete,
    createCustomPlan,
    createSurprisePlan,
    deleteCustomPlan,
    memorizationStats,
    recordGameRound,

    // Bible Reader
    bibleHighlights,
    bibleBookmarks,
    addBibleHighlight,
    removeBibleHighlight,
    updateBibleHighlight,
    addBibleBookmark,
    removeBibleBookmark,

    // Modal
    modal,
    setModal,

    // User Action Menu
    userActionMenu,
    showUserActionMenu,
    hideUserActionMenu,

    // Notifications
    notifications,
    unreadNotifCount,
    fetchNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,

    // Church Account
    churchAccount,
    churchLogin,
    churchLogout,

    // Utils
    getDailyQuote: () => dailyQuote
  }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}

export default AppContext
