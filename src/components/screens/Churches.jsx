// =============================================================================
// CHURCHES SCREEN
// =============================================================================
// Browse and search for churches by name, city, state, or ZIP code.
// Uses server-side search with pagination (5 results at a time).
// Shows church photo, name, description, address, and ratings.

import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { Card } from '../common'
import { useState } from 'react'
import { X, Church, Heart, Search, MapPin, ChevronDown } from 'lucide-react'

function Churches() {
  const navigate = useNavigate()

  const {
    churches,
    searchChurches,
    churchSearchResults,
    churchSearchTotal,
    churchSearchHasMore,
    toggleFavoriteChurch,
    isChurchFavorited,
    favoriteChurchIds
  } = useApp()

  // Local state
  const [query, setQuery] = useState('')
  const [hasSearched, setHasSearched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)

  // Run a search when user taps Search or presses Enter
  async function handleSearch() {
    if (!query.trim()) return
    setLoading(true)
    setHasSearched(true)
    await searchChurches(query, 0)
    setLoading(false)
  }

  // Load more results (next page)
  async function handleShowMore() {
    setLoading(true)
    await searchChurches(query, churchSearchResults.length)
    setLoading(false)
  }

  // Clear search and go back to default view
  function handleClear() {
    setQuery('')
    setHasSearched(false)
    searchChurches('', 0)
  }

  // Generate star rating display
  function renderStars(rating) {
    if (!rating || rating === 0) return null
    const fullStars = Math.floor(rating)
    const hasHalf = rating % 1 >= 0.5
    let stars = '★'.repeat(fullStars)
    if (hasHalf) stars += '½'
    return stars
  }

  // Decide what to display: search results or favorites
  const showingSearchResults = hasSearched
  const displayedChurches = showingSearchResults
    ? churchSearchResults
    : showFavoritesOnly
      ? churches.filter(c => isChurchFavorited(c.id))
      : churches

  return (
    <div className="screen with-bottom-nav">
      {/* Header */}
      <div className="screen-header">
        <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '16px' }}>
          Find Churches
        </h1>

        {/* Search Input */}
        <div className="church-search-bar">
          <Search size={18} className="church-search-icon" />
          <input
            type="search"
            enterKeyHint="search"
            placeholder="Search by city, state, or ZIP..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          {query ? (
            <button className="church-search-clear" onClick={handleClear}>
              <X size={18} />
            </button>
          ) : null}
          <button
            className="church-search-submit"
            onClick={handleSearch}
            disabled={!query.trim()}
          >
            Search
          </button>
        </div>

        {/* Result count or favorites toggle */}
        {showingSearchResults ? (
          <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '8px' }}>
            Showing {churchSearchResults.length} of {churchSearchTotal} results for "{query}"
          </div>
        ) : favoriteChurchIds.size > 0 ? (
          <button
            className={`favorites-filter-btn ${showFavoritesOnly ? 'active' : ''}`}
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
          >
            <Heart
              size={16}
              fill={showFavoritesOnly ? '#ef4444' : 'none'}
              color={showFavoritesOnly ? '#ef4444' : '#6b7280'}
            />
            My Favorites ({favoriteChurchIds.size})
          </button>
        ) : null}
      </div>

      {/* Content */}
      <div className="screen-content">
        {loading && !churchSearchResults.length ? (
          <div className="empty-state">
            <div className="empty-text">Searching...</div>
          </div>
        ) : displayedChurches.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><Church size={48} /></div>
            <div className="empty-text">
              {hasSearched ? 'No churches found' : 'Search for churches'}
            </div>
            <div className="empty-subtext">
              {hasSearched
                ? 'Try a different city, state, or ZIP code'
                : 'Enter a city, state, or ZIP code above'}
            </div>
          </div>
        ) : (
          <>
            {displayedChurches.map(church => (
              <Card
                key={church.id}
                onClick={() => navigate(`/churches/${church.id}`)}
              >
                {/* Photo + Info Row */}
                <div style={{ display: 'flex', gap: '12px' }}>
                  {/* Church Photo (icon always underneath as fallback) */}
                  <div className="church-photo-container">
                    <Church size={32} color="#9ca3af" className="church-photo-fallback" />
                    {church.photoUrl && (
                      <img
                        src={church.photoUrl}
                        alt={church.name}
                        className="church-photo-img"
                        onError={(e) => { e.target.style.display = 'none' }}
                      />
                    )}
                  </div>

                  {/* Church Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div className="church-name" style={{ fontSize: '16px', fontWeight: '600' }}>
                        {church.name}
                      </div>
                      <button
                        className="favorite-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleFavoriteChurch(church.id)
                        }}
                        style={{ flexShrink: 0, marginLeft: '8px' }}
                      >
                        <Heart
                          size={20}
                          fill={isChurchFavorited(church.id) ? '#ef4444' : 'none'}
                          color={isChurchFavorited(church.id) ? '#ef4444' : '#9ca3af'}
                        />
                      </button>
                    </div>

                    {/* City, State */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#6b7280', fontSize: '13px', marginTop: '2px' }}>
                      <MapPin size={12} />
                      {church.city}{church.state ? `, ${church.state}` : ''}
                    </div>

                    {/* Description */}
                    {church.shortDescription && (
                      <div style={{
                        fontSize: '13px',
                        color: '#6b7280',
                        marginTop: '4px',
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical'
                      }}>
                        {church.shortDescription}
                      </div>
                    )}

                    {/* Rating (if has reviews) */}
                    {church.reviewCount > 0 && (
                      <div style={{ marginTop: '4px', fontSize: '13px' }}>
                        <span className="stars stars-sm" style={{ color: '#f59e0b' }}>
                          {renderStars(church.overallRating)}
                        </span>
                        <span style={{ color: '#9ca3af', marginLeft: '4px' }}>
                          ({church.reviewCount})
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}

            {/* Show More Button */}
            {showingSearchResults && churchSearchHasMore && (
              <button
                className="btn-secondary"
                onClick={handleShowMore}
                disabled={loading}
                style={{
                  width: '100%',
                  marginTop: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <ChevronDown size={18} />
                {loading ? 'Loading...' : `Show More Churches (${churchSearchTotal - churchSearchResults.length} remaining)`}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default Churches
