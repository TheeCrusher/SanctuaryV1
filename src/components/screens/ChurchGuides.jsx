// =============================================================================
// CHURCH GUIDES MANAGEMENT
// =============================================================================
// Shows verified guides linked to this church account.
// Church can add new guides (search by name) and remove existing ones
// (but at least one guide must always remain).

import './ChurchDashboard.css'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { churchApi } from '../../utils/api'
import { ArrowLeft, ShieldCheck, X, Search, Plus, AlertCircle } from 'lucide-react'

function ChurchGuides() {
  const navigate = useNavigate()
  const [guides, setGuides] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [actionError, setActionError] = useState(null)

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [showSearch, setShowSearch] = useState(false)

  useEffect(() => {
    loadGuides()
  }, [])

  async function loadGuides() {
    try {
      const { churchAccount } = await churchApi.get('/church-auth/me')
      setGuides(churchAccount.guides)
    } catch (err) {
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }

  async function handleSearch(query) {
    setSearchQuery(query)
    if (!query.trim()) {
      setSearchResults([])
      return
    }
    setSearching(true)
    try {
      const data = await churchApi.get(`/church-auth/search-guides?q=${encodeURIComponent(query)}`)
      // Filter out guides already linked
      const linkedIds = new Set(guides.map(g => g.id))
      setSearchResults(data.guides.filter(g => !linkedIds.has(g.id)))
    } catch (error) {
      // ignore
    } finally {
      setSearching(false)
    }
  }

  async function addGuide(guideId) {
    setActionError(null)
    try {
      const data = await churchApi.post('/church-auth/verify-guide', { guideId })
      if (data.success) {
        await loadGuides()
        setSearchQuery('')
        setSearchResults([])
      }
    } catch (err) {
      setActionError('Failed to add guide. Please try again.')
    }
  }

  async function removeGuide(guideId) {
    if (guides.length <= 1) return
    setActionError(null)
    try {
      await churchApi.delete(`/church-auth/verify-guide/${guideId}`)
      setGuides(prev => prev.filter(g => g.id !== guideId))
    } catch (err) {
      setActionError('Failed to remove guide. Please try again.')
    }
  }

  function renderAvatar(guide) {
    if (guide.photoUrl) {
      return <img src={guide.photoUrl} alt={guide.name} className="church-member-avatar-img" />
    }
    return <span className="church-member-avatar-emoji">{guide.avatar || '🙏'}</span>
  }

  if (loading) {
    return (
      <div className="screen church-screen-center">
        <div className="loading-spinner" />
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="church-editor">
        <div className="church-editor-header">
          <button className="church-back-btn" onClick={() => navigate('/church-dashboard')}>
            <ArrowLeft size={20} />
          </button>
          <h2>Verified Guides</h2>
        </div>
        <div className="church-empty-state">
          <AlertCircle size={48} />
          <p>Failed to load guides.</p>
          <p className="church-empty-hint">Check your connection and try again.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="church-editor">
      {/* Header */}
      <div className="church-editor-header">
        <button className="church-back-btn" onClick={() => navigate('/church-dashboard')}>
          <ArrowLeft size={20} />
        </button>
        <h2>Verified Guides</h2>
      </div>

      {/* Current Guides */}
      <div className="church-member-list">
        {guides.map(guide => (
          <div key={guide.id} className="church-member-card">
            <div className="church-member-avatar">
              {renderAvatar(guide)}
            </div>
            <div className="church-member-info">
              <span className="church-member-name">{guide.name}</span>
              <span className="church-guide-verified">
                <ShieldCheck size={14} /> Verified Guide
              </span>
            </div>
            <button
              className="church-guide-remove"
              onClick={() => removeGuide(guide.id)}
              disabled={guides.length <= 1}
              title={guides.length <= 1 ? 'At least one guide required' : 'Remove guide'}
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      {guides.length <= 1 && (
        <div className="church-guide-hint">
          <AlertCircle size={14} />
          At least one guide must remain linked to the church account.
        </div>
      )}

      {actionError && (
        <div className="church-editor-error">
          <AlertCircle size={16} /> {actionError}
        </div>
      )}

      {/* Add Guide Section */}
      <div className="church-add-guide-section">
        {!showSearch ? (
          <button className="church-add-guide-btn" onClick={() => setShowSearch(true)}>
            <Plus size={18} />
            Add a Guide
          </button>
        ) : (
          <>
            <div className="church-guide-search">
              <Search size={18} className="church-guide-search-icon" />
              <input
                type="text"
                placeholder="Search guides by name..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                autoFocus
              />
            </div>

            {searching && (
              <p className="church-guide-no-results">Searching...</p>
            )}

            {!searching && searchResults.length > 0 && (
              <div className="church-search-results">
                {searchResults.map(guide => (
                  <div key={guide.id} className="church-member-card">
                    <div className="church-member-avatar">
                      {renderAvatar(guide)}
                    </div>
                    <div className="church-member-info">
                      <span className="church-member-name">{guide.name}</span>
                    </div>
                    <button className="church-guide-add-btn" onClick={() => addGuide(guide.id)}>
                      Add
                    </button>
                  </div>
                ))}
              </div>
            )}

            {!searching && searchQuery && searchResults.length === 0 && (
              <p className="church-guide-no-results">
                No guides found matching "{searchQuery}"
              </p>
            )}

            <button
              className="church-add-guide-cancel"
              onClick={() => { setShowSearch(false); setSearchQuery(''); setSearchResults([]) }}
            >
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default ChurchGuides
