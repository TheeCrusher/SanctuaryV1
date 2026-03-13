import { useState, useRef, useEffect } from 'react'
import { api } from '../../utils/api'
import { getSocket } from '../../utils/socket'

export function useConversationSlice() {
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [availablePeople, setAvailablePeople] = useState([])

  // ----- REAL-TIME STATE -----
  const [onlineUsers, setOnlineUsers] = useState(new Set())
  const [typingUsers, setTypingUsers] = useState({}) // { conversationId: [{ userId, userName }] }

  // Ref to track the currently selected conversation inside socket callbacks.
  // Callbacks close over stale state unless we use a ref that stays current.
  const selectedConvRef = useRef(null)
  useEffect(() => {
    selectedConvRef.current = selectedConversation
  }, [selectedConversation])

  // ---- CONVERSATION FUNCTIONS ----

  async function startNewConversation(personId) {
    try {
      const { conversation } = await api.post('/conversations', { personId })

      // If this is a message request (recipient has connections-only permission
      // and we're not connected), don't open chat — just confirm the request was sent.
      if (conversation.status === 'request') {
        return { ok: true, isRequest: true, conversation }
      }

      const convWithMsgs = { ...conversation, msgs: [] }
      setSelectedConversation(convWithMsgs)

      // Add to active list if it's genuinely new
      setConversations(prev => {
        const exists = prev.find(c => c.id === conversation.id)
        if (exists) return prev
        return [...prev, conversation]
      })

      // Fetch any existing messages
      try {
        const { messages } = await api.get(`/conversations/${conversation.id}/messages`)
        setSelectedConversation(prev =>
          prev && prev.id === conversation.id ? { ...prev, msgs: messages } : prev
        )
      } catch (err) {
        // ignore
      }

      return { ok: true, isRequest: false, conversation: convWithMsgs }
    } catch (error) {
      return { ok: false, error: error.message || 'Could not start conversation.', code: error.code || null }
    }
  }

  async function selectConversation(id) {
    const conv = conversations.find(c => c.id === id)
    if (!conv) return null

    // Render immediately with empty messages so the screen opens fast
    setSelectedConversation({ ...conv, msgs: [] })

    try {
      const { messages } = await api.get(`/conversations/${id}/messages`)
      const convWithMsgs = { ...conv, msgs: messages }
      setSelectedConversation(convWithMsgs)

      // Clear the unread badge
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

      const updatedConv = {
        ...selectedConversation,
        msgs: [...selectedConversation.msgs, message],
        last: text.trim(),
        time: 'Just now'
      }

      setSelectedConversation(updatedConv)
      setConversations(prev => prev.map(c =>
        c.id === selectedConversation.id
          ? { ...c, last: text.trim(), time: 'Just now' }
          : c
      ))

      // Broadcast via socket so the other person gets it instantly
      const socket = getSocket()
      if (socket) {
        socket.emit('send_message', {
          conversationId: selectedConversation.id,
          message
        })
        socket.emit('typing_stop', { conversationId: selectedConversation.id })
      }
    } catch (error) {
      // ignore
    }
  }

  // ---- TYPING INDICATOR HELPERS ----

  function emitTypingStart(conversationId) {
    const socket = getSocket()
    if (socket) socket.emit('typing_start', { conversationId })
  }

  function emitTypingStop(conversationId) {
    const socket = getSocket()
    if (socket) socket.emit('typing_stop', { conversationId })
  }

  // ---- ROOM MANAGEMENT ----

  function joinConversationRoom(conversationId) {
    const socket = getSocket()
    if (socket) socket.emit('join_conversation', { conversationId })
  }

  function leaveConversationRoom(conversationId) {
    const socket = getSocket()
    if (socket) socket.emit('leave_conversation', { conversationId })
  }

  function reset() {
    setConversations([])
    setSelectedConversation(null)
    setAvailablePeople([])
    setOnlineUsers(new Set())
    setTypingUsers({})
  }

  return {
    conversations,
    setConversations,
    selectedConversation,
    setSelectedConversation,
    availablePeople,
    setAvailablePeople,
    onlineUsers,
    setOnlineUsers,
    typingUsers,
    setTypingUsers,
    selectedConvRef,
    startNewConversation,
    selectConversation,
    sendMessage,
    emitTypingStart,
    emitTypingStop,
    joinConversationRoom,
    leaveConversationRoom,
    reset,
  }
}
