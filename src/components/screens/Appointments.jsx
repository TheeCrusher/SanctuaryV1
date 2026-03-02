// =============================================================================
// APPOINTMENTS SCREEN (with Session Notes tab)
// =============================================================================
// Shows appointments and session notes in a unified screen with a pill toggle.
// Sessions tab: appointments grouped by status (pending, confirmed, completed, declined).
// Session Notes tab: chronological list of all session notes with linked appointments.
// Completion flow: guides can mark sessions complete and get prompted to add notes.

import './Appointments.css'
import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { Avatar, Card, Badge, Modal, EmptyState } from '../common'
import { Plus, Calendar, Repeat, X, CalendarDays, ArrowLeft, FileText, Search, Star } from 'lucide-react'
import { api } from '../../utils/api'
import { formatDateShort, timeAgo } from '../../utils/helpers'

// Tag color mapping (from Notes.jsx)
const TAG_COLORS = {
  Prayer:     { bg: 'var(--brand-light)',           color: 'var(--brand-light-text)' },
  Scripture:  { bg: 'var(--accent-green-light)',    color: 'var(--accent-green-text)' },
  Reflection: { bg: 'var(--accent-gold-light)',     color: 'var(--accent-gold-text)' },
  Testimony:  { bg: 'var(--accent-purple-light)',   color: 'var(--accent-purple-text)' },
  Question:   { bg: 'var(--accent-burgundy-light)', color: 'var(--accent-burgundy-text)' },
}

const ALL_TAGS = ['Prayer', 'Scripture', 'Reflection', 'Testimony', 'Question']

function Appointments() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // Which tab is active: 'sessions' or 'notes'
  const [activeTab, setActiveTab] = useState('sessions')

  // --- Sessions tab state ---
  const [showModal, setShowModal] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(null)
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(null)
  const [showNotePrompt, setShowNotePrompt] = useState(null) // completed apt to prompt notes for
  const [showReviewModal, setShowReviewModal] = useState(null) // appointment to review
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [reviewedAptIds, setReviewedAptIds] = useState(new Set()) // locally tracked reviews
  const [communityGuides, setCommunityGuides] = useState([])
  const [communitySeekers, setCommunitySeekers] = useState([])
  const [confirmError, setConfirmError] = useState(null)
  const [formError, setFormError] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    guideId: '',
    seekerId: '',
    date: '',
    time: '',
    duration: '60',
    type: 'Bible Study',
    notes: '',
    recurrenceRule: 'none',
    recurrenceEndDate: ''
  })

  // --- Notes tab state ---
  const [showNoteEditor, setShowNoteEditor] = useState(false)
  const [editingNote, setEditingNote] = useState(null)
  const [noteTitle, setNoteTitle] = useState('')
  const [noteContent, setNoteContent] = useState('')
  const [selectedTags, setSelectedTags] = useState([])
  const [noteAppointmentId, setNoteAppointmentId] = useState(null)
  const [noteSearch, setNoteSearch] = useState('')

  const {
    user,
    appointments,
    notes,
    createAppointment,
    confirmAppointment,
    declineAppointment,
    completeAppointment,
    cancelAppointment,
    cancelSeries,
    createNote,
    updateNote,
    deleteNote
  } = useApp()

  const isSeeker = user?.role?.toLowerCase() === 'seeker'

  // Load community connections for the dropdown
  useEffect(() => {
    if (isSeeker) {
      loadGuides()
    } else {
      loadSeekers()
    }
  }, [isSeeker])

  async function loadGuides() {
    try {
      const data = await api.get('/users/guides')
      const guides = (data.guides || []).map(g => ({
        id: g.id,
        name: g.name,
        photoUrl: g.photoUrl,
        avatar: g.avatar,
        role: 'Guide'
      }))
      setCommunityGuides(guides)
    } catch (error) {
      // ignore
    }
  }

  async function loadSeekers() {
    try {
      const data = await api.get('/community')
      const seekers = (data.community || []).filter(p => p.role === 'Seeker')
      setCommunitySeekers(seekers)
    } catch (error) {
      // ignore
    }
  }

  // Pre-select guide from URL search params (coming from UserProfile "Book Session")
  useEffect(() => {
    const preGuideId = searchParams.get('guideId')
    if (preGuideId && isSeeker) {
      setFormData(prev => ({ ...prev, guideId: preGuideId }))
      setShowModal(true)
    }
  }, [searchParams])

  // Group appointments by status
  const pendingApts = appointments.filter(a => a.status === 'pending')
  const confirmedApts = appointments.filter(a => a.status === 'confirmed')
  const completedApts = appointments.filter(a => a.status === 'completed')
  const declinedApts = appointments.filter(a => a.status === 'declined')

  // Filter notes by search query
  const filteredNotes = useMemo(() => {
    if (!noteSearch.trim()) return notes
    const q = noteSearch.toLowerCase()
    return notes.filter(n =>
      (n.title || '').toLowerCase().includes(q) ||
      (n.content || '').toLowerCase().includes(q) ||
      (n.otherPersonName || '').toLowerCase().includes(q)
    )
  }, [notes, noteSearch])

  // Smart display name: show the OTHER person's name
  function getDisplayName(apt) {
    return isSeeker
      ? (apt.guideName || apt.seekerName)
      : apt.seekerName
  }

  async function handleSubmitReview() {
    if (!reviewRating || !showReviewModal) return
    setReviewSubmitting(true)
    try {
      await api.post(`/guide-reviews/guide/${showReviewModal.guideId}`, {
        rating: reviewRating,
        reviewText: reviewText.trim() || null,
        appointmentId: showReviewModal.id
      })
      // Track locally so button disappears immediately
      setReviewedAptIds(prev => new Set([...prev, showReviewModal.id]))
      setShowReviewModal(null)
      setReviewRating(0)
      setReviewText('')
    } catch {
      // silently fail — user can try again
    } finally {
      setReviewSubmitting(false)
    }
  }

  function handleInputChange(e) {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')

    if (isSeeker && !formData.guideId) {
      setFormError('Please select a guide.')
      return
    }
    if (!isSeeker && !formData.seekerId) {
      setFormError('Please select a seeker.')
      return
    }
    if (!formData.date) {
      setFormError('Please select a date.')
      return
    }
    if (!formData.time) {
      setFormError('Please select a time.')
      return
    }

    const submitData = { ...formData }

    if (isSeeker) {
      submitData.name = user.name
      submitData.guideId = Number(formData.guideId)
      delete submitData.seekerId
    } else {
      const selectedSeeker = communitySeekers.find(s => s.id === Number(formData.seekerId))
      submitData.name = selectedSeeker ? selectedSeeker.name : formData.name
      submitData.seekerId = Number(formData.seekerId)
      delete submitData.guideId
    }

    await createAppointment(submitData)

    setFormData({
      name: '',
      guideId: '',
      seekerId: '',
      date: '',
      time: '',
      duration: '60',
      type: 'Bible Study',
      notes: '',
      recurrenceRule: 'none',
      recurrenceEndDate: ''
    })
    setShowModal(false)
  }

  function recurrenceLabel(rule) {
    const labels = { weekly: 'Weekly', biweekly: 'Biweekly', monthly: 'Monthly' }
    return labels[rule] || null
  }

  // =========================================================================
  // NOTE EDITOR FUNCTIONS (absorbed from Notes.jsx)
  // =========================================================================

  function openNewNote(appointmentId = null) {
    setEditingNote(null)
    setNoteTitle('')
    setNoteContent('')
    setSelectedTags([])
    setNoteAppointmentId(appointmentId)
    setShowNoteEditor(true)
  }

  function openEditNote(note) {
    setEditingNote(note)
    setNoteTitle(note.title)
    setNoteContent(note.content)
    setSelectedTags(note.tags || [])
    setNoteAppointmentId(note.appointmentId || null)
    setShowNoteEditor(true)
  }

  function toggleTag(tag) {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  async function handleNoteSave() {
    if (!noteTitle.trim() && !noteContent.trim()) return

    const noteData = {
      title: noteTitle.trim() || 'Untitled',
      content: noteContent.trim(),
      tags: selectedTags,
      appointmentId: noteAppointmentId
    }

    try {
      if (editingNote) {
        await updateNote(editingNote.id, noteData)
      } else {
        await createNote(noteData)
      }
      setShowNoteEditor(false)
    } catch (error) {
      // ignore
    }
  }

  async function handleNoteDelete() {
    if (!editingNote) return
    if (!window.confirm('Delete this note? This cannot be undone.')) return

    try {
      await deleteNote(editingNote.id)
      setShowNoteEditor(false)
    } catch (error) {
      // ignore
    }
  }

  // Find note linked to a specific appointment
  function getNoteForAppointment(aptId) {
    return notes.find(n => n.appointmentId === aptId)
  }

  // =========================================================================
  // APPOINTMENT CARD COMPONENT
  // =========================================================================

  function AppointmentCard({ apt }) {
    const displayName = getDisplayName(apt)
    const isGuideOnThis = user?.id === apt.guideId
    const linkedNote = apt.status === 'completed' ? getNoteForAppointment(apt.id) : null

    return (
      <Card className={`apt-status-${apt.status}`}>
        <div className="apt-row">
          <Avatar src={isGuideOnThis ? apt.seekerPhoto : apt.guidePhoto} emoji={apt.avatar} size="md" variant="blue" />
          <div className="apt-info">
            <div className="apt-header">
              <span className="apt-name">{displayName}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {apt.status === 'completed' && (linkedNote || apt.hasNotes) && (
                  <button
                    className="apt-notes-indicator"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (linkedNote) {
                        openEditNote(linkedNote)
                      } else {
                        openNewNote(apt.id)
                      }
                    }}
                    title="View session notes"
                  >
                    <FileText size={14} />
                  </button>
                )}
                <Badge status={apt.status} />
              </div>
            </div>
            <div className="apt-meta">
              {apt.type} • {formatDateShort(apt.date)} at {apt.time} • {apt.duration} min
            </div>
            {apt.recurrenceRule && apt.recurrenceRule !== 'none' && (
              <div className="apt-recurrence-tag">
                <Repeat size={12} />
                {recurrenceLabel(apt.recurrenceRule)}
              </div>
            )}
            {apt.notes && (
              <div className="apt-notes">{apt.notes}</div>
            )}

            {/* Actions for active appointments */}
            {apt.status !== 'completed' && apt.status !== 'declined' && (
              <div className="apt-actions">
                {apt.status === 'pending' && isGuideOnThis && (
                  <>
                    <button
                      className="btn-primary-sm"
                      onClick={async () => {
                        try {
                          setConfirmError(null)
                          await confirmAppointment(apt.id)
                        } catch (err) {
                          setConfirmError(err.message || 'Failed to confirm')
                        }
                      }}
                    >
                      Confirm
                    </button>
                    <button
                      className="btn-cancel-apt"
                      onClick={async () => {
                        try {
                          await declineAppointment(apt.id)
                        } catch (err) {
                          // ignore
                        }
                      }}
                    >
                      Decline
                    </button>
                  </>
                )}
                {apt.status === 'confirmed' && isGuideOnThis && (
                  <button
                    className="btn-primary-sm"
                    onClick={() => setShowCompleteConfirm(apt)}
                  >
                    Complete
                  </button>
                )}
                <button
                  className="btn-cancel-apt"
                  onClick={() => setShowCancelConfirm(apt)}
                >
                  <X size={14} /> Cancel
                </button>
              </div>
            )}

            {/* Add Notes button for completed appointments without notes */}
            {apt.status === 'completed' && !linkedNote && !apt.hasNotes && (
              <div className="apt-actions">
                <button
                  className="btn-primary-sm"
                  onClick={() => openNewNote(apt.id)}
                >
                  <FileText size={14} /> Add Notes
                </button>
              </div>
            )}

            {/* Rate Session button — seeker only, completed, not yet reviewed */}
            {apt.status === 'completed' && isSeeker && !isGuideOnThis &&
             !apt.hasReviewed && !reviewedAptIds.has(apt.id) && (
              <div className="apt-actions">
                <button
                  className="btn-gold-sm"
                  onClick={() => {
                    setShowReviewModal(apt)
                    setReviewRating(0)
                    setReviewText('')
                  }}
                >
                  <Star size={14} /> Rate Session
                </button>
              </div>
            )}
          </div>
        </div>
      </Card>
    )
  }

  // =========================================================================
  // RENDER
  // =========================================================================

  return (
    <div className="screen with-bottom-nav">
      {/* Header */}
      <div className="screen-header">
        <div className="screen-header-top">
          <button className="back-btn" onClick={() => navigate('/')}>
            <ArrowLeft size={20} />
          </button>
          <h1 style={{ fontSize: '24px', fontWeight: '700' }}>Sessions</h1>
          <div style={{ display: 'flex', gap: '8px' }}>
            {activeTab === 'sessions' && (
              <>
                <button className="icon-btn" onClick={() => navigate('/calendar')} title="Calendar">
                  <CalendarDays size={22} />
                </button>
                <button className="icon-btn" onClick={() => setShowModal(true)}>
                  <Plus size={22} />
                </button>
              </>
            )}
            {activeTab === 'notes' && (
              <button className="icon-btn" onClick={() => openNewNote()}>
                <Plus size={22} />
              </button>
            )}
          </div>
        </div>

        {/* Pill Toggle */}
        <div className="community-tabs">
          <button
            className={`community-tab ${activeTab === 'sessions' ? 'active' : ''}`}
            onClick={() => setActiveTab('sessions')}
          >
            Sessions
          </button>
          <button
            className={`community-tab ${activeTab === 'notes' ? 'active' : ''}`}
            onClick={() => setActiveTab('notes')}
          >
            Session Notes
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="screen-content">
        {/* ============ SESSIONS TAB ============ */}
        {activeTab === 'sessions' && (
          <>
            {confirmError && (
              <div style={{
                background: 'var(--alert-error-bg)',
                border: '1px solid var(--alert-error-text)',
                color: 'var(--alert-error-text)',
                padding: '12px 16px',
                borderRadius: '10px',
                marginBottom: '12px',
                fontSize: '14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span>{confirmError}</span>
                <button
                  onClick={() => setConfirmError(null)}
                  style={{ background: 'none', border: 'none', color: 'var(--alert-error-text)', cursor: 'pointer', fontWeight: 'bold', fontSize: '18px', padding: '0 4px' }}
                >
                  &times;
                </button>
              </div>
            )}

            {appointments.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title="No sessions yet"
                subtitle="Create your first session to get started"
                actionLabel="New Session"
                onAction={() => setShowModal(true)}
              />
            ) : (
              <>
                {pendingApts.length > 0 && (
                  <>
                    <div className="section-divider">Pending ({pendingApts.length})</div>
                    {pendingApts.map(apt => (
                      <AppointmentCard key={apt.id} apt={apt} />
                    ))}
                  </>
                )}

                {confirmedApts.length > 0 && (
                  <>
                    <div className="section-divider">Confirmed ({confirmedApts.length})</div>
                    {confirmedApts.map(apt => (
                      <AppointmentCard key={apt.id} apt={apt} />
                    ))}
                  </>
                )}

                {completedApts.length > 0 && (
                  <>
                    <div className="section-divider">Completed ({completedApts.length})</div>
                    {completedApts.map(apt => (
                      <AppointmentCard key={apt.id} apt={apt} />
                    ))}
                  </>
                )}

                {declinedApts.length > 0 && (
                  <>
                    <div className="section-divider">Declined ({declinedApts.length})</div>
                    {declinedApts.map(apt => (
                      <AppointmentCard key={apt.id} apt={apt} />
                    ))}
                  </>
                )}
              </>
            )}
          </>
        )}

        {/* ============ SESSION NOTES TAB ============ */}
        {activeTab === 'notes' && (
          <>
            {/* Search bar */}
            {notes.length > 0 && (
              <div className="notes-search">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Search notes..."
                  value={noteSearch}
                  onChange={e => setNoteSearch(e.target.value)}
                />
              </div>
            )}

            {filteredNotes.length === 0 ? (
              <EmptyState
                icon={FileText}
                title={noteSearch ? 'No matching notes' : 'No session notes yet'}
                subtitle={noteSearch
                  ? 'Try a different search term'
                  : 'Notes will appear here after you complete a session and add notes.'
                }
                actionLabel={noteSearch ? undefined : 'Create Note'}
                onAction={noteSearch ? undefined : () => openNewNote()}
              />
            ) : (
              filteredNotes.map(note => (
                <div
                  key={note.id}
                  className="note-card"
                  onClick={() => openEditNote(note)}
                >
                  <div className="note-card-header">
                    <div className="note-title">{note.title || 'Untitled'}</div>
                    <div className="note-time">
                      {timeAgo(note.updatedAt || note.createdAt)}
                    </div>
                  </div>

                  {/* Linked appointment label */}
                  {note.appointmentId && note.otherPersonName && (
                    <div className="apt-linked-label">
                      Session with {note.otherPersonName}
                      {note.appointmentDate && ` — ${formatDateShort(note.appointmentDate)}`}
                      {note.otherPersonRole && (
                        <span className={`apt-linked-role ${note.otherPersonRole.toLowerCase() === 'guide' ? 'role-guide' : 'role-seeker'}`}>
                          {note.otherPersonRole}
                        </span>
                      )}
                    </div>
                  )}

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
          </>
        )}
      </div>

      {/* ============ MODALS ============ */}

      {/* New Appointment Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="New Session"
      >
        <form onSubmit={handleSubmit}>
          {formError && <div className="login-error" style={{ marginBottom: '12px' }}>{formError}</div>}
          {isSeeker ? (
            <div className="form-group">
              <label className="form-label" htmlFor="guideId">Which Guide?</label>
              <select
                id="guideId"
                name="guideId"
                value={formData.guideId}
                onChange={handleInputChange}
                required
              >
                <option value="">Select a Guide...</option>
                {communityGuides.map(guide => (
                  <option key={guide.id} value={guide.id}>
                    {guide.name}
                  </option>
                ))}
              </select>
              {communityGuides.length === 0 && (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  No guides available
                </div>
              )}
            </div>
          ) : (
            <div className="form-group">
              <label className="form-label" htmlFor="seekerId">Which Seeker?</label>
              <select
                id="seekerId"
                name="seekerId"
                value={formData.seekerId}
                onChange={handleInputChange}
                required
              >
                <option value="">Select a Seeker...</option>
                {communitySeekers.map(seeker => (
                  <option key={seeker.id} value={seeker.id}>
                    {seeker.name}
                  </option>
                ))}
              </select>
              {communitySeekers.length === 0 && (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Add Seekers to your Community first
                </div>
              )}
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="date">Date</label>
            <input type="date" id="date" name="date" value={formData.date} onChange={handleInputChange} required />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="time">Time</label>
            <input type="time" id="time" name="time" value={formData.time} onChange={handleInputChange} required />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="duration">Duration (minutes)</label>
            <select id="duration" name="duration" value={formData.duration} onChange={handleInputChange}>
              <option value="30">30 minutes</option>
              <option value="60">60 minutes</option>
              <option value="90">90 minutes</option>
              <option value="120">120 minutes</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="type">Session Type</label>
            <select id="type" name="type" value={formData.type} onChange={handleInputChange}>
              <option value="Bible Study">Bible Study</option>
              <option value="Prayer Session">Prayer Session</option>
              <option value="Counseling">Counseling</option>
              <option value="General Guidance">General Guidance</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="recurrenceRule">Repeat</label>
            <select id="recurrenceRule" name="recurrenceRule" value={formData.recurrenceRule} onChange={handleInputChange}>
              <option value="none">Does not repeat</option>
              <option value="weekly">Weekly</option>
              <option value="biweekly">Every 2 weeks</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          {formData.recurrenceRule !== 'none' && (
            <div className="form-group">
              <label className="form-label" htmlFor="recurrenceEndDate">Repeat Until</label>
              <input type="date" id="recurrenceEndDate" name="recurrenceEndDate" value={formData.recurrenceEndDate} onChange={handleInputChange} min={formData.date} required />
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="notes">Notes (optional)</label>
            <textarea id="notes" name="notes" value={formData.notes} onChange={handleInputChange} placeholder="Add any notes about this session..." />
          </div>

          <div className="modal-buttons">
            <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn-primary">Create</button>
          </div>
        </form>
      </Modal>

      {/* Complete Confirmation Modal */}
      {showCompleteConfirm && (
        <Modal onClose={() => setShowCompleteConfirm(null)}>
          <div className="modal-title">Complete Session</div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Mark the session with <strong>{getDisplayName(showCompleteConfirm)}</strong> on {formatDateShort(showCompleteConfirm.date)} as completed?
          </p>
          <div className="modal-buttons">
            <button className="btn-secondary" onClick={() => setShowCompleteConfirm(null)}>
              Go Back
            </button>
            <button
              className="btn-primary"
              onClick={async () => {
                const completed = await completeAppointment(showCompleteConfirm.id)
                setShowCompleteConfirm(null)
                if (completed) {
                  setShowNotePrompt(showCompleteConfirm)
                }
              }}
            >
              Yes, Complete
            </button>
          </div>
        </Modal>
      )}

      {/* Add Notes Prompt Modal (after completing a session) */}
      {showNotePrompt && (
        <Modal onClose={() => setShowNotePrompt(null)}>
          <div className="modal-title">Session Completed!</div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Would you like to add notes from your session with <strong>{getDisplayName(showNotePrompt)}</strong>?
          </p>
          <div className="modal-buttons">
            <button className="btn-secondary" onClick={() => setShowNotePrompt(null)}>
              Skip
            </button>
            <button
              className="btn-primary"
              onClick={() => {
                const aptId = showNotePrompt.id
                setShowNotePrompt(null)
                openNewNote(aptId)
              }}
            >
              <FileText size={16} /> Add Notes
            </button>
          </div>
        </Modal>
      )}

      {/* Rate Session Modal (seeker post-completion review) */}
      {showReviewModal && (
        <Modal onClose={() => setShowReviewModal(null)}>
          <div className="modal-title">
            Rate your session with {getDisplayName(showReviewModal)}
          </div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16, fontSize: 14 }}>
            How was your session on {formatDateShort(showReviewModal.date)}?
          </p>

          {/* Star picker */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 8 }}>
            {[1,2,3,4,5].map(n => (
              <button
                key={n}
                onClick={() => setReviewRating(reviewRating === n ? 0 : n)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
              >
                <Star
                  size={34}
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
              width: '100%', padding: '10px 12px', borderRadius: 10,
              border: '1px solid var(--border-color)',
              background: 'var(--bg-primary)', color: 'var(--text-primary)',
              fontSize: 14, resize: 'none', boxSizing: 'border-box', marginBottom: 16
            }}
          />

          <div className="modal-buttons">
            <button className="btn-secondary" onClick={() => setShowReviewModal(null)}>
              Skip
            </button>
            <button
              className="btn-gold"
              onClick={handleSubmitReview}
              disabled={!reviewRating || reviewSubmitting}
            >
              {reviewSubmitting ? 'Saving...' : 'Submit'}
            </button>
          </div>
        </Modal>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <Modal onClose={() => setShowCancelConfirm(null)}>
          <div className="modal-title">Cancel Session</div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Cancel the session with <strong>{getDisplayName(showCancelConfirm)}</strong> on {formatDateShort(showCancelConfirm.date)}?
          </p>

          <div className="modal-buttons" style={{ flexDirection: 'column', gap: '8px' }}>
            <button
              className="btn-primary"
              style={{ background: 'var(--danger-bg)', color: 'var(--danger-text)', width: '100%' }}
              onClick={() => {
                cancelAppointment(showCancelConfirm.id)
                setShowCancelConfirm(null)
              }}
            >
              Cancel This Session
            </button>

            {showCancelConfirm.seriesId && (
              <button
                className="btn-primary"
                style={{ background: 'var(--danger-bg)', color: 'var(--danger-text)', width: '100%' }}
                onClick={() => {
                  cancelSeries(showCancelConfirm.seriesId)
                  setShowCancelConfirm(null)
                }}
              >
                Cancel All Future in Series
              </button>
            )}

            <button
              className="btn-secondary"
              style={{ width: '100%' }}
              onClick={() => setShowCancelConfirm(null)}
            >
              Keep Session
            </button>
          </div>
        </Modal>
      )}

      {/* Note Editor Modal */}
      <Modal
        isOpen={showNoteEditor}
        onClose={() => setShowNoteEditor(false)}
        title={editingNote ? 'Edit Note' : 'New Note'}
      >
        <div className="note-editor">
          <div className="form-group">
            <label className="form-label">Title</label>
            <input
              type="text"
              className="form-input"
              placeholder="Enter note title..."
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Content</label>
            <textarea
              className="form-input"
              placeholder="Write your thoughts, prayers, reflections..."
              rows={6}
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
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

          <button className="btn-primary" onClick={handleNoteSave}>
            {editingNote ? 'Save Changes' : 'Create Note'}
          </button>

          {editingNote && (
            <button className="note-delete-btn" onClick={handleNoteDelete}>
              Delete Note
            </button>
          )}
        </div>
      </Modal>
    </div>
  )
}

export default Appointments
