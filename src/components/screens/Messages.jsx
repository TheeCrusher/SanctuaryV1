// =============================================================================
// MESSAGES SCREEN
// =============================================================================
// Shows a list of all conversations with online status indicators.
// Allows starting new conversations with available people.
// Includes search-by-name in the new conversation modal.

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { Avatar, Card, Modal, EmptyState } from '../common'
import { Plus, MessageCircle, ChevronRight, Search } from 'lucide-react'
import { api } from '../../utils/api'

function Messages() {
  const navigate = useNavigate()
  const [showNewConvModal, setShowNewConvModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])

  const {
    conversations,
    availablePeople,
    selectConversation,
    startNewConversation,
    onlineUsers
  } = useApp()

  // Debounced server search — fires 300ms after user stops typing
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([])
      return
    }

    const timer = setTimeout(async () => {
      try {
        const { users } = await api.get(`/users/search?q=${encodeURIComponent(searchQuery.trim())}`)
        setSearchResults(users)
      } catch (err) {
        console.error('Search failed:', err)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Build the displayed people list: local filter + server results, deduplicated
  const displayedPeople = searchQuery.trim()
    ? (() => {
        const q = searchQuery.toLowerCase()
        const local = availablePeople.filter(p =>
          p.name.toLowerCase().includes(q)
        )
        const localIds = new Set(local.map(p => p.id))
        const extra = searchResults.filter(u => !localIds.has(u.id))
        return [...local, ...extra]
      })()
    : availablePeople

  async function handleConversationClick(convId) {
    await selectConversation(convId)
    navigate('/chat')
  }

  async function handleNewConversation(personId) {
    await startNewConversation(personId)
    setShowNewConvModal(false)
    setSearchQuery('')
    navigate('/chat')
  }

  function handleCloseModal() {
    setShowNewConvModal(false)
    setSearchQuery('')
    setSearchResults([])
  }

  return (
    <div className="screen with-bottom-nav">
      {/* Header */}
      <div className="screen-header">
        <div className="screen-header-top">
          <h1 style={{ fontSize: '24px', fontWeight: '700' }}>Messages</h1>
          <button
            className="icon-btn"
            onClick={() => setShowNewConvModal(true)}
          >
            <Plus size={22} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="screen-content">
        {conversations.length === 0 ? (
          <EmptyState
            icon={MessageCircle}
            title="No conversations yet"
            subtitle="Start a conversation with a seeker"
            actionLabel="New Message"
            onAction={() => setShowNewConvModal(true)}
          />
        ) : (
          conversations.map(conv => (
            <Card
              key={conv.id}
              onClick={() => handleConversationClick(conv.id)}
            >
              <div className="conv-row">
                <div className="conv-avatar-wrap">
                  <Avatar emoji={conv.avatar} size="md" variant="blue" />
                  {onlineUsers.has(conv.personId) && (
                    <span className="online-dot" />
                  )}
                  {conv.unread > 0 && (
                    <span className="unread-badge">{conv.unread}</span>
                  )}
                </div>
                <div className="conv-info">
                  <div className="conv-header">
                    <span className="conv-name">{conv.name}</span>
                    <span className="conv-time">{conv.time}</span>
                  </div>
                  <div className="conv-preview">{conv.last}</div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* New Conversation Modal */}
      <Modal
        isOpen={showNewConvModal}
        onClose={handleCloseModal}
        title="New Conversation"
      >
        <div className="new-conv-search">
          <input
            type="text"
            placeholder="Search by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {displayedPeople.length === 0 ? (
          <div className="new-conv-no-results">
            {searchQuery.trim()
              ? `No users found for "${searchQuery}"`
              : 'No users available'}
          </div>
        ) : (
          displayedPeople.map(person => (
            <div
              key={person.id}
              className="new-conv-item"
              onClick={() => handleNewConversation(person.id)}
            >
              <div style={{ position: 'relative' }}>
                <Avatar emoji={person.avatar} size="md" variant="blue" />
                {onlineUsers.has(person.id) && <span className="online-dot" />}
              </div>
              <div className="new-conv-info">
                <div className="new-conv-name">{person.name}</div>
                <div className="new-conv-role">{person.role}</div>
              </div>
              <span style={{ color: 'var(--text-faint)' }}><ChevronRight size={20} /></span>
            </div>
          ))
        )}

        <button
          className="btn-secondary"
          onClick={handleCloseModal}
          style={{ marginTop: '16px' }}
        >
          Cancel
        </button>
      </Modal>
    </div>
  )
}

export default Messages
