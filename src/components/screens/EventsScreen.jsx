// =============================================================================
// EVENTS SCREEN
// =============================================================================
// Browse, create, and RSVP to community events.
// Two top-level tabs: In-Person and Digital.
// Digital events support live streams and recorded content with Join/Watch buttons.
//
// Features:
//   - In-Person / Digital toggle tabs
//   - Category filter tabs (different sets per event type)
//   - Event cards with RSVP or Join/Watch buttons
//   - LIVE NOW badge for active livestreams
//   - Create Event modal with type-specific fields

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Calendar, MapPin, Users, Video, Radio, ExternalLink, Clock } from 'lucide-react'
import { api } from '../../utils/api'
import { useApp } from '../../context/AppContext'
import { Modal, LoadingSpinner, ErrorState, EmptyState } from '../common'

const IN_PERSON_CATEGORIES = ['All', 'Social', 'Service/Mission', 'Youth', 'Worship', 'Active/Outdoor']
const DIGITAL_CATEGORIES = ['All', 'Sermons/Teachings', 'Prayer', 'Worship', 'Bible Study', 'General']

function getPlatformName(url) {
  if (!url) return 'Online'
  const lower = url.toLowerCase()
  if (lower.includes('youtube') || lower.includes('youtu.be')) return 'YouTube'
  if (lower.includes('zoom')) return 'Zoom'
  if (lower.includes('facebook') || lower.includes('fb.')) return 'Facebook Live'
  if (lower.includes('twitch')) return 'Twitch'
  if (lower.includes('vimeo')) return 'Vimeo'
  return 'Online'
}

function EventsScreen() {
  const navigate = useNavigate()
  const { allChurches } = useApp()

  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [eventType, setEventType] = useState('in_person')
  const [selectedCategory, setSelectedCategory] = useState('All')

  // Create modal state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dateTime, setDateTime] = useState('')
  const [location, setLocation] = useState('')
  const [category, setCategory] = useState('Social')
  const [churchId, setChurchId] = useState('')
  const [creating, setCreating] = useState(false)
  // Digital event create fields
  const [createEventType, setCreateEventType] = useState('in_person')
  const [eventLink, setEventLink] = useState('')
  const [isLive, setIsLive] = useState(true)

  const categories = eventType === 'in_person' ? IN_PERSON_CATEGORIES : DIGITAL_CATEGORIES

  useEffect(() => {
    loadEvents()
  }, [selectedCategory, eventType])

  async function loadEvents() {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams()
      params.set('event_type', eventType)
      if (selectedCategory !== 'All') params.set('category', selectedCategory)
      const data = await api.get(`/events?${params.toString()}`)
      setEvents(data.events)
    } catch (err) {
      console.error('Failed to load events:', err)
      setError('Failed to load events. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleEventTypeChange(type) {
    setEventType(type)
    setSelectedCategory('All')
  }

  async function handleRsvp(e, eventId, hasRsvpd) {
    e.stopPropagation()
    try {
      if (hasRsvpd) {
        await api.delete(`/events/${eventId}/rsvp`)
      } else {
        await api.post(`/events/${eventId}/rsvp`)
      }
      loadEvents()
    } catch (error) {
      console.error('RSVP failed:', error)
    }
  }

  function resetCreateForm() {
    setTitle('')
    setDescription('')
    setDateTime('')
    setLocation('')
    setCategory(createEventType === 'digital' ? 'General' : 'Social')
    setChurchId('')
    setEventLink('')
    setIsLive(true)
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!title.trim()) return
    if (createEventType === 'in_person' && !dateTime) return

    try {
      setCreating(true)
      const body = {
        title: title.trim(),
        description: description.trim() || null,
        dateTime: dateTime || null,
        category,
        churchId: churchId || null,
        eventType: createEventType
      }
      if (createEventType === 'in_person') {
        body.location = location.trim() || null
      } else {
        body.eventLink = eventLink.trim() || null
        body.isLive = isLive
      }
      await api.post('/events', body)
      resetCreateForm()
      setShowCreateModal(false)
      // Switch to the tab matching what was just created
      if (createEventType !== eventType) {
        setEventType(createEventType)
        setSelectedCategory('All')
      } else {
        loadEvents()
      }
    } catch (error) {
      console.error('Failed to create event:', error)
    } finally {
      setCreating(false)
    }
  }

  function handleCreateEventTypeChange(type) {
    setCreateEventType(type)
    setCategory(type === 'digital' ? 'General' : 'Social')
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric'
    })
  }

  function formatTime(dateStr) {
    const d = new Date(dateStr)
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric', minute: '2-digit'
    })
  }

  const createCategories = createEventType === 'in_person'
    ? IN_PERSON_CATEGORIES.filter(c => c !== 'All')
    : DIGITAL_CATEGORIES.filter(c => c !== 'All')

  return (
    <div className="screen-container" style={{ paddingBottom: '100px' }}>
      {/* Header */}
      <div className="events-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="back-btn" onClick={() => navigate('/more')}>
            <ArrowLeft size={22} />
          </button>
          <h2>Community Events</h2>
        </div>
        <button className="events-create-btn" onClick={() => {
          setCreateEventType(eventType)
          setCategory(eventType === 'digital' ? 'General' : 'Social')
          setShowCreateModal(true)
        }}>
          <Plus size={16} /> Create
        </button>
      </div>

      {/* Top-level type tabs (In-Person / Digital) */}
      <div className="events-type-tabs">
        <button
          className={`events-type-tab ${eventType === 'in_person' ? 'active' : ''}`}
          onClick={() => handleEventTypeChange('in_person')}
        >
          In-Person
        </button>
        <button
          className={`events-type-tab ${eventType === 'digital' ? 'active' : ''}`}
          onClick={() => handleEventTypeChange('digital')}
        >
          Digital
        </button>
      </div>

      {/* Category filter tabs */}
      <div className="events-category-tabs">
        {categories.map(cat => (
          <button
            key={cat}
            className={`events-category-tab ${selectedCategory === cat ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Events list */}
      {loading ? (
        <LoadingSpinner message="Loading events..." />
      ) : error ? (
        <ErrorState subtitle={error} onAction={loadEvents} />
      ) : events.length === 0 ? (
        <EmptyState
          icon={eventType === 'digital' ? Video : Calendar}
          title={selectedCategory !== 'All'
            ? `No ${eventType === 'digital' ? 'digital' : ''} events in ${selectedCategory}`
            : eventType === 'digital' ? 'No digital events yet' : 'No upcoming events'}
          subtitle="Be the first to create an event!"
          actionLabel="Create Event"
          onAction={() => {
            setCreateEventType(eventType)
            setCategory(eventType === 'digital' ? 'General' : 'Social')
            setShowCreateModal(true)
          }}
        />
      ) : (
        events.map(evt => {
          const isDigital = evt.eventType === 'digital'

          return (
            <div
              key={evt.id}
              className={`event-card ${isDigital ? 'event-card-digital' : ''}`}
              onClick={() => navigate(`/events/${evt.id}`)}
            >
              <div className="event-card-header">
                <div className="event-card-title">
                  {isDigital && <Video size={16} className="event-digital-icon" />}
                  {evt.title}
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
                  {evt.status === 'live_now' && (
                    <span className="event-live-badge"><span className="event-live-dot" />LIVE</span>
                  )}
                  {evt.status === 'recorded' && (
                    <span className="event-recorded-badge">Watch Anytime</span>
                  )}
                  <span className="event-card-category">{evt.category}</span>
                </div>
              </div>

              <div className="event-card-meta">
                {/* Date/time — show differently for recorded vs live/in-person */}
                {evt.status === 'recorded' ? (
                  <div className="event-card-meta-row">
                    <Clock size={14} />
                    <span>Available anytime</span>
                  </div>
                ) : (
                  <div className="event-card-meta-row">
                    <Calendar size={14} />
                    <span>{formatDate(evt.dateTime)} at {formatTime(evt.dateTime)}</span>
                  </div>
                )}

                {/* Location (in-person) or Platform (digital) */}
                {isDigital && evt.eventLink ? (
                  <div className="event-card-meta-row">
                    <ExternalLink size={14} />
                    <span className="event-platform-name">{getPlatformName(evt.eventLink)}</span>
                  </div>
                ) : !isDigital && evt.location ? (
                  <div className="event-card-meta-row">
                    <MapPin size={14} />
                    <span>{evt.location}</span>
                  </div>
                ) : null}
              </div>

              {evt.churchName && (
                <div className="event-card-church">{evt.churchName}</div>
              )}

              <div className="event-card-footer">
                <div className="event-rsvp-count">
                  <Users size={14} />
                  <span>{evt.rsvpCount} {isDigital ? 'interested' : 'going'}</span>
                </div>
                {isDigital && evt.eventLink ? (
                  <button
                    className="event-join-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      window.open(evt.eventLink, '_blank', 'noopener,noreferrer')
                    }}
                  >
                    {evt.isLive ? 'Join' : 'Watch'}
                  </button>
                ) : (
                  <button
                    className={`event-rsvp-btn ${evt.hasRsvpd ? 'active' : ''}`}
                    onClick={(e) => handleRsvp(e, evt.id, evt.hasRsvpd)}
                  >
                    {evt.hasRsvpd ? 'Going' : "I'm Going"}
                  </button>
                )}
              </div>
            </div>
          )
        })
      )}

      {/* Create Event Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => { setShowCreateModal(false); resetCreateForm() }}
        title="Create Event"
      >
        <form className="create-event-form" onSubmit={handleCreate}>
          {/* Event Type Toggle */}
          <div>
            <label>Event Type</label>
            <div className="create-event-type-toggle">
              <button
                type="button"
                className={`toggle-btn ${createEventType === 'in_person' ? 'active' : ''}`}
                onClick={() => handleCreateEventTypeChange('in_person')}
              >
                <MapPin size={14} /> In-Person
              </button>
              <button
                type="button"
                className={`toggle-btn ${createEventType === 'digital' ? 'active' : ''}`}
                onClick={() => handleCreateEventTypeChange('digital')}
              >
                <Video size={14} /> Digital
              </button>
            </div>
          </div>

          <div>
            <label>Title *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Event name"
              maxLength={200}
              required
            />
          </div>

          <div>
            <label>Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What's this event about?"
              maxLength={1000}
            />
          </div>

          {/* Conditional fields based on event type */}
          {createEventType === 'in_person' ? (
            <>
              <div>
                <label>Date & Time *</label>
                <input
                  type="datetime-local"
                  value={dateTime}
                  onChange={e => setDateTime(e.target.value)}
                  required
                />
              </div>
              <div>
                <label>Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="Where is it?"
                />
              </div>
            </>
          ) : (
            <>
              {/* Live / Recorded Toggle */}
              <div>
                <label>Format</label>
                <div className="create-event-type-toggle">
                  <button
                    type="button"
                    className={`toggle-btn ${isLive ? 'active' : ''}`}
                    onClick={() => setIsLive(true)}
                  >
                    <Radio size={14} /> Live
                  </button>
                  <button
                    type="button"
                    className={`toggle-btn ${!isLive ? 'active' : ''}`}
                    onClick={() => setIsLive(false)}
                  >
                    <Video size={14} /> Recorded
                  </button>
                </div>
              </div>
              {/* Date/time for live events */}
              {isLive && (
                <div>
                  <label>Date & Time *</label>
                  <input
                    type="datetime-local"
                    value={dateTime}
                    onChange={e => setDateTime(e.target.value)}
                    required
                  />
                </div>
              )}
              <div>
                <label>Link (URL to stream or video)</label>
                <input
                  type="url"
                  value={eventLink}
                  onChange={e => setEventLink(e.target.value)}
                  placeholder="https://youtube.com/live/..."
                />
              </div>
            </>
          )}

          <div>
            <label>Category *</label>
            <select value={category} onChange={e => setCategory(e.target.value)}>
              {createCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label>Church (optional)</label>
            <select value={churchId} onChange={e => setChurchId(e.target.value)}>
              <option value="">None — informal event</option>
              {allChurches.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={creating || !title.trim() || (createEventType === 'in_person' && !dateTime) || (createEventType === 'digital' && isLive && !dateTime)}
            style={{ marginTop: '8px' }}
          >
            {creating ? 'Creating...' : 'Create Event'}
          </button>
        </form>
      </Modal>
    </div>
  )
}

export default EventsScreen
