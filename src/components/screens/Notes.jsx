// =============================================================================
// SESSION NOTES SCREEN
// =============================================================================
// Users can create, edit, and delete personal journal entries.
// Each note has a title, content, and optional tags.
// Accessed via More > Session Notes.

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { Modal, EmptyState } from '../common'
import { ArrowLeft, Plus, FileText, X } from 'lucide-react'

// Tag color mapping — each tag gets a unique color scheme
const TAG_COLORS = {
  Prayer:     { bg: '#dbeafe', color: '#1e40af' },
  Scripture:  { bg: '#d1fae5', color: '#065f46' },
  Reflection: { bg: '#fef3c7', color: '#92400e' },
  Testimony:  { bg: '#ede9fe', color: '#5b21b6' },
  Question:   { bg: '#fce7f3', color: '#9d174d' },
}

const ALL_TAGS = ['Prayer', 'Scripture', 'Reflection', 'Testimony', 'Question']

// Helper: format a date as relative time (e.g., "Just now", "2h ago")
function relativeTime(dateString) {
  const now = new Date()
  const date = new Date(dateString)
  const diffMs = now - date
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 7) return `${diffDay}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function Notes() {
  const navigate = useNavigate()
  const { notes, createNote, updateNote, deleteNote } = useApp()

  // Modal state
  const [showEditor, setShowEditor] = useState(false)
  const [editingNote, setEditingNote] = useState(null)

  // Form state
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [selectedTags, setSelectedTags] = useState([])

  function openNewNote() {
    setEditingNote(null)
    setTitle('')
    setContent('')
    setSelectedTags([])
    setShowEditor(true)
  }

  function openEditNote(note) {
    setEditingNote(note)
    setTitle(note.title)
    setContent(note.content)
    setSelectedTags(note.tags || [])
    setShowEditor(true)
  }

  function toggleTag(tag) {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  async function handleSave() {
    if (!title.trim() && !content.trim()) return

    const noteData = {
      title: title.trim() || 'Untitled',
      content: content.trim(),
      tags: selectedTags
    }

    try {
      if (editingNote) {
        await updateNote(editingNote.id, noteData)
      } else {
        await createNote(noteData)
      }
      setShowEditor(false)
    } catch (error) {
      console.error('Failed to save note:', error)
    }
  }

  async function handleDelete() {
    if (!editingNote) return
    if (!window.confirm('Delete this note? This cannot be undone.')) return

    try {
      await deleteNote(editingNote.id)
      setShowEditor(false)
    } catch (error) {
      console.error('Failed to delete note:', error)
    }
  }

  return (
    <div className="screen with-bottom-nav">
      {/* Header */}
      <div className="screen-header">
        <button className="back-btn" onClick={() => navigate('/more')}>
          <ArrowLeft size={20} />
        </button>
        <h1 className="screen-title">Session Notes</h1>
        <button className="icon-btn" onClick={openNewNote}>
          <Plus size={20} />
        </button>
      </div>

      {/* Notes List */}
      <div className="screen-content">
        {notes.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No notes yet"
            subtitle="Tap + to create your first journal entry"
            actionLabel="Create Note"
            onAction={openNewNote}
          />
        ) : (
          notes.map(note => (
            <div
              key={note.id}
              className="note-card"
              onClick={() => openEditNote(note)}
            >
              <div className="note-card-header">
                <div className="note-title">{note.title || 'Untitled'}</div>
                <div className="note-time">
                  {relativeTime(note.updatedAt || note.createdAt)}
                </div>
              </div>
              {note.content && (
                <div className="note-preview">{note.content}</div>
              )}
              {note.tags && note.tags.length > 0 && (
                <div className="note-tags">
                  {note.tags.map(tag => (
                    <span
                      key={tag}
                      className="note-tag"
                      style={{
                        background: TAG_COLORS[tag]?.bg || '#f3f4f6',
                        color: TAG_COLORS[tag]?.color || '#374151'
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Note Editor Modal */}
      <Modal
        isOpen={showEditor}
        onClose={() => setShowEditor(false)}
        title={editingNote ? 'Edit Note' : 'New Note'}
      >
        <div className="note-editor">
          <div className="form-group">
            <label className="form-label">Title</label>
            <input
              type="text"
              className="form-input"
              placeholder="Enter note title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Content</label>
            <textarea
              className="form-input"
              placeholder="Write your thoughts, prayers, reflections..."
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              style={{ resize: 'vertical', minHeight: '120px' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Tags</label>
            <div className="note-tag-selector">
              {ALL_TAGS.map(tag => (
                <button
                  key={tag}
                  className={`note-tag-btn ${selectedTags.includes(tag) ? 'selected' : ''}`}
                  style={selectedTags.includes(tag) ? {
                    background: TAG_COLORS[tag]?.bg,
                    color: TAG_COLORS[tag]?.color,
                    borderColor: TAG_COLORS[tag]?.color
                  } : {}}
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <button className="btn-primary" onClick={handleSave}>
            {editingNote ? 'Save Changes' : 'Create Note'}
          </button>

          {editingNote && (
            <button className="note-delete-btn" onClick={handleDelete}>
              Delete Note
            </button>
          )}
        </div>
      </Modal>
    </div>
  )
}

export default Notes
