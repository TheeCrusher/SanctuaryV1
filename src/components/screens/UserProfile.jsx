// =============================================================================
// USER PROFILE SCREEN (Public view of another user)
// =============================================================================
// Shows another user's profile with connection status and action buttons.
// - "Add to Community" / "Request Pending" / "In Your Community" based on status
// - "Send Message" for everyone
// - "Book Session" only when a Seeker views a Guide's profile

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { Avatar } from '../common'
import { ArrowLeft, MapPin, BookOpen, MessageCircle, UserPlus, Clock, Users, Calendar, Lock } from 'lucide-react'
import { api } from '../../utils/api'

function UserProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, startNewConversation } = useApp()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState('none')
  const [connectionLoading, setConnectionLoading] = useState(false)

  useEffect(() => {
    async function loadProfile() {
      try {
        const [profileRes, statusRes] = await Promise.all([
          api.get(`/users/${id}`),
          api.get(`/community/status/${id}`)
        ])
        setProfile(profileRes.user)
        setConnectionStatus(statusRes.status)
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

  async function handleAddToCommunity() {
    setConnectionLoading(true)
    try {
      await api.post('/community/request', { recipientId: Number(id) })
      setConnectionStatus('pending_sent')
    } catch (error) {
      console.error('Failed to send connection request:', error)
    } finally {
      setConnectionLoading(false)
    }
  }

  // Show "Book Session" only when a Seeker views a Guide's profile
  const showBookSession = user?.role === 'seeker' && profile?.role === 'Guide'

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
          {profile.isConnected === false && (
            <div className="profile-limited-hint">
              <Lock size={14} />
              <span>Connect to see full profile</span>
            </div>
          )}
        </div>

        {/* Connection status / action */}
        {connectionStatus !== 'self' && (
          <div className="profile-actions">
            {connectionStatus === 'none' && (
              <button
                className="connection-btn"
                onClick={handleAddToCommunity}
                disabled={connectionLoading}
              >
                <UserPlus size={18} />
                {connectionLoading ? 'Sending...' : 'Add to Community'}
              </button>
            )}
            {connectionStatus === 'pending_sent' && (
              <div className="connection-status connection-status-pending">
                <Clock size={16} />
                Request Pending
              </div>
            )}
            {connectionStatus === 'pending_received' && (
              <div className="connection-status connection-status-pending">
                <Clock size={16} />
                Wants to connect with you
              </div>
            )}
            {connectionStatus === 'accepted' && (
              <div className="connection-status connection-status-connected">
                <Users size={16} />
                In Your Community
              </div>
            )}

            <button className="btn-primary" onClick={handleMessage} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <MessageCircle size={18} /> Send Message
            </button>

            {showBookSession && (
              <button
                className="btn-secondary"
                onClick={() => navigate('/appointments')}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                <Calendar size={18} /> Book Session
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default UserProfile
