import { createContext, useContext, useEffect } from 'react'
import { api, getToken, setToken, removeToken, getChurchToken, removeChurchToken, churchApi } from '../utils/api'
import { connectSocket, disconnectSocket } from '../utils/socket'

import { useAuthSlice } from './slices/useAuthSlice'
import { useAppointmentSlice } from './slices/useAppointmentSlice'
import { useConversationSlice } from './slices/useConversationSlice'
import { useChurchSlice } from './slices/useChurchSlice'
import { useScriptureSlice } from './slices/useScriptureSlice'
import { useNotificationSlice } from './slices/useNotificationSlice'
import { useUISlice } from './slices/useUISlice'

// ============================================================================
// CONTEXT SETUP
// ============================================================================

const AppContext = createContext(null)

// Custom hook — imported by every screen. The interface is identical to before.
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
  // Each slice hook owns its own state and domain-specific functions.
  // AppContext only owns the cross-slice operations below.
  const auth = useAuthSlice()
  const appointments = useAppointmentSlice()
  const conversations = useConversationSlice()
  const churches = useChurchSlice()
  const scripture = useScriptureSlice()
  const notifications = useNotificationSlice()
  const ui = useUISlice()

  // =========================================================================
  // SOCKET EVENT LISTENERS
  // =========================================================================
  // This lives here (not in useConversationSlice) because it touches both
  // conversation state AND notification state — two separate slices.

  function setupSocketListeners(socket) {
    socket.on('online_users', ({ userIds }) => {
      conversations.setOnlineUsers(new Set(userIds))
    })

    socket.on('user_online', ({ userId }) => {
      conversations.setOnlineUsers(prev => new Set([...prev, userId]))
    })

    socket.on('user_offline', ({ userId }) => {
      conversations.setOnlineUsers(prev => {
        const next = new Set(prev)
        next.delete(userId)
        return next
      })
    })

    socket.on('new_message', ({ conversationId, message }) => {
      // If we're in this conversation, append the message immediately
      const currentConv = conversations.selectedConvRef.current
      if (currentConv && currentConv.id === conversationId) {
        conversations.setSelectedConversation(prev => {
          if (!prev || prev.id !== conversationId) return prev
          return { ...prev, msgs: [...prev.msgs, message] }
        })
      }

      // Update the conversation list preview (last message + unread count)
      conversations.setConversations(prev => prev.map(c =>
        c.id === conversationId
          ? {
              ...c,
              last: message.text,
              time: 'Just now',
              unread: currentConv?.id === conversationId ? 0 : (c.unread || 0) + 1
            }
          : c
      ))
    })

    socket.on('user_typing', ({ conversationId, userId, userName }) => {
      conversations.setTypingUsers(prev => {
        const current = prev[conversationId] || []
        if (current.find(t => t.userId === userId)) return prev
        return { ...prev, [conversationId]: [...current, { userId, userName }] }
      })
    })

    socket.on('user_stop_typing', ({ conversationId, userId }) => {
      conversations.setTypingUsers(prev => {
        const current = prev[conversationId] || []
        return { ...prev, [conversationId]: current.filter(t => t.userId !== userId) }
      })
    })

    socket.on('new_notification', ({ notification, unreadCount }) => {
      notifications.setNotifications(prev => [notification, ...prev])
      notifications.setUnreadNotifCount(unreadCount)
    })
  }

  // =========================================================================
  // LOAD ALL DATA
  // =========================================================================
  // Called after login or session restore. Fetches all domains in parallel.
  // Lives here because it writes to every slice — it's the one function that
  // truly belongs to the "whole app" rather than any single domain.

  async function loadAllData(userObj) {
    try {
      const churchParams = new URLSearchParams()
      if (userObj?.state) churchParams.set('state', userObj.state)
      if (userObj?.city) churchParams.set('city', userObj.city)
      if (userObj?.preferredChurchId) churchParams.set('preferredChurchId', userObj.preferredChurchId)
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

      appointments.setAppointments(appointmentsRes.appointments)
      conversations.setConversations(conversationsRes.conversations)
      conversations.setAvailablePeople(peopleRes.people)

      // Preferred church — prepend to list if not already present
      let churchList = churchesRes.churches
      if (churchesRes.preferred) {
        const prefId = churchesRes.preferred.id
        if (!churchList.find(c => c.id === prefId)) {
          churchList = [churchesRes.preferred, ...churchList]
        }
      }
      churches.setChurches(churchList)
      churches.setFavoriteChurchIds(new Set(favoritesRes.favoriteIds))

      ui.setDailyQuote(quoteRes.quote)
      ui.setNotes(notesRes.notes)

      scripture.setScriptureDailyVerse(dailyVerseRes.verse)
      scripture.setScriptureVerses(versesRes.verses)
      scripture.setScriptureBookmarkIds(new Set(verseBookmarksRes.bookmarkIds))
      scripture.setReadingPlans(plansRes.plans)
      scripture.setBibleHighlights(bibleHighlightsRes.highlights)
      scripture.setBibleBookmarks(bibleBookmarksRes.bookmarks)
      scripture.setMemorizationStats(memoStatsRes)

      notifications.setUnreadNotifCount(unreadCountRes.count)
    } catch (error) {
      // ignore — individual screens handle their own error states
    }
  }

  // =========================================================================
  // INITIALIZATION
  // =========================================================================
  // Runs once on app boot. Checks localStorage for a saved JWT.
  // If found, restores the session and loads all data.

  useEffect(() => {
    async function initialize() {
      const token = getToken()

      if (!token) {
        auth.setIsLoading(false)
        return
      }

      try {
        const { user: userData } = await api.get('/users/me')
        auth.setUser(userData)
        await loadAllData(userData)
        const sock = connectSocket()
        if (sock) setupSocketListeners(sock)
      } catch (error) {
        removeToken()
      }

      // Church session is separate — a user and a church can both be "logged in"
      const cToken = getChurchToken()
      if (cToken) {
        try {
          const { churchAccount: acct } = await churchApi.get('/church-auth/me')
          auth.setChurchAccount(acct)
        } catch {
          removeChurchToken()
        }
      }

      auth.setIsLoading(false)
    }

    initialize()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // =========================================================================
  // AUTHENTICATION FUNCTIONS
  // =========================================================================
  // These live here (not in useAuthSlice) because login/logout/register
  // trigger side effects across multiple slices (loadAllData, socket, resets).

  async function register(name, email, password, role, phoneNumber) {
    try {
      const data = await api.post('/auth/register', { name, email, password, role, phoneNumber })
      setToken(data.token)
      auth.setUser(data.user)
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
      const data = await api.post('/auth/login', { email, password })
      setToken(data.token)
      auth.setUser(data.user)
      await loadAllData(data.user)
      const sock = connectSocket()
      if (sock) setupSocketListeners(sock)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  function logout() {
    disconnectSocket()
    removeToken()

    // Reset every slice back to its empty initial state
    auth.reset()
    appointments.reset()
    conversations.reset()
    churches.reset()
    scripture.reset()
    notifications.reset()
    ui.reset()
  }

  // =========================================================================
  // CONTEXT VALUE
  // =========================================================================
  // Spread all slices into a single flat object so every component that
  // calls useApp() gets the same API it always had — nothing changes.

  const value = {
    // Auth
    user: auth.user,
    isLoading: auth.isLoading,
    register,
    login,
    logout,
    updateUserPhoto: auth.updateUserPhoto,
    updateProfile: auth.updateProfile,

    // Appointments
    appointments: appointments.appointments,
    createAppointment: appointments.createAppointment,
    confirmAppointment: appointments.confirmAppointment,
    declineAppointment: appointments.declineAppointment,
    completeAppointment: appointments.completeAppointment,
    cancelAppointment: appointments.cancelAppointment,
    cancelSeries: appointments.cancelSeries,
    upcomingCount: appointments.upcomingCount,
    completedCount: appointments.completedCount,

    // Conversations
    conversations: conversations.conversations,
    selectedConversation: conversations.selectedConversation,
    availablePeople: conversations.availablePeople,
    startNewConversation: conversations.startNewConversation,
    selectConversation: conversations.selectConversation,
    sendMessage: conversations.sendMessage,
    setSelectedConversation: conversations.setSelectedConversation,

    // Real-time
    onlineUsers: conversations.onlineUsers,
    typingUsers: conversations.typingUsers,
    emitTypingStart: conversations.emitTypingStart,
    emitTypingStop: conversations.emitTypingStop,
    joinConversationRoom: conversations.joinConversationRoom,
    leaveConversationRoom: conversations.leaveConversationRoom,

    // Churches
    churches: churches.churches,
    allChurches: churches.allChurches,
    churchSearchQuery: churches.churchSearchQuery,
    setChurchSearchQuery: churches.setChurchSearchQuery,
    churchSearchResults: churches.churchSearchResults,
    searchChurches: churches.searchChurches,
    saveChurchFromGoogle: churches.saveChurchFromGoogle,
    reloadChurches: churches.reloadChurches,
    favoriteChurchIds: churches.favoriteChurchIds,
    toggleFavoriteChurch: churches.toggleFavoriteChurch,
    isChurchFavorited: churches.isChurchFavorited,

    // Notes
    notes: ui.notes,
    createNote: ui.createNote,
    updateNote: ui.updateNote,
    deleteNote: ui.deleteNote,

    // Scripture
    scriptureDailyVerse: scripture.scriptureDailyVerse,
    scriptureVerses: scripture.scriptureVerses,
    scriptureBookmarkIds: scripture.scriptureBookmarkIds,
    readingPlans: scripture.readingPlans,
    memorizationStats: scripture.memorizationStats,
    toggleVerseBookmark: scripture.toggleVerseBookmark,
    getRandomVerse: scripture.getRandomVerse,
    getReadingPlanDetail: scripture.getReadingPlanDetail,
    getReadingProgress: scripture.getReadingProgress,
    markDayComplete: scripture.markDayComplete,
    createCustomPlan: scripture.createCustomPlan,
    createSurprisePlan: scripture.createSurprisePlan,
    deleteCustomPlan: scripture.deleteCustomPlan,
    recordGameRound: scripture.recordGameRound,

    // Bible Reader
    bibleHighlights: scripture.bibleHighlights,
    bibleBookmarks: scripture.bibleBookmarks,
    addBibleHighlight: scripture.addBibleHighlight,
    removeBibleHighlight: scripture.removeBibleHighlight,
    updateBibleHighlight: scripture.updateBibleHighlight,
    addBibleBookmark: scripture.addBibleBookmark,
    removeBibleBookmark: scripture.removeBibleBookmark,

    // Modal
    modal: ui.modal,
    setModal: ui.setModal,

    // User Action Menu
    userActionMenu: ui.userActionMenu,
    showUserActionMenu: ui.showUserActionMenu,
    hideUserActionMenu: ui.hideUserActionMenu,

    // Notifications
    notifications: notifications.notifications,
    unreadNotifCount: notifications.unreadNotifCount,
    fetchNotifications: notifications.fetchNotifications,
    markNotificationRead: notifications.markNotificationRead,
    markAllNotificationsRead: notifications.markAllNotificationsRead,
    deleteNotification: notifications.deleteNotification,

    // Church Account
    churchAccount: auth.churchAccount,
    churchLogin: auth.churchLogin,
    churchLogout: auth.churchLogout,

    // Utils
    getDailyQuote: ui.getDailyQuote,
  }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}

export default AppContext
