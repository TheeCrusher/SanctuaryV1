// =============================================================================
// NOTIFICATIONS SCREEN
// =============================================================================
// Shows all in-app notifications sorted by most recent first.
// Each notification has a type icon, title, body, timestamp, and unread indicator.
// Tapping a notification marks it as read and navigates to the related screen.

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { EmptyState, LoadingSpinner, ErrorState } from '../common'
import { timeAgo } from '../../utils/helpers'
import {
  ArrowLeft,
  Bell,
  MessageCircle,
  UserPlus,
  Users,
  Heart,
  PartyPopper,
  Calendar,
  Clock,
  Megaphone,
  Trash2,
  CheckCheck
} from 'lucide-react'

// Icon + color mapping for each notification type
const NOTIF_CONFIG = {
  new_message:             { icon: MessageCircle, color: 'var(--brand-primary)',         bg: 'var(--brand-light)' },
  connection_request:      { icon: UserPlus,      color: 'var(--accent-gold)',            bg: 'var(--accent-gold-light)' },
  connection_accepted:     { icon: Users,         color: 'var(--accent-gold)',            bg: 'var(--accent-gold-light)' },
  prayer_prayed:           { icon: Heart,         color: 'var(--accent-burgundy)',        bg: 'var(--accent-burgundy-light)' },
  prayer_comment:          { icon: MessageCircle, color: 'var(--accent-orange)',          bg: 'var(--accent-orange-light)' },
  testimony_celebration:   { icon: PartyPopper,   color: 'var(--accent-gold)',            bg: 'var(--accent-gold-light)' },
  event_rsvp:              { icon: Calendar,      color: 'var(--accent-teal)',            bg: 'var(--accent-teal-light)' },
  appointment_request:     { icon: Clock,         color: 'var(--accent-gold)',            bg: 'var(--accent-gold-light)' },
  appointment_confirmed:   { icon: Clock,         color: 'var(--accent-gold)',            bg: 'var(--accent-gold-light)' },
  appointment_declined:    { icon: Clock,         color: 'var(--accent-burgundy)',        bg: 'var(--accent-burgundy-light)' },
  waitlist_spot_open:      { icon: Clock,         color: 'var(--accent-gold)',            bg: 'var(--accent-gold-light)' },
  church_announcement:     { icon: Megaphone,     color: 'var(--accent-green)',           bg: 'var(--accent-green-light)' }
}

// Determine where to navigate when tapping a notification
function getNavPath(notif) {
  switch (notif.referenceType) {
    case 'conversation': return '/chat'
    case 'prayer':       return '/prayer-board'
    case 'event':        return `/events/${notif.referenceId}`
    case 'appointment':  return '/appointments'
    case 'church':       return `/churches/${notif.referenceId}`
    case 'user':         return `/user/${notif.referenceId}`
    default:             return '/dashboard'
  }
}

function Notifications() {
  const navigate = useNavigate()
  const {
    notifications,
    unreadNotifCount,
    fetchNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
    selectConversation
  } = useApp()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  async function loadNotifications() {
    try {
      setLoading(true)
      setError(null)
      await fetchNotifications()
    } catch (err) {
      setError('Failed to load notifications. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Load notifications on mount
  useEffect(() => { loadNotifications() }, [])

  // Handle tapping a notification: mark read + navigate
  async function handleTap(notif) {
    if (!notif.isRead) {
      await markNotificationRead(notif.id)
    }

    // Special case: message notifications select the conversation first
    if (notif.referenceType === 'conversation' && notif.referenceId) {
      await selectConversation(notif.referenceId)
      navigate('/chat')
      return
    }

    navigate(getNavPath(notif))
  }

  // Handle deleting a notification (stop bubbling to tap handler)
  async function handleDelete(e, notif) {
    e.stopPropagation()
    await deleteNotification(notif.id)
  }

  return (
    <div className="screen with-bottom-nav">
      {/* Header */}
      <div className="screen-header">
        <div className="screen-header-top">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
          </button>
          <h1 className="screen-header-title">Notifications</h1>
          {unreadNotifCount > 0 ? (
            <button className="notif-mark-all-btn" onClick={markAllNotificationsRead}>
              <CheckCheck size={18} />
            </button>
          ) : (
            <div className="header-spacer" />
          )}
        </div>
      </div>

      {/* Content */}
      <div className="notif-content">
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorState subtitle={error} onAction={loadNotifications} />
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No Notifications"
            subtitle="You're all caught up! Notifications will appear here when someone interacts with you."
          />
        ) : (
          <div className="notif-list">
            {notifications.map(notif => {
              const config = NOTIF_CONFIG[notif.type] || NOTIF_CONFIG.new_message
              const Icon = config.icon

              return (
                <div
                  key={notif.id}
                  className={`notif-item ${!notif.isRead ? 'notif-unread' : ''}`}
                  onClick={() => handleTap(notif)}
                >
                  {/* Type Icon */}
                  <div
                    className="notif-icon"
                    style={{ background: config.bg, color: config.color }}
                  >
                    <Icon size={20} />
                  </div>

                  {/* Text Content */}
                  <div className="notif-text">
                    <div className="notif-title">{notif.title}</div>
                    {notif.body && <div className="notif-body">{notif.body}</div>}
                    <div className="notif-time">{timeAgo(notif.createdAt)}</div>
                  </div>

                  {/* Right side: unread dot + delete */}
                  <div className="notif-actions">
                    {!notif.isRead && <div className="notif-unread-dot" />}
                    <button
                      className="notif-delete-btn"
                      onClick={(e) => handleDelete(e, notif)}
                      aria-label="Delete notification"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default Notifications
