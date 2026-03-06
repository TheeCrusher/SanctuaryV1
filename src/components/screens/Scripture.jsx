// =============================================================================
// SCRIPTURE STUDY SCREEN
// =============================================================================
// Hub for scripture features: daily verse, reading plans, memorization
// challenge, browse by category, bookmark verses, and sharing.
// Accessed via More > Scripture Study.

import './Scripture.css'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'
import { Modal, EmptyState } from '../common'
import {
  ArrowLeft, BookOpen, Star, Share2, Shuffle, Bookmark,
  Plus, Sparkles, Flame, Trash2
} from 'lucide-react'

const CATEGORIES = ['All', 'Love', 'Strength', 'Hope', 'Comfort', 'Trust', 'Courage', 'Faith', 'Peace', 'Gratitude']
const PLAN_CATEGORIES = CATEGORIES.filter(c => c !== 'All')

function Scripture() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const {
    scriptureDailyVerse,
    scriptureVerses,
    scriptureBookmarkIds,
    readingPlans,
    toggleVerseBookmark,
    getRandomVerse,
    createCustomPlan,
    createSurprisePlan,
    deleteCustomPlan,
    memorizationStats
  } = useApp()

  // Browse state
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false)
  const [versesVisible, setVersesVisible] = useState(7)

  // Random verse modal
  const [randomVerse, setRandomVerse] = useState(null)
  const [showRandomModal, setShowRandomModal] = useState(false)

  // Create plan modal
  const [showCreatePlanModal, setShowCreatePlanModal] = useState(false)
  const [planName, setPlanName] = useState('')
  const [planCategory, setPlanCategory] = useState('')
  const [planDuration, setPlanDuration] = useState(7)
  const [creating, setCreating] = useState(false)

  // Filter verses by category and/or bookmarks
  let displayedVerses = scriptureVerses
  if (selectedCategory !== 'All') {
    displayedVerses = displayedVerses.filter(v => v.category === selectedCategory)
  }
  if (showBookmarksOnly) {
    displayedVerses = displayedVerses.filter(v => scriptureBookmarkIds.has(v.id))
  }

  // Split plans into started vs unstarted
  const startedPlans = readingPlans.filter(p => p.completedDays && p.completedDays.length > 0)
  const unstartedPlans = readingPlans.filter(p => !p.completedDays || p.completedDays.length === 0)

  async function handleRandomVerse() {
    try {
      const verse = await getRandomVerse()
      setRandomVerse(verse)
      setShowRandomModal(true)
    } catch (error) {
      // ignore
    }
  }

  async function handleShare(verse) {
    const shareText = `"${verse.text}" — ${verse.reference}\n\nShared via Sanctuary`
    if (navigator.share) {
      try {
        await navigator.share({ text: shareText })
      } catch (err) {
        // User cancelled — that's fine
      }
    } else {
      await navigator.clipboard.writeText(shareText)
      showToast('Verse copied to clipboard!', 'success')
    }
  }

  async function handleCreatePlan() {
    if (!planName.trim() || !planCategory) return
    setCreating(true)
    try {
      await createCustomPlan(planName.trim(), planCategory, planDuration)
      showToast('Custom plan created!', 'success')
      setShowCreatePlanModal(false)
      setPlanName('')
      setPlanCategory('')
      setPlanDuration(7)
    } catch (error) {
      showToast('Failed to create plan', 'error')
    }
    setCreating(false)
  }

  async function handleSurprisePlan() {
    try {
      await createSurprisePlan(7)
      showToast('Surprise plan created!', 'success')
    } catch (error) {
      showToast('Failed to create plan', 'error')
    }
  }

  async function handleDeletePlan(e, planId) {
    e.stopPropagation()
    try {
      await deleteCustomPlan(planId)
      showToast('Plan deleted', 'success')
    } catch (error) {
      showToast('Failed to delete plan', 'error')
    }
  }

  return (
    <div className="screen with-bottom-nav">
      {/* Header */}
      <div className="screen-header">
        <button className="back-btn" onClick={() => navigate('/more')}>
          <ArrowLeft size={20} />
        </button>
        <h1 className="screen-title">Scripture Study</h1>
        <div className="header-spacer" />
      </div>

      <div className="screen-content">
        {/* ============================================================ */}
        {/* 1. VERSE OF THE DAY (unchanged) */}
        {/* ============================================================ */}
        {scriptureDailyVerse && (
          <div className="verse-of-day">
            <div className="verse-of-day-label">Verse of the Day</div>
            <div className="verse-of-day-ref">{scriptureDailyVerse.reference}</div>
            <p className="verse-of-day-text">"{scriptureDailyVerse.text}"</p>
            <div className="verse-of-day-actions">
              <button
                className="verse-action-pill"
                onClick={() => toggleVerseBookmark(scriptureDailyVerse.id)}
              >
                <Star
                  size={16}
                  fill={scriptureBookmarkIds.has(scriptureDailyVerse.id) ? 'white' : 'none'}
                />
                {scriptureBookmarkIds.has(scriptureDailyVerse.id) ? 'Saved' : 'Save'}
              </button>
              <button
                className="verse-action-pill"
                onClick={() => handleShare(scriptureDailyVerse)}
              >
                <Share2 size={16} />
                Share
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* 2. READING PLANS (moved from bottom, overhauled) */}
        {/* ============================================================ */}
        <div className="scripture-section">
          <div className="scripture-section-header">
            <h3 className="scripture-section-title">Reading Plans</h3>
            <div className="scripture-section-actions">
              <button className="scripture-small-btn" onClick={() => setShowCreatePlanModal(true)}>
                <Plus size={12} /> Create
              </button>
              <button className="scripture-small-btn" onClick={handleSurprisePlan}>
                <Sparkles size={12} /> Surprise Me
              </button>
            </div>
          </div>

          {/* Started plans first — show progress */}
          {startedPlans.map(plan => {
            const progress = Math.round((plan.completedDays.length / plan.totalDays) * 100)
            return (
              <div
                key={plan.id}
                className="plan-card plan-card-started"
                onClick={() => navigate(`/scripture/plan/${plan.id}`)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div className="plan-name">{plan.name}</div>
                  <div className="plan-card-badges">
                    {plan.isCustom && <span className="plan-custom-badge">Custom</span>}
                    <span className="plan-continue-badge">Continue</span>
                  </div>
                </div>
                <div className="plan-progress-bar" style={{ marginTop: '10px' }}>
                  <div className="plan-progress-fill" style={{ width: `${progress}%` }} />
                </div>
                <div className="plan-card-meta" style={{ marginTop: '6px' }}>
                  <span className="plan-progress-text">
                    Day {plan.completedDays.length} of {plan.totalDays}
                  </span>
                  {plan.isCustom && (
                    <button
                      className="verse-action-btn"
                      onClick={(e) => handleDeletePlan(e, plan.id)}
                      style={{ color: 'var(--text-faint)' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            )
          })}

          {/* Unstarted plans */}
          {unstartedPlans.map(plan => (
            <div
              key={plan.id}
              className="plan-card"
              onClick={() => navigate(`/scripture/plan/${plan.id}`)}
            >
              <div className="plan-name">{plan.name}</div>
              <div className="plan-desc">{plan.description}</div>
              <div className="plan-card-meta">
                <div className="plan-card-badges">
                  <span className="plan-duration-badge">{plan.totalDays} days</span>
                  {plan.isCustom && <span className="plan-custom-badge">Custom</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {plan.isCustom && (
                    <button
                      className="verse-action-btn"
                      onClick={(e) => handleDeletePlan(e, plan.id)}
                      style={{ color: 'var(--text-faint)' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                  <BookOpen size={20} style={{ color: 'var(--text-faint)' }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ============================================================ */}
        {/* 3. MEMORIZATION CHALLENGE (new section) */}
        {/* ============================================================ */}
        <div className="scripture-section">
          <div className="scripture-section-header">
            <h3 className="scripture-section-title">Memorization Challenge</h3>
            {memorizationStats.streak.current > 0 && (
              <div className="streak-badge">
                <Flame size={14} />
                {memorizationStats.streak.current} day streak
              </div>
            )}
          </div>

          <div className="memo-game-grid">
            <div className="memo-game-card" onClick={() => navigate('/scripture/game/fill_blank')}>
              <div className="memo-game-icon">
                <BookOpen size={28} style={{ color: 'var(--accent-gold)' }} />
              </div>
              <div className="memo-game-name">Fill in the Blank</div>
              <div className="memo-game-desc">Complete missing words</div>
            </div>

            <div className="memo-game-card" onClick={() => navigate('/scripture/game/scramble')}>
              <div className="memo-game-icon">
                <Shuffle size={28} style={{ color: 'var(--accent-burgundy)' }} />
              </div>
              <div className="memo-game-name">Verse Scramble</div>
              <div className="memo-game-desc">Reorder the words</div>
            </div>

            <div className="memo-game-card" onClick={() => navigate('/scripture/game/flashcard')}>
              <div className="memo-game-icon">
                <Sparkles size={28} style={{ color: 'var(--accent-gold)' }} />
              </div>
              <div className="memo-game-name">Flash Cards</div>
              <div className="memo-game-desc">Test your recall</div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 4. BROWSE VERSES (moved down) */}
        {/* ============================================================ */}
        <div className="scripture-section">
          <div className="scripture-section-header">
            <h3 className="scripture-section-title">Browse Verses</h3>
            <div className="scripture-section-actions">
              <button
                className={`scripture-small-btn ${showBookmarksOnly ? 'active' : ''}`}
                onClick={() => { setShowBookmarksOnly(!showBookmarksOnly); setVersesVisible(7) }}
                style={showBookmarksOnly ? { background: 'var(--brand-primary)', color: 'white', borderColor: 'var(--brand-primary)' } : {}}
              >
                <Bookmark size={12} /> Bookmarks
              </button>
              <button className="scripture-small-btn" onClick={handleRandomVerse}>
                <Shuffle size={12} /> Random
              </button>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="category-pills">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                className={`category-pill ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => { setSelectedCategory(cat); setVersesVisible(7) }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Verses List */}
          {displayedVerses.length === 0 ? (
            <EmptyState
              icon={showBookmarksOnly ? Bookmark : BookOpen}
              title={showBookmarksOnly ? 'No bookmarks yet' : 'No verses in this category'}
              subtitle={showBookmarksOnly ? 'Tap the star on any verse to save it' : 'Try selecting a different category'}
            />
          ) : (() => {
            const isAllUnfiltered = selectedCategory === 'All' && !showBookmarksOnly
            const sliced = isAllUnfiltered ? displayedVerses.slice(0, versesVisible) : displayedVerses
            const hasMore = isAllUnfiltered && displayedVerses.length > versesVisible
            return (
              <>
                {sliced.map(verse => (
                  <div key={verse.id} className="verse-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div className="verse-reference">{verse.reference}</div>
                      <span className="verse-category-badge">{verse.category}</span>
                    </div>
                    <p className="verse-text">"{verse.text}"</p>
                    <div className="verse-actions">
                      <button
                        className="verse-action-btn"
                        onClick={() => toggleVerseBookmark(verse.id)}
                        style={scriptureBookmarkIds.has(verse.id) ? { color: 'var(--accent-gold)' } : {}}
                      >
                        <Star
                          size={18}
                          fill={scriptureBookmarkIds.has(verse.id) ? 'var(--accent-gold)' : 'none'}
                        />
                      </button>
                      <button
                        className="verse-action-btn"
                        onClick={() => handleShare(verse)}
                      >
                        <Share2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
                {hasMore && (
                  <button
                    className="show-more-btn"
                    onClick={() => setVersesVisible(v => v + 7)}
                  >
                    Show More
                  </button>
                )}
                {isAllUnfiltered && !hasMore && displayedVerses.length > 7 && (
                  <p className="verses-end-nudge">
                    That's all for now — pick a category above or open the Bible reader for more.
                  </p>
                )}
              </>
            )
          })()}
        </div>
      </div>

      {/* ============================================================ */}
      {/* CREATE CUSTOM PLAN MODAL */}
      {/* ============================================================ */}
      <Modal
        isOpen={showCreatePlanModal}
        onClose={() => setShowCreatePlanModal(false)}
        title="Create Custom Plan"
      >
        <div className="create-plan-form">
          <div>
            <label className="create-plan-label">Plan Name</label>
            <input
              className="create-plan-input"
              value={planName}
              onChange={e => setPlanName(e.target.value)}
              placeholder="My Study Plan"
              maxLength={100}
            />
          </div>

          <div>
            <label className="create-plan-label">Topic / Category</label>
            <div className="category-pills">
              {PLAN_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  className={`category-pill ${planCategory === cat ? 'active' : ''}`}
                  onClick={() => setPlanCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="create-plan-label">Duration</label>
            <div className="duration-options">
              {[7, 14, 21, 30].map(d => (
                <button
                  key={d}
                  className={`duration-btn ${planDuration === d ? 'active' : ''}`}
                  onClick={() => setPlanDuration(d)}
                >
                  {d} days
                </button>
              ))}
            </div>
          </div>

          <button
            className="btn-primary"
            onClick={handleCreatePlan}
            disabled={!planName.trim() || !planCategory || creating}
          >
            {creating ? 'Creating...' : 'Create Plan'}
          </button>
        </div>
      </Modal>

      {/* ============================================================ */}
      {/* RANDOM VERSE MODAL (unchanged) */}
      {/* ============================================================ */}
      <Modal
        isOpen={showRandomModal}
        onClose={() => setShowRandomModal(false)}
        title="Random Verse"
      >
        {randomVerse && (
          <div>
            <div style={{
              background: 'var(--bg-muted)',
              padding: '20px',
              borderRadius: '10px',
              marginBottom: '16px'
            }}>
              <div style={{
                fontSize: '16px',
                fontWeight: '700',
                color: 'var(--brand-primary)',
                marginBottom: '12px'
              }}>
                {randomVerse.reference}
              </div>
              <p style={{
                fontSize: '15px',
                lineHeight: '1.7',
                color: 'var(--text-secondary)',
                fontStyle: 'italic',
                margin: 0
              }}>
                "{randomVerse.text}"
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn-primary"
                style={{ flex: 1 }}
                onClick={() => toggleVerseBookmark(randomVerse.id)}
              >
                <Star
                  size={16}
                  fill={scriptureBookmarkIds.has(randomVerse.id) ? 'white' : 'none'}
                  style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }}
                />
                {scriptureBookmarkIds.has(randomVerse.id) ? 'Saved' : 'Save Verse'}
              </button>
              <button
                className="btn-secondary"
                style={{ flex: 1 }}
                onClick={() => handleShare(randomVerse)}
              >
                <Share2
                  size={16}
                  style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }}
                />
                Share
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Scripture
