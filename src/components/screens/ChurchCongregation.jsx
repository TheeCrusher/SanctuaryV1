// =============================================================================
// CHURCH CONGREGATION VIEW
// =============================================================================
// Shows all Sanctuary users who belong to this church (favorited, reviewed,
// or have it as their preferred church). Read-only — no interaction from here.

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { churchApi } from '../../utils/api'
import { ArrowLeft, Users } from 'lucide-react'

function ChurchCongregation() {
  const navigate = useNavigate()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadCongregation() {
      try {
        const data = await churchApi.get('/church-auth/congregation')
        setMembers(data.members)
      } catch (error) {
        // ignore
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

  if (loading) {
    return (
      <div className="screen" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div className="loading-spinner" />
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
        <div className="church-member-list">
          <p className="church-member-count">{members.length} member{members.length !== 1 ? 's' : ''}</p>
          {members.map(member => (
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
    </div>
  )
}

export default ChurchCongregation
