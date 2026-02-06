// =============================================================================
// USER PROFILE SCREEN (Public view of another user)
// =============================================================================

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { Avatar } from '../common'
import { ArrowLeft, MapPin, BookOpen, MessageCircle } from 'lucide-react'
import { api } from '../../utils/api'

function UserProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { startNewConversation } = useApp()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadProfile() {
      try {
        const { user } = await api.get(`/users/${id}`)
        setProfile(user)
      } catch (error) {
        console.error('Failed to load profile:', error)
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [id])

  async function handleMessage() {
    const conv = await startNewConversation(Number(id))
    if (conv) navigate('/chat')
  }

  if (loading) {
    return (
      <div className="screen" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div>Loading...</div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="screen">
        <div className="screen-header">
          <div className="screen-header-top">
            <button className="back-btn" onClick={() => navigate(-1)}>
              <ArrowLeft size={20} />
            </button>
            <h1 className="section-title">Profile</h1>
            <div style={{ width: 40 }} />
          </div>
        </div>
        <div className="screen-content">
          <div className="empty-state">
            <div className="empty-text">User not found</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="screen with-bottom-nav">
      <div className="profile-header">
        <button className="back-btn" onClick={() => navigate(-1)} style={{ position: 'absolute', top: 16, left: 16 }}>
          <ArrowLeft size={20} />
        </button>
        <Avatar
          src={profile.photoUrl}
          emoji={profile.avatar}
          size="xl"
          variant="gradient"
        />
        <div className="profile-name" style={{ marginTop: 12 }}>{profile.name}</div>
        <div className="profile-role-badge">{profile.role}</div>

        <div className="profile-details">
          {profile.specialization && (
            <div className="profile-detail-row">
              <BookOpen size={14} />
              <span>{profile.specialization}</span>
            </div>
          )}
          {profile.location && (
            <div className="profile-detail-row">
              <MapPin size={14} />
              <span>{profile.location}</span>
            </div>
          )}
          {profile.bio && (
            <div className="profile-bio">{profile.bio}</div>
          )}
        </div>

        <button className="btn-primary" onClick={handleMessage} style={{ marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <MessageCircle size={18} /> Send Message
        </button>
      </div>
    </div>
  )
}

export default UserProfile
