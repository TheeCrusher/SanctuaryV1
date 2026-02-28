// =============================================================================
// COMMUNITY SCREEN
// =============================================================================
// Shows the user's community AND messages in a single screen with a top toggle.
// "Your Community" tab: Guide/Seeker filter tabs, search, pending requests, person cards.
// "Messages" tab: Conversation list, new conversation modal with user search.
// Fixed "Invite Friends" button at the bottom of both tabs.

import './Community.css'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { Avatar, Card, Modal, EmptyState, LoadingSpinner, ErrorState } from '../common'
import { Search, ChevronDown, ChevronUp, Check, X, Users, UserPlus, Plus, MessageCircle, ChevronRight, Share2, Sparkles, Church } from 'lucide-react'
import { api } from '../../utils/api'

function CommunityScreen() {
  const navigate = useNavigate()
  const {
    user,
    conversations,
    availablePeople,
    selectConversation,
    startNewConversation,
    onlineUsers,
    showUserActionMenu
  } = useApp()

  // Top-level toggle: 'community' or 'messages'
  const [topTab, setTopTab] = useState('community')

  // Community state
  const [community, setCommunity] = useState([])
  const [pending, setPending] = useState({ incoming: [], outgoing: [] })
  const [suggested, setSuggested] = useState([])
  const [showSuggested, setShowSuggested] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [searchText, setSearchText] = useState('')
  const [showPending, setShowPending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Messages state
  const [showNewConvModal, setShowNewConvModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])

  // Invite Friends state
  const [copied, setCopied] = useState(false)

  // Load community and pending requests on mount
  useEffect(() => {
    loadData()
  }, [])

  // Debounced server search for new conversation modal
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
        // ignore
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  async function loadData() {
    try {
      setLoading(true)
      setError(null)
      const [communityRes, pendingRes, suggestedRes] = await Promise.all([
        api.get('/community'),
        api.get('/community/pending'),
        api.get('/users/suggested?limit=5')
      ])
      setCommunity(communityRes.community || [])
      setPending(pendingRes || { incoming: [], outgoing: [] })
      setSuggested(suggestedRes.suggested || [])
    } catch (err) {
      setError('Failed to load community. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleAccept(connectionId) {
    try {
      await api.patch(`/community/${connectionId}`, { status: 'accepted' })
      await loadData()
    } catch (error) {
      // ignore
    }
  }

  async function handleDecline(connectionId) {
    try {
      await api.patch(`/community/${connectionId}`, { status: 'declined' })
      await loadData()
    } catch (error) {
      // ignore
    }
  }

  // Filter community by tab and search
  const filtered = community.filter(person => {
    const matchesTab =
      activeTab === 'all' ||
      (activeTab === 'guides' && person.role === 'Guide') ||
      (activeTab === 'seekers' && person.role === 'Seeker')

    const matchesSearch =
      !searchText ||
      person.name.toLowerCase().includes(searchText.toLowerCase())

    return matchesTab && matchesSearch
  })

  // Find shared interests between current user and a community member
  function getSharedInterests(person) {
    if (!user?.interests || !person.interests) return []
    return user.interests.filter(i => person.interests.includes(i))
  }

  const pendingCount = pending.incoming.length

  // Build the displayed people list for new conversation modal
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

  async function handleInvite() {
    const shareData = {
      title: 'Join me on Sanctuary',
      text: 'Sanctuary is a spiritual guidance app connecting guides with seekers. Join our community!',
      url: 'https://sanctuary-v1.vercel.app/login'
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (err) {
        // AbortError means user dismissed share sheet — ignore
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareData.url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        // ignore
      }
    }
  }

  if (loading) {
    return (
      <div className="screen with-bottom-nav">
        <LoadingSpinner message="Loading community..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="screen with-bottom-nav">
        <ErrorState subtitle={error} onAction={loadData} />
      </div>
    )
  }

  return (
    <div className="screen with-bottom-nav">
      {/* Header */}
      <div className="screen-header">
        {/* Top toggle: Your Community | Messages */}
        <div className="community-top-toggle">
          <button
            className={topTab === 'community' ? 'active' : ''}
            onClick={() => setTopTab('community')}
          >
            Your Community
          </button>
          <button
            className={topTab === 'messages' ? 'active' : ''}
            onClick={() => setTopTab('messages')}
          >
            Messages
          </button>
        </div>

        {/* Community sub-header */}
        {topTab === 'community' && (
          <>
            <div className="screen-header-top">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="community-count">{community.length} {community.length === 1 ? 'person' : 'people'}</span>
              </div>
            </div>

            {/* Search bar */}
            <div className="search-container" style={{ marginTop: 12 }}>
              <Search size={18} className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Search your community..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>

            {/* Filter tabs */}
            <div className="community-tabs">
              <button
                className={`community-tab ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                All
              </button>
              <button
                className={`community-tab ${activeTab === 'guides' ? 'active' : ''}`}
                onClick={() => setActiveTab('guides')}
              >
                Guides
              </button>
              <button
                className={`community-tab ${activeTab === 'seekers' ? 'active' : ''}`}
                onClick={() => setActiveTab('seekers')}
              >
                Seekers
              </button>
            </div>
          </>
        )}

        {/* Messages sub-header */}
        {topTab === 'messages' && (
          <div className="community-messages-header">
            <h2>Messages</h2>
            <button
              className="icon-btn"
              onClick={() => setShowNewConvModal(true)}
            >
              <Plus size={22} />
            </button>
          </div>
        )}
      </div>

      {/* Content area */}
      <div className="screen-content community-screen-content">
        {topTab === 'community' ? (
          <>
            {/* Suggested for You */}
            {suggested.length > 0 && (
              <div className="suggested-section">
                <button
                  className="suggested-header"
                  onClick={() => setShowSuggested(!showSuggested)}
                >
                  <div className="suggested-header-left">
                    <Sparkles size={18} className="suggested-header-icon" />
                    <span className="suggested-header-title">Suggested for You</span>
                    <span className="suggested-header-count">{suggested.length}</span>
                  </div>
                  {showSuggested ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>

                {showSuggested && (
                  <div className="suggested-list">
                    {suggested.map(person => (
                      <button
                        key={person.id}
                        className="suggested-card"
                        onClick={() => showUserActionMenu({
                          userId: person.id, userName: person.name,
                          photoUrl: person.photoUrl, avatar: person.avatar
                        })}
                      >
                        <Avatar emoji={person.avatar} src={person.photoUrl} size="md" />
                        <div className="suggested-card-info">
                          <div className="suggested-card-top">
                            <span className="suggested-card-name tappable-name">{person.name}</span>
                            <span className={`role-badge role-badge-${person.role.toLowerCase()}`}>
                              {person.role}
                            </span>
                          </div>
                          <div className="suggested-card-reason">{person.matchReason}</div>
                        </div>
                        <UserPlus size={18} className="suggested-card-action" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Pending requests banner */}
            {pendingCount > 0 && (
              <div className="pending-banner">
                <button
                  className="pending-banner-toggle"
                  onClick={() => setShowPending(!showPending)}
                >
                  <div className="pending-banner-left">
                    <UserPlus size={18} />
                    <span>{pendingCount} pending {pendingCount === 1 ? 'request' : 'requests'}</span>
                  </div>
                  {showPending ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>

                {showPending && (
                  <div className="pending-list">
                    {pending.incoming.map(person => (
                      <div key={person.connectionId} className="pending-card">
                        <div className="pending-card-left" onClick={() => showUserActionMenu({
                          userId: person.id, userName: person.name,
                          photoUrl: person.photoUrl, avatar: person.avatar
                        })}>
                          <Avatar src={person.photoUrl} emoji={person.avatar} size="sm" />
                          <div>
                            <span className="pending-card-name tappable-name">{person.name}</span>
                            <span className={`role-badge role-badge-${person.role.toLowerCase()}`}>
                              {person.role}
                            </span>
                          </div>
                        </div>
                        <div className="pending-card-actions">
                          <button
                            className="pending-btn pending-btn-accept"
                            onClick={() => handleAccept(person.connectionId)}
                          >
                            <Check size={16} />
                          </button>
                          <button
                            className="pending-btn pending-btn-decline"
                            onClick={() => handleDecline(person.connectionId)}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Community list */}
            {filtered.length === 0 ? (
              <div className="empty-state">
                <Users size={48} style={{ marginBottom: 12, opacity: 0.3 }} />
                <div className="empty-text">
                  {searchText
                    ? 'No one matches your search'
                    : community.length === 0
                      ? 'Your community is empty'
                      : `No ${activeTab === 'guides' ? 'guides' : 'seekers'} in your community yet`
                  }
                </div>
                {community.length === 0 && (
                  <div className="empty-subtext">
                    Connect with people from the Prayer Board, Churches, or user search
                  </div>
                )}
              </div>
            ) : (
              <div className="community-list">
                {filtered.map(person => {
                  const shared = getSharedInterests(person)
                  return (
                    <button
                      key={person.id}
                      className="community-card"
                      onClick={() => showUserActionMenu({
                        userId: person.id, userName: person.name,
                        photoUrl: person.photoUrl, avatar: person.avatar
                      })}
                    >
                      <Avatar src={person.photoUrl} emoji={person.avatar} size="md" />
                      <div className="community-card-info">
                        <div className="community-card-top">
                          <span className="community-card-name tappable-name">{person.name}</span>
                          <span className={`role-badge role-badge-${person.role.toLowerCase()}`}>
                            {person.role}
                          </span>
                        </div>
                        {(person.denomination || person.churchName || person.preferredChurchId) && (
                          <div className="community-card-detail">
                            {person.preferredChurchId ? (
                              <span
                                className="community-church-badge"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  navigate(`/churches/${person.preferredChurchId}`)
                                }}
                              >
                                <Church size={11} />
                                {person.preferredChurchName || person.churchName}
                              </span>
                            ) : (
                              person.churchName || person.denomination
                            )}
                          </div>
                        )}
                        {shared.length > 0 && (
                          <div className="community-interests">
                            {shared.slice(0, 3).map(interest => (
                              <span key={interest} className="community-interest-tag">{interest}</span>
                            ))}
                            {shared.length > 3 && (
                              <span className="community-interest-more">+{shared.length - 3}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </>
        ) : (
          <>
            {/* Messages conversation list */}
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
                      <Avatar src={conv.photoUrl} emoji={conv.avatar} name={conv.name} size="md" variant="blue" />
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
          </>
        )}
      </div>

      {/* Fixed Invite Friends button */}
      <div className="community-invite-fixed">
        <button onClick={handleInvite}>
          <Share2 size={18} />
          {copied ? 'Link Copied!' : 'Invite Friends'}
        </button>
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
                <Avatar src={person.photoUrl} emoji={person.avatar} name={person.name} size="md" variant="blue" />
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

export default CommunityScreen
