// =============================================================================
// GUIDE POSTS FEED
// =============================================================================
// A public feed of short-form content published by guides: devotionals,
// reflections, scripture notes, and general messages. Any logged-in user
// can read and like posts. Only guides can write and delete posts.

import './GuidePostsFeed.css'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { Avatar, Modal, LoadingSpinner, EmptyState, ErrorState } from '../common'
import { api } from '../../utils/api'
import { timeAgo } from '../../utils/helpers'
import { Heart, Trash2, PenSquare, BookOpen } from 'lucide-react'

const POST_TYPES = ['All', 'Devotional', 'Reflection', 'Scripture', 'General']

const TYPE_ICONS = {
  devotional: '✨',
  reflection: '💭',
  scripture: '📖',
  general: '💬'
}

function GuidePostsFeed() {
  const navigate = useNavigate()
  const { user } = useApp()

  const [posts, setPosts]             = useState([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState(null)
  const [filter, setFilter]           = useState('All')
  const [expanded, setExpanded]       = useState({})   // postId → true
  const [showCreate, setShowCreate]   = useState(false)

  // Create-post form state
  const [form, setForm]               = useState({ title: '', content: '', postType: 'devotional', scriptureRef: '' })
  const [submitting, setSubmitting]   = useState(false)
  const [formError, setFormError]     = useState(null)

  // ── Load posts ────────────────────────────────────────────────────────────
  async function loadPosts() {
    try {
      setLoading(true)
      setError(null)
      const params = filter !== 'All' ? `?type=${filter.toLowerCase()}` : ''
      const data = await api.get(`/guide-posts${params}`)
      setPosts(data.posts || [])
    } catch {
      setError('Failed to load posts. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadPosts() }, [filter])

  // ── Like toggle ───────────────────────────────────────────────────────────
  async function handleLike(postId) {
    // Optimistic update
    setPosts(prev => prev.map(p =>
      p.id === postId
        ? { ...p, liked: !p.liked, likeCount: p.liked ? p.likeCount - 1 : p.likeCount + 1 }
        : p
    ))
    try {
      const data = await api.post(`/guide-posts/${postId}/like`, {})
      setPosts(prev => prev.map(p =>
        p.id === postId ? { ...p, liked: data.liked, likeCount: data.likeCount } : p
      ))
    } catch {
      // Revert optimistic update on failure
      setPosts(prev => prev.map(p =>
        p.id === postId
          ? { ...p, liked: !p.liked, likeCount: p.liked ? p.likeCount - 1 : p.likeCount + 1 }
          : p
      ))
    }
  }

  // ── Delete post ───────────────────────────────────────────────────────────
  async function handleDelete(postId) {
    if (!window.confirm('Delete this post?')) return
    try {
      await api.delete(`/guide-posts/${postId}`)
      setPosts(prev => prev.filter(p => p.id !== postId))
    } catch {
      // silently fail — post stays visible
    }
  }

  // ── Create post ───────────────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim() || !form.content.trim()) {
      setFormError('Title and message are required.')
      return
    }
    try {
      setSubmitting(true)
      setFormError(null)
      const data = await api.post('/guide-posts', {
        title: form.title.trim(),
        content: form.content.trim(),
        postType: form.postType,
        scriptureRef: form.scriptureRef.trim() || null
      })
      // Prepend to feed and close modal
      setPosts(prev => [data.post, ...prev])
      setShowCreate(false)
      setForm({ title: '', content: '', postType: 'devotional', scriptureRef: '' })
    } catch {
      setFormError('Failed to publish post. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="screen with-bottom-nav">

      {/* Header */}
      <div className="gp-header">
        <h1>Guide Posts</h1>
        {user?.role === 'guide' && (
          <button className="gp-write-btn" onClick={() => setShowCreate(true)}>
            <PenSquare size={15} />
            Write a Post
          </button>
        )}
      </div>

      {/* Filter pills */}
      <div className="gp-filters">
        {POST_TYPES.map(type => (
          <button
            key={type}
            className={`gp-filter-pill${filter === type ? ' active' : ''}`}
            onClick={() => setFilter(type)}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="screen-content" style={{ paddingTop: 0 }}>
        {loading ? (
          <div className="gp-loading"><LoadingSpinner /></div>
        ) : error ? (
          <ErrorState message={error} onRetry={loadPosts} />
        ) : posts.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No posts yet"
            subtitle={filter !== 'All'
              ? `No ${filter.toLowerCase()} posts found. Try a different filter.`
              : 'Guides haven\'t published anything yet. Check back soon.'}
          />
        ) : (
          posts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={user?.id}
              expanded={!!expanded[post.id]}
              onToggleExpand={() => setExpanded(prev => ({ ...prev, [post.id]: !prev[post.id] }))}
              onLike={() => handleLike(post.id)}
              onDelete={() => handleDelete(post.id)}
              onNavigate={id => navigate(`/user/${id}`)}
            />
          ))
        )}
      </div>

      {/* Create post modal */}
      {showCreate && (
        <Modal
          title="Write a Post"
          onClose={() => { setShowCreate(false); setFormError(null) }}
        >
          <form onSubmit={handleSubmit}>
            <div className="gp-modal-field">
              <label className="gp-modal-label">Type</label>
              <select
                className="gp-modal-select"
                value={form.postType}
                onChange={e => setForm(f => ({ ...f, postType: e.target.value }))}
              >
                <option value="devotional">✨ Devotional</option>
                <option value="reflection">💭 Reflection</option>
                <option value="scripture">📖 Scripture</option>
                <option value="general">💬 General</option>
              </select>
            </div>

            <div className="gp-modal-field">
              <label className="gp-modal-label">Title</label>
              <input
                className="gp-modal-input"
                type="text"
                placeholder="Give your post a title…"
                maxLength={200}
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              />
            </div>

            {form.postType === 'scripture' && (
              <div className="gp-modal-field">
                <label className="gp-modal-label">Scripture Reference</label>
                <input
                  className="gp-modal-input"
                  type="text"
                  placeholder="e.g. John 3:16"
                  maxLength={200}
                  value={form.scriptureRef}
                  onChange={e => setForm(f => ({ ...f, scriptureRef: e.target.value }))}
                />
              </div>
            )}

            <div className="gp-modal-field">
              <label className="gp-modal-label">Message</label>
              <textarea
                className="gp-modal-textarea"
                placeholder="Share your thoughts…"
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              />
            </div>

            {formError && (
              <p style={{ color: 'var(--danger)', fontSize: 13, margin: '0 0 10px' }}>{formError}</p>
            )}

            <div className="gp-modal-actions">
              <button
                type="button"
                className="gp-modal-cancel"
                onClick={() => { setShowCreate(false); setFormError(null) }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="gp-modal-submit"
                disabled={submitting}
              >
                {submitting ? 'Publishing…' : 'Publish'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

// ── Post card subcomponent ────────────────────────────────────────────────────
function PostCard({ post, currentUserId, expanded, onToggleExpand, onLike, onDelete, onNavigate }) {
  const isLong = post.content.length > 220

  return (
    <div className="gp-card">
      <div className="gp-card-inner">

        {/* Byline */}
        <div className="gp-byline">
          <Avatar src={post.userPhoto} emoji={post.userAvatar} size="sm" variant="guide" />
          <div className="gp-byline-info">
            <div className="gp-byline-name" onClick={() => onNavigate(post.userId)}>
              {post.userName}
            </div>
            {post.userDenomination && (
              <div className="gp-byline-sub">{post.userDenomination}</div>
            )}
          </div>
          <span className={`gp-type-badge gp-type-${post.postType}`}>
            {TYPE_ICONS[post.postType]} {post.postType}
          </span>
        </div>

        {/* Title */}
        <h3 className="gp-title">{post.title}</h3>

        {/* Scripture ref */}
        {post.scriptureRef && (
          <div className="gp-scripture-ref">
            <BookOpen size={12} />
            {post.scriptureRef}
          </div>
        )}

        {/* Content */}
        <p className={`gp-content${isLong && !expanded ? ' collapsed' : ''}`}>
          {post.content}
        </p>
        {isLong && (
          <button className="gp-read-more" onClick={onToggleExpand}>
            {expanded ? 'Show less' : 'Read more'}
          </button>
        )}

        {/* Footer */}
        <div className="gp-footer">
          <div className="gp-footer-left">
            <button className={`gp-like-btn${post.liked ? ' liked' : ''}`} onClick={onLike}>
              <Heart size={16} fill={post.liked ? 'currentColor' : 'none'} />
              {post.likeCount > 0 && <span>{post.likeCount}</span>}
            </button>
            {post.userId === currentUserId && (
              <button className="gp-delete-btn" onClick={onDelete} title="Delete post">
                <Trash2 size={15} />
              </button>
            )}
          </div>
          <span className="gp-time">{timeAgo(post.createdAt)}</span>
        </div>
      </div>
    </div>
  )
}

export default GuidePostsFeed
