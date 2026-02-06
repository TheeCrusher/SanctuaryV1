// =============================================================================
// CHURCHES SCREEN
// =============================================================================
// Browse and search for churches.
// Shows church listings with ratings and info.

import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { Card } from '../common'
import { useState } from 'react'
import { X, Church, Check, Heart } from 'lucide-react'

function Churches() {
  const navigate = useNavigate()

  // Get church data and favorites from context
  const {
    churches,
    churchSearchQuery,
    setChurchSearchQuery,
    toggleFavoriteChurch,
    isChurchFavorited,
    favoriteChurchIds
  } = useApp()

  // Local state for favorites filter toggle
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)

  // Filter churches: if showing favorites only, filter to favorited ones
  const displayedChurches = showFavoritesOnly
    ? churches.filter(c => isChurchFavorited(c.id))
    : churches

  // Generate star rating display
  function renderStars(rating) {
    const fullStars = Math.floor(rating)
    const hasHalf = rating % 1 >= 0.5
    let stars = '★'.repeat(fullStars)
    if (hasHalf) stars += '½'
    return stars
  }

  return (
    <div className="screen with-bottom-nav">
      {/* Header */}
      <div className="screen-header">
        <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '16px' }}>
          Find Churches
        </h1>

        {/* Search Input */}
        <div className="search-row">
          <input
            type="text"
            placeholder="Search by city or ZIP code..."
            value={churchSearchQuery}
            onChange={(e) => setChurchSearchQuery(e.target.value)}
          />
          {churchSearchQuery && (
            <button
              className="search-clear"
              onClick={() => setChurchSearchQuery('')}
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Favorites Filter Toggle */}
        {favoriteChurchIds.size > 0 && (
          <button
            className={`favorites-filter-btn ${showFavoritesOnly ? 'active' : ''}`}
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
          >
            <Heart
              size={16}
              fill={showFavoritesOnly ? '#ef4444' : 'none'}
              color={showFavoritesOnly ? '#ef4444' : '#6b7280'}
            />
            My Favorites ({favoriteChurchIds.size})
          </button>
        )}
      </div>

      {/* Content */}
      <div className="screen-content">
        {displayedChurches.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><Church size={48} /></div>
            <div className="empty-text">No churches found</div>
            <div className="empty-subtext">
              Try a different search term
            </div>
          </div>
        ) : (
          displayedChurches.map(church => (
            <Card
              key={church.id}
              onClick={() => navigate(`/churches/${church.id}`)}
            >
              {/* Church Header with Heart */}
              <div className="church-top">
                <div style={{ flex: 1 }}>
                  <div className="church-name">{church.name}</div>
                  <div className="church-address">
                    {church.address}, {church.city}
                  </div>
                </div>
                <button
                  className="favorite-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleFavoriteChurch(church.id)
                  }}
                >
                  <Heart
                    size={22}
                    fill={isChurchFavorited(church.id) ? '#ef4444' : 'none'}
                    color={isChurchFavorited(church.id) ? '#ef4444' : '#9ca3af'}
                  />
                </button>
              </div>

              {/* Overall Rating */}
              <div className="church-overall">
                <span className="stars stars-sm">
                  {renderStars(church.overallRating)}
                </span>
                <span className="star-score">{church.overallRating}</span>
                <span style={{ color: '#9ca3af', fontSize: '13px' }}>
                  ({church.reviewCount} reviews)
                </span>
              </div>

              {/* Category Ratings */}
              <div className="rating-grid">
                <div>
                  <div className="rating-label">Singing</div>
                  <span className="stars stars-sm">
                    {renderStars(church.ratings.singing)}
                  </span>
                </div>
                <div>
                  <div className="rating-label">Preaching</div>
                  <span className="stars stars-sm">
                    {renderStars(church.ratings.preaching)}
                  </span>
                </div>
                <div>
                  <div className="rating-label">Openness</div>
                  <span className="stars stars-sm">
                    {renderStars(church.ratings.openness)}
                  </span>
                </div>
                <div>
                  <div className="rating-label">Space</div>
                  <span className="stars stars-sm">
                    {renderStars(church.ratings.space)}
                  </span>
                </div>
              </div>

              {/* Meta Tags */}
              <div className="church-meta">
                <span className={`meta-tag ${church.sundaySchool ? 'meta-tag-yes' : 'meta-tag-no'}`}>
                  {church.sundaySchool
                    ? <><Check size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> Sunday School</>
                    : <><X size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> No Sunday School</>
                  }
                </span>
                <span className="meta-tag">{church.hours}</span>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

export default Churches
