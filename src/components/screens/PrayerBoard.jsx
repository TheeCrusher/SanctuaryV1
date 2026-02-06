// =============================================================================
// PRAYER BOARD SCREEN
// =============================================================================
// Community prayer request board where users can post, pray, and comment.

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { Modal, Avatar, EmptyState } from '../common'
import { ArrowLeft, HandHeart, MessageCircle, Plus, Check, ChevronDown, ChevronUp } from 'lucide-react'
import { api } from '../../utils/api'

const CATEGORIES = ['All', 'Health', 'Family', 'Guidance', 'Gratitude', 'Financial', 'Other']

const CATEGORY_COLORS = {
  Health: { bg: '#fef2f2', color: '#dc2626' },
  Family: { bg: '#fef3c7', color: '#92400e' },
  Guidance: { bg: '#dbeafe', color: '#1e40af' },
  Gratitude: { bg: '#d1fae5', color: '#065f46' },
  Financial: { bg: '#f3e8ff', color: '#7c3aed' },
  Other: { bg: 'var(--bg-muted)', color: 'var(--text-secondary)' }
}

function PrayerBoard() {
  const navigate = useNavigate()
  const { user } = useApp()

  const [requests, setRequests] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [expandedId, setExpandedId] = useState(null)
  const [comments, setComments] = useState({})
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)

  // Create form state
  const [formTitle, setFormTitle] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formCategory, setFormCategory] = useState('Guidance')
  const [formAnonymous, setFormAnonymous] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadRequests()
  }, [selectedCategory])

  async function loadRequests() {
    try {
      const params = selectedCategory !== 'All' ? `?category=${selectedCategory}` : ''
      const { requests: data } = await api.get(`/prayers${params}`)
      setRequests(data)
    } catch (error) {
      console.error('Failed to load prayers:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate() {
    if (!formTitle.trim()) return
    setSubmitting(true)
    try {
      const { request } = await api.post('/prayers', {
        title: formTitle.trim(),
        description: formDescription.trim() || null,
        category: formCategory,
        isAnonymous: formAnonymous
      })
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
    } catch (error) {
      console.error('Failed to create prayer:', error)
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
      console.error('Failed to pray:', error)
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
        console.error('Failed to load comments:', error)
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
      console.error('Failed to add comment:', error)
    }
  }

  async function handleMarkAnswered(requestId) {
    try {
      await api.patch(`/prayers/${requestId}`)
      setRequests(prev => prev.filter(r => r.id !== requestId))
    } catch (error) {
      console.error('Failed to mark answered:', error)
    }
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
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-faint)' }}>Loading...</div>
        ) : requests.length === 0 ? (
          <EmptyState
            icon={<HandHeart size={48} />}
            text="No prayer requests yet"
            subtext="Be the first to share a prayer request"
            action={{ text: 'New Request', onClick: () => setShowCreateModal(true) }}
          />
        ) : (
          requests.map(req => (
            <div key={req.id} className="prayer-card">
              <div className="prayer-card-header">
                <Avatar emoji={req.userAvatar} src={req.userPhoto} size="sm" variant="blue" />
                <div className="prayer-card-info">
                  <div className="prayer-card-name">{req.userName}</div>
                  <div className="prayer-card-time">{relativeTime(req.createdAt)}</div>
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
              {req.description && <div className="prayer-card-desc">{req.description}</div>}

              <div className="prayer-card-actions">
                <button
                  className={`prayer-action-btn ${req.hasPrayed ? 'prayed' : ''}`}
                  onClick={() => !req.hasPrayed && handlePray(req.id)}
                  disabled={req.hasPrayed}
                >
                  <HandHeart size={16} />
                  {req.prayerCount} {req.prayerCount === 1 ? 'Prayer' : 'Prayers'}
                </button>
                <button className="prayer-action-btn" onClick={() => toggleExpand(req.id)}>
                  <MessageCircle size={16} />
                  {req.commentCount} {req.commentCount === 1 ? 'Comment' : 'Comments'}
                  {expandedId === req.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                {req.userId === user?.id && (
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
                      <Avatar emoji={c.userAvatar} src={c.userPhoto} size="sm" variant="blue" />
                      <div>
                        <span className="prayer-comment-name">{c.userName}</span>
                        <span className="prayer-comment-text">{c.text}</span>
                      </div>
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

      {/* Create Prayer Modal */}
      {showCreateModal && (
        <Modal onClose={() => setShowCreateModal(false)}>
          <div className="modal-title">New Prayer Request</div>

          <div className="form-group">
            <label className="form-label">Title</label>
            <input
              type="text"
              value={formTitle}
              onChange={e => setFormTitle(e.target.value)}
              placeholder="What would you like prayer for?"
              maxLength={200}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description (optional)</label>
            <textarea
              value={formDescription}
              onChange={e => setFormDescription(e.target.value)}
              placeholder="Share more details if you'd like..."
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
              {submitting ? 'Posting...' : 'Post Request'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default PrayerBoard
