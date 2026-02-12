// =============================================================================
// CHURCHES SCREEN
// =============================================================================
// Browse and search for churches via Google Places API.
// Search results show real photos from Google + Sanctuary ratings if available.
// Tapping a church auto-saves it to Sanctuary's database (if not already there)
// then navigates to the detail page.

import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { Card } from '../common'
import { useState } from 'react'
import { X, Church, Heart, Search, MapPin, Star } from 'lucide-react'

// API base URL for photo proxy (same pattern as src/utils/api.js)
const API_BASE = import.meta.env.VITE_API_URL || ''

function Churches() {
  const navigate = useNavigate()

  const {
    churches,
    searchChurches,
    saveChurchFromGoogle,
    churchSearchResults,
    toggleFavoriteChurch,
    isChurchFavorited,
    favoriteChurchIds
  } = useApp()

  // Local state
  const [query, setQuery] = useState('')
  const [hasSearched, setHasSearched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(null) // googlePlaceId of church being saved
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [visibleCount, setVisibleCount] = useState(10) // Show 10 results initially

  // Run a search when user taps Search or presses Enter
  async function handleSearch() {
    if (!query.trim()) return
    setLoading(true)
    setHasSearched(true)
    setVisibleCount(10) // Reset to 10 for new search
    try {
      await searchChurches(query)
    } catch (err) {
      console.error('Search error:', err)
    }
    setLoading(false)
  }

  // Clear search and go back to default view
  function handleClear() {
    setQuery('')
    setHasSearched(false)
    setVisibleCount(10)
    searchChurches('')
  }

  // Handle tapping a search result card
  async function handleChurchTap(result) {
    if (result.sanctuaryId) {
      // Church already in our database — navigate directly
      navigate(`/churches/${result.sanctuaryId}`)
    } else {
      // Church not in our database yet — save it first, then navigate
      setSaving(result.googlePlaceId)
      try {
        const church = await saveChurchFromGoogle({
          googlePlaceId: result.googlePlaceId,
          name: result.name,
          address: result.address,
          city: result.city,
          state: result.state,
          zip: result.zip,
          phone: result.phone,
          website: result.website,
          hours: result.hours ? result.hours.join('\n') : null,
          googleRating: result.googleRating || null
        })
        navigate(`/churches/${church.id}`)
      } catch (err) {
        console.error('Failed to save church:', err)
      }
      setSaving(null)
    }
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

  // What to show when not searching: favorited churches from local DB
  const defaultChurches = showFavoritesOnly
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
            placeholder="Search churches, city, or state..."
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
        {hasSearched ? (
          <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '8px' }}>
            {loading ? 'Searching Google Places...' : `Showing ${Math.min(visibleCount, churchSearchResults.length)} of ${churchSearchResults.length} results for "${query}"`}
          </div>
        ) : favoriteChurchIds.size > 0 ? (
          <button
            className={`favorites-filter-btn ${showFavoritesOnly ? 'active' : ''}`}
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
          >
            <Heart
              size={16}
              fill={showFavoritesOnly ? '#722F37' : 'none'}
              color={showFavoritesOnly ? '#722F37' : '#6b7280'}
            />
            My Favorites ({favoriteChurchIds.size})
          </button>
        ) : null}
      </div>

      {/* Content */}
      <div className="screen-content">
        {loading && !churchSearchResults.length ? (
          <div className="empty-state">
            <div className="empty-text">Searching Google Places...</div>
          </div>

        ) : hasSearched ? (
          // ===== GOOGLE SEARCH RESULTS =====
          churchSearchResults.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><Church size={48} /></div>
              <div className="empty-text">No churches found</div>
              <div className="empty-subtext">Try a different search term</div>
            </div>
          ) : (
            <>
              {churchSearchResults.slice(0, visibleCount).map(result => (
                <Card
                  key={result.googlePlaceId}
                  onClick={() => handleChurchTap(result)}
                >
                  <div style={{ display: 'flex', gap: '12px' }}>
                    {/* Church Photo from Google (via our proxy) */}
                    <div className="church-photo-container">
                      <Church size={32} color="#9ca3af" className="church-photo-fallback" />
                      {result.hasPhoto && (
                        <img
                          src={`${API_BASE}/api/churches/photo/${result.googlePlaceId}`}
                          alt={result.name}
                          className="church-photo-img"
                          loading="lazy"
                          onError={(e) => { e.target.style.display = 'none' }}
                        />
                      )}
                    </div>

                    {/* Church Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div className="church-name" style={{ fontSize: '16px', fontWeight: '600' }}>
                          {result.name}
                        </div>
                        {/* Show favorite button only if church is already in Sanctuary */}
                        {result.sanctuaryId && (
                          <button
                            className="favorite-btn"
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleFavoriteChurch(result.sanctuaryId)
                            }}
                            style={{ flexShrink: 0, marginLeft: '8px' }}
                          >
                            <Heart
                              size={20}
                              fill={isChurchFavorited(result.sanctuaryId) ? '#722F37' : 'none'}
                              color={isChurchFavorited(result.sanctuaryId) ? '#722F37' : '#9ca3af'}
                            />
                          </button>
                        )}
                      </div>

                      {/* City, State */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#6b7280', fontSize: '13px', marginTop: '2px' }}>
                        <MapPin size={12} />
                        {result.city}{result.state ? `, ${result.state}` : ''}
                      </div>

                      {/* Address */}
                      <div style={{
                        fontSize: '13px',
                        color: '#6b7280',
                        marginTop: '4px',
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical'
                      }}>
                        {result.address}
                      </div>

                      {/* Ratings row */}
                      <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px' }}>
                        {/* Google rating */}
                        {result.googleRating && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#6b7280' }}>
                            <Star size={12} fill="#C9A227" color="#C9A227" />
                            <span>{result.googleRating.toFixed(1)}</span>
                            <span style={{ fontSize: '11px' }}>Google</span>
                          </div>
                        )}
                        {/* Sanctuary rating (if church exists in our DB with reviews) */}
                        {result.sanctuaryReviewCount > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#4f46e5' }}>
                            <span className="stars stars-sm" style={{ color: '#C9A227' }}>
                              {renderStars(result.sanctuaryRating)}
                            </span>
                            <span>({result.sanctuaryReviewCount}) Sanctuary</span>
                          </div>
                        )}
                      </div>

                      {/* Saving indicator */}
                      {saving === result.googlePlaceId && (
                        <div style={{ fontSize: '12px', color: '#4f46e5', marginTop: '4px' }}>
                          Opening...
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}

              {/* Show More button (reveals more from the same batch — no extra API call) */}
              {visibleCount < churchSearchResults.length && (
                <button
                  className="btn-secondary"
                  onClick={() => setVisibleCount(prev => prev + 10)}
                  style={{
                    width: '100%',
                    marginTop: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  Show 10 More
                </button>
              )}
            </>
          )

        ) : (
          // ===== DEFAULT VIEW (no search) =====
          defaultChurches.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><Church size={48} /></div>
              <div className="empty-text">Search for churches</div>
              <div className="empty-subtext">
                Enter a church name, city, or state above
              </div>
            </div>
          ) : (
            <>
              {defaultChurches.map(church => (
                <Card
                  key={church.id}
                  onClick={() => navigate(`/churches/${church.id}`)}
                >
                  <div style={{ display: 'flex', gap: '12px' }}>
                    {/* Church Photo */}
                    <div className="church-photo-container">
                      <Church size={32} color="#9ca3af" className="church-photo-fallback" />
                      {church.googlePlaceId ? (
                        <img
                          src={`${API_BASE}/api/churches/photo/${church.googlePlaceId}`}
                          alt={church.name}
                          className="church-photo-img"
                          loading="lazy"
                          onError={(e) => { e.target.style.display = 'none' }}
                        />
                      ) : church.photoUrl ? (
                        <img
                          src={church.photoUrl}
                          alt={church.name}
                          className="church-photo-img"
                          onError={(e) => { e.target.style.display = 'none' }}
                        />
                      ) : null}
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
                            fill={isChurchFavorited(church.id) ? '#722F37' : 'none'}
                            color={isChurchFavorited(church.id) ? '#722F37' : '#9ca3af'}
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

                      {/* Rating */}
                      {church.reviewCount > 0 && (
                        <div style={{ marginTop: '4px', fontSize: '13px' }}>
                          <span className="stars stars-sm" style={{ color: '#C9A227' }}>
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
            </>
          )
        )}
      </div>
    </div>
  )
}

export default Churches
