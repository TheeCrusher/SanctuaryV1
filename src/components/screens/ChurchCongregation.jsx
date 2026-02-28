// =============================================================================
// CHURCH CONGREGATION VIEW
// =============================================================================
// Shows all Sanctuary users who belong to this church (favorited, reviewed,
// or have it as their preferred church). Read-only — no interaction from here.

import './ChurchDashboard.css'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { churchApi } from '../../utils/api'
import { ArrowLeft, Users, AlertCircle, Search } from 'lucide-react'

function ChurchCongregation() {
  const navigate = useNavigate()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')

  useEffect(() => {
    async function loadCongregation() {
      try {
        const data = await churchApi.get('/church-auth/congregation')
        setMembers(data.members)
      } catch (err) {
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    loadCongregation()
  }, [])

  function renderAvatar(member) {
    if (member.photoUrl) {
      return <img src={member.photoUrl} alt={member.name} className="church-member-avatar-img" />
    }
    return <span className="church-member-avatar-emoji">{member.avatar || '🙏'}</span>
  }

  const guideCount = members.filter(m => m.role === 'guide').length
  const seekerCount = members.filter(m => m.role === 'seeker').length

  const filtered = members.filter(m => {
    const matchesSearch = !searchText || m.name.toLowerCase().includes(searchText.toLowerCase())
    const matchesRole =
      roleFilter === 'all' ||
      (roleFilter === 'guides' && m.role === 'guide') ||
      (roleFilter === 'seekers' && m.role === 'seeker')
    return matchesSearch && matchesRole
  })

  if (loading) {
    return (
      <div className="screen church-screen-center">
        <div className="loading-spinner" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="church-editor">
        <div className="church-editor-header">
          <button className="church-back-btn" onClick={() => navigate('/church-dashboard')}>
            <ArrowLeft size={20} />
          </button>
          <h2>Congregation</h2>
        </div>
        <div className="church-empty-state">
          <AlertCircle size={48} />
          <p>Failed to load congregation.</p>
          <p className="church-empty-hint">Check your connection and try again.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="church-editor">
      {/* Header */}
      <div className="church-editor-header">
        <button className="church-back-btn" onClick={() => navigate('/church-dashboard')}>
          <ArrowLeft size={20} />
        </button>
        <h2>Congregation</h2>
      </div>

      {members.length === 0 ? (
        <div className="church-empty-state">
          <Users size={48} />
          <p>No members yet.</p>
          <p className="church-empty-hint">
            As users join Sanctuary and favorite your church, they'll appear here.
          </p>
        </div>
      ) : (
        <>
          {/* Stats bar */}
          <div className="congregation-stats-bar">
            <div className="congregation-stat">
              <span className="congregation-stat-value">{members.length}</span>
              <span className="congregation-stat-label">Total</span>
            </div>
            <div className="congregation-stat-divider" />
            <div className="congregation-stat">
              <span className="congregation-stat-value congregation-stat-gold">{guideCount}</span>
              <span className="congregation-stat-label">Guides</span>
            </div>
            <div className="congregation-stat-divider" />
            <div className="congregation-stat">
              <span className="congregation-stat-value congregation-stat-blue">{seekerCount}</span>
              <span className="congregation-stat-label">Seekers</span>
            </div>
          </div>

          {/* Search */}
          <div className="congregation-search-row">
            <Search size={16} className="congregation-search-icon" />
            <input
              type="text"
              className="congregation-search-input"
              placeholder="Search members..."
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
            />
          </div>

          {/* Role filter tabs */}
          <div className="congregation-filter-tabs">
            {['all', 'guides', 'seekers'].map(tab => (
              <button
                key={tab}
                className={`congregation-filter-tab ${roleFilter === tab ? 'active' : ''}`}
                onClick={() => setRoleFilter(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Member list */}
          {filtered.length === 0 ? (
            <div className="church-empty-state" style={{ paddingTop: 32 }}>
              <p>No members match your search.</p>
            </div>
          ) : (
            <div className="church-member-list">
              {filtered.map(member => (
                <div key={member.id} className="church-member-card">
                  <div className="church-member-avatar">
                    {renderAvatar(member)}
                  </div>
                  <div className="church-member-info">
                    <span className="church-member-name">{member.name}</span>
                    {member.city && member.state && (
                      <span className="church-member-location">{member.city}, {member.state}</span>
                    )}
                  </div>
                  <span className={`church-member-badge ${member.role === 'guide' ? 'badge-guide' : 'badge-seeker'}`}>
                    {member.role === 'guide' ? 'Guide' : 'Seeker'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default ChurchCongregation
