// =============================================================================
// DASHBOARD COMPONENT (Home Screen)
// =============================================================================
// Role-aware home screen — two distinct experiences:
//
// SEEKER  — spiritual home feed:
//   1. What's New (notifications)
//   2. Your Upcoming (next session + RSVP'd events)
//   3. Suggested Guides (2-3 from Find a Guide API)
//   4. Community Activity (prayer posts from connections)
//   5. Your Journey (stats)
//   6. Daily Word
//
// GUIDE   — ministry command center:
//   1. Updates (messages + connection requests, if any)
//   2. Pending Requests (action cards: confirm / decline)
//   3. Upcoming Sessions (confirmed)
//   4. Availability (quick toggle + max seekers)
//   5. Currently Working With (active seeker list)
//   6. Recent Notes
//   7. Ministry Stats + Daily Word

import './Dashboard.css'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { Avatar, Card, Badge, LoadingSpinner, ErrorState } from '../common'
import { api } from '../../utils/api'
import {
  MessageCircle, Users, Heart, Calendar, CheckCircle,
  ChevronRight, Bell, Flame, Trophy, CalendarCheck,
  CircleCheckBig, Star, FileText, ThumbsUp, X, Compass,
  Clock, UserCheck
} from 'lucide-react'
import { formatDateShort } from '../../utils/helpers'

function Dashboard() {
  const navigate = useNavigate()
  const {
    user, getDailyQuote, unreadNotifCount, notes,
    updateProfile, confirmAppointment, declineAppointment
  } = useApp()

  const [homeData, setHomeData]           = useState(null)
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState(null)
  const [suggestedGuides, setSuggested]   = useState([])   // seeker only
  const [actionLoading, setActionLoading] = useState(null) // apt id being actioned (guide)
  const [availLoading, setAvailLoading]   = useState(false)

  const quote = getDailyQuote()

  // ── Primary fetch ──────────────────────────────────────────────────────────
  async function fetchHome() {
    try {
      setLoading(true)
      setError(null)
      const data = await api.get('/home')
      setHomeData(data)
    } catch {
      setError('Failed to load home data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Secondary fetch: suggested guides (seeker only) ────────────────────────
  async function fetchSuggestedGuides() {
    try {
      const params = new URLSearchParams()
      if (user?.state) { params.set('scope', 'local'); params.set('state', user.state) }
      params.set('limit', '3')
      const data = await api.get(`/users/guides?${params}`)
      setSuggested(data.guides || [])
    } catch {
      // non-critical — silently skip
    }
  }

  useEffect(() => {
    fetchHome()
    if (user?.role === 'seeker') fetchSuggestedGuides()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Guide: confirm / decline directly from dashboard ──────────────────────
  async function handleConfirm(id) {
    setActionLoading(id)
    await confirmAppointment(id)
    await fetchHome()
    setActionLoading(null)
  }

  async function handleDecline(id) {
    setActionLoading(id)
    await declineAppointment(id)
    await fetchHome()
    setActionLoading(null)
  }

  // ── Guide: availability quick-toggle ──────────────────────────────────────
  async function toggleAvailability() {
    setAvailLoading(true)
    await updateProfile({ acceptingSeekers: !user?.acceptingSeekers })
    setAvailLoading(false)
  }

  // ── Derived data (guide only) ──────────────────────────────────────────────
  const pendingRequests   = homeData?.upcomingAppointments?.filter(a => a.status === 'pending')  || []
  const confirmedSessions = homeData?.upcomingAppointments?.filter(a => a.status === 'confirmed') || []

  // Unique active seekers derived from all upcoming appointments for this guide
  const activeSeekers = homeData ? (() => {
    const seen = new Set()
    return homeData.upcomingAppointments
      .filter(a => a.guideId === user?.id && a.seekerId && !seen.has(a.seekerId) && seen.add(a.seekerId))
      .map(a => ({ id: a.seekerId, name: a.seekerName, photo: a.seekerPhoto, avatar: a.avatar }))
  })() : []

  const recentNotes = (notes || []).slice(0, 3)

  // ── Notification presence flags ────────────────────────────────────────────
  const notifs = homeData?.notifications
  const seekerNotifs = notifs && (
    notifs.unreadMessages > 0 || notifs.pendingConnections > 0 || notifs.prayerActivity > 0
  )
  const guideGeneralNotifs = notifs && (
    notifs.unreadMessages > 0 || notifs.pendingConnections > 0
  )

  // ==========================================================================
  // SEEKER DASHBOARD
  // ==========================================================================
  function renderSeekerContent() {
    return (
      <>
        {/* SECTION: What's New */}
        <div className="home-section">
          <div className="home-section-header">
            <h2 className="home-section-title">What's New</h2>
          </div>

          {seekerNotifs ? (
            <div className="home-notif-list">
              {notifs.unreadMessages > 0 && (
                <Card onClick={() => navigate('/community')}>
                  <div className="home-notif-row">
                    <div className="home-notif-icon home-notif-messages"><MessageCircle size={20} /></div>
                    <span className="home-notif-text">
                      {notifs.unreadMessages} unread message{notifs.unreadMessages !== 1 ? 's' : ''}
                    </span>
                    <ChevronRight size={18} className="home-notif-arrow" />
                  </div>
                </Card>
              )}
              {notifs.pendingConnections > 0 && (
                <Card onClick={() => navigate('/community')}>
                  <div className="home-notif-row">
                    <div className="home-notif-icon home-notif-connections"><Users size={20} /></div>
                    <span className="home-notif-text">
                      {notifs.pendingConnections} connection request{notifs.pendingConnections !== 1 ? 's' : ''}
                    </span>
                    <ChevronRight size={18} className="home-notif-arrow" />
                  </div>
                </Card>
              )}
              {notifs.prayerActivity > 0 && (
                <Card onClick={() => navigate('/prayer-board')}>
                  <div className="home-notif-row">
                    <div className="home-notif-icon home-notif-prayers"><Heart size={20} /></div>
                    <span className="home-notif-text">
                      {notifs.prayerActivity} new prayer{notifs.prayerActivity !== 1 ? 's' : ''} on your requests
                    </span>
                    <ChevronRight size={18} className="home-notif-arrow" />
                  </div>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <div className="home-caught-up">
                <CheckCircle size={32} style={{ color: 'var(--success)' }} />
                <span className="home-caught-up-text">You're all caught up!</span>
              </div>
            </Card>
          )}
        </div>

        {/* SECTION: Your Upcoming */}
        <div className="home-section">
          <div className="home-section-header">
            <h2 className="home-section-title">Your Upcoming</h2>
            <button className="view-all-btn" onClick={() => navigate('/appointments')}>View All</button>
          </div>

          {homeData.upcomingAppointments.length === 0 && (!homeData.upcomingEvents || homeData.upcomingEvents.length === 0) ? (
            <Card>
              <div className="home-caught-up">
                <Calendar size={32} style={{ color: 'var(--text-faint)' }} />
                <span className="home-caught-up-text">Nothing coming up</span>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Explore events and book a session!</span>
              </div>
            </Card>
          ) : (() => {
            const allItems = [
              ...homeData.upcomingAppointments.map(a => ({ ...a, _type: 'apt' })),
              ...(homeData.upcomingEvents || []).map(e => ({ ...e, _type: 'evt' }))
            ]
            return allItems.slice(0, 5).map(item =>
              item._type === 'apt' ? (
                <Card key={`apt-${item.id}`} onClick={() => navigate('/appointments')}>
                  <div className="home-upcoming-row">
                    <Avatar src={item.guidePhoto} emoji={item.avatar} size="sm" />
                    <div className="home-upcoming-info">
                      <div className="home-upcoming-name">{item.guideName || item.seekerName}</div>
                      <div className="home-upcoming-meta">{item.type} · {formatDateShort(item.date)} at {item.time}</div>
                    </div>
                    <Badge status={item.status} />
                  </div>
                </Card>
              ) : (
                <Card key={`evt-${item.id}`} onClick={() => navigate(`/events/${item.id}`)}>
                  <div className="home-upcoming-row">
                    <div className="home-upcoming-icon">
                      <Calendar size={18} style={{ color: 'var(--brand-primary)' }} />
                    </div>
                    <div className="home-upcoming-info">
                      <div className="home-upcoming-name">{item.title}</div>
                      <div className="home-upcoming-meta">
                        {formatDateShort(item.dateTime)}{item.location ? ` · ${item.location}` : ''}
                      </div>
                    </div>
                    <span className="home-activity-badge">{item.category}</span>
                  </div>
                </Card>
              )
            )
          })()}
        </div>

        {/* SECTION: Suggested Guides */}
        <div className="home-section">
          <div className="home-section-header">
            <h2 className="home-section-title">Suggested Guides</h2>
            <button className="view-all-btn" onClick={() => navigate('/find-guide')}>See All</button>
          </div>

          {suggestedGuides.length === 0 ? (
            <Card onClick={() => navigate('/find-guide')}>
              <div className="home-caught-up">
                <Compass size={32} style={{ color: 'var(--accent-gold)' }} />
                <span className="home-caught-up-text">Find a spiritual guide</span>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Connect with a guide for your journey</span>
              </div>
            </Card>
          ) : (
            suggestedGuides.map(guide => (
              <Card key={guide.id}>
                <div className="dash-guide-row">
                  <Avatar src={guide.photoUrl} emoji={guide.avatar} size="sm" />
                  <div className="dash-guide-info">
                    <div className="dash-guide-name">{guide.name}</div>
                    <div className="dash-guide-meta">
                      {guide.specialization || guide.denomination || 'Spiritual Guide'}
                      {guide.city ? ` · ${guide.city}` : ''}
                    </div>
                    {guide.acceptingSeekers ? (
                      <span className="dash-guide-accepting">Accepting seekers</span>
                    ) : (
                      <span className="dash-guide-full">Currently full</span>
                    )}
                  </div>
                  <button
                    className="dash-guide-request-btn"
                    onClick={() => navigate(`/appointments?guideId=${guide.id}&guideName=${encodeURIComponent(guide.name)}`)}
                    disabled={!guide.acceptingSeekers}
                  >
                    Request
                  </button>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* SECTION: Community Activity */}
        <div className="home-section">
          <div className="home-section-header">
            <h2 className="home-section-title">Community Activity</h2>
            <button className="view-all-btn" onClick={() => navigate('/prayer-board')}>View All</button>
          </div>

          {homeData.communityActivity.length === 0 ? (
            <Card>
              <div className="home-caught-up">
                <Users size={32} style={{ color: 'var(--text-faint)' }} />
                <span className="home-caught-up-text">No recent activity</span>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Connect with others to see their prayers</span>
              </div>
            </Card>
          ) : (
            homeData.communityActivity.map(prayer => (
              <Card key={prayer.id} onClick={() => navigate('/prayer-board')}>
                <div className="home-activity-row">
                  <Avatar src={prayer.userPhoto} emoji={prayer.userAvatar} size="sm" />
                  <div className="home-activity-info">
                    <span className="home-activity-name">{prayer.userName}</span>
                    <span className="home-activity-title">{prayer.title}</span>
                  </div>
                  <span className="home-activity-badge">{prayer.category}</span>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* SECTION: Your Journey stats */}
        <div className="home-section">
          <div className="stats-box">
            <div className="stats-box-title">Your Journey</div>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">
                  <Flame size={20} className="stat-icon-inline stat-icon-gold" />
                  {homeData.sessionStats.studyStreak}
                </div>
                <div className="stat-label">Study Streak</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">
                  <CalendarCheck size={20} className="stat-icon-inline stat-icon-gold" />
                  {homeData.sessionStats.eventsAttending}
                </div>
                <div className="stat-label">Events Attending</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">
                  <Trophy size={20} className="stat-icon-inline stat-icon-gold" />
                  {homeData.sessionStats.communityScore}
                </div>
                <div className="stat-label">Community Score</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">
                  <CircleCheckBig size={20} className="stat-icon-inline stat-icon-gold" />
                  {homeData.sessionStats.sessionsCompleted}
                </div>
                <div className="stat-label">Sessions Done</div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION: Daily Word */}
        <div className="home-section">
          <div className="home-section-header">
            <h2 className="home-section-title">Daily Word</h2>
          </div>
          <Card>
            <div className="home-daily-word">
              <p className="home-daily-text">"{quote.text}"</p>
              <p className="home-daily-ref">— {quote.ref}</p>
            </div>
          </Card>
        </div>
      </>
    )
  }

  // ==========================================================================
  // GUIDE DASHBOARD
  // ==========================================================================
  function renderGuideContent() {
    const isAccepting = user?.acceptingSeekers !== false
    const maxSlots    = user?.maxPendingRequests || 5

    return (
      <>
        {/* SECTION: General updates (messages + connections) — shown only when present */}
        {guideGeneralNotifs && (
          <div className="home-section">
            <div className="home-notif-list">
              {notifs.unreadMessages > 0 && (
                <Card onClick={() => navigate('/community')}>
                  <div className="home-notif-row">
                    <div className="home-notif-icon home-notif-messages"><MessageCircle size={20} /></div>
                    <span className="home-notif-text">
                      {notifs.unreadMessages} unread message{notifs.unreadMessages !== 1 ? 's' : ''}
                    </span>
                    <ChevronRight size={18} className="home-notif-arrow" />
                  </div>
                </Card>
              )}
              {notifs.pendingConnections > 0 && (
                <Card onClick={() => navigate('/community')}>
                  <div className="home-notif-row">
                    <div className="home-notif-icon home-notif-connections"><Users size={20} /></div>
                    <span className="home-notif-text">
                      {notifs.pendingConnections} connection request{notifs.pendingConnections !== 1 ? 's' : ''}
                    </span>
                    <ChevronRight size={18} className="home-notif-arrow" />
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* SECTION: Pending Requests */}
        <div className="home-section">
          <div className="home-section-header">
            <h2 className="home-section-title">Pending Requests</h2>
            {pendingRequests.length > 0 && (
              <button className="view-all-btn" onClick={() => navigate('/appointments')}>View All</button>
            )}
          </div>

          {pendingRequests.length === 0 ? (
            <Card>
              <div className="home-caught-up">
                <CheckCircle size={32} style={{ color: 'var(--success)' }} />
                <span className="home-caught-up-text">No pending requests</span>
              </div>
            </Card>
          ) : (
            pendingRequests.map(apt => {
              const isActioning = actionLoading === apt.id
              return (
                <Card key={apt.id} className="dash-pending-card">
                  <div className="home-upcoming-row">
                    <Avatar src={apt.seekerPhoto} emoji={apt.avatar} size="sm" />
                    <div className="home-upcoming-info">
                      <div className="home-upcoming-name">{apt.seekerName}</div>
                      <div className="home-upcoming-meta">{apt.type} · {formatDateShort(apt.date)} at {apt.time}</div>
                    </div>
                  </div>
                  <div className="dash-pending-actions">
                    <button
                      className="dash-confirm-btn"
                      onClick={() => handleConfirm(apt.id)}
                      disabled={isActioning}
                    >
                      <ThumbsUp size={14} />
                      {isActioning ? 'Confirming…' : 'Confirm'}
                    </button>
                    <button
                      className="dash-decline-btn"
                      onClick={() => handleDecline(apt.id)}
                      disabled={isActioning}
                    >
                      <X size={14} />
                      Decline
                    </button>
                  </div>
                </Card>
              )
            })
          )}
        </div>

        {/* SECTION: Upcoming Confirmed Sessions */}
        <div className="home-section">
          <div className="home-section-header">
            <h2 className="home-section-title">Upcoming Sessions</h2>
            <button className="view-all-btn" onClick={() => navigate('/appointments')}>View All</button>
          </div>

          {confirmedSessions.length === 0 ? (
            <Card>
              <div className="home-caught-up">
                <Calendar size={32} style={{ color: 'var(--text-faint)' }} />
                <span className="home-caught-up-text">No confirmed sessions yet</span>
              </div>
            </Card>
          ) : (
            confirmedSessions.map(apt => (
              <Card key={apt.id} onClick={() => navigate('/appointments')}>
                <div className="home-upcoming-row">
                  <Avatar src={apt.seekerPhoto} emoji={apt.avatar} size="sm" />
                  <div className="home-upcoming-info">
                    <div className="home-upcoming-name">{apt.seekerName}</div>
                    <div className="home-upcoming-meta">{apt.type} · {formatDateShort(apt.date)} at {apt.time}</div>
                  </div>
                  <Badge status={apt.status} />
                </div>
              </Card>
            ))
          )}
        </div>

        {/* SECTION: Availability quick-toggle */}
        <div className="home-section">
          <div className="home-section-header">
            <h2 className="home-section-title">Availability</h2>
          </div>
          <Card>
            <div className="dash-availability-card">
              <div className="dash-availability-row">
                <div className="dash-avail-label">
                  <UserCheck size={18} style={{ color: isAccepting ? 'var(--accent-gold)' : 'var(--text-muted)' }} />
                  <span>Accepting new seekers</span>
                </div>
                <div
                  className={`theme-toggle ${isAccepting ? 'active' : ''}`}
                  onClick={availLoading ? undefined : toggleAvailability}
                  style={{ cursor: availLoading ? 'default' : 'pointer', opacity: availLoading ? 0.6 : 1 }}
                >
                  <div className="theme-toggle-thumb" />
                </div>
              </div>

              <div className="dash-availability-row" style={{ marginTop: '10px' }}>
                <div className="dash-avail-label">
                  <Clock size={18} style={{ color: 'var(--text-muted)' }} />
                  <span>Max pending requests</span>
                </div>
                <select
                  className="dash-avail-select"
                  value={maxSlots}
                  onChange={e => updateProfile({ maxPendingRequests: Number(e.target.value) })}
                >
                  {[1, 2, 3, 4, 5, 8, 10, 15, 20].map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>

              <div className="dash-avail-status">
                {isAccepting
                  ? `${pendingRequests.length} pending · ${maxSlots} max slots`
                  : 'Not accepting new seekers right now'
                }
              </div>
            </div>
          </Card>
        </div>

        {/* SECTION: Currently Working With */}
        <div className="home-section">
          <div className="home-section-header">
            <h2 className="home-section-title">Currently Working With</h2>
            <button className="view-all-btn" onClick={() => navigate('/appointments')}>Sessions</button>
          </div>

          {activeSeekers.length === 0 ? (
            <Card>
              <div className="home-caught-up">
                <Users size={32} style={{ color: 'var(--text-faint)' }} />
                <span className="home-caught-up-text">No active seekers yet</span>
              </div>
            </Card>
          ) : (
            <Card>
              <div className="dash-seekers-list">
                {activeSeekers.map(seeker => (
                  <button
                    key={seeker.id}
                    className="dash-seeker-chip"
                    onClick={() => navigate(`/user/${seeker.id}`)}
                  >
                    <Avatar src={seeker.photo} emoji={seeker.avatar} size="sm" />
                    <span className="dash-seeker-name">{seeker.name?.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* SECTION: Recent Session Notes */}
        <div className="home-section">
          <div className="home-section-header">
            <h2 className="home-section-title">Recent Notes</h2>
            <button className="view-all-btn" onClick={() => navigate('/appointments')}>View All</button>
          </div>

          {recentNotes.length === 0 ? (
            <Card>
              <div className="home-caught-up">
                <FileText size={32} style={{ color: 'var(--text-faint)' }} />
                <span className="home-caught-up-text">No session notes yet</span>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  Notes appear here after you complete sessions
                </span>
              </div>
            </Card>
          ) : (
            recentNotes.map(note => (
              <Card key={note.id} onClick={() => navigate('/appointments')}>
                <div className="dash-note-row">
                  <div className="dash-note-icon"><FileText size={16} /></div>
                  <div className="dash-note-info">
                    <div className="dash-note-title">{note.title || 'Untitled Note'}</div>
                    {note.otherPersonName && (
                      <div className="dash-note-meta">With {note.otherPersonName}</div>
                    )}
                    {note.content && (
                      <div className="dash-note-preview">
                        {note.content.slice(0, 80)}{note.content.length > 80 ? '…' : ''}
                      </div>
                    )}
                  </div>
                  <ChevronRight size={16} className="home-notif-arrow" />
                </div>
              </Card>
            ))
          )}
        </div>

        {/* SECTION: Ministry Stats */}
        <div className="home-section">
          <div className="stats-box">
            <div className="stats-box-title">Your Ministry</div>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{homeData.sessionStats.upcoming}</div>
                <div className="stat-label"><Calendar size={13} className="stat-icon" /> Upcoming</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{homeData.sessionStats.completed}</div>
                <div className="stat-label"><CircleCheckBig size={13} className="stat-icon" /> Completed</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{homeData.sessionStats.uniqueSeekers}</div>
                <div className="stat-label"><Users size={13} className="stat-icon" /> Seekers Helped</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{homeData.sessionStats.rating || '—'}</div>
                <div className="stat-label"><Star size={13} className="stat-icon" /> Rating</div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION: Daily Word */}
        <div className="home-section">
          <div className="home-section-header">
            <h2 className="home-section-title">Daily Word</h2>
          </div>
          <Card>
            <div className="home-daily-word">
              <p className="home-daily-text">"{quote.text}"</p>
              <p className="home-daily-ref">— {quote.ref}</p>
            </div>
          </Card>
        </div>
      </>
    )
  }

  // ==========================================================================
  // RENDER
  // ==========================================================================
  return (
    <div className="screen with-bottom-nav">
      {/* WELCOME HEADER — same for both roles */}
      <div className="dashboard-header">
        <div className="dashboard-user-row">
          <div>
            <p style={{ opacity: 0.9, marginBottom: '4px' }}>Welcome back,</p>
            <h1 style={{ fontSize: '24px', fontWeight: '700' }}>
              <span style={{ color: 'var(--accent-gold)' }}>{user?.name || 'Friend'}</span>
              <span className={`home-role-badge ${user?.role === 'guide' ? 'home-role-guide' : 'home-role-seeker'}`}>
                {user?.role === 'guide' ? 'G' : 'S'}
              </span>
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="notif-bell-btn" onClick={() => navigate('/notifications')}>
              <Bell size={24} />
              {unreadNotifCount > 0 && (
                <span className="notif-bell-badge">
                  {unreadNotifCount > 99 ? '99+' : unreadNotifCount}
                </span>
              )}
            </button>
            <button
              onClick={() => navigate('/account-details')}
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', borderRadius: '50%' }}
            >
              <Avatar src={user?.photoUrl} emoji={user?.avatar} size="lg" variant="white" />
            </button>
          </div>
        </div>
      </div>

      <div className="screen-content">
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorState subtitle={error} onAction={fetchHome} />
        ) : user?.role === 'guide' ? (
          renderGuideContent()
        ) : (
          renderSeekerContent()
        )}
      </div>
    </div>
  )
}

export default Dashboard
