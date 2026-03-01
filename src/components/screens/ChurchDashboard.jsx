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
import { Pencil, Users, ShieldCheck, LogOut, Church, AlertCircle, BookOpen, X, ChevronDown } from 'lucide-react'

const SCRIPTURE_CATEGORIES = ['Love', 'Strength', 'Hope', 'Comfort', 'Trust', 'Courage', 'Faith', 'Peace', 'Gratitude']
const SCRIPTURE_DURATIONS = [7, 14, 21, 30]

function ChurchDashboard() {
  const { churchLogout } = useApp()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  // Congregation Study state
  const [plans, setPlans] = useState([])
  const [featuredPlanId, setFeaturedPlanId] = useState(null)
  const [plansLoading, setPlansLoading] = useState(false)
  const [showStudyModal, setShowStudyModal] = useState(false)
  const [studyModalView, setStudyModalView] = useState('list') // 'list' | 'create'
  const [studyActionError, setStudyActionError] = useState('')
  const [studySaving, setStudySaving] = useState(false)
  // Create-plan form state
  const [newPlanName, setNewPlanName] = useState('')
  const [newPlanCategory, setNewPlanCategory] = useState('Faith')
  const [newPlanDuration, setNewPlanDuration] = useState(7)

  useEffect(() => {
    async function loadData() {
      try {
        const [{ churchAccount: acct }, plansData] = await Promise.all([
          churchApi.get('/church-auth/me'),
          churchApi.get('/church-auth/plans').catch(() => ({ plans: [], featuredPlanId: null }))
        ])
        setData(acct)
        setPlans(plansData.plans || [])
        setFeaturedPlanId(plansData.featuredPlanId || null)
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

  async function loadPlans() {
    setPlansLoading(true)
    try {
      const { plans: p, featuredPlanId: fid } = await churchApi.get('/church-auth/plans')
      setPlans(p)
      setFeaturedPlanId(fid)
    } catch (err) {
      // non-critical — study section stays empty
    } finally {
      setPlansLoading(false)
    }
  }

  function openStudyModal() {
    setStudyModalView('list')
    setStudyActionError('')
    setNewPlanName('')
    setNewPlanCategory('Faith')
    setNewPlanDuration(7)
    loadPlans()
    setShowStudyModal(true)
  }

  async function handleFeaturePlan(planId) {
    setStudyActionError('')
    setStudySaving(true)
    try {
      await churchApi.put('/church-auth/plans/feature', { planId })
      setFeaturedPlanId(planId)
      setShowStudyModal(false)
    } catch (err) {
      setStudyActionError(err.message || 'Failed to set featured plan.')
    } finally {
      setStudySaving(false)
    }
  }

  async function handleRemoveFeatured() {
    setStudyActionError('')
    try {
      await churchApi.delete('/church-auth/plans/feature')
      setFeaturedPlanId(null)
    } catch (err) {
      setStudyActionError('Failed to remove featured plan.')
    }
  }

  async function handleCreateAndFeature() {
    if (!newPlanName.trim()) return
    setStudyActionError('')
    setStudySaving(true)
    try {
      const { plan } = await churchApi.post('/church-auth/plans', {
        name: newPlanName.trim(),
        category: newPlanCategory,
        duration: newPlanDuration
      })
      await churchApi.put('/church-auth/plans/feature', { planId: plan.id })
      setFeaturedPlanId(plan.id)
      setPlans(prev => [plan, ...prev])
      setShowStudyModal(false)
    } catch (err) {
      setStudyActionError(err.message || 'Failed to create plan.')
    } finally {
      setStudySaving(false)
    }
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
        <button className="church-nav-card" data-tour-id="church-edit-profile" onClick={() => navigate('/church-profile-editor')}>
          <Pencil size={24} />
          <span>Edit Profile</span>
        </button>
        <button className="church-nav-card" data-tour-id="church-congregation" onClick={() => navigate('/church-congregation')}>
          <Users size={24} />
          <span>Congregation</span>
        </button>
        <button className="church-nav-card" data-tour-id="church-verified-guides" onClick={() => navigate('/church-guides')}>
          <ShieldCheck size={24} />
          <span>Verified Guides</span>
        </button>
      </div>

      {/* Congregation Study Card */}
      <div className="church-study-card">
        <div className="church-study-card-header">
          <div className="church-study-card-title">
            <BookOpen size={18} />
            <span>Congregation Study</span>
          </div>
          {featuredPlanId && (
            <button className="church-study-remove-btn" onClick={handleRemoveFeatured}>
              <X size={14} /> Remove
            </button>
          )}
        </div>

        {studyActionError && (
          <div className="church-editor-error">{studyActionError}</div>
        )}

        {featuredPlanId ? (
          (() => {
            const featured = plans.find(p => p.id === featuredPlanId)
            return featured ? (
              <div className="church-study-active">
                <div className="church-study-plan-name">{featured.name}</div>
                <div className="church-study-plan-meta">
                  {featured.totalDays}-day study · {featured.dayCount} days
                </div>
                <button className="church-study-change-btn" onClick={openStudyModal}>
                  Change Plan
                </button>
              </div>
            ) : (
              <div className="church-study-empty">
                <p>Active plan loading…</p>
                <button className="church-study-set-btn" onClick={openStudyModal}>
                  Manage Study
                </button>
              </div>
            )
          })()
        ) : (
          <div className="church-study-empty">
            <p>No congregation study is active.</p>
            <button className="church-study-set-btn" onClick={openStudyModal}>
              Set Congregation Study
            </button>
          </div>
        )}
      </div>

      {/* Logout */}
      <button className="church-logout-btn" onClick={handleLogout}>
        <LogOut size={18} />
        Log Out
      </button>

      {/* Congregation Study Modal */}
      {showStudyModal && (
        <div className="church-modal-overlay" onClick={() => setShowStudyModal(false)}>
          <div className="church-modal" onClick={e => e.stopPropagation()}>
            <div className="church-modal-header">
              <h3 className="church-modal-title">
                {studyModalView === 'create' ? 'Create New Plan' : 'Set Congregation Study'}
              </h3>
              <button className="church-modal-close" onClick={() => setShowStudyModal(false)}>
                <X size={20} />
              </button>
            </div>

            {studyActionError && (
              <div className="church-editor-error">{studyActionError}</div>
            )}

            {studyModalView === 'list' ? (
              <div className="church-study-modal-body">
                {plansLoading ? (
                  <div className="church-screen-center" style={{ minHeight: '80px' }}>
                    <div className="loading-spinner" />
                  </div>
                ) : plans.length === 0 ? (
                  <div className="church-study-modal-empty">
                    <p>No plans yet. Create one below.</p>
                  </div>
                ) : (
                  <div className="church-study-plan-list">
                    {plans.map(plan => (
                      <button
                        key={plan.id}
                        className={`church-study-plan-row${plan.id === featuredPlanId ? ' church-study-plan-row-active' : ''}`}
                        onClick={() => !studySaving && handleFeaturePlan(plan.id)}
                        disabled={studySaving}
                      >
                        <div className="church-study-plan-row-info">
                          <span className="church-study-plan-row-name">{plan.name}</span>
                          <span className="church-study-plan-row-meta">{plan.totalDays}-day study</span>
                        </div>
                        {plan.id === featuredPlanId && (
                          <span className="church-study-featured-badge">Active</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                <button
                  className="church-study-create-toggle"
                  onClick={() => setStudyModalView('create')}
                >
                  + Create New Plan
                </button>
              </div>
            ) : (
              <div className="church-study-modal-body">
                <div className="church-study-form">
                  <div className="form-group">
                    <label className="form-label">Plan Name</label>
                    <input
                      type="text"
                      value={newPlanName}
                      onChange={e => setNewPlanName(e.target.value)}
                      placeholder="e.g. Summer Faith Journey"
                      maxLength={200}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Scripture Category</label>
                    <div className="church-study-select-wrapper">
                      <select
                        value={newPlanCategory}
                        onChange={e => setNewPlanCategory(e.target.value)}
                      >
                        {SCRIPTURE_CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                      <ChevronDown size={16} className="church-study-select-icon" />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Duration</label>
                    <div className="church-study-duration-pills">
                      {SCRIPTURE_DURATIONS.map(d => (
                        <button
                          key={d}
                          className={`church-study-duration-pill${newPlanDuration === d ? ' active' : ''}`}
                          onClick={() => setNewPlanDuration(d)}
                          type="button"
                        >
                          {d} days
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="church-study-modal-actions">
                  <button
                    className="btn-secondary"
                    onClick={() => setStudyModalView('list')}
                  >
                    Back
                  </button>
                  <button
                    className="btn-primary"
                    onClick={handleCreateAndFeature}
                    disabled={studySaving || !newPlanName.trim()}
                  >
                    {studySaving ? 'Creating…' : 'Create & Feature'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ChurchDashboard
