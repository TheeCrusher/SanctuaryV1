// =============================================================================
// CHURCH DETAIL SCREEN
// =============================================================================
// Shows detailed information about a specific church.
// Includes reviews section with star ratings.

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { Card, Modal, Avatar, TappableName } from '../common'
import { ArrowLeft, Church, Check, X, Heart, Star, Edit3, Trash2, Users } from 'lucide-react'
import { api } from '../../utils/api'

function ChurchDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { allChurches, toggleFavoriteChurch, isChurchFavorited, user } = useApp()

  const church = allChurches.find(c => c.id === parseInt(id))

  // Church members state (people who favorited/reviewed this church)
  const [members, setMembers] = useState([])

  // Reviews state
  const [reviews, setReviews] = useState([])
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [editingReview, setEditingReview] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Load reviews and members when component mounts
  useEffect(() => {
    if (church) {
      loadReviews()
      loadMembers()
    }
  }, [church?.id])

  async function loadReviews() {
    try {
      const { reviews: data } = await api.get(`/churches/${id}/reviews`)
      setReviews(data)
    } catch (error) {
      console.error('Failed to load reviews:', error)
    }
  }

  async function loadMembers() {
    try {
      const { members: data } = await api.get(`/churches/${id}/members`)
      setMembers(data)
    } catch (error) {
      console.error('Failed to load members:', error)
    }
  }

  // Check if user already has a review
  const myReview = reviews.find(r => r.userId === user?.id)

  function openWriteReview() {
    if (myReview) {
      setReviewRating(myReview.rating)
      setReviewText(myReview.text || '')
      setEditingReview(true)
    } else {
      setReviewRating(0)
      setReviewText('')
      setEditingReview(false)
    }
    setShowReviewModal(true)
  }

  async function handleSubmitReview() {
    if (reviewRating === 0) return
    setSubmitting(true)
    try {
      if (editingReview) {
        await api.put(`/churches/${id}/reviews`, { rating: reviewRating, text: reviewText })
      } else {
        await api.post(`/churches/${id}/reviews`, { rating: reviewRating, text: reviewText })
      }
      await loadReviews()
      setShowReviewModal(false)
    } catch (error) {
      console.error('Failed to submit review:', error)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeleteReview() {
    try {
      await api.delete(`/churches/${id}/reviews`)
      await loadReviews()
      setShowReviewModal(false)
    } catch (error) {
      console.error('Failed to delete review:', error)
    }
  }

  function renderStars(rating) {
    const fullStars = Math.floor(rating)
    const hasHalf = rating % 1 >= 0.5
    let stars = '\u2605'.repeat(fullStars)
    if (hasHalf) stars += '\u00BD'
    return stars
  }

  function relativeTime(dateStr) {
    const now = new Date()
    const date = new Date(dateStr)
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

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
            <button className="btn-primary" onClick={() => navigate('/churches')} style={{ marginTop: '16px' }}>
              Back to Churches
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="screen with-bottom-nav">
      {/* Header */}
      <div className="screen-header">
        <div className="screen-header-top">
          <button className="back-btn" onClick={() => navigate('/churches')}>
            <ArrowLeft size={20} />
          </button>
          <h1 style={{ fontSize: '20px', fontWeight: '700', flex: 1, textAlign: 'center' }}>
            Church Details
          </h1>
          <button className="favorite-btn" onClick={() => toggleFavoriteChurch(church.id)}>
            <Heart
              size={22}
              fill={isChurchFavorited(church.id) ? '#ef4444' : 'none'}
              color={isChurchFavorited(church.id) ? '#ef4444' : '#9ca3af'}
            />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="screen-content">
        {/* Church Name & Address */}
        <Card>
          <h2 className="church-name" style={{ marginBottom: '8px' }}>{church.name}</h2>
          <p className="church-address">
            {church.address}<br />{church.city}, {church.zip}
          </p>
          <div className="church-overall" style={{ marginTop: '16px' }}>
            <span className="stars stars-lg">{renderStars(church.overallRating)}</span>
            <span className="star-score" style={{ fontSize: '18px' }}>{church.overallRating}</span>
            <span style={{ color: 'var(--text-faint)' }}>({church.reviewCount} reviews)</span>
          </div>
        </Card>

        {/* Service Times */}
        <Card>
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px' }}>Service Times</h3>
          <p style={{ color: 'var(--text-secondary)' }}>{church.hours}</p>
        </Card>

        {/* Ratings Breakdown */}
        <Card>
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px' }}>Ratings</h3>
          <div className="rating-grid">
            {['singing', 'preaching', 'openness', 'space'].map(cat => (
              <div key={cat}>
                <div className="rating-label">{cat.charAt(0).toUpperCase() + cat.slice(1)}</div>
                <div>
                  <span className="stars stars-sm">{renderStars(church.ratings[cat])}</span>
                  <span style={{ marginLeft: '8px', fontWeight: '600' }}>{church.ratings[cat]}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Programs */}
        <Card>
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px' }}>Programs</h3>
          <div className="church-meta">
            <span className={`meta-tag ${church.sundaySchool ? 'meta-tag-yes' : 'meta-tag-no'}`}>
              {church.sundaySchool
                ? <><Check size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> Sunday School</>
                : <><X size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> No Sunday School</>
              }
            </span>
            {church.sundaySchool && <span className="meta-tag">{church.recommendedAges}</span>}
          </div>
        </Card>

        {/* People at This Church */}
        {members.length > 0 && (
          <div className="church-members-section">
            <div className="section-header">
              <h3 className="section-title">
                <Users size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
                People at This Church
              </h3>
            </div>
            <div className="church-members-grid">
              {members.map(member => (
                <button
                  key={member.id}
                  className="church-member-card"
                  onClick={() => navigate(`/user/${member.id}`)}
                >
                  <Avatar emoji={member.avatar} src={member.photoUrl} size="md" />
                  <div className="church-member-name">{member.name}</div>
                  <span className={`role-badge role-badge-${member.role.toLowerCase()}`}>
                    {member.role}
                  </span>
                  {member.sharedInterests > 0 && (
                    <div className="church-member-shared">
                      {member.sharedInterests} shared {member.sharedInterests === 1 ? 'interest' : 'interests'}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Reviews Section */}
        <div className="section-header">
          <h3 className="section-title">Reviews</h3>
          <button className="view-all-btn" onClick={openWriteReview}>
            {myReview ? <><Edit3 size={14} /> Edit Review</> : '+ Write Review'}
          </button>
        </div>

        {reviews.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-faint)' }}>
            No reviews yet. Be the first!
          </div>
        ) : (
          reviews.map(review => (
            <div key={review.id} className="review-card">
              <div className="review-header">
                <Avatar emoji={review.userAvatar} src={review.userPhoto} size="sm" variant="blue" />
                <div className="review-info">
                  <TappableName userId={review.userId} name={review.userName} className="review-name" />
                  <div className="review-meta">
                    <span className="stars stars-sm" style={{ fontSize: '12px' }}>{renderStars(review.rating)}</span>
                    <span>{relativeTime(review.createdAt)}</span>
                  </div>
                </div>
              </div>
              {review.text && <div className="review-text">{review.text}</div>}
            </div>
          ))
        )}
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <Modal onClose={() => setShowReviewModal(false)}>
          <div className="modal-title">{editingReview ? 'Edit Review' : 'Write a Review'}</div>

          {/* Star Selector */}
          <div className="review-star-selector">
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} className="review-star-btn" onClick={() => setReviewRating(n)}>
                <Star size={32} fill={n <= reviewRating ? '#fbbf24' : 'none'} color={n <= reviewRating ? '#fbbf24' : 'var(--text-faint)'} />
              </button>
            ))}
          </div>
          {reviewRating > 0 && (
            <div style={{ textAlign: 'center', fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][reviewRating]}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Review (optional)</label>
            <textarea
              value={reviewText}
              onChange={e => setReviewText(e.target.value)}
              placeholder="Share your experience..."
              maxLength={500}
              rows={4}
            />
          </div>

          <div className="modal-buttons">
            <button className="btn-secondary" onClick={() => setShowReviewModal(false)}>Cancel</button>
            <button
              className="btn-primary"
              onClick={handleSubmitReview}
              disabled={reviewRating === 0 || submitting}
            >
              {submitting ? 'Saving...' : editingReview ? 'Update' : 'Submit'}
            </button>
          </div>

          {editingReview && (
            <button className="note-delete-btn" onClick={handleDeleteReview} style={{ marginTop: '12px' }}>
              <Trash2 size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
              Delete Review
            </button>
          )}
        </Modal>
      )}
    </div>
  )
}

export default ChurchDetail
