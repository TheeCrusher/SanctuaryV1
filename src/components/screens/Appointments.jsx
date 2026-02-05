// =============================================================================
// APPOINTMENTS SCREEN
// =============================================================================
// Shows all appointments grouped by status (pending, confirmed, completed).
// Allows creating new appointments and managing existing ones.

import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { Avatar, Card, Badge, Modal, EmptyState } from '../common'

function Appointments() {
  // State for the "New Appointment" modal
  const [showModal, setShowModal] = useState(false)

  // Form state for new appointment
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    time: '',
    duration: '60',
    type: 'Bible Study',
    notes: ''
  })

  // Get appointment functions from context
  const {
    appointments,
    createAppointment,
    confirmAppointment,
    completeAppointment
  } = useApp()

  // Group appointments by status
  const pendingApts = appointments.filter(a => a.status === 'pending')
  const confirmedApts = appointments.filter(a => a.status === 'confirmed')
  const completedApts = appointments.filter(a => a.status === 'completed')

  // Format date for display
  function formatDate(dateStr) {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  // Handle form input changes
  function handleInputChange(e) {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // Handle form submission
  async function handleSubmit(e) {
    e.preventDefault()
    await createAppointment(formData)

    // Reset form and close modal
    setFormData({
      name: '',
      date: '',
      time: '',
      duration: '60',
      type: 'Bible Study',
      notes: ''
    })
    setShowModal(false)
  }

  // Render a single appointment card
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
            {apt.notes && (
              <div className="apt-notes">{apt.notes}</div>
            )}

            {/* Action buttons based on status */}
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
          <button className="icon-btn" onClick={() => setShowModal(true)}>
            +
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="screen-content">
        {appointments.length === 0 ? (
          <EmptyState
            icon="📅"
            title="No sessions yet"
            subtitle="Create your first session to get started"
            actionLabel="New Session"
            onAction={() => setShowModal(true)}
          />
        ) : (
          <>
            {/* Pending Section */}
            {pendingApts.length > 0 && (
              <>
                <div className="section-divider">Pending ({pendingApts.length})</div>
                {pendingApts.map(apt => (
                  <AppointmentCard key={apt.id} apt={apt} />
                ))}
              </>
            )}

            {/* Confirmed Section */}
            {confirmedApts.length > 0 && (
              <>
                <div className="section-divider">Confirmed ({confirmedApts.length})</div>
                {confirmedApts.map(apt => (
                  <AppointmentCard key={apt.id} apt={apt} />
                ))}
              </>
            )}

            {/* Completed Section */}
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
    </div>
  )
}

export default Appointments
