// =============================================================================
// SCRIPTURE STUDY SCREEN
// =============================================================================
// Hub for scripture features: daily verse, browse by category,
// bookmark verses, reading plans, random verse, and sharing.
// Accessed via More > Scripture Study.

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { Modal } from '../common'
import {
  ArrowLeft, BookOpen, Star, Share2, Shuffle, Bookmark
} from 'lucide-react'

const CATEGORIES = ['All', 'Love', 'Strength', 'Hope', 'Comfort', 'Trust', 'Courage']

function Scripture() {
  const navigate = useNavigate()
  const {
    scriptureDailyVerse,
    scriptureVerses,
    scriptureBookmarkIds,
    readingPlans,
    toggleVerseBookmark,
    getRandomVerse
  } = useApp()

  const [selectedCategory, setSelectedCategory] = useState('All')
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false)
  const [randomVerse, setRandomVerse] = useState(null)
  const [showRandomModal, setShowRandomModal] = useState(false)

  // Filter verses by category and/or bookmarks
  let displayedVerses = scriptureVerses
  if (selectedCategory !== 'All') {
    displayedVerses = displayedVerses.filter(v => v.category === selectedCategory)
  }
  if (showBookmarksOnly) {
    displayedVerses = displayedVerses.filter(v => scriptureBookmarkIds.has(v.id))
  }

  async function handleRandomVerse() {
    try {
      const verse = await getRandomVerse()
      setRandomVerse(verse)
      setShowRandomModal(true)
    } catch (error) {
      console.error('Failed to get random verse:', error)
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
      alert('Verse copied to clipboard!')
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
        <div style={{ width: '40px' }} />
      </div>

      <div className="screen-content">
        {/* Verse of the Day */}
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

        {/* Quick Actions */}
        <div className="quick-actions">
          <button
            className={`quick-action-btn ${showBookmarksOnly ? 'active' : ''}`}
            onClick={() => setShowBookmarksOnly(!showBookmarksOnly)}
          >
            <Bookmark size={16} />
            My Bookmarks
          </button>
          <button className="quick-action-btn" onClick={handleRandomVerse}>
            <Shuffle size={16} />
            Random Verse
          </button>
        </div>

        {/* Category Filter Pills */}
        <div className="category-pills">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`category-pill ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Verses List */}
        {displayedVerses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>
            {showBookmarksOnly ? 'No bookmarked verses yet' : 'No verses in this category'}
          </div>
        ) : (
          displayedVerses.map(verse => (
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
                  style={scriptureBookmarkIds.has(verse.id) ? { color: '#f59e0b' } : {}}
                >
                  <Star
                    size={18}
                    fill={scriptureBookmarkIds.has(verse.id) ? '#f59e0b' : 'none'}
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
          ))
        )}

        {/* Reading Plans Section */}
        <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', margin: '28px 0 14px' }}>
          Reading Plans
        </h3>
        {readingPlans.map(plan => (
          <div
            key={plan.id}
            className="plan-card"
            onClick={() => navigate(`/scripture/plan/${plan.id}`)}
          >
            <div className="plan-name">{plan.name}</div>
            <div className="plan-desc">{plan.description}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{
                background: '#e0e7ff',
                color: '#3730a3',
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '600'
              }}>
                {plan.totalDays} days
              </span>
              <BookOpen size={20} style={{ color: '#9ca3af' }} />
            </div>
          </div>
        ))}
      </div>

      {/* Random Verse Modal */}
      <Modal
        isOpen={showRandomModal}
        onClose={() => setShowRandomModal(false)}
        title="Random Verse"
      >
        {randomVerse && (
          <div>
            <div style={{
              background: '#f3f4f6',
              padding: '20px',
              borderRadius: '10px',
              marginBottom: '16px'
            }}>
              <div style={{
                fontSize: '16px',
                fontWeight: '700',
                color: '#1e3a8a',
                marginBottom: '12px'
              }}>
                {randomVerse.reference}
              </div>
              <p style={{
                fontSize: '15px',
                lineHeight: '1.7',
                color: '#374151',
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
