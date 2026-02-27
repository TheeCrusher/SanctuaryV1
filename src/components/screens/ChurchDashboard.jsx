// =============================================================================
// CHURCH DASHBOARD
// =============================================================================
// The main screen church accounts see after logging in.
// Admin overview with navigation cards to manage their church page.
// No bottom nav — church accounts have their own simple layout.

import './ChurchDashboard.css'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { churchApi } from '../../utils/api'
import { Pencil, Users, ShieldCheck, LogOut, Church, AlertCircle } from 'lucide-react'

function ChurchDashboard() {
  const { churchLogout } = useApp()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    async function loadData() {
      try {
        const { churchAccount: acct } = await churchApi.get('/church-auth/me')
        setData(acct)
      } catch (error) {
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  function handleLogout() {
    churchLogout()
    navigate('/login')
  }

  if (loading) {
    return (
      <div className="screen church-screen-center">
        <div className="loading-spinner" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="screen">
        <div className="church-empty-state">
          <AlertCircle size={48} />
          <p>Failed to load church data.</p>
          <p className="church-empty-hint">Check your connection and try again.</p>
          <button className="church-logout-btn" onClick={handleLogout}>
            <LogOut size={18} /> Log Out
          </button>
        </div>
      </div>
    )
  }

  const API_BASE = import.meta.env.VITE_API_URL || ''
  const { church, guides, stats } = data
  const photoUrl = church.googlePlaceId
    ? `${API_BASE}/api/churches/photo/${church.googlePlaceId}`
    : null

  return (
    <div className="church-dashboard">
      {/* Header */}
      <div className="church-dashboard-header">
        <div className="church-dashboard-photo">
          {photoUrl ? (
            <img src={photoUrl} alt={church.name} />
          ) : (
            <div className="church-dashboard-photo-placeholder">
              <Church size={48} />
            </div>
          )}
        </div>
        <h1 className="church-dashboard-name">{church.name}</h1>
        <span className="church-managed-badge">Managed Page</span>
        {church.city && church.state && (
          <p className="church-dashboard-location">{church.city}, {church.state}</p>
        )}
      </div>

      {/* Quick Stats */}
      <div className="church-stats-row">
        <div className="church-stat-card">
          <span className="church-stat-number">{stats.memberCount}</span>
          <span className="church-stat-label">Members</span>
        </div>
        <div className="church-stat-card">
          <span className="church-stat-number">{stats.reviewCount}</span>
          <span className="church-stat-label">Reviews</span>
        </div>
        <div className="church-stat-card">
          <span className="church-stat-number">
            {church.overallRating ? parseFloat(church.overallRating).toFixed(1) : '—'}
          </span>
          <span className="church-stat-label">Rating</span>
        </div>
        <div className="church-stat-card">
          <span className="church-stat-number">{guides.length}</span>
          <span className="church-stat-label">Guides</span>
        </div>
      </div>

      {/* Navigation Cards */}
      <div className="church-nav-grid">
        <button className="church-nav-card" onClick={() => navigate('/church-profile-editor')}>
          <Pencil size={24} />
          <span>Edit Profile</span>
        </button>
        <button className="church-nav-card" onClick={() => navigate('/church-congregation')}>
          <Users size={24} />
          <span>Congregation</span>
        </button>
        <button className="church-nav-card" onClick={() => navigate('/church-guides')}>
          <ShieldCheck size={24} />
          <span>Verified Guides</span>
        </button>
      </div>

      {/* Logout */}
      <button className="church-logout-btn" onClick={handleLogout}>
        <LogOut size={18} />
        Log Out
      </button>
    </div>
  )
}

export default ChurchDashboard
