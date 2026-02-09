// =============================================================================
// EVENTS SCREEN
// =============================================================================
// Browse, create, and RSVP to community events.
// Accessible from More Menu → Events.
//
// Features:
//   - Category filter tabs (All, Social, Service/Mission, Youth, Worship, Active/Outdoor)
//   - Event cards with RSVP button
//   - Create Event modal
//   - Tapping a card navigates to EventDetail

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Calendar, MapPin, Users, Tag, Clock } from 'lucide-react'
import { api } from '../../utils/api'
import { useApp } from '../../context/AppContext'
import Modal from '../common/Modal'

const CATEGORIES = ['All', 'Social', 'Service/Mission', 'Youth', 'Worship', 'Active/Outdoor']

function EventsScreen() {
  const navigate = useNavigate()
  const { allChurches } = useApp()

  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
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

  useEffect(() => {
    loadEvents()
  }, [selectedCategory])

  async function loadEvents() {
    try {
      setLoading(true)
      const params = selectedCategory !== 'All' ? `?category=${selectedCategory}` : ''
      const data = await api.get(`/events${params}`)
      setEvents(data.events)
    } catch (error) {
      console.error('Failed to load events:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleRsvp(e, eventId, hasRsvpd) {
    e.stopPropagation() // Don't navigate to detail
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

  async function handleCreate(e) {
    e.preventDefault()
    if (!title.trim() || !dateTime) return

    try {
      setCreating(true)
      await api.post('/events', {
        title: title.trim(),
        description: description.trim() || null,
        dateTime,
        location: location.trim() || null,
        category,
        churchId: churchId || null
      })
      // Reset form and close modal
      setTitle('')
      setDescription('')
      setDateTime('')
      setLocation('')
      setCategory('Social')
      setChurchId('')
      setShowCreateModal(false)
      loadEvents()
    } catch (error) {
      console.error('Failed to create event:', error)
    } finally {
      setCreating(false)
    }
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
        <button className="events-create-btn" onClick={() => setShowCreateModal(true)}>
          <Plus size={16} /> Create
        </button>
      </div>

      {/* Category filter tabs */}
      <div className="events-category-tabs">
        {CATEGORIES.map(cat => (
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
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-faint)' }}>
          Loading events...
        </div>
      ) : events.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-faint)' }}>
          No upcoming events{selectedCategory !== 'All' ? ` in ${selectedCategory}` : ''}
        </div>
      ) : (
        events.map(evt => (
          <div key={evt.id} className="event-card" onClick={() => navigate(`/events/${evt.id}`)}>
            <div className="event-card-header">
              <div className="event-card-title">{evt.title}</div>
              <span className="event-card-category">{evt.category}</span>
            </div>

            <div className="event-card-meta">
              <div className="event-card-meta-row">
                <Calendar size={14} />
                <span>{formatDate(evt.dateTime)} at {formatTime(evt.dateTime)}</span>
              </div>
              {evt.location && (
                <div className="event-card-meta-row">
                  <MapPin size={14} />
                  <span>{evt.location}</span>
                </div>
              )}
            </div>

            {evt.churchName && (
              <div className="event-card-church">{evt.churchName}</div>
            )}

            <div className="event-card-footer">
              <div className="event-rsvp-count">
                <Users size={14} />
                <span>{evt.rsvpCount} going</span>
              </div>
              <button
                className={`event-rsvp-btn ${evt.hasRsvpd ? 'active' : ''}`}
                onClick={(e) => handleRsvp(e, evt.id, evt.hasRsvpd)}
              >
                {evt.hasRsvpd ? 'Going' : "I'm Going"}
              </button>
            </div>
          </div>
        ))
      )}

      {/* Create Event Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Event"
      >
        <form className="create-event-form" onSubmit={handleCreate}>
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

          <div>
            <label>Category *</label>
            <select value={category} onChange={e => setCategory(e.target.value)}>
              {CATEGORIES.filter(c => c !== 'All').map(cat => (
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
            disabled={creating || !title.trim() || !dateTime}
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
