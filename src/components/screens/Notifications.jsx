// =============================================================================
// NOTIFICATIONS SCREEN
// =============================================================================
// Shows all in-app notifications sorted by most recent first.
// Each notification has a type icon, title, body, timestamp, and unread indicator.
// Tapping a notification marks it as read and navigates to the related screen.

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { EmptyState } from '../common'
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
  new_message:             { icon: MessageCircle, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  connection_request:      { icon: UserPlus,      color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
  connection_accepted:     { icon: Users,         color: '#16a34a', bg: 'rgba(22,163,74,0.1)' },
  prayer_prayed:           { icon: Heart,         color: '#722F37', bg: 'rgba(114,47,55,0.1)' },
  prayer_comment:          { icon: MessageCircle, color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
  testimony_celebration:   { icon: PartyPopper,   color: '#C9A227', bg: 'rgba(201,162,39,0.1)' },
  event_rsvp:              { icon: Calendar,      color: '#06b6d4', bg: 'rgba(6,182,212,0.1)' },
  appointment_request:     { icon: Clock,         color: '#1e3a8a', bg: 'rgba(30,58,138,0.1)' },
  church_announcement:     { icon: Megaphone,     color: '#059669', bg: 'rgba(5,150,105,0.1)' }
}

// Format a timestamp into a relative string like "2 hours ago"
function timeAgo(dateString) {
  const now = new Date()
  const date = new Date(dateString)
  const seconds = Math.floor((now - date) / 1000)

  if (seconds < 60) return 'Just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  const weeks = Math.floor(days / 7)
  if (weeks < 4) return `${weeks}w ago`
  return date.toLocaleDateString()
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

  // Load notifications on mount
  useEffect(() => {
    async function load() {
      await fetchNotifications()
      setLoading(false)
    }
    load()
  }, [])

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
          <h1 style={{ fontSize: '20px', fontWeight: '700' }}>Notifications</h1>
          {unreadNotifCount > 0 ? (
            <button className="notif-mark-all-btn" onClick={markAllNotificationsRead}>
              <CheckCheck size={18} />
            </button>
          ) : (
            <div style={{ width: '40px' }} />
          )}
        </div>
      </div>

      {/* Content */}
      <div className="notif-content">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
            Loading notifications...
          </div>
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
