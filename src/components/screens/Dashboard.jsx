// =============================================================================
// DASHBOARD COMPONENT (Home Screen)
// =============================================================================
// The main hub showing 6 sections:
// 1. Welcome Header with role badge
// 2. What's New (notification cards)
// 3. Your Upcoming (appointments)
// 4. Community Activity (prayer posts from connections)
// 5. Your Sessions (stats grid)
// 6. Daily Word (Bible quote)
//
// Fetches all data from GET /api/home in a single call.

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { Avatar, Card, Badge } from '../common'
import { api } from '../../utils/api'
import {
  MessageCircle, Users, Heart, Calendar,
  CheckCircle, ChevronRight, Clock, Star,
  BookOpen, Loader, Bell
} from 'lucide-react'

function Dashboard() {
  const navigate = useNavigate()
  const { user, getDailyQuote, unreadNotifCount } = useApp()

  // Home data from the aggregated endpoint
  const [homeData, setHomeData] = useState(null)
  const [loading, setLoading] = useState(true)

  // Get today's Bible quote from AppContext
  const quote = getDailyQuote()

  // Fetch home data on mount
  useEffect(() => {
    async function fetchHome() {
      try {
        const data = await api.get('/home')
        setHomeData(data)
      } catch (err) {
        console.error('Failed to load home data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchHome()
  }, [])

  // Format date for display
  function formatDate(dateStr) {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  // Determine if there are any notifications
  const notifications = homeData?.notifications
  const hasNotifications = notifications && (
    notifications.unreadMessages > 0 ||
    notifications.pendingConnections > 0 ||
    notifications.prayerActivity > 0 ||
    (user?.role === 'guide' && notifications.pendingSessions > 0)
  )

  return (
    <div className="screen with-bottom-nav">
      {/* ===== SECTION 1: WELCOME HEADER ===== */}
      <div className="dashboard-header">
        <div className="dashboard-user-row">
          <div>
            <p style={{ opacity: 0.9, marginBottom: '4px' }}>Welcome back,</p>
            <h1 style={{ fontSize: '24px', fontWeight: '700' }}>
              {user?.name || 'Friend'}
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
            <Avatar
              src={user?.photoUrl}
              emoji={user?.avatar}
              size="lg"
              variant="white"
            />
          </div>
        </div>
      </div>

      {/* ===== CONTENT ===== */}
      <div className="screen-content">

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
            <Loader size={32} style={{ color: 'var(--brand-primary)', animation: 'spin 1s linear infinite' }} />
          </div>
        ) : (
          <>
            {/* ===== SECTION 2: WHAT'S NEW ===== */}
            <div className="home-section">
              <div className="home-section-header">
                <h2 className="home-section-title">What's New</h2>
              </div>

              {hasNotifications ? (
                <div className="home-notif-list">
                  {notifications.unreadMessages > 0 && (
                    <Card onClick={() => navigate('/community')}>
                      <div className="home-notif-row">
                        <div className="home-notif-icon home-notif-messages">
                          <MessageCircle size={20} />
                        </div>
                        <span className="home-notif-text">
                          {notifications.unreadMessages} unread message{notifications.unreadMessages !== 1 ? 's' : ''}
                        </span>
                        <ChevronRight size={18} className="home-notif-arrow" />
                      </div>
                    </Card>
                  )}

                  {notifications.pendingConnections > 0 && (
                    <Card onClick={() => navigate('/community')}>
                      <div className="home-notif-row">
                        <div className="home-notif-icon home-notif-connections">
                          <Users size={20} />
                        </div>
                        <span className="home-notif-text">
                          {notifications.pendingConnections} connection request{notifications.pendingConnections !== 1 ? 's' : ''}
                        </span>
                        <ChevronRight size={18} className="home-notif-arrow" />
                      </div>
                    </Card>
                  )}

                  {notifications.prayerActivity > 0 && (
                    <Card onClick={() => navigate('/prayer-board')}>
                      <div className="home-notif-row">
                        <div className="home-notif-icon home-notif-prayers">
                          <Heart size={20} />
                        </div>
                        <span className="home-notif-text">
                          {notifications.prayerActivity} new prayer{notifications.prayerActivity !== 1 ? 's' : ''} on your requests
                        </span>
                        <ChevronRight size={18} className="home-notif-arrow" />
                      </div>
                    </Card>
                  )}

                  {user?.role === 'guide' && notifications.pendingSessions > 0 && (
                    <Card onClick={() => navigate('/appointments')}>
                      <div className="home-notif-row">
                        <div className="home-notif-icon home-notif-sessions">
                          <Calendar size={20} />
                        </div>
                        <span className="home-notif-text">
                          {notifications.pendingSessions} pending session request{notifications.pendingSessions !== 1 ? 's' : ''}
                        </span>
                        <ChevronRight size={18} className="home-notif-arrow" />
                      </div>
                    </Card>
                  )}
                </div>
              ) : (
                <Card>
                  <div className="home-caught-up">
                    <CheckCircle size={32} style={{ color: '#16a34a' }} />
                    <span className="home-caught-up-text">You're all caught up!</span>
                  </div>
                </Card>
              )}
            </div>

            {/* ===== SECTION 3: YOUR UPCOMING ===== */}
            <div className="home-section">
              <div className="home-section-header">
                <h2 className="home-section-title">Your Upcoming</h2>
                <button className="view-all-btn" onClick={() => navigate('/appointments')}>
                  View All
                </button>
              </div>

              {homeData.upcomingAppointments.length === 0 && (!homeData.upcomingEvents || homeData.upcomingEvents.length === 0) ? (
                <Card>
                  <div className="empty-state" style={{ padding: '24px' }}>
                    <div className="empty-icon"><Calendar size={40} /></div>
                    <div className="empty-text">Nothing coming up</div>
                    <div className="empty-subtext">Explore events and book a session!</div>
                  </div>
                </Card>
              ) : (
                <>
                  {/* Merge appointments + events, show max 5 */}
                  {(() => {
                    const allItems = [
                      ...homeData.upcomingAppointments.map(apt => ({ ...apt, _type: 'apt' })),
                      ...(homeData.upcomingEvents || []).map(evt => ({ ...evt, _type: 'evt' }))
                    ]
                    return allItems.slice(0, 5).map(item =>
                      item._type === 'apt' ? (
                        <Card key={`apt-${item.id}`} onClick={() => navigate('/appointments')}>
                          <div className="home-upcoming-row">
                            <div className="home-upcoming-icon">{item.avatar}</div>
                            <div className="home-upcoming-info">
                              <div className="home-upcoming-name">
                                {user?.role === 'guide'
                                  ? item.seekerName
                                  : item.guideName || item.seekerName
                                }
                              </div>
                              <div className="home-upcoming-meta">
                                {item.type} · {formatDate(item.date)} at {item.time}
                              </div>
                            </div>
                            <Badge status={item.status} />
                          </div>
                        </Card>
                      ) : (
                        <Card key={`evt-${item.id}`} onClick={() => navigate(`/events/${item.id}`)}>
                          <div className="home-upcoming-row">
                            <div className="home-upcoming-icon" style={{ fontSize: '16px' }}>
                              <Calendar size={18} style={{ color: 'var(--brand-primary)' }} />
                            </div>
                            <div className="home-upcoming-info">
                              <div className="home-upcoming-name">{item.title}</div>
                              <div className="home-upcoming-meta">
                                {formatDate(item.dateTime)}{item.location ? ` · ${item.location}` : ''}
                              </div>
                            </div>
                            <span className="home-activity-badge">{item.category}</span>
                          </div>
                        </Card>
                      )
                    )
                  })()}
                </>
              )}
            </div>

            {/* ===== SECTION 4: COMMUNITY ACTIVITY ===== */}
            <div className="home-section">
              <div className="home-section-header">
                <h2 className="home-section-title">Community Activity</h2>
                <button className="view-all-btn" onClick={() => navigate('/prayer-board')}>
                  View All
                </button>
              </div>

              {homeData.communityActivity.length === 0 ? (
                <Card>
                  <div className="empty-state" style={{ padding: '24px' }}>
                    <div className="empty-icon"><Users size={40} /></div>
                    <div className="empty-text">No recent activity</div>
                    <div className="empty-subtext">Connect with others to see their prayers</div>
                  </div>
                </Card>
              ) : (
                homeData.communityActivity.map(prayer => (
                  <Card key={prayer.id} onClick={() => navigate('/prayer-board')}>
                    <div className="home-activity-row">
                      <Avatar emoji={prayer.userAvatar} size="sm" />
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

            {/* ===== SECTION 5: YOUR SESSIONS (Stats) ===== */}
            <div className="home-section">
              <div className="stats-box">
                <div className="stats-box-title">Your Sessions</div>
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-value">{homeData.sessionStats.upcoming}</div>
                    <div className="stat-label">Upcoming</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{homeData.sessionStats.completed}</div>
                    <div className="stat-label">Completed</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{homeData.sessionStats.uniqueSeekers}</div>
                    <div className="stat-label">Seekers Helped</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">4.9</div>
                    <div className="stat-label">Rating</div>
                  </div>
                </div>
              </div>
            </div>

            {/* ===== SECTION 6: DAILY WORD ===== */}
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
        )}
      </div>
    </div>
  )
}

export default Dashboard
