// =============================================================================
// CHURCH DETAIL SCREEN
// =============================================================================
// Shows detailed information about a specific church.
// Includes reviews section with star ratings.

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { Card, Modal, Avatar } from '../common'
import { ArrowLeft, Church, Check, Heart, Star, Edit3, Trash2, Users, Megaphone, Music, BookOpen, GraduationCap, Baby, Book, Car, Building, Navigation, Clock } from 'lucide-react'
import { api } from '../../utils/api'

// The 8 rating categories — each has a key (matches backend), display label, and icon
const RATING_CATEGORIES = [
  { key: 'worship',    label: 'Worship',      icon: Music },
  { key: 'sermon',     label: 'Sermon',       icon: BookOpen },
  { key: 'community',  label: 'Community',    icon: Users },
  { key: 'youth',      label: 'Youth',        icon: GraduationCap },
  { key: 'children',   label: 'Children',     icon: Baby },
  { key: 'bibleStudy', label: 'Bible Study',  icon: Book },
  { key: 'parking',    label: 'Parking',      icon: Car },
  { key: 'facilities', label: 'Facilities',   icon: Building },
]

// Blank categories object (all null = nothing rated)
const EMPTY_CATEGORIES = {
  worship: null, sermon: null, community: null, youth: null,
  children: null, bibleStudy: null, parking: null, facilities: null,
}

// Compute overall from whichever categories are rated (non-null)
function computeOverall(cats) {
  const rated = Object.values(cats).filter(v => v !== null)
  if (rated.length === 0) return 0
  return rated.reduce((sum, v) => sum + v, 0) / rated.length
}

function ChurchDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { toggleFavoriteChurch, isChurchFavorited, user, showUserActionMenu } = useApp()

  // Fetch church by ID from the API (not from local cache)
  const [church, setChurch] = useState(null)
  const [loading, setLoading] = useState(true)

  // Church members state (people who favorited/reviewed this church)
  const [members, setMembers] = useState([])

  // Reviews state
  const [reviews, setReviews] = useState([])
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [reviewCategories, setReviewCategories] = useState({ ...EMPTY_CATEGORIES })
  const [reviewText, setReviewText] = useState('')
  const [editingReview, setEditingReview] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Bulletin board state
  const [announcements, setAnnouncements] = useState([])
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false)
  const [annTitle, setAnnTitle] = useState('')
  const [annMessage, setAnnMessage] = useState('')
  const [annCategory, setAnnCategory] = useState('Announcement')
  const [annSubmitting, setAnnSubmitting] = useState(false)

  async function loadChurch() {
    try {
      const data = await api.get(`/churches/${id}`)
      setChurch(data.church)
    } catch (error) {
      console.error('Failed to load church:', error)
      setChurch(null)
    } finally {
      setLoading(false)
    }
  }

  // Load church data, reviews, members, and announcements when component mounts
  useEffect(() => {
    loadChurch()
    loadReviews()
    loadMembers()
    loadAnnouncements()
  }, [id])

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

  async function loadAnnouncements() {
    try {
      const { announcements: data } = await api.get(`/churches/${id}/announcements`)
      setAnnouncements(data)
    } catch (error) {
      console.error('Failed to load announcements:', error)
    }
  }

  async function handleCreateAnnouncement() {
    if (!annTitle.trim() || !annMessage.trim()) return
    setAnnSubmitting(true)
    try {
      await api.post(`/churches/${id}/announcements`, {
        title: annTitle.trim(),
        message: annMessage.trim(),
        category: annCategory
      })
      setAnnTitle('')
      setAnnMessage('')
      setAnnCategory('Announcement')
      setShowAnnouncementModal(false)
      loadAnnouncements()
    } catch (error) {
      console.error('Failed to create announcement:', error)
    } finally {
      setAnnSubmitting(false)
    }
  }

  // Check if user already has a review
  const myReview = reviews.find(r => r.userId === user?.id)

  function openWriteReview() {
    if (myReview) {
      // If existing review has category data, use it; otherwise start fresh
      if (myReview.categories && Object.values(myReview.categories).some(v => v !== null)) {
        setReviewCategories({ ...myReview.categories })
      } else {
        setReviewCategories({ ...EMPTY_CATEGORIES })
      }
      setReviewText(myReview.text || '')
      setEditingReview(true)
    } else {
      setReviewCategories({ ...EMPTY_CATEGORIES })
      setReviewText('')
      setEditingReview(false)
    }
    setShowReviewModal(true)
  }

  async function handleSubmitReview() {
    const overall = computeOverall(reviewCategories)
    if (overall === 0) return // No categories rated
    setSubmitting(true)
    try {
      const payload = { categories: reviewCategories, text: reviewText }
      if (editingReview) {
        await api.put(`/churches/${id}/reviews`, payload)
      } else {
        await api.post(`/churches/${id}/reviews`, payload)
      }
      // Reload both reviews and church data (category averages changed)
      await Promise.all([loadReviews(), loadChurch()])
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
      await Promise.all([loadReviews(), loadChurch()])
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

  if (loading) {
    return (
      <div className="screen" style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-faint)' }}>
        Loading church...
      </div>
    )
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
        {/* Church Photo (Google Places proxy or legacy photo_url) */}
        {(church.googlePlaceId || church.photoUrl) && (
          <div style={{ borderRadius: '12px', overflow: 'hidden', marginBottom: '12px' }}>
            <img
              src={church.googlePlaceId
                ? `${import.meta.env.VITE_API_URL || ''}/api/churches/photo/${church.googlePlaceId}`
                : church.photoUrl
              }
              alt={church.name}
              style={{ width: '100%', height: '180px', objectFit: 'cover', display: 'block' }}
              onError={(e) => { e.target.parentElement.style.display = 'none' }}
            />
          </div>
        )}

        {/* Church Name & Address */}
        <Card>
          <h2 className="church-name" style={{ marginBottom: '8px' }}>{church.name}</h2>
          {church.shortDescription && (
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '12px' }}>{church.shortDescription}</p>
          )}
          <p className="church-address">
            {church.address}
            {church.state && <><br />{church.city}, {church.state} {church.zip !== '00000' ? church.zip : ''}</>}
            {!church.state && <><br />{church.city}{church.zip ? `, ${church.zip}` : ''}</>}
          </p>
          {church.phone && (
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '8px' }}>
              Phone: <a href={`tel:${church.phone}`} style={{ color: 'var(--brand-primary)' }}>{church.phone}</a>
            </p>
          )}
          {church.website && (
            <p style={{ fontSize: '14px', marginTop: '4px' }}>
              <a href={church.website} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--brand-primary)' }}>
                Visit Website
              </a>
            </p>
          )}

          {/* Get Directions link */}
          <p style={{ fontSize: '14px', marginTop: '4px' }}>
            <a
              href={church.googlePlaceId
                ? `https://www.google.com/maps/place/?q=place_id:${church.googlePlaceId}`
                : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(church.address + ', ' + church.city + ', ' + church.state)}`
              }
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--brand-primary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              <Navigation size={14} /> Get Directions
            </a>
          </p>

          {/* Ratings — Google + Sanctuary side by side */}
          {(church.googleRating || church.reviewCount > 0) && (
            <div className="church-ratings-row" style={{ marginTop: '16px' }}>
              {church.googleRating && (
                <div className="church-rating-badge">
                  <Star size={14} fill="#f59e0b" color="#f59e0b" />
                  <span style={{ fontWeight: '600' }}>{church.googleRating.toFixed(1)}</span>
                  <span style={{ color: 'var(--text-faint)', fontSize: '12px' }}>Google</span>
                </div>
              )}
              {church.reviewCount > 0 && (
                <div className="church-rating-badge">
                  <span className="stars stars-sm">{renderStars(church.overallRating)}</span>
                  <span style={{ fontWeight: '600' }}>{church.overallRating}</span>
                  <span style={{ color: 'var(--text-faint)', fontSize: '12px' }}>({church.reviewCount}) Sanctuary</span>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Service Times (only show if data exists) */}
        {church.hours && (
          <Card>
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={16} /> Service Times
            </h3>
            <div className="church-hours-list">
              {church.hours.split('\n').map((line, i) => (
                <div key={i} className="church-hours-line">{line}</div>
              ))}
            </div>
          </Card>
        )}

        {/* Programs (only show if sundaySchool data exists) */}
        {church.sundaySchool && (
          <Card>
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px' }}>Programs</h3>
            <div className="church-meta">
              <span className="meta-tag meta-tag-yes">
                <Check size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> Sunday School
              </span>
              {church.recommendedAges && <span className="meta-tag">{church.recommendedAges}</span>}
            </div>
          </Card>
        )}

        {/* Rating Breakdown — bar chart showing per-category averages */}
        {church.reviewCount > 0 && church.categoryRatings &&
         Object.values(church.categoryRatings).some(v => v !== null) && (
          <Card>
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>Rating Breakdown</h3>
            {RATING_CATEGORIES.map(({ key, label, icon: Icon }) => {
              const avg = church.categoryRatings[key]
              if (avg === null) return null
              return (
                <div key={key} className="category-breakdown-row">
                  <div className="category-breakdown-label">
                    <Icon size={14} />
                    <span>{label}</span>
                  </div>
                  <div className="category-breakdown-bar-wrapper">
                    <div
                      className="category-breakdown-bar"
                      style={{ width: `${(avg / 5) * 100}%` }}
                    />
                  </div>
                  <span className="category-breakdown-value">{avg.toFixed(1)}</span>
                </div>
              )
            })}
          </Card>
        )}

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
                  onClick={() => member.id !== user?.id && showUserActionMenu({
                    userId: member.id, userName: member.name,
                    photoUrl: member.photoUrl, avatar: member.avatar
                  })}
                  style={{ cursor: member.id !== user?.id ? 'pointer' : 'default' }}
                >
                  <Avatar emoji={member.avatar} src={member.photoUrl} name={member.name} size="md" />
                  <div className={`church-member-name ${member.id !== user?.id ? 'tappable-name' : ''}`}>{member.name}</div>
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

        {/* Bulletin Board */}
        {(announcements.length > 0 || user?.role === 'guide') && (
          <div className="bulletin-section">
            <div className="section-header">
              <h3 className="section-title">
                <Megaphone size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
                Bulletin Board
              </h3>
              {user?.role === 'guide' && (
                <button className="view-all-btn" onClick={() => setShowAnnouncementModal(true)}>
                  + Post
                </button>
              )}
            </div>
            {announcements.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--text-faint)', fontSize: '14px' }}>
                No announcements yet
              </div>
            ) : (
              announcements.map(ann => (
                <div key={ann.id} className="bulletin-card">
                  <div className="bulletin-card-header">
                    <span className="bulletin-card-title">{ann.title}</span>
                    <span className={`bulletin-category bulletin-category-${ann.category.toLowerCase().replace(/[\s/]+/g, '-')}`}>
                      {ann.category}
                    </span>
                  </div>
                  <div className="bulletin-card-message">{ann.message}</div>
                  <div className="bulletin-card-meta">
                    {ann.authorName} · {relativeTime(ann.createdAt)}
                  </div>
                </div>
              ))
            )}
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
              <div
                className="review-header"
                style={{ cursor: review.userId !== user?.id ? 'pointer' : 'default' }}
                onClick={() => review.userId !== user?.id && showUserActionMenu({
                  userId: review.userId, userName: review.userName,
                  photoUrl: review.userPhoto, avatar: review.userAvatar
                })}
              >
                <Avatar emoji={review.userAvatar} src={review.userPhoto} size="sm" variant="blue" />
                <div className="review-info">
                  <span className={`review-name ${review.userId !== user?.id ? 'tappable-name' : ''}`}>{review.userName}</span>
                  <div className="review-meta">
                    <span className="stars stars-sm" style={{ fontSize: '12px' }}>{renderStars(review.rating)}</span>
                    <span>{relativeTime(review.createdAt)}</span>
                  </div>
                </div>
              </div>
              {review.text && <div className="review-text">{review.text}</div>}
              {/* Category mini-ratings (only for reviews with category data) */}
              {review.categories && Object.values(review.categories).some(v => v !== null) && (
                <div className="review-categories-mini">
                  {RATING_CATEGORIES.map(({ key, label }) => {
                    const val = review.categories[key]
                    if (val === null || val === undefined) return null
                    return (
                      <span key={key} className="review-category-tag">
                        {label}: <span className="stars stars-sm">{renderStars(val)}</span>
                      </span>
                    )
                  })}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Review Modal — 8 category rows with star pickers */}
      {showReviewModal && (
        <Modal onClose={() => setShowReviewModal(false)}>
          <div className="modal-title">{editingReview ? 'Edit Review' : 'Write a Review'}</div>
          <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-faint)', margin: '0 0 12px' }}>
            Rate the categories you experienced (all optional)
          </p>

          {/* Category Star Rows */}
          <div className="category-rating-list">
            {RATING_CATEGORIES.map(({ key, label, icon: Icon }) => (
              <div key={key} className="category-rating-row">
                <div className="category-rating-label">
                  <Icon size={16} />
                  <span>{label}</span>
                </div>
                <div className="category-rating-stars">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      className="review-star-btn"
                      onClick={() => setReviewCategories(prev => ({
                        ...prev,
                        [key]: prev[key] === n ? null : n
                      }))}
                    >
                      <Star
                        size={22}
                        fill={reviewCategories[key] && n <= reviewCategories[key] ? '#fbbf24' : 'none'}
                        color={reviewCategories[key] && n <= reviewCategories[key] ? '#fbbf24' : 'var(--text-faint)'}
                      />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Live computed overall */}
          {computeOverall(reviewCategories) > 0 && (
            <div className="review-computed-overall">
              <span className="stars" style={{ marginRight: '6px' }}>{renderStars(computeOverall(reviewCategories))}</span>
              {computeOverall(reviewCategories).toFixed(1)} overall
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Review (optional)</label>
            <textarea
              value={reviewText}
              onChange={e => setReviewText(e.target.value)}
              placeholder="Share your experience..."
              maxLength={500}
              rows={3}
            />
          </div>

          <div className="modal-buttons">
            <button className="btn-secondary" onClick={() => setShowReviewModal(false)}>Cancel</button>
            <button
              className="btn-primary"
              onClick={handleSubmitReview}
              disabled={computeOverall(reviewCategories) === 0 || submitting}
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

      {/* Create Announcement Modal */}
      {showAnnouncementModal && (
        <Modal onClose={() => setShowAnnouncementModal(false)}>
          <div className="modal-title">Post Announcement</div>

          <div className="create-announcement-form">
            <div>
              <label>Title</label>
              <input
                type="text"
                value={annTitle}
                onChange={e => setAnnTitle(e.target.value)}
                placeholder="Announcement title"
                maxLength={200}
              />
            </div>

            <div>
              <label>Message</label>
              <textarea
                value={annMessage}
                onChange={e => setAnnMessage(e.target.value)}
                placeholder="What would you like to share?"
                maxLength={1000}
              />
            </div>

            <div>
              <label>Category</label>
              <select value={annCategory} onChange={e => setAnnCategory(e.target.value)}>
                <option value="Announcement">Announcement</option>
                <option value="Upcoming Sermon">Upcoming Sermon</option>
                <option value="Schedule Change">Schedule Change</option>
                <option value="Church Need">Church Need</option>
                <option value="Event">Event</option>
              </select>
            </div>
          </div>

          <div className="modal-buttons" style={{ marginTop: '16px' }}>
            <button className="btn-secondary" onClick={() => setShowAnnouncementModal(false)}>Cancel</button>
            <button
              className="btn-primary"
              onClick={handleCreateAnnouncement}
              disabled={!annTitle.trim() || !annMessage.trim() || annSubmitting}
            >
              {annSubmitting ? 'Posting...' : 'Post'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default ChurchDetail
