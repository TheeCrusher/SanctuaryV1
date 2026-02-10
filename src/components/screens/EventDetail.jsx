// =============================================================================
// EVENT DETAIL SCREEN
// =============================================================================
// Shows full event info, RSVP button, and attendee list.
// Reached by tapping an event card on EventsScreen.
//
// Route: /events/:id

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Calendar, MapPin, Clock, Tag, Users, User } from 'lucide-react'
import { api } from '../../utils/api'
import { useApp } from '../../context/AppContext'
import { Avatar } from '../common'

function EventDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { showUserActionMenu, user } = useApp()

  const [event, setEvent] = useState(null)
  const [attendees, setAttendees] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadEvent()
  }, [id])

  async function loadEvent() {
    try {
      setLoading(true)
      const data = await api.get(`/events/${id}`)
      setEvent(data.event)
      setAttendees(data.attendees)
    } catch (error) {
      console.error('Failed to load event:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleRsvp() {
    if (!event) return
    try {
      if (event.hasRsvpd) {
        await api.delete(`/events/${id}/rsvp`)
      } else {
        await api.post(`/events/${id}/rsvp`)
      }
      loadEvent()
    } catch (error) {
      console.error('RSVP failed:', error)
    }
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
    })
  }

  function formatTime(dateStr) {
    const d = new Date(dateStr)
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric', minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="screen-container" style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-faint)' }}>
        Loading event...
      </div>
    )
  }

  if (!event) {
    return (
      <div className="screen-container">
        <button className="back-btn" onClick={() => navigate('/events')}>
          <ArrowLeft size={22} />
        </button>
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-faint)' }}>
          Event not found
        </div>
      </div>
    )
  }

  return (
    <div className="screen-container event-detail-screen">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <button className="back-btn" onClick={() => navigate('/events')}>
          <ArrowLeft size={22} />
        </button>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>Event Details</h2>
      </div>

      {/* Event info card */}
      <div className="event-detail-card">
        <div className="event-detail-title">{event.title}</div>
        <span className="event-detail-category">{event.category}</span>

        <div className="event-detail-info">
          <div className="event-detail-info-row">
            <Calendar size={18} />
            <span>{formatDate(event.dateTime)}</span>
          </div>
          <div className="event-detail-info-row">
            <Clock size={18} />
            <span>{formatTime(event.dateTime)}</span>
          </div>
          {event.location && (
            <div className="event-detail-info-row">
              <MapPin size={18} />
              <span>{event.location}</span>
            </div>
          )}
          {event.churchName && (
            <div className="event-detail-info-row">
              <Tag size={18} />
              <span>{event.churchName}</span>
            </div>
          )}
        </div>

        {event.description && (
          <div className="event-detail-desc">{event.description}</div>
        )}

        <div
          className="event-detail-creator"
          style={{ cursor: event.creatorId !== user?.id ? 'pointer' : 'default' }}
          onClick={() => event.creatorId !== user?.id && showUserActionMenu({
            userId: event.creatorId, userName: event.creatorName,
            photoUrl: event.creatorPhoto, avatar: event.creatorAvatar
          })}
        >
          <Avatar
            src={event.creatorPhoto}
            emoji={event.creatorAvatar}
            name={event.creatorName}
            size="sm"
          />
          <span>Created by {event.creatorName}</span>
        </div>
      </div>

      {/* RSVP button */}
      <button
        className={`event-detail-rsvp-btn ${event.hasRsvpd ? 'active' : ''}`}
        onClick={handleRsvp}
      >
        <Users size={20} />
        {event.hasRsvpd ? `Going (${event.rsvpCount})` : `I'm Going (${event.rsvpCount})`}
      </button>

      {/* Attendees */}
      {attendees.length > 0 && (
        <div className="event-attendees-section">
          <div className="event-attendees-title">
            Attendees ({attendees.length})
          </div>
          {attendees.map(a => (
            <div key={a.id} className="event-attendee-row">
              <div
                className="event-attendee-user"
                style={{ cursor: a.id !== user?.id ? 'pointer' : 'default' }}
                onClick={() => a.id !== user?.id && showUserActionMenu({
                  userId: a.id, userName: a.name,
                  photoUrl: a.photoUrl, avatar: a.avatar
                })}
              >
                <Avatar
                  src={a.photoUrl}
                  emoji={a.avatar}
                  name={a.name}
                  size="sm"
                />
                <span className="event-attendee-name">{a.name}</span>
              </div>
              <span
                className="event-attendee-role"
                style={{
                  background: a.role === 'guide' ? 'rgba(59,130,246,0.1)' : 'rgba(16,185,129,0.1)',
                  color: a.role === 'guide' ? '#3b82f6' : '#10b981'
                }}
              >
                {a.role.charAt(0).toUpperCase() + a.role.slice(1)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default EventDetail
