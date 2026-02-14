// =============================================================================
// FIND A GUIDE SCREEN
// =============================================================================
// Browse all verified guides nationwide. Shows guide cards with availability
// status, search filtering, and "Show 10 More" pagination.
// Tapping a card navigates to that guide's UserProfile page.

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { Avatar, Card, LoadingSpinner, ErrorState, EmptyState } from '../common'
import { api } from '../../utils/api'
import { ArrowLeft, Search, X, MapPin, BookOpen } from 'lucide-react'

function FindGuides() {
  const navigate = useNavigate()
  const { user } = useApp()
  const [guides, setGuides] = useState([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [visibleCount, setVisibleCount] = useState(10)

  useEffect(() => {
    loadGuides()
  }, [])

  async function loadGuides(searchQuery = '') {
    setLoading(true)
    setError(null)
    try {
      const url = searchQuery
        ? `/users/guides?q=${encodeURIComponent(searchQuery)}`
        : '/users/guides'
      const data = await api.get(url)
      setGuides(data.guides || [])
      setVisibleCount(10)
    } catch (err) {
      console.error('Failed to load guides:', err)
      setError('Failed to load guides. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleSearch() {
    if (!query.trim()) {
      loadGuides()
      return
    }
    loadGuides(query.trim())
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleSearch()
  }

  function clearSearch() {
    setQuery('')
    loadGuides()
  }

  function getAvailability(guide) {
    if (!guide.acceptingSeekers) {
      return { color: 'gray', label: 'Not accepting seekers' }
    }
    if (guide.pendingCount >= guide.maxPendingRequests) {
      return { color: 'orange', label: 'Waitlist' }
    }
    return { color: 'green', label: 'Accepting requests' }
  }

  function getLocationText(guide) {
    if (guide.city && guide.state) return `${guide.city}, ${guide.state}`
    if (guide.state) return guide.state
    if (guide.city) return guide.city
    return null
  }

  const visibleGuides = guides.slice(0, visibleCount)

  return (
    <div className="screen with-bottom-nav">
      {/* Header */}
      <div className="screen-header">
        <div className="screen-header-top">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
          </button>
          <h1 style={{ fontSize: '24px', fontWeight: '700' }}>Find a Guide</h1>
          <div style={{ width: 40 }} />
        </div>
      </div>

      <div className="screen-content">
        {/* Search Bar */}
        <div className="search-container" style={{ marginBottom: '16px' }}>
          <div className="search-bar">
            <Search size={18} style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search by name, specialization, or denomination..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="search-input"
            />
            {query && (
              <button className="search-clear-btn" onClick={clearSearch}>
                <X size={16} />
              </button>
            )}
          </div>
          <button className="btn-primary-sm" onClick={handleSearch} style={{ whiteSpace: 'nowrap' }}>
            Search
          </button>
        </div>

        {/* Results count */}
        {!loading && (
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
            {guides.length} guide{guides.length !== 1 ? 's' : ''} found
          </div>
        )}

        {/* Loading state */}
        {loading && <LoadingSpinner message="Loading guides..." />}

        {/* Error state */}
        {!loading && error && <ErrorState subtitle={error} onAction={() => loadGuides(query.trim() || '')} />}

        {/* Empty state */}
        {!loading && !error && guides.length === 0 && (
          <EmptyState
            icon={Search}
            title="No guides found"
            subtitle={query ? 'Try a different search term' : 'No guides are available at this time'}
          />
        )}

        {/* Guide cards */}
        {!loading && visibleGuides.map(guide => {
          const availability = getAvailability(guide)
          const location = getLocationText(guide)

          return (
            <Card key={guide.id}>
              <div
                className="guide-card"
                onClick={() => navigate(`/user/${guide.id}`)}
              >
                <Avatar src={guide.photoUrl} emoji={guide.avatar} size="lg" variant="blue" />
                <div className="guide-card-info">
                  <div className="guide-card-name">
                    {guide.name}
                    <span className="guide-badge">Guide</span>
                  </div>
                  {guide.specialization && (
                    <div className="guide-card-meta">
                      <BookOpen size={13} />
                      {guide.specialization}
                    </div>
                  )}
                  {guide.denomination && (
                    <div className="guide-card-spec">{guide.denomination}</div>
                  )}
                  {location && (
                    <div className="guide-card-meta">
                      <MapPin size={13} />
                      {location}
                    </div>
                  )}
                  <div className={`availability-label ${availability.color}`}>
                    <span className={`availability-dot ${availability.color}`} />
                    {availability.label}
                  </div>
                </div>
              </div>
            </Card>
          )
        })}

        {/* Show 10 More button */}
        {!loading && visibleCount < guides.length && (
          <button
            className="btn-secondary"
            style={{ width: '100%', marginTop: '12px' }}
            onClick={() => setVisibleCount(prev => prev + 10)}
          >
            Show 10 More
          </button>
        )}
      </div>
    </div>
  )
}

export default FindGuides
