// =============================================================================
// APPOINTMENTS SCREEN
// =============================================================================
// Shows all appointments grouped by status (pending, confirmed, completed).
// Allows creating new appointments with optional recurrence.
// Supports cancelling individual or entire series of recurring appointments.

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { Avatar, Card, Badge, Modal, EmptyState } from '../common'
import { Plus, Calendar, Repeat, X, CalendarDays, CalendarPlus, Download } from 'lucide-react'

function Appointments() {
  const navigate = useNavigate()
  const [showModal, setShowModal] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(null)

  const [formData, setFormData] = useState({
    name: '',
    date: '',
    time: '',
    duration: '60',
    type: 'Bible Study',
    notes: '',
    recurrenceRule: 'none',
    recurrenceEndDate: ''
  })

  const {
    appointments,
    createAppointment,
    confirmAppointment,
    completeAppointment,
    cancelAppointment,
    cancelSeries
  } = useApp()

  // Group appointments by status
  const pendingApts = appointments.filter(a => a.status === 'pending')
  const confirmedApts = appointments.filter(a => a.status === 'confirmed')
  const completedApts = appointments.filter(a => a.status === 'completed')

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
    await createAppointment(formData)

    setFormData({
      name: '',
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
    const startDt = apt.date.replace(/-/g, '') + 'T' + apt.time.replace(':', '') + '00'
    const [h, m] = apt.time.split(':').map(Number)
    const endMinutes = h * 60 + m + Number(apt.duration)
    const endH = String(Math.floor(endMinutes / 60)).padStart(2, '0')
    const endM = String(endMinutes % 60).padStart(2, '0')
    const endDt = apt.date.replace(/-/g, '') + 'T' + endH + endM + '00'

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: `Sanctuary: ${apt.type} with ${apt.name}`,
      dates: `${startDt}/${endDt}`,
      details: apt.notes || `${apt.type} session with ${apt.name}`,
    })
    return `https://calendar.google.com/calendar/render?${params.toString()}`
  }

  // Generate and download an .ics file
  function downloadIcs(apt) {
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
      `SUMMARY:Sanctuary: ${apt.type} with ${apt.name}`,
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
    return (
      <Card>
        <div className="apt-row">
          <Avatar emoji={apt.avatar} size="md" variant="blue" />
          <div className="apt-info">
            <div className="apt-header">
              <span className="apt-name">{apt.name}</span>
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

            {apt.status !== 'completed' && (
              <div className="apt-actions">
                {apt.status === 'pending' && (
                  <button
                    className="btn-primary"
                    style={{ padding: '8px 16px', fontSize: '14px' }}
                    onClick={() => confirmAppointment(apt.id)}
                  >
                    Confirm
                  </button>
                )}
                {apt.status === 'confirmed' && (
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
          <div className="form-group">
            <label className="form-label" htmlFor="name">Seeker Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter name"
              required
            />
          </div>

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
            Cancel the session with <strong>{showCancelConfirm.name}</strong> on {formatDate(showCancelConfirm.date)}?
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
