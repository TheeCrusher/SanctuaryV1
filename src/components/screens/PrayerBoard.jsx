// =============================================================================
// PRAYER BOARD SCREEN
// =============================================================================
// Community prayer request board where users can post, pray, and comment.

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { Modal, Avatar, EmptyState, LoadingSpinner, ErrorState } from '../common'
import { ArrowLeft, HandHeart, MessageCircle, Plus, Check, ChevronDown, ChevronUp, PartyPopper, Link } from 'lucide-react'
import { api } from '../../utils/api'
import { timeAgo } from '../../utils/helpers'

const CATEGORIES = ['All', 'Health', 'Family', 'Guidance', 'Gratitude', 'Financial', 'Other']

const CATEGORY_COLORS = {
  Health:    { bg: 'var(--accent-burgundy-light)', color: 'var(--accent-burgundy-text)' },
  Family:    { bg: 'var(--accent-gold-light)',     color: 'var(--accent-gold-text)' },
  Guidance:  { bg: 'var(--brand-light)',           color: 'var(--brand-light-text)' },
  Gratitude: { bg: 'var(--accent-green-light)',    color: 'var(--accent-green-text)' },
  Financial: { bg: 'var(--accent-purple-light)',   color: 'var(--accent-purple-text)' },
  Other:     { bg: 'var(--bg-muted)',              color: 'var(--text-secondary)' }
}

function PrayerBoard() {
  const navigate = useNavigate()
  const { user, showUserActionMenu } = useApp()

  const [topTab, setTopTab] = useState('prayer') // 'prayer' or 'testimony'
  const [requests, setRequests] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [expandedId, setExpandedId] = useState(null)
  const [comments, setComments] = useState({})
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(null)

  // Create form state
  const [formTitle, setFormTitle] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formCategory, setFormCategory] = useState('Guidance')
  const [formAnonymous, setFormAnonymous] = useState(false)
  const [formLinkedPrayerId, setFormLinkedPrayerId] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // User's prayer requests (for linking testimonies)
  const [userPrayers, setUserPrayers] = useState([])

  const isTestimony = topTab === 'testimony'

  useEffect(() => {
    loadRequests()
  }, [selectedCategory, topTab])

  // Load user's prayer requests when switching to testimony tab (for "link to prayer" dropdown)
  useEffect(() => {
    if (topTab === 'testimony') {
      api.get('/prayers/user-requests').then(data => {
        setUserPrayers(data.requests || [])
      }).catch(() => setUserPrayers([]))
    }
  }, [topTab])

  async function loadRequests() {
    try {
      setLoading(true)
      setFetchError(null)
      const catParam = selectedCategory !== 'All' ? `&category=${selectedCategory}` : ''
      const result = await api.get(`/prayers?type=${topTab}${catParam}`)
      setRequests(result?.requests || [])
    } catch (err) {
      setFetchError('Failed to load prayer requests. Please try again.')
      setRequests([])
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate() {
    if (!formTitle.trim()) return
    setSubmitting(true)
    try {
      const body = {
        title: formTitle.trim(),
        description: formDescription.trim() || null,
        category: formCategory,
        isAnonymous: formAnonymous,
        type: topTab
      }
      if (isTestimony && formLinkedPrayerId) {
        body.linkedPrayerId = parseInt(formLinkedPrayerId)
      }
      const { request } = await api.post('/prayers', body)
      // Add user info to the new request for display
      request.userName = formAnonymous ? 'Anonymous' : user.name
      request.userAvatar = formAnonymous ? '🙏' : user.avatar
      request.userPhoto = formAnonymous ? null : user.photoUrl
      setRequests(prev => [request, ...prev])
      setShowCreateModal(false)
      setFormTitle('')
      setFormDescription('')
      setFormCategory('Guidance')
      setFormAnonymous(false)
      setFormLinkedPrayerId('')
    } catch (error) {
      // ignore
    } finally {
      setSubmitting(false)
    }
  }

  async function handlePray(requestId) {
    try {
      const { prayerCount } = await api.post(`/prayers/${requestId}/pray`)
      setRequests(prev => prev.map(r =>
        r.id === requestId ? { ...r, prayerCount, hasPrayed: true } : r
      ))
    } catch (error) {
      // ignore
    }
  }

  async function toggleExpand(requestId) {
    if (expandedId === requestId) {
      setExpandedId(null)
      return
    }
    setExpandedId(requestId)
    if (!comments[requestId]) {
      try {
        const { comments: data } = await api.get(`/prayers/${requestId}/comments`)
        setComments(prev => ({ ...prev, [requestId]: data }))
      } catch (error) {
        // ignore
      }
    }
  }

  async function handleAddComment(requestId) {
    if (!newComment.trim()) return
    try {
      const { comment } = await api.post(`/prayers/${requestId}/comments`, { text: newComment.trim() })
      comment.userName = user.name
      comment.userAvatar = user.avatar
      comment.userPhoto = user.photoUrl
      setComments(prev => ({
        ...prev,
        [requestId]: [...(prev[requestId] || []), comment]
      }))
      setRequests(prev => prev.map(r =>
        r.id === requestId ? { ...r, commentCount: r.commentCount + 1 } : r
      ))
      setNewComment('')
    } catch (error) {
      // ignore
    }
  }

  async function handleMarkAnswered(requestId) {
    try {
      await api.patch(`/prayers/${requestId}`)
      setRequests(prev => prev.filter(r => r.id !== requestId))
    } catch (error) {
      // ignore
    }
  }

  return (
    <div className="screen with-bottom-nav">
      {/* Header */}
      <div className="screen-header">
        <div className="screen-header-top">
          <button className="back-btn" onClick={() => navigate('/more')}>
            <ArrowLeft size={20} />
          </button>
          <h1 className="section-title">Prayer Board</h1>
          <button className="icon-btn" onClick={() => setShowCreateModal(true)}>
            <Plus size={20} />
          </button>
        </div>

        {/* Prayer / Testimony toggle */}
        <div className="prayer-top-toggle" style={{ marginTop: 12 }}>
          <button className={topTab === 'prayer' ? 'active' : ''} onClick={() => setTopTab('prayer')}>
            Prayer Requests
          </button>
          <button className={topTab === 'testimony' ? 'active' : ''} onClick={() => setTopTab('testimony')}>
            Testimonies
          </button>
        </div>

        {/* Category pills */}
        <div className="category-pills" style={{ marginTop: 12 }}>
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
      </div>

      {/* Content */}
      <div className="screen-content">
        {loading ? (
          <LoadingSpinner />
        ) : fetchError ? (
          <ErrorState subtitle={fetchError} onAction={loadRequests} />
        ) : requests.length === 0 ? (
          <EmptyState
            icon={isTestimony ? PartyPopper : HandHeart}
            title={isTestimony ? 'No testimonies yet' : 'No prayer requests yet'}
            subtitle={isTestimony ? 'Be the first to share a testimony' : 'Be the first to share a prayer request'}
            actionLabel={isTestimony ? 'Share Testimony' : 'New Request'}
            onAction={() => setShowCreateModal(true)}
          />
        ) : (
          requests.map(req => (
            <div key={req.id} className={`prayer-card ${req.type === 'testimony' ? 'testimony-card' : ''}`}>
              <div className="prayer-card-header">
                <div
                  className="prayer-card-user"
                  style={{ cursor: !req.isAnonymous && req.userId !== user?.id ? 'pointer' : 'default' }}
                  onClick={() => !req.isAnonymous && req.userId !== user?.id && showUserActionMenu({
                    userId: req.userId, userName: req.userName,
                    photoUrl: req.userPhoto, avatar: req.userAvatar
                  })}
                >
                  <Avatar emoji={req.userAvatar} src={req.userPhoto} size="sm" variant="blue" />
                  <div className="prayer-card-info">
                    <span className={`prayer-card-name ${!req.isAnonymous && req.userId !== user?.id ? 'tappable-name' : ''}`}>{req.userName}</span>
                    <div className="prayer-card-time">{timeAgo(req.createdAt)}</div>
                  </div>
                </div>
                <span
                  className="prayer-category-badge"
                  style={{
                    background: CATEGORY_COLORS[req.category]?.bg,
                    color: CATEGORY_COLORS[req.category]?.color
                  }}
                >
                  {req.category}
                </span>
              </div>

              <div className="prayer-card-title">{req.title}</div>

              {/* Linked prayer reference (testimonies only) */}
              {isTestimony && req.linkedPrayerTitle && (
                <div className="testimony-linked">
                  <Link size={12} />
                  Answered prayer: {req.linkedPrayerTitle}
                </div>
              )}

              {req.description && <div className="prayer-card-desc">{req.description}</div>}

              <div className="prayer-card-actions">
                {isTestimony ? (
                  <button
                    className={`celebrate-btn ${req.hasPrayed ? 'active' : ''}`}
                    onClick={() => !req.hasPrayed && handlePray(req.id)}
                    disabled={req.hasPrayed}
                  >
                    <PartyPopper size={16} />
                    {req.prayerCount} {req.prayerCount === 1 ? 'Celebration' : 'Celebrations'}
                  </button>
                ) : (
                  <button
                    className={`prayer-action-btn ${req.hasPrayed ? 'prayed' : ''}`}
                    onClick={() => !req.hasPrayed && handlePray(req.id)}
                    disabled={req.hasPrayed}
                  >
                    <HandHeart size={16} />
                    {req.prayerCount} {req.prayerCount === 1 ? 'Prayer' : 'Prayers'}
                  </button>
                )}
                <button className="prayer-action-btn" onClick={() => toggleExpand(req.id)}>
                  <MessageCircle size={16} />
                  {req.commentCount} {req.commentCount === 1 ? 'Comment' : 'Comments'}
                  {expandedId === req.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                {!isTestimony && req.userId === user?.id && (
                  <button className="prayer-action-btn answered" onClick={() => handleMarkAnswered(req.id)}>
                    <Check size={16} /> Answered
                  </button>
                )}
              </div>

              {/* Expanded comments */}
              {expandedId === req.id && (
                <div className="prayer-comments">
                  {(comments[req.id] || []).map(c => (
                    <div key={c.id} className="prayer-comment">
                      <div
                        className="prayer-comment-user"
                        style={{ cursor: c.userId !== user?.id ? 'pointer' : 'default' }}
                        onClick={() => c.userId !== user?.id && showUserActionMenu({
                          userId: c.userId, userName: c.userName,
                          photoUrl: c.userPhoto, avatar: c.userAvatar
                        })}
                      >
                        <Avatar emoji={c.userAvatar} src={c.userPhoto} size="sm" variant="blue" />
                        <span className={`prayer-comment-name ${c.userId !== user?.id ? 'tappable-name' : ''}`}>{c.userName}</span>
                      </div>
                      <span className="prayer-comment-text">{c.text}</span>
                    </div>
                  ))}
                  <div className="prayer-comment-input">
                    <input
                      type="text"
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      onKeyDown={e => e.key === 'Enter' && handleAddComment(req.id)}
                    />
                    <button
                      className="btn-primary"
                      onClick={() => handleAddComment(req.id)}
                      style={{ padding: '10px 16px', width: 'auto' }}
                      disabled={!newComment.trim()}
                    >
                      Post
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Create Prayer/Testimony Modal */}
      {showCreateModal && (
        <Modal onClose={() => setShowCreateModal(false)}>
          <div className="modal-title">{isTestimony ? 'Share Testimony' : 'New Prayer Request'}</div>

          <div className="form-group">
            <label className="form-label">Title</label>
            <input
              type="text"
              value={formTitle}
              onChange={e => setFormTitle(e.target.value)}
              placeholder={isTestimony ? 'What is God doing in your life?' : 'What would you like prayer for?'}
              maxLength={200}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description (optional)</label>
            <textarea
              value={formDescription}
              onChange={e => setFormDescription(e.target.value)}
              placeholder={isTestimony ? 'Share your praise report...' : 'Share more details if you\'d like...'}
              maxLength={1000}
              rows={4}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Category</label>
            <select value={formCategory} onChange={e => setFormCategory(e.target.value)}>
              {CATEGORIES.filter(c => c !== 'All').map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Link to prayer request (testimonies only) */}
          {isTestimony && userPrayers.length > 0 && (
            <div className="form-group">
              <label className="form-label">Link to Prayer Request (optional)</label>
              <select value={formLinkedPrayerId} onChange={e => setFormLinkedPrayerId(e.target.value)}>
                <option value="">None</option>
                {userPrayers.map(p => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>
          )}

          <label className="prayer-anon-label">
            <input
              type="checkbox"
              checked={formAnonymous}
              onChange={e => setFormAnonymous(e.target.checked)}
            />
            <span>Post anonymously</span>
          </label>

          <div className="modal-buttons">
            <button className="btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleCreate} disabled={!formTitle.trim() || submitting}>
              {submitting ? 'Posting...' : isTestimony ? 'Share' : 'Post Request'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default PrayerBoard
