// =============================================================================
// COMMUNITY SCREEN
// =============================================================================
// Shows the user's community — people they've connected with.
// Features: Guide/Seeker filter tabs, search, pending requests, person cards.
// Accessed from the Community tab in the bottom nav.

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { Avatar } from '../common'
import { Search, ChevronDown, ChevronUp, Check, X, Users, UserPlus } from 'lucide-react'
import { api } from '../../utils/api'

function CommunityScreen() {
  const navigate = useNavigate()
  const { user } = useApp()

  const [community, setCommunity] = useState([])
  const [pending, setPending] = useState({ incoming: [], outgoing: [] })
  const [activeTab, setActiveTab] = useState('all')
  const [searchText, setSearchText] = useState('')
  const [showPending, setShowPending] = useState(false)
  const [loading, setLoading] = useState(true)

  // Load community and pending requests on mount
  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [communityRes, pendingRes] = await Promise.all([
        api.get('/community'),
        api.get('/community/pending')
      ])
      setCommunity(communityRes.community || [])
      setPending(pendingRes || { incoming: [], outgoing: [] })
    } catch (error) {
      console.error('Failed to load community:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleAccept(connectionId) {
    try {
      await api.patch(`/community/${connectionId}`, { status: 'accepted' })
      await loadData()
    } catch (error) {
      console.error('Failed to accept request:', error)
    }
  }

  async function handleDecline(connectionId) {
    try {
      await api.patch(`/community/${connectionId}`, { status: 'declined' })
      await loadData()
    } catch (error) {
      console.error('Failed to decline request:', error)
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

  if (loading) {
    return (
      <div className="screen with-bottom-nav" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div>Loading...</div>
      </div>
    )
  }

  return (
    <div className="screen with-bottom-nav">
      {/* Header */}
      <div className="screen-header">
        <div className="screen-header-top">
          <h1 className="section-title">Your Community</h1>
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
      </div>

      <div className="screen-content">
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
                    <div className="pending-card-left" onClick={() => navigate(`/user/${person.id}`)}>
                      <Avatar src={person.photoUrl} emoji={person.avatar} size="sm" />
                      <div>
                        <div className="pending-card-name">{person.name}</div>
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
                  onClick={() => navigate(`/user/${person.id}`)}
                >
                  <Avatar src={person.photoUrl} emoji={person.avatar} size="md" />
                  <div className="community-card-info">
                    <div className="community-card-top">
                      <span className="community-card-name">{person.name}</span>
                      <span className={`role-badge role-badge-${person.role.toLowerCase()}`}>
                        {person.role}
                      </span>
                    </div>
                    {(person.denomination || person.churchName) && (
                      <div className="community-card-detail">
                        {person.churchName || person.denomination}
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
      </div>
    </div>
  )
}

export default CommunityScreen
