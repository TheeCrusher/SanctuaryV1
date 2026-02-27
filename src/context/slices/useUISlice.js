import { useState } from 'react'
import { api } from '../../utils/api'

export function useUISlice() {
  // ----- MODAL STATE -----
  const [modal, setModal] = useState(null)

  // ----- USER ACTION MENU STATE -----
  // The sheet that appears when you tap a user's name (View Profile, Message, Block, etc.)
  const [userActionMenu, setUserActionMenu] = useState(null)

  function showUserActionMenu({ userId, userName, photoUrl, avatar, showMessage = true }) {
    setUserActionMenu({ userId, userName, photoUrl, avatar, showMessage })
  }

  function hideUserActionMenu() {
    setUserActionMenu(null)
  }

  // ----- DAILY QUOTE STATE -----
  const [dailyQuote, setDailyQuote] = useState({ text: '', ref: '' })

  // ----- NOTES STATE -----
  const [notes, setNotes] = useState([])

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

  // Called by AppContext on logout to wipe all UI state
  function reset() {
    setModal(null)
    setUserActionMenu(null)
    setDailyQuote({ text: '', ref: '' })
    setNotes([])
  }

  return {
    // Modal
    modal,
    setModal,

    // User action menu
    userActionMenu,
    showUserActionMenu,
    hideUserActionMenu,

    // Daily quote
    dailyQuote,
    setDailyQuote,
    getDailyQuote: () => dailyQuote,

    // Notes
    notes,
    setNotes,
    createNote,
    updateNote,
    deleteNote,

    // Internal
    reset,
  }
}
