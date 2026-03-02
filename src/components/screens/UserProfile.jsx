// =============================================================================
// USER PROFILE SCREEN (Public view of another user)
// =============================================================================
// Shows another user's profile with connection status and action buttons.
// - "Add to Community" / "Request Pending" / "In Your Community" based on status
// - "Send Message" for everyone
// - "Book Session" only when a Seeker views a Guide's profile
// - 3-dot menu with "Block User" option

import './Profile.css'
import './BlockedUsersScreen.css'
import './GuidePostsFeed.css'
import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { Avatar, LoadingSpinner, ErrorState } from '../common'
import { ArrowLeft, MapPin, BookOpen, MessageCircle, UserPlus, Clock, Users, Calendar, Lock, MoreVertical, ShieldOff, Heart, Trash2, Star, UserCheck } from 'lucide-react'
import { api } from '../../utils/api'
import { timeAgo } from '../../utils/helpers'

function UserProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, startNewConversation } = useApp()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [connectionStatus, setConnectionStatus] = useState('none')
  const [connectionLoading, setConnectionLoading] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [blocking, setBlocking] = useState(false)
  const menuRef = useRef(null)

  async function loadProfile() {
    try {
      setLoading(true)
      setError(null)
      const [profileRes, statusRes] = await Promise.all([
        api.get(`/users/${id}`),
        api.get(`/community/status/${id}`)
      ])
      const p = profileRes.user
      setProfile(p)
      setConnectionStatus(statusRes.status)
      setIsFollowing(p?.isFollowing || false)
      setFollowerCount(p?.followerCount || 0)
      // Fetch guide-specific data in parallel
      if (p?.role === 'guide') {
        try {
          const [postsRes, reviewsRes] = await Promise.all([
            api.get(`/guide-posts/user/${id}`),
            api.get(`/guide-reviews/guide/${id}`)
          ])
          setGuidePosts(postsRes.posts || [])
          setReviews(reviewsRes.reviews || [])
          // Pre-fill review modal if user already left a review
          const mine = reviewsRes.reviews?.find(r => r.isOwn)
          if (mine) {
            setReviewRating(mine.rating)
            setReviewText(mine.reviewText || '')
          }
        } catch {
          // non-critical — silently skip
        }
      }
    } catch (err) {
      setError('Failed to load profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadProfile() }, [id])

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false)
      }
    }
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMenu])

  async function handleMessage() {
    const conv = await startNewConversation(Number(id))
    if (conv) navigate('/chat')
  }

  async function handleAddToCommunity() {
    setConnectionLoading(true)
    try {
      await api.post('/community/request', { recipientId: Number(id) })
      setConnectionStatus('pending_sent')
    } catch (error) {
      // ignore
    } finally {
      setConnectionLoading(false)
    }
  }

  const [guidePosts, setGuidePosts] = useState([])
  const [isFollowing, setIsFollowing] = useState(false)
  const [followerCount, setFollowerCount] = useState(0)
  const [followLoading, setFollowLoading] = useState(false)
  const [reviews, setReviews] = useState([])
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [reviewToast, setReviewToast] = useState(null)

  function showToast(msg) {
    setReviewToast(msg)
    setTimeout(() => setReviewToast(null), 3000)
  }

  function formatCount(n) {
    if (!n) return '0'
    if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}K`
    return String(n)
  }

  async function handleProfilePostLike(postId) {
    setGuidePosts(prev => prev.map(p =>
      p.id === postId
        ? { ...p, liked: !p.liked, likeCount: p.liked ? p.likeCount - 1 : p.likeCount + 1 }
        : p
    ))
    try {
      const data = await api.post(`/guide-posts/${postId}/like`, {})
      setGuidePosts(prev => prev.map(p =>
        p.id === postId ? { ...p, liked: data.liked, likeCount: data.likeCount } : p
      ))
    } catch {
      setGuidePosts(prev => prev.map(p =>
        p.id === postId
          ? { ...p, liked: !p.liked, likeCount: p.liked ? p.likeCount - 1 : p.likeCount + 1 }
          : p
      ))
    }
  }

  async function handleProfilePostDelete(postId) {
    if (!window.confirm('Delete this post?')) return
    try {
      await api.delete(`/guide-posts/${postId}`)
      setGuidePosts(prev => prev.filter(p => p.id !== postId))
    } catch {
      // silently fail
    }
  }

  const [waitlistLoading, setWaitlistLoading] = useState(false)

  async function handleBlock() {
    if (!confirm(`Block ${profile.name}? They won't be able to see your profile, messages, or activity.`)) {
      return
    }
    setBlocking(true)
    setShowMenu(false)
    try {
      await api.post('/blocks', { blockedId: Number(id) })
      navigate(-1)
    } catch (error) {
      setBlocking(false)
    }
  }

  async function handleFollow() {
    setFollowLoading(true)
    try {
      if (isFollowing) {
        const data = await api.delete(`/follows/${id}`)
        setIsFollowing(false)
        setFollowerCount(data.followerCount)
      } else {
        const data = await api.post(`/follows/${id}`, {})
        setIsFollowing(true)
        setFollowerCount(data.followerCount)
      }
    } catch {
      // silently fail
    } finally {
      setFollowLoading(false)
    }
  }

  async function handleSubmitReview() {
    if (!reviewRating) return
    setReviewSubmitting(true)
    try {
      const data = await api.post(`/guide-reviews/guide/${id}`, {
        rating: reviewRating,
        reviewText: reviewText.trim() || null
      })
      // Update profile rating stats + reviews list
      setProfile(prev => ({
        ...prev,
        overallRating: data.guideStats.overallRating,
        reviewCount: data.guideStats.reviewCount
      }))
      const refreshed = await api.get(`/guide-reviews/guide/${id}`)
      setReviews(refreshed.reviews || [])
      setShowReviewModal(false)
      showToast('Review submitted!')
    } catch {
      showToast('Failed to submit review.')
    } finally {
      setReviewSubmitting(false)
    }
  }

  async function handleDeleteReview() {
    if (!confirm('Delete your review?')) return
    try {
      await api.delete(`/guide-reviews/guide/${id}`)
      const data = await api.get(`/guide-reviews/guide/${id}`)
      setReviews(data.reviews || [])
      const statsData = await api.get(`/users/${id}`)
      setProfile(prev => ({
        ...prev,
        overallRating: statsData.user.overallRating,
        reviewCount: statsData.user.reviewCount
      }))
      setReviewRating(0)
      setReviewText('')
      setShowReviewModal(false)
      showToast('Review deleted.')
    } catch {
      showToast('Failed to delete review.')
    }
  }

  async function handleJoinWaitlist() {
    setWaitlistLoading(true)
    try {
      await api.post('/users/waitlist', { guideId: Number(id) })
      setProfile(prev => ({ ...prev, onWaitlist: true }))
    } catch (error) {
      // ignore
    } finally {
      setWaitlistLoading(false)
    }
  }

  // Guide availability logic for seekers
  const isGuide = profile?.role?.toLowerCase() === 'guide'
  const isViewerSeeker = user?.role === 'seeker'
  const guideNotAccepting = isGuide && profile?.acceptingSeekers === false
  const guideIsFull = isGuide && profile?.acceptingSeekers !== false &&
    profile?.pendingCount >= profile?.maxPendingRequests

  const showBookSession = isViewerSeeker && isGuide && !guideNotAccepting && !guideIsFull
  const showWaitlist = isViewerSeeker && isGuide && guideIsFull && !profile?.onWaitlist
  const showOnWaitlist = isViewerSeeker && isGuide && profile?.onWaitlist
  const showNotAccepting = isViewerSeeker && isGuide && guideNotAccepting

  if (loading) {
    return (
      <div className="screen">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="screen">
        <ErrorState subtitle={error} onAction={loadProfile} />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="screen">
        <div className="screen-header">
          <div className="screen-header-top">
            <button className="back-btn" onClick={() => navigate(-1)}>
              <ArrowLeft size={20} />
            </button>
            <h1 className="section-title">Profile</h1>
            <div className="header-spacer" />
          </div>
        </div>
        <div className="screen-content">
          <div className="empty-state">
            <div className="empty-text">User not found</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="screen with-bottom-nav">
      <div className={`profile-header ${profile.role?.toLowerCase() === 'guide' ? 'profile-header-guide' : ''}`}>
        <button className="back-btn" onClick={() => navigate(-1)} style={{ position: 'absolute', top: 16, left: 16 }}>
          <ArrowLeft size={20} />
        </button>

        {/* 3-dot menu (only for other users' profiles) */}
        {connectionStatus !== 'self' && (
          <div className="three-dot-menu" ref={menuRef}>
            <button
              className="three-dot-btn"
              onClick={() => setShowMenu(!showMenu)}
              disabled={blocking}
            >
              <MoreVertical size={20} />
            </button>
            {showMenu && (
              <div className="three-dot-dropdown">
                <button className="three-dot-item danger" onClick={handleBlock}>
                  <ShieldOff size={16} />
                  Block User
                </button>
              </div>
            )}
          </div>
        )}

        <div className={profile.role?.toLowerCase() === 'guide' ? 'profile-avatar-guide' : 'profile-avatar-seeker'} style={{ borderRadius: '50%' }}>
          <Avatar
            src={profile.photoUrl}
            emoji={profile.avatar}
            size="xl"
            variant="gradient"
          />
        </div>
        <div className="profile-name" style={{ marginTop: 12 }}>{profile.name}</div>
        <div className={`profile-role-badge ${profile.role?.toLowerCase() === 'guide' ? 'role-guide' : 'role-seeker'}`}>{profile.role}</div>

        <div className="profile-details">
          {profile.specialization && (
            <div className="profile-detail-row">
              <BookOpen size={14} />
              <span>{profile.specialization}</span>
            </div>
          )}
          {profile.location && (
            <div className="profile-detail-row">
              <MapPin size={14} />
              <span>{profile.location}</span>
            </div>
          )}
          {profile.bio && (
            <div className="profile-bio">{profile.bio}</div>
          )}
          {profile.isConnected === false && (
            <div className="profile-limited-hint">
              <Lock size={14} />
              <span>Connect to see full profile</span>
            </div>
          )}
        </div>

        {/* Guide credibility stats — followers + rating */}
        {isGuide && (followerCount > 0 || profile.overallRating > 0) && (
          <div className="profile-guide-cred">
            {followerCount > 0 && (
              <span className="profile-cred-chip">
                <Users size={13} /> {formatCount(followerCount)} {followerCount === 1 ? 'follower' : 'followers'}
              </span>
            )}
            {profile.overallRating > 0 && (
              <span className="profile-cred-chip profile-cred-chip-gold">
                <Star size={13} fill="var(--accent-gold)" color="var(--accent-gold)" />
                {profile.overallRating.toFixed(1)} ({profile.reviewCount} {profile.reviewCount === 1 ? 'review' : 'reviews'})
              </span>
            )}
          </div>
        )}

        {/* Connection status / action */}
        {connectionStatus !== 'self' && (
          <div className="profile-actions">
            {/* Follow button — for guide profiles, any user can follow */}
            {isGuide && (
              <button
                className={isFollowing ? 'btn-secondary' : 'btn-gold'}
                onClick={handleFollow}
                disabled={followLoading}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                {isFollowing
                  ? <><UserCheck size={18} /> Following</>
                  : <><UserPlus size={18} /> Follow</>
                }
              </button>
            )}

            {connectionStatus === 'none' && (
              <button
                className="connection-btn"
                onClick={handleAddToCommunity}
                disabled={connectionLoading}
              >
                <UserPlus size={18} />
                {connectionLoading ? 'Sending...' : 'Add to Community'}
              </button>
            )}
            {connectionStatus === 'pending_sent' && (
              <div className="connection-status connection-status-pending">
                <Clock size={16} />
                Request Pending
              </div>
            )}
            {connectionStatus === 'pending_received' && (
              <div className="connection-status connection-status-pending">
                <Clock size={16} />
                Wants to connect with you
              </div>
            )}
            {connectionStatus === 'accepted' && (
              <div className="connection-status connection-status-connected">
                <Users size={16} />
                In Your Community
              </div>
            )}

            <button className="btn-primary" onClick={handleMessage} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <MessageCircle size={18} /> Send Message
            </button>

            {showBookSession && (
              <button
                className="btn-gold"
                onClick={() => navigate(`/appointments?guideId=${profile.id}&guideName=${encodeURIComponent(profile.name)}`)}
              >
                <Calendar size={18} /> Book Session
              </button>
            )}

            {showNotAccepting && (
              <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '8px 0', fontSize: '14px' }}>
                This guide is not currently accepting new seekers.
              </div>
            )}

            {showWaitlist && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '8px' }}>
                  Pending requests full
                </div>
                <button className="btn-gold" onClick={handleJoinWaitlist} disabled={waitlistLoading}>
                  <Clock size={18} /> {waitlistLoading ? 'Joining...' : 'Join Waitlist'}
                </button>
              </div>
            )}

            {showOnWaitlist && (
              <div style={{ color: 'var(--accent-gold)', textAlign: 'center', padding: '8px 0', fontSize: '14px' }}>
                You're on the waitlist. You'll be notified when a spot opens.
              </div>
            )}

            {/* Write / Edit review button — seeker viewing a guide's profile */}
            {isGuide && isViewerSeeker && (
              <button
                className="btn-secondary"
                onClick={() => setShowReviewModal(true)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                <Star size={16} />
                {reviews.some(r => r.isOwn) ? 'Edit Review' : 'Write a Review'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Toast */}
      {reviewToast && (
        <div style={{
          position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--bg-secondary)', color: 'var(--text-primary)',
          padding: '10px 20px', borderRadius: 20, fontSize: 14,
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)', zIndex: 1000,
          border: '1px solid var(--border-color)'
        }}>
          {reviewToast}
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <div className="modal-overlay" onClick={() => setShowReviewModal(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-title">
              {reviews.some(r => r.isOwn) ? `Edit Your Review` : `Rate ${profile.name}`}
            </div>

            {/* Star picker */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10, margin: '16px 0' }}>
              {[1,2,3,4,5].map(n => (
                <button
                  key={n}
                  onClick={() => setReviewRating(reviewRating === n ? 0 : n)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
                >
                  <Star
                    size={32}
                    fill={n <= reviewRating ? 'var(--accent-gold)' : 'none'}
                    color={n <= reviewRating ? 'var(--accent-gold)' : 'var(--text-faint)'}
                  />
                </button>
              ))}
            </div>
            {reviewRating > 0 && (
              <div style={{ textAlign: 'center', color: 'var(--accent-gold)', fontWeight: 600, marginBottom: 12, fontSize: 14 }}>
                {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][reviewRating]}
              </div>
            )}

            <textarea
              value={reviewText}
              onChange={e => setReviewText(e.target.value)}
              placeholder="Share your experience (optional)..."
              maxLength={500}
              rows={3}
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border-color)',
                background: 'var(--bg-primary)', color: 'var(--text-primary)',
                fontSize: 14, resize: 'none', boxSizing: 'border-box'
              }}
            />

            <div className="modal-buttons" style={{ marginTop: 16 }}>
              <button className="btn-secondary" onClick={() => setShowReviewModal(false)}>
                Cancel
              </button>
              <button
                className="btn-gold"
                onClick={handleSubmitReview}
                disabled={!reviewRating || reviewSubmitting}
              >
                {reviewSubmitting ? 'Saving...' : reviews.some(r => r.isOwn) ? 'Update' : 'Submit'}
              </button>
            </div>

            {reviews.some(r => r.isOwn) && (
              <button
                onClick={handleDeleteReview}
                style={{ width: '100%', marginTop: 8, padding: '8px', background: 'none',
                  border: 'none', color: 'var(--text-faint)', fontSize: 13, cursor: 'pointer' }}
              >
                Delete my review
              </button>
            )}
          </div>
        </div>
      )}

      {/* Guide Reviews Section — shown for guide profiles with reviews */}
      {isGuide && reviews.length > 0 && (
        <div className="screen-content" style={{ paddingTop: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 10px 4px' }}>
            Reviews
            {profile.overallRating > 0 && (
              <span style={{ fontWeight: 400, fontSize: 14, color: 'var(--accent-gold)', marginLeft: 8 }}>
                ★ {profile.overallRating.toFixed(1)}
              </span>
            )}
          </h2>
          {reviews.map(review => (
            <div key={review.id} style={{
              background: 'var(--bg-secondary)', borderRadius: 12, padding: '12px 14px',
              marginBottom: 10, border: '1px solid var(--border-warm)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Avatar
                    src={review.seekerPhoto}
                    emoji={review.seekerAvatar}
                    size="sm"
                  />
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                    {review.seekerName}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 2 }}>
                  {[1,2,3,4,5].map(n => (
                    <Star
                      key={n}
                      size={13}
                      fill={n <= review.rating ? 'var(--accent-gold)' : 'none'}
                      color={n <= review.rating ? 'var(--accent-gold)' : 'var(--text-faint)'}
                    />
                  ))}
                </div>
              </div>
              {review.reviewText && (
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0', lineHeight: 1.5 }}>
                  {review.reviewText}
                </p>
              )}
              <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 6 }}>
                {timeAgo(review.createdAt)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Guide Posts Section — shown below profile card for guide profiles */}
      {isGuide && (
        <div className="screen-content" style={{ paddingTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, padding: '0 4px' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Posts</h2>
          </div>

          {guidePosts.length === 0 ? (
            <p style={{ color: 'var(--text-faint)', fontSize: 14, textAlign: 'center', padding: '16px 0' }}>
              No posts yet.
            </p>
          ) : (
            guidePosts.map(post => (
              <div key={post.id} className="gp-card" style={{ margin: '0 0 12px' }}>
                <div className="gp-card-inner">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span className={`gp-type-badge gp-type-${post.postType}`}>
                      {post.postType === 'devotional' && '✨ '}
                      {post.postType === 'reflection' && '💭 '}
                      {post.postType === 'scripture' && '📖 '}
                      {post.postType === 'general' && '💬 '}
                      {post.postType}
                    </span>
                    <span className="gp-time">{timeAgo(post.createdAt)}</span>
                  </div>

                  <h3 className="gp-title">{post.title}</h3>

                  {post.scriptureRef && (
                    <div className="gp-scripture-ref" style={{ marginBottom: 8 }}>
                      <BookOpen size={12} />
                      {post.scriptureRef}
                    </div>
                  )}

                  <p className="gp-content" style={{ WebkitLineClamp: 3, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {post.content}
                  </p>

                  <div className="gp-footer">
                    <button
                      className={`gp-like-btn${post.liked ? ' liked' : ''}`}
                      onClick={() => handleProfilePostLike(post.id)}
                    >
                      <Heart size={16} fill={post.liked ? 'currentColor' : 'none'} />
                      {post.likeCount > 0 && <span>{post.likeCount}</span>}
                    </button>
                    {post.isOwn && (
                      <button className="gp-delete-btn" onClick={() => handleProfilePostDelete(post.id)}>
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default UserProfile
