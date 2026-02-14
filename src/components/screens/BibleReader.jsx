// =============================================================================
// BIBLE READER SCREEN
// =============================================================================
// The main Bible reading experience. Shows chapter text with verse numbers,
// book/chapter navigation, verse highlighting, bookmarks, and search.
// This screen hides the bottom nav for an immersive reading feel.

import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, ChevronLeft, ChevronRight, BookOpen,
  Search, Highlighter, Bookmark, BookMarked,
  X, Loader2
} from 'lucide-react'
import { useBibleData } from '../../hooks/useBibleData'
import { useApp } from '../../context/AppContext'

// Available highlight colors
const HIGHLIGHT_COLORS = [
  { name: 'yellow', hex: '#fef08a' },
  { name: 'green', hex: '#bbf7d0' },
  { name: 'blue', hex: '#bfdbfe' },
  { name: 'pink', hex: '#fecdd3' },
  { name: 'purple', hex: '#e9d5ff' }
]

function BibleReader() {
  const navigate = useNavigate()
  const contentRef = useRef(null)
  const touchStartRef = useRef({ x: 0, y: 0 })

  // Bible data from the custom hook (loads KJV JSON)
  const { bible, loading, getChapter, getBookNames, searchBible } = useBibleData()

  // Highlights & bookmarks from global state (persisted to database)
  const {
    bibleHighlights,
    bibleBookmarks,
    addBibleHighlight,
    removeBibleHighlight,
    addBibleBookmark,
    removeBibleBookmark
  } = useApp()

  // ----- LOCAL STATE -----
  const [bookIndex, setBookIndex] = useState(0)         // Current book (0 = Genesis)
  const [chapterIndex, setChapterIndex] = useState(0)   // Current chapter (0 = chapter 1)
  const [selectedVerse, setSelectedVerse] = useState(null) // Tapped verse number (1-based)
  const [showPicker, setShowPicker] = useState(false)    // Book/chapter picker open?
  const [pickerStep, setPickerStep] = useState('book')   // 'book' or 'chapter'
  const [pickerBookIndex, setPickerBookIndex] = useState(0) // Book selected in picker
  const [showTools, setShowTools] = useState(false)      // Tools panel open?
  const [activeToolTab, setActiveToolTab] = useState('search')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [selectedColor, setSelectedColor] = useState('yellow')

  // Get current chapter data
  const books = getBookNames()
  const currentBook = books[bookIndex]
  const verses = getChapter(bookIndex, chapterIndex)

  // Scroll to top whenever chapter changes
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0
    }
    setSelectedVerse(null)
  }, [bookIndex, chapterIndex])

  // ----- NAVIGATION HELPERS -----

  // Go to the previous chapter (handles book boundaries)
  function goPrevChapter() {
    if (chapterIndex > 0) {
      setChapterIndex(chapterIndex - 1)
    } else if (bookIndex > 0) {
      // Go to last chapter of previous book
      const prevBook = books[bookIndex - 1]
      setBookIndex(bookIndex - 1)
      setChapterIndex(prevBook.chapterCount - 1)
    }
  }

  // Go to the next chapter (handles book boundaries)
  function goNextChapter() {
    if (currentBook && chapterIndex < currentBook.chapterCount - 1) {
      setChapterIndex(chapterIndex + 1)
    } else if (bookIndex < books.length - 1) {
      // Go to first chapter of next book
      setBookIndex(bookIndex + 1)
      setChapterIndex(0)
    }
  }

  // Navigate to a specific location (used by search results, bookmarks)
  function goToLocation(bIndex, cIndex) {
    setBookIndex(bIndex)
    setChapterIndex(cIndex)
    setShowPicker(false)
    setShowTools(false)
  }

  // Can we go prev/next?
  const canGoPrev = bookIndex > 0 || chapterIndex > 0
  const canGoNext = bookIndex < books.length - 1 || (currentBook && chapterIndex < currentBook.chapterCount - 1)

  // ----- SWIPE HANDLERS -----
  function handleTouchStart(e) {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }

  function handleTouchEnd(e) {
    const deltaX = e.changedTouches[0].clientX - touchStartRef.current.x
    const deltaY = e.changedTouches[0].clientY - touchStartRef.current.y
    // Only trigger if horizontal swipe > 50px and more horizontal than vertical
    if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
      if (deltaX < 0 && canGoNext) goNextChapter()
      if (deltaX > 0 && canGoPrev) goPrevChapter()
    }
  }

  // ----- PICKER HANDLERS -----

  function openPicker() {
    setPickerStep('book')
    setPickerBookIndex(bookIndex)
    setShowPicker(true)
  }

  function selectPickerBook(index) {
    setPickerBookIndex(index)
    setPickerStep('chapter')
  }

  function selectPickerChapter(cIndex) {
    goToLocation(pickerBookIndex, cIndex)
  }

  // ----- HIGHLIGHT HELPERS -----

  // Check if a verse is highlighted and return the highlight data
  function getHighlightForVerse(verseNum) {
    if (!currentBook) return null
    return bibleHighlights.find(
      h => h.book === currentBook.name && h.chapter === chapterIndex + 1 && h.verse === verseNum
    )
  }

  // Toggle highlight on selected verse
  async function handleHighlightVerse() {
    if (!selectedVerse || !currentBook) return
    const existing = getHighlightForVerse(selectedVerse)
    if (existing) {
      await removeBibleHighlight(existing.id)
    } else {
      await addBibleHighlight(currentBook.name, chapterIndex + 1, selectedVerse, selectedColor)
    }
  }

  // Change color of an existing highlight
  async function handleChangeHighlightColor(highlightId, color) {
    // Remove and re-add with new color for simplicity
    const highlight = bibleHighlights.find(h => h.id === highlightId)
    if (highlight) {
      await addBibleHighlight(highlight.book, highlight.chapter, highlight.verse, color)
    }
  }

  // ----- BOOKMARK HELPERS -----

  function getBookmarkForCurrentChapter() {
    if (!currentBook) return null
    return bibleBookmarks.find(
      b => b.book === currentBook.name && b.chapter === chapterIndex + 1
    )
  }

  async function toggleBookmark() {
    if (!currentBook) return
    const existing = getBookmarkForCurrentChapter()
    if (existing) {
      await removeBibleBookmark(existing.id)
    } else {
      await addBibleBookmark(currentBook.name, chapterIndex + 1)
    }
  }

  // ----- SEARCH -----

  const handleSearch = useCallback(() => {
    if (!searchQuery || searchQuery.length < 2) {
      setSearchResults([])
      return
    }
    setSearching(true)
    // Use setTimeout so the UI updates with the spinner before searching
    setTimeout(() => {
      const results = searchBible(searchQuery)
      setSearchResults(results)
      setSearching(false)
    }, 50)
  }, [searchQuery, searchBible])

  // ----- LOADING STATE -----

  if (loading) {
    return (
      <div className="screen" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 size={48} className="animate-spin" style={{ color: '#1e3a8a', marginBottom: '16px' }} />
          <div>Loading Bible...</div>
        </div>
      </div>
    )
  }

  // ----- RENDER -----

  return (
    <div className="bible-reader">
      {/* ===== TOP BAR ===== */}
      <div className="bible-top-bar">
        <button className="bible-top-btn" onClick={() => navigate('/bibles')}>
          <ArrowLeft size={22} />
        </button>
        <button className="bible-location-btn" onClick={openPicker}>
          <span className="bible-location-text">
            {currentBook?.name || 'Loading'} {chapterIndex + 1}
          </span>
          <ChevronRight size={16} />
        </button>
        <button
          className={`bible-top-btn ${getBookmarkForCurrentChapter() ? 'bible-top-btn-active' : ''}`}
          onClick={toggleBookmark}
        >
          {getBookmarkForCurrentChapter() ? <BookMarked size={22} /> : <Bookmark size={22} />}
        </button>
      </div>

      {/* ===== CHAPTER CONTENT ===== */}
      <div className="bible-chapter-content" ref={contentRef} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <h2 className="bible-chapter-title">
          {currentBook?.name} {chapterIndex + 1}
        </h2>
        <div className="bible-verses">
          {verses.map((verseText, i) => {
            const verseNum = i + 1
            const highlight = getHighlightForVerse(verseNum)
            const isSelected = selectedVerse === verseNum

            return (
              <span
                key={verseNum}
                className={`bible-verse${isSelected ? ' bible-verse-selected' : ''}${highlight ? ` bible-verse-hl-${highlight.color}` : ''}`}
                onClick={() => setSelectedVerse(isSelected ? null : verseNum)}
              >
                <sup className="bible-verse-num">{verseNum}</sup>
                {verseText}{' '}
              </span>
            )
          })}
        </div>
      </div>

      {/* ===== CHAPTER NAVIGATION ===== */}
      {canGoPrev && (
        <button className="bible-nav-btn bible-nav-prev" onClick={goPrevChapter}>
          <ChevronLeft size={20} />
        </button>
      )}
      {canGoNext && (
        <button className="bible-nav-btn bible-nav-next" onClick={goNextChapter}>
          <ChevronRight size={20} />
        </button>
      )}

      {/* ===== VERSE ACTION BAR (shows when verse selected) ===== */}
      {selectedVerse && (
        <div className="bible-verse-actions">
          <span className="bible-verse-actions-label">Verse {selectedVerse}</span>
          <div className="bible-verse-actions-colors">
            {HIGHLIGHT_COLORS.map(c => (
              <button
                key={c.name}
                className={`bible-color-dot${selectedColor === c.name ? ' bible-color-dot-active' : ''}`}
                style={{ background: c.hex }}
                onClick={() => setSelectedColor(c.name)}
              />
            ))}
          </div>
          <button className="bible-verse-action-btn" onClick={handleHighlightVerse}>
            <Highlighter size={16} />
            {getHighlightForVerse(selectedVerse) ? 'Remove' : 'Highlight'}
          </button>
        </div>
      )}

      {/* ===== TOOLS BUTTON ===== */}
      {!showTools && !selectedVerse && (
        <button className="bible-tools-fab" onClick={() => setShowTools(true)}>
          <Search size={20} />
          <span>Tools</span>
        </button>
      )}

      {/* ===== TOOLS PANEL (slide-up) ===== */}
      {showTools && (
        <div className="bible-tools-overlay" onClick={() => setShowTools(false)}>
          <div className="bible-tools-panel" onClick={e => e.stopPropagation()}>
            {/* Tools header */}
            <div className="bible-tools-header">
              <span className="bible-tools-title">Tools</span>
              <button className="bible-tools-close" onClick={() => setShowTools(false)}>
                <X size={20} />
              </button>
            </div>

            {/* Tab bar */}
            <div className="bible-tools-tabs">
              {[
                { key: 'search', icon: Search, label: 'Search' },
                { key: 'highlights', icon: Highlighter, label: 'Highlights' },
                { key: 'bookmarks', icon: Bookmark, label: 'Bookmarks' },
                { key: 'lookup', icon: BookOpen, label: 'Look Up' }
              ].map(tab => (
                <button
                  key={tab.key}
                  className={`bible-tools-tab${activeToolTab === tab.key ? ' bible-tools-tab-active' : ''}`}
                  onClick={() => setActiveToolTab(tab.key)}
                >
                  <tab.icon size={16} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="bible-tools-content">
              {/* SEARCH TAB */}
              {activeToolTab === 'search' && (
                <div>
                  <div className="bible-search-bar">
                    <input
                      className="bible-search-input"
                      type="text"
                      placeholder="Search the Bible..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    />
                    <button className="bible-search-btn" onClick={handleSearch}>
                      <Search size={18} />
                    </button>
                  </div>
                  {searching && (
                    <div className="bible-tools-empty">
                      <Loader2 size={24} className="animate-spin" />
                    </div>
                  )}
                  {!searching && searchResults.length > 0 && (
                    <div className="bible-search-results">
                      <div className="bible-search-count">{searchResults.length} results</div>
                      {searchResults.map((r, i) => (
                        <button
                          key={i}
                          className="bible-search-result"
                          onClick={() => goToLocation(r.bookIndex, r.chapter - 1)}
                        >
                          <div className="bible-search-result-ref">
                            {r.bookName} {r.chapter}:{r.verse}
                          </div>
                          <div className="bible-search-result-text">{r.text}</div>
                        </button>
                      ))}
                    </div>
                  )}
                  {!searching && searchQuery && searchResults.length === 0 && (
                    <div className="bible-tools-empty">No results found</div>
                  )}
                </div>
              )}

              {/* HIGHLIGHTS TAB */}
              {activeToolTab === 'highlights' && (
                <div>
                  {bibleHighlights.length === 0 ? (
                    <div className="bible-tools-empty">
                      No highlights yet. Tap a verse while reading to highlight it.
                    </div>
                  ) : (
                    <div className="bible-highlight-list">
                      {bibleHighlights.map(h => {
                        // Find the book index for navigation
                        const bIdx = books.findIndex(b => b.name === h.book)
                        return (
                          <button
                            key={h.id}
                            className={`bible-highlight-item bible-verse-hl-${h.color}`}
                            onClick={() => {
                              if (bIdx >= 0) goToLocation(bIdx, h.chapter - 1)
                            }}
                          >
                            <div className="bible-highlight-item-ref">
                              {h.book} {h.chapter}:{h.verse}
                            </div>
                            <div className="bible-highlight-item-actions">
                              {HIGHLIGHT_COLORS.map(c => (
                                <button
                                  key={c.name}
                                  className={`bible-color-dot-sm${h.color === c.name ? ' bible-color-dot-active' : ''}`}
                                  style={{ background: c.hex }}
                                  onClick={e => {
                                    e.stopPropagation()
                                    handleChangeHighlightColor(h.id, c.name)
                                  }}
                                />
                              ))}
                              <button
                                className="bible-highlight-remove"
                                onClick={e => {
                                  e.stopPropagation()
                                  removeBibleHighlight(h.id)
                                }}
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* BOOKMARKS TAB */}
              {activeToolTab === 'bookmarks' && (
                <div>
                  {bibleBookmarks.length === 0 ? (
                    <div className="bible-tools-empty">
                      No bookmarks yet. Tap the bookmark icon in the top bar to save your place.
                    </div>
                  ) : (
                    <div className="bible-bookmark-list">
                      {bibleBookmarks.map(b => {
                        const bIdx = books.findIndex(bk => bk.name === b.book)
                        return (
                          <button
                            key={b.id}
                            className="bible-bookmark-item"
                            onClick={() => {
                              if (bIdx >= 0) goToLocation(bIdx, b.chapter - 1)
                            }}
                          >
                            <div className="bible-bookmark-item-left">
                              <BookMarked size={18} />
                              <span>{b.book} {b.chapter}</span>
                            </div>
                            <button
                              className="bible-bookmark-remove"
                              onClick={e => {
                                e.stopPropagation()
                                removeBibleBookmark(b.id)
                              }}
                            >
                              <X size={14} />
                            </button>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* LOOK UP TAB */}
              {activeToolTab === 'lookup' && (
                <div className="bible-tools-empty">
                  Cross-references and verse look-up coming soon.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== BOOK/CHAPTER PICKER MODAL ===== */}
      {showPicker && (
        <div className="bible-picker-overlay" onClick={() => setShowPicker(false)}>
          <div className="bible-picker-modal" onClick={e => e.stopPropagation()}>
            <div className="bible-picker-header">
              {pickerStep === 'chapter' && (
                <button className="bible-picker-back" onClick={() => setPickerStep('book')}>
                  <ArrowLeft size={20} />
                </button>
              )}
              <span className="bible-picker-title">
                {pickerStep === 'book' ? 'Select Book' : books[pickerBookIndex]?.name}
              </span>
              <button className="bible-picker-close" onClick={() => setShowPicker(false)}>
                <X size={20} />
              </button>
            </div>

            {/* Book list */}
            {pickerStep === 'book' && (
              <div className="bible-picker-books">
                <div className="bible-picker-section-label">Old Testament</div>
                {books.slice(0, 39).map((book, i) => (
                  <button
                    key={i}
                    className={`bible-picker-book${i === bookIndex ? ' bible-picker-book-active' : ''}`}
                    onClick={() => selectPickerBook(i)}
                  >
                    <span>{book.name}</span>
                    <span className="bible-picker-book-chapters">{book.chapterCount} ch</span>
                  </button>
                ))}
                <div className="bible-picker-section-label">New Testament</div>
                {books.slice(39).map((book, i) => (
                  <button
                    key={i + 39}
                    className={`bible-picker-book${i + 39 === bookIndex ? ' bible-picker-book-active' : ''}`}
                    onClick={() => selectPickerBook(i + 39)}
                  >
                    <span>{book.name}</span>
                    <span className="bible-picker-book-chapters">{book.chapterCount} ch</span>
                  </button>
                ))}
              </div>
            )}

            {/* Chapter grid */}
            {pickerStep === 'chapter' && (
              <div className="bible-picker-chapters">
                {Array.from({ length: books[pickerBookIndex]?.chapterCount || 0 }, (_, i) => (
                  <button
                    key={i}
                    className={`bible-picker-chapter${pickerBookIndex === bookIndex && i === chapterIndex ? ' bible-picker-chapter-active' : ''}`}
                    onClick={() => selectPickerChapter(i)}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default BibleReader
