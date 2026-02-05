// =============================================================================
// CHURCH DETAIL SCREEN
// =============================================================================
// Shows detailed information about a specific church.
// Uses URL parameters to get the church ID.

import { useParams, useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { Card } from '../common'
import { ArrowLeft, Church, Check, X } from 'lucide-react'

function ChurchDetail() {
  const navigate = useNavigate()

  // useParams gets URL parameters (like :id in /churches/:id)
  const { id } = useParams()

  // Get all churches from context
  const { allChurches } = useApp()

  // Find the specific church by ID
  const church = allChurches.find(c => c.id === parseInt(id))

  // If church not found, show error
  if (!church) {
    return (
      <div className="screen">
        <div className="screen-header">
          <div className="screen-header-top">
            <button className="back-btn" onClick={() => navigate('/churches')}>
              <ArrowLeft size={20} />
            </button>
            <h1 style={{ fontSize: '20px', fontWeight: '700' }}>Church Not Found</h1>
            <div style={{ width: '40px' }} />
          </div>
        </div>
        <div className="screen-content">
          <div className="empty-state">
            <div className="empty-icon"><Church size={48} /></div>
            <div className="empty-text">Church not found</div>
            <button
              className="btn-primary"
              onClick={() => navigate('/churches')}
              style={{ marginTop: '16px' }}
            >
              Back to Churches
            </button>
          </div>
        </div>
      </div>
    )
  }

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
        <div className="screen-header-top">
          <button className="back-btn" onClick={() => navigate('/churches')}>
            ←
          </button>
          <h1 style={{ fontSize: '20px', fontWeight: '700', flex: 1, textAlign: 'center' }}>
            Church Details
          </h1>
          <div style={{ width: '40px' }} />
        </div>
      </div>

      {/* Content */}
      <div className="screen-content">
        {/* Church Name & Address */}
        <Card>
          <h2 className="church-name" style={{ marginBottom: '8px' }}>
            {church.name}
          </h2>
          <p className="church-address">
            {church.address}
            <br />
            {church.city}, {church.zip}
          </p>

          {/* Overall Rating */}
          <div className="church-overall" style={{ marginTop: '16px' }}>
            <span className="stars stars-lg">
              {renderStars(church.overallRating)}
            </span>
            <span className="star-score" style={{ fontSize: '18px' }}>
              {church.overallRating}
            </span>
            <span style={{ color: '#9ca3af' }}>
              ({church.reviewCount} reviews)
            </span>
          </div>
        </Card>

        {/* Service Times */}
        <Card>
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px' }}>
            Service Times
          </h3>
          <p style={{ color: '#374151' }}>{church.hours}</p>
        </Card>

        {/* Ratings Breakdown */}
        <Card>
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px' }}>
            Ratings
          </h3>
          <div className="rating-grid">
            <div>
              <div className="rating-label">Singing</div>
              <div>
                <span className="stars stars-sm">
                  {renderStars(church.ratings.singing)}
                </span>
                <span style={{ marginLeft: '8px', fontWeight: '600' }}>
                  {church.ratings.singing}
                </span>
              </div>
            </div>
            <div>
              <div className="rating-label">Preaching</div>
              <div>
                <span className="stars stars-sm">
                  {renderStars(church.ratings.preaching)}
                </span>
                <span style={{ marginLeft: '8px', fontWeight: '600' }}>
                  {church.ratings.preaching}
                </span>
              </div>
            </div>
            <div>
              <div className="rating-label">Openness</div>
              <div>
                <span className="stars stars-sm">
                  {renderStars(church.ratings.openness)}
                </span>
                <span style={{ marginLeft: '8px', fontWeight: '600' }}>
                  {church.ratings.openness}
                </span>
              </div>
            </div>
            <div>
              <div className="rating-label">Space</div>
              <div>
                <span className="stars stars-sm">
                  {renderStars(church.ratings.space)}
                </span>
                <span style={{ marginLeft: '8px', fontWeight: '600' }}>
                  {church.ratings.space}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Programs */}
        <Card>
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px' }}>
            Programs
          </h3>
          <div className="church-meta">
            <span className={`meta-tag ${church.sundaySchool ? 'meta-tag-yes' : 'meta-tag-no'}`}>
              {church.sundaySchool
                ? <><Check size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> Sunday School</>
                : <><X size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> No Sunday School</>
              }
            </span>
            {church.sundaySchool && (
              <span className="meta-tag">{church.recommendedAges}</span>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

export default ChurchDetail
