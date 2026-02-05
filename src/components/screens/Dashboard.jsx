// =============================================================================
// DASHBOARD COMPONENT
// =============================================================================
// The main home screen showing:
// - Welcome header with user info
// - Stats (upcoming sessions, completed, seekers)
// - Daily Bible quote
// - Recent appointments preview

import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { Avatar, Card, Badge } from '../common'

function Dashboard() {
  const navigate = useNavigate()

  // Get data from our app context
  const {
    user,
    appointments,
    upcomingCount,
    completedCount,
    uniqueSeekersCount,
    getDailyQuote
  } = useApp()

  // Get today's Bible quote
  const quote = getDailyQuote()

  // Get upcoming appointments (not completed) for preview
  const upcomingAppointments = appointments
    .filter(apt => apt.status !== 'completed')
    .slice(0, 3)  // Only show first 3

  // Format date for display
  function formatDate(dateStr) {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="screen with-bottom-nav">
      {/* ===== HEADER ===== */}
      <div className="dashboard-header">
        <div className="dashboard-user-row">
          <div>
            <p style={{ opacity: 0.9, marginBottom: '4px' }}>Welcome back,</p>
            <h1 style={{ fontSize: '24px', fontWeight: '700' }}>
              {user?.name || 'Guide'}
            </h1>
          </div>
          <Avatar
            src={user?.photoUrl}
            emoji={user?.avatar}
            size="lg"
            variant="white"
          />
        </div>
      </div>

      {/* ===== CONTENT ===== */}
      <div className="screen-content">
        {/* Stats Box */}
        <div className="stats-box">
          <div className="stats-box-title">Your Impact</div>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{upcomingCount}</div>
              <div className="stat-label">Upcoming Sessions</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{completedCount}</div>
              <div className="stat-label">Completed</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{uniqueSeekersCount}</div>
              <div className="stat-label">Seekers Helped</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">4.9</div>
              <div className="stat-label">Rating</div>
            </div>
          </div>
        </div>

        {/* Daily Quote */}
        <Card>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontStyle: 'italic', color: '#374151', marginBottom: '8px' }}>
              "{quote.text}"
            </p>
            <p style={{ fontSize: '13px', color: '#1e3a8a', fontWeight: '600' }}>
              — {quote.ref}
            </p>
          </div>
        </Card>

        {/* Upcoming Appointments */}
        <div className="section-header">
          <h2 className="section-title">Upcoming Sessions</h2>
          <button
            className="view-all-btn"
            onClick={() => navigate('/appointments')}
          >
            View All
          </button>
        </div>

        {upcomingAppointments.length === 0 ? (
          <Card>
            <div className="empty-state" style={{ padding: '24px' }}>
              <div className="empty-icon">📅</div>
              <div className="empty-text">No upcoming sessions</div>
              <div className="empty-subtext">Your schedule is clear</div>
            </div>
          </Card>
        ) : (
          upcomingAppointments.map(apt => (
            <Card key={apt.id} onClick={() => navigate('/appointments')}>
              <div className="apt-row">
                <Avatar emoji={apt.avatar} size="md" variant="blue" />
                <div className="apt-info">
                  <div className="apt-header">
                    <span className="apt-name">{apt.name}</span>
                    <Badge status={apt.status} />
                  </div>
                  <div className="apt-meta">
                    {apt.type} • {formatDate(apt.date)} at {apt.time}
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

export default Dashboard
