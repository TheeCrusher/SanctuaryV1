// =============================================================================
// CHURCHES SCREEN
// =============================================================================
// Browse and search for churches.
// Shows church listings with ratings and info.

import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { Card } from '../common'

function Churches() {
  const navigate = useNavigate()

  // Get church data from context
  const {
    churches,
    churchSearchQuery,
    setChurchSearchQuery
  } = useApp()

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
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="screen-content">
        {churches.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">⛪</div>
            <div className="empty-text">No churches found</div>
            <div className="empty-subtext">
              Try a different search term
            </div>
          </div>
        ) : (
          churches.map(church => (
            <Card
              key={church.id}
              onClick={() => navigate(`/churches/${church.id}`)}
            >
              {/* Church Header */}
              <div className="church-top">
                <div>
                  <div className="church-name">{church.name}</div>
                  <div className="church-address">
                    {church.address}, {church.city}
                  </div>
                </div>
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
                  {church.sundaySchool ? '✓ Sunday School' : '✗ No Sunday School'}
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
