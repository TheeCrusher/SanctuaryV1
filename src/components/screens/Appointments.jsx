// =============================================================================
// APPOINTMENTS SCREEN
// =============================================================================
// Shows all appointments grouped by status (pending, confirmed, completed, declined).
// Allows creating new appointments with optional recurrence.
// Supports cancelling individual or entire series of recurring appointments.
// Role-aware: Guides select a Seeker, Seekers select a Guide from community.
// Only guides can confirm/decline pending appointment requests.

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { Avatar, Card, Badge, Modal, EmptyState } from '../common'
import { Plus, Calendar, Repeat, X, CalendarDays, CalendarPlus, Download, ArrowLeft } from 'lucide-react'
import { api } from '../../utils/api'

function Appointments() {
  const navigate = useNavigate()
  const [showModal, setShowModal] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(null)
  const [communityGuides, setCommunityGuides] = useState([])
  const [communitySeekers, setCommunitySeekers] = useState([])
  const [confirmError, setConfirmError] = useState(null)

  const [formData, setFormData] = useState({
    name: '',
    guideId: '',
    seekerId: '',
    date: '',
    time: '',
    duration: '60',
    type: 'Bible Study',
    notes: '',
    recurrenceRule: 'none',
    recurrenceEndDate: ''
  })

  const {
    user,
    appointments,
    createAppointment,
    confirmAppointment,
    declineAppointment,
    completeAppointment,
    cancelAppointment,
    cancelSeries
  } = useApp()

  const isSeeker = user?.role?.toLowerCase() === 'seeker'

  // Load community connections for the dropdown
  useEffect(() => {
    if (isSeeker) {
      loadGuides()
    } else {
      loadSeekers()
    }
  }, [isSeeker])

  async function loadGuides() {
    try {
      const data = await api.get('/community')
      const guides = (data.community || []).filter(p => p.role === 'Guide')
      setCommunityGuides(guides)
    } catch (error) {
      console.error('Failed to load community guides:', error)
    }
  }

  async function loadSeekers() {
    try {
      const data = await api.get('/community')
      const seekers = (data.community || []).filter(p => p.role === 'Seeker')
      setCommunitySeekers(seekers)
    } catch (error) {
      console.error('Failed to load community seekers:', error)
    }
  }

  // Group appointments by status
  const pendingApts = appointments.filter(a => a.status === 'pending')
  const confirmedApts = appointments.filter(a => a.status === 'confirmed')
  const completedApts = appointments.filter(a => a.status === 'completed')
  const declinedApts = appointments.filter(a => a.status === 'declined')

  // Smart display name: show the OTHER person's name
  function getDisplayName(apt) {
    return isSeeker
      ? (apt.guideName || apt.seekerName)
      : apt.seekerName
  }

  function formatDate(dateStr) {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  function handleInputChange(e) {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()

    const submitData = { ...formData }

    if (isSeeker) {
      // Seeker: auto-fill their name, send the selected guideId
      submitData.name = user.name
      submitData.guideId = Number(formData.guideId)
      delete submitData.seekerId
    } else {
      // Guide: look up seeker name from the dropdown selection
      const selectedSeeker = communitySeekers.find(s => s.id === Number(formData.seekerId))
      submitData.name = selectedSeeker ? selectedSeeker.name : formData.name
      submitData.seekerId = Number(formData.seekerId)
      delete submitData.guideId
    }

    await createAppointment(submitData)

    setFormData({
      name: '',
      guideId: '',
      seekerId: '',
      date: '',
      time: '',
      duration: '60',
      type: 'Bible Study',
      notes: '',
      recurrenceRule: 'none',
      recurrenceEndDate: ''
    })
    setShowModal(false)
  }

  function recurrenceLabel(rule) {
    const labels = { weekly: 'Weekly', biweekly: 'Biweekly', monthly: 'Monthly' }
    return labels[rule] || null
  }

  // Build a Google Calendar "Add Event" URL
  function googleCalendarUrl(apt) {
    const otherName = getDisplayName(apt)
    const startDt = apt.date.replace(/-/g, '') + 'T' + apt.time.replace(':', '') + '00'
    const [h, m] = apt.time.split(':').map(Number)
    const endMinutes = h * 60 + m + Number(apt.duration)
    const endH = String(Math.floor(endMinutes / 60)).padStart(2, '0')
    const endM = String(endMinutes % 60).padStart(2, '0')
    const endDt = apt.date.replace(/-/g, '') + 'T' + endH + endM + '00'

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: `Sanctuary: ${apt.type} with ${otherName}`,
      dates: `${startDt}/${endDt}`,
      details: apt.notes || `${apt.type} session with ${otherName}`,
    })
    return `https://calendar.google.com/calendar/render?${params.toString()}`
  }

  // Generate and download an .ics file
  function downloadIcs(apt) {
    const otherName = getDisplayName(apt)
    const startDt = apt.date.replace(/-/g, '') + 'T' + apt.time.replace(':', '') + '00'
    const [h, m] = apt.time.split(':').map(Number)
    const endMinutes = h * 60 + m + Number(apt.duration)
    const endH = String(Math.floor(endMinutes / 60)).padStart(2, '0')
    const endM = String(endMinutes % 60).padStart(2, '0')
    const endDt = apt.date.replace(/-/g, '') + 'T' + endH + endM + '00'

    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Sanctuary//EN',
      'BEGIN:VEVENT',
      `DTSTART:${startDt}`,
      `DTEND:${endDt}`,
      `SUMMARY:Sanctuary: ${apt.type} with ${otherName}`,
      `DESCRIPTION:${apt.notes || apt.type + ' session'}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n')

    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sanctuary-session-${apt.date}.ics`
    a.click()
    URL.revokeObjectURL(url)
  }

  function AppointmentCard({ apt }) {
    const displayName = getDisplayName(apt)
    const isGuideOnThis = user?.id === apt.guideId

    return (
      <Card>
        <div className="apt-row">
          <Avatar emoji={apt.avatar} size="md" variant="blue" />
          <div className="apt-info">
            <div className="apt-header">
              <span className="apt-name">{displayName}</span>
              <Badge status={apt.status} />
            </div>
            <div className="apt-meta">
              {apt.type} • {formatDate(apt.date)} at {apt.time} • {apt.duration} min
            </div>
            {apt.recurrenceRule && apt.recurrenceRule !== 'none' && (
              <div className="apt-recurrence-tag">
                <Repeat size={12} />
                {recurrenceLabel(apt.recurrenceRule)}
              </div>
            )}
            {apt.notes && (
              <div className="apt-notes">{apt.notes}</div>
            )}

            {/* Calendar export buttons */}
            <div className="apt-cal-actions">
              <a
                href={googleCalendarUrl(apt)}
                target="_blank"
                rel="noopener noreferrer"
                className="apt-cal-btn"
                title="Add to Google Calendar"
              >
                <CalendarPlus size={14} /> Google
              </a>
              <button className="apt-cal-btn" onClick={() => downloadIcs(apt)} title="Download .ics file">
                <Download size={14} /> .ics
              </button>
            </div>

            {apt.status !== 'completed' && apt.status !== 'declined' && (
              <div className="apt-actions">
                {/* Only the guide can confirm/decline pending appointments */}
                {apt.status === 'pending' && isGuideOnThis && (
                  <>
                    <button
                      className="btn-primary"
                      style={{ padding: '8px 16px', fontSize: '14px' }}
                      onClick={async () => {
                        try {
                          setConfirmError(null)
                          await confirmAppointment(apt.id)
                        } catch (err) {
                          setConfirmError(err.message || 'Failed to confirm')
                        }
                      }}
                    >
                      Confirm
                    </button>
                    <button
                      className="btn-cancel-apt"
                      onClick={async () => {
                        try {
                          await declineAppointment(apt.id)
                        } catch (err) {
                          console.error('Failed to decline:', err)
                        }
                      }}
                    >
                      Decline
                    </button>
                  </>
                )}
                {apt.status === 'confirmed' && isGuideOnThis && (
                  <button
                    className="btn-primary"
                    style={{ padding: '8px 16px', fontSize: '14px' }}
                    onClick={() => completeAppointment(apt.id)}
                  >
                    Complete
                  </button>
                )}
                <button
                  className="btn-cancel-apt"
                  onClick={() => setShowCancelConfirm(apt)}
                >
                  <X size={14} /> Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="screen with-bottom-nav">
      {/* Header */}
      <div className="screen-header">
        <div className="screen-header-top">
          <button className="back-btn" onClick={() => navigate('/')}>
            <ArrowLeft size={20} />
          </button>
          <h1 style={{ fontSize: '24px', fontWeight: '700' }}>Sessions</h1>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="icon-btn" onClick={() => navigate('/calendar')} title="Calendar">
              <CalendarDays size={22} />
            </button>
            <button className="icon-btn" onClick={() => setShowModal(true)}>
              <Plus size={22} />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="screen-content">
        {/* Conflict error message */}
        {confirmError && (
          <div style={{
            background: 'var(--alert-error-bg)',
            border: '1px solid var(--alert-error-text)',
            color: 'var(--alert-error-text)',
            padding: '12px 16px',
            borderRadius: '10px',
            marginBottom: '12px',
            fontSize: '14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>{confirmError}</span>
            <button
              onClick={() => setConfirmError(null)}
              style={{ background: 'none', border: 'none', color: 'var(--alert-error-text)', cursor: 'pointer', fontWeight: 'bold', fontSize: '18px', padding: '0 4px' }}
            >
              &times;
            </button>
          </div>
        )}

        {appointments.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No sessions yet"
            subtitle="Create your first session to get started"
            actionLabel="New Session"
            onAction={() => setShowModal(true)}
          />
        ) : (
          <>
            {pendingApts.length > 0 && (
              <>
                <div className="section-divider">Pending ({pendingApts.length})</div>
                {pendingApts.map(apt => (
                  <AppointmentCard key={apt.id} apt={apt} />
                ))}
              </>
            )}

            {confirmedApts.length > 0 && (
              <>
                <div className="section-divider">Confirmed ({confirmedApts.length})</div>
                {confirmedApts.map(apt => (
                  <AppointmentCard key={apt.id} apt={apt} />
                ))}
              </>
            )}

            {completedApts.length > 0 && (
              <>
                <div className="section-divider">Completed ({completedApts.length})</div>
                {completedApts.map(apt => (
                  <AppointmentCard key={apt.id} apt={apt} />
                ))}
              </>
            )}

            {declinedApts.length > 0 && (
              <>
                <div className="section-divider">Declined ({declinedApts.length})</div>
                {declinedApts.map(apt => (
                  <AppointmentCard key={apt.id} apt={apt} />
                ))}
              </>
            )}
          </>
        )}
      </div>

      {/* New Appointment Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="New Session"
      >
        <form onSubmit={handleSubmit}>
          {/* Role-aware first field */}
          {isSeeker ? (
            <div className="form-group">
              <label className="form-label" htmlFor="guideId">Which Guide?</label>
              <select
                id="guideId"
                name="guideId"
                value={formData.guideId}
                onChange={handleInputChange}
                required
              >
                <option value="">Select a Guide...</option>
                {communityGuides.map(guide => (
                  <option key={guide.id} value={guide.id}>
                    {guide.name}
                  </option>
                ))}
              </select>
              {communityGuides.length === 0 && (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Add Guides to your Community first
                </div>
              )}
            </div>
          ) : (
            <div className="form-group">
              <label className="form-label" htmlFor="seekerId">Which Seeker?</label>
              <select
                id="seekerId"
                name="seekerId"
                value={formData.seekerId}
                onChange={handleInputChange}
                required
              >
                <option value="">Select a Seeker...</option>
                {communitySeekers.map(seeker => (
                  <option key={seeker.id} value={seeker.id}>
                    {seeker.name}
                  </option>
                ))}
              </select>
              {communitySeekers.length === 0 && (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Add Seekers to your Community first
                </div>
              )}
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="date">Date</label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="time">Time</label>
            <input
              type="time"
              id="time"
              name="time"
              value={formData.time}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="duration">Duration (minutes)</label>
            <select
              id="duration"
              name="duration"
              value={formData.duration}
              onChange={handleInputChange}
            >
              <option value="30">30 minutes</option>
              <option value="60">60 minutes</option>
              <option value="90">90 minutes</option>
              <option value="120">120 minutes</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="type">Session Type</label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleInputChange}
            >
              <option value="Bible Study">Bible Study</option>
              <option value="Prayer Session">Prayer Session</option>
              <option value="Counseling">Counseling</option>
              <option value="General Guidance">General Guidance</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="recurrenceRule">Repeat</label>
            <select
              id="recurrenceRule"
              name="recurrenceRule"
              value={formData.recurrenceRule}
              onChange={handleInputChange}
            >
              <option value="none">Does not repeat</option>
              <option value="weekly">Weekly</option>
              <option value="biweekly">Every 2 weeks</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          {formData.recurrenceRule !== 'none' && (
            <div className="form-group">
              <label className="form-label" htmlFor="recurrenceEndDate">Repeat Until</label>
              <input
                type="date"
                id="recurrenceEndDate"
                name="recurrenceEndDate"
                value={formData.recurrenceEndDate}
                onChange={handleInputChange}
                min={formData.date}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="notes">Notes (optional)</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="Add any notes about this session..."
            />
          </div>

          <div className="modal-buttons">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Create
            </button>
          </div>
        </form>
      </Modal>

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <Modal onClose={() => setShowCancelConfirm(null)}>
          <div className="modal-title">Cancel Session</div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Cancel the session with <strong>{getDisplayName(showCancelConfirm)}</strong> on {formatDate(showCancelConfirm.date)}?
          </p>

          <div className="modal-buttons" style={{ flexDirection: 'column', gap: '8px' }}>
            <button
              className="btn-primary"
              style={{ background: 'var(--danger-bg)', color: 'var(--danger-text)', width: '100%' }}
              onClick={() => {
                cancelAppointment(showCancelConfirm.id)
                setShowCancelConfirm(null)
              }}
            >
              Cancel This Session
            </button>

            {showCancelConfirm.seriesId && (
              <button
                className="btn-primary"
                style={{ background: 'var(--danger-bg)', color: 'var(--danger-text)', width: '100%' }}
                onClick={() => {
                  cancelSeries(showCancelConfirm.seriesId)
                  setShowCancelConfirm(null)
                }}
              >
                Cancel All Future in Series
              </button>
            )}

            <button
              className="btn-secondary"
              style={{ width: '100%' }}
              onClick={() => setShowCancelConfirm(null)}
            >
              Keep Session
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default Appointments
