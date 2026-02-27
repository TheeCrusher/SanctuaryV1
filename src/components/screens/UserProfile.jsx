// =============================================================================
// USER PROFILE SCREEN (Public view of another user)
// =============================================================================
// Shows another user's profile with connection status and action buttons.
// - "Add to Community" / "Request Pending" / "In Your Community" based on status
// - "Send Message" for everyone
// - "Book Session" only when a Seeker views a Guide's profile
// - 3-dot menu with "Block User" option

import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { Avatar, LoadingSpinner, ErrorState } from '../common'
import { ArrowLeft, MapPin, BookOpen, MessageCircle, UserPlus, Clock, Users, Calendar, Lock, MoreVertical, ShieldOff } from 'lucide-react'
import { api } from '../../utils/api'

function UserProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, startNewConversation } = useApp()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [connectionStatus, setConnectionStatus] = useState('none')
  const [connectionLoading, setConnectionLoading] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [blocking, setBlocking] = useState(false)
  const menuRef = useRef(null)

  async function loadProfile() {
    try {
      setLoading(true)
      setError(null)
      const [profileRes, statusRes] = await Promise.all([
        api.get(`/users/${id}`),
        api.get(`/community/status/${id}`)
      ])
      setProfile(profileRes.user)
      setConnectionStatus(statusRes.status)
    } catch (err) {
      setError('Failed to load profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadProfile() }, [id])

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false)
      }
    }
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMenu])

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
      // ignore
    } finally {
      setConnectionLoading(false)
    }
  }

  const [waitlistLoading, setWaitlistLoading] = useState(false)

  async function handleBlock() {
    if (!confirm(`Block ${profile.name}? They won't be able to see your profile, messages, or activity.`)) {
      return
    }
    setBlocking(true)
    setShowMenu(false)
    try {
      await api.post('/blocks', { blockedId: Number(id) })
      navigate(-1)
    } catch (error) {
      setBlocking(false)
    }
  }

  async function handleJoinWaitlist() {
    setWaitlistLoading(true)
    try {
      await api.post('/users/waitlist', { guideId: Number(id) })
      setProfile(prev => ({ ...prev, onWaitlist: true }))
    } catch (error) {
      // ignore
    } finally {
      setWaitlistLoading(false)
    }
  }

  // Guide availability logic for seekers
  const isGuide = profile?.role?.toLowerCase() === 'guide'
  const isViewerSeeker = user?.role === 'seeker'
  const guideNotAccepting = isGuide && profile?.acceptingSeekers === false
  const guideIsFull = isGuide && profile?.acceptingSeekers !== false &&
    profile?.pendingCount >= profile?.maxPendingRequests

  const showBookSession = isViewerSeeker && isGuide && !guideNotAccepting && !guideIsFull
  const showWaitlist = isViewerSeeker && isGuide && guideIsFull && !profile?.onWaitlist
  const showOnWaitlist = isViewerSeeker && isGuide && profile?.onWaitlist
  const showNotAccepting = isViewerSeeker && isGuide && guideNotAccepting

  if (loading) {
    return (
      <div className="screen">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="screen">
        <ErrorState subtitle={error} onAction={loadProfile} />
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
            <div className="header-spacer" />
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
      <div className={`profile-header ${profile.role?.toLowerCase() === 'guide' ? 'profile-header-guide' : ''}`}>
        <button className="back-btn" onClick={() => navigate(-1)} style={{ position: 'absolute', top: 16, left: 16 }}>
          <ArrowLeft size={20} />
        </button>

        {/* 3-dot menu (only for other users' profiles) */}
        {connectionStatus !== 'self' && (
          <div className="three-dot-menu" ref={menuRef}>
            <button
              className="three-dot-btn"
              onClick={() => setShowMenu(!showMenu)}
              disabled={blocking}
            >
              <MoreVertical size={20} />
            </button>
            {showMenu && (
              <div className="three-dot-dropdown">
                <button className="three-dot-item danger" onClick={handleBlock}>
                  <ShieldOff size={16} />
                  Block User
                </button>
              </div>
            )}
          </div>
        )}

        <div className={profile.role?.toLowerCase() === 'guide' ? 'profile-avatar-guide' : 'profile-avatar-seeker'} style={{ borderRadius: '50%' }}>
          <Avatar
            src={profile.photoUrl}
            emoji={profile.avatar}
            size="xl"
            variant="gradient"
          />
        </div>
        <div className="profile-name" style={{ marginTop: 12 }}>{profile.name}</div>
        <div className={`profile-role-badge ${profile.role?.toLowerCase() === 'guide' ? 'role-guide' : 'role-seeker'}`}>{profile.role}</div>

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
                className="btn-gold"
                onClick={() => navigate(`/appointments?guideId=${profile.id}&guideName=${encodeURIComponent(profile.name)}`)}
              >
                <Calendar size={18} /> Book Session
              </button>
            )}

            {showNotAccepting && (
              <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '8px 0', fontSize: '14px' }}>
                This guide is not currently accepting new seekers.
              </div>
            )}

            {showWaitlist && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '8px' }}>
                  Pending requests full
                </div>
                <button className="btn-gold" onClick={handleJoinWaitlist} disabled={waitlistLoading}>
                  <Clock size={18} /> {waitlistLoading ? 'Joining...' : 'Join Waitlist'}
                </button>
              </div>
            )}

            {showOnWaitlist && (
              <div style={{ color: 'var(--accent-gold)', textAlign: 'center', padding: '8px 0', fontSize: '14px' }}>
                You're on the waitlist. You'll be notified when a spot opens.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default UserProfile
