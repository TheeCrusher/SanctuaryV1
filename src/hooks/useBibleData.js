// ============================================================
// useBibleData - Custom Hook for Bible Text
// ============================================================
// Loads the KJV Bible JSON file from /data/kjv.json, caches
// it in memory, and provides helper functions for accessing
// books, chapters, verses, and searching.
//
// The JSON is ~4MB and downloads once, then the browser caches it.
// A module-level variable keeps it in memory so switching
// chapters/books doesn't re-download.
//
// Usage:
//   const { bible, loading, getChapter, getBookNames, searchBible } = useBibleData()
// ============================================================

import { useState, useEffect } from 'react'

// Module-level cache: persists across component re-renders
// and even across different components using this hook.
let cachedBible = null

export function useBibleData() {
  const [bible, setBible] = useState(cachedBible)
  const [loading, setLoading] = useState(!cachedBible)
  const [error, setError] = useState(null)

  useEffect(() => {
    // If we already have the data cached, no need to fetch
    if (cachedBible) {
      setBible(cachedBible)
      setLoading(false)
      return
    }

    // Fetch the KJV JSON file from the public folder
    async function loadBible() {
      try {
        const response = await fetch('/data/kjv.json')
        if (!response.ok) throw new Error('Failed to load Bible data')
        const data = await response.json()
        cachedBible = data
        setBible(data)
      } catch (err) {
        console.error('Error loading Bible:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadBible()
  }, [])

  // ---- Helper: Get a specific chapter's verses ----
  // Returns an array of verse strings, or empty array if not found
  function getChapter(bookIndex, chapterIndex) {
    if (!bible) return []
    const book = bible.books[bookIndex]
    if (!book) return []
    return book.chapters[chapterIndex] || []
  }

  // ---- Helper: Get list of all book names with chapter counts ----
  // Returns: [{ name, abbrev, chapterCount }, ...]
  function getBookNames() {
    if (!bible) return []
    return bible.books.map(book => ({
      name: book.name,
      abbrev: book.abbrev,
      chapterCount: book.chapters.length
    }))
  }

  // ---- Helper: Search across the entire Bible ----
  // Returns up to maxResults matches: [{ bookIndex, bookName, chapter, verse, text }, ...]
  function searchBible(query, maxResults = 100) {
    if (!bible || !query || query.length < 2) return []

    const results = []
    const lowerQuery = query.toLowerCase()

    for (let b = 0; b < bible.books.length; b++) {
      const book = bible.books[b]
      for (let c = 0; c < book.chapters.length; c++) {
        const chapter = book.chapters[c]
        for (let v = 0; v < chapter.length; v++) {
          if (chapter[v].toLowerCase().includes(lowerQuery)) {
            results.push({
              bookIndex: b,
              bookName: book.name,
              chapter: c + 1,
              verse: v + 1,
              text: chapter[v]
            })
            if (results.length >= maxResults) return results
          }
        }
      }
    }

    return results
  }

  // ---- Helper: Get total chapter count for navigation ----
  // Returns the total number of chapters in the entire Bible
  function getTotalChapters() {
    if (!bible) return 0
    return bible.books.reduce((total, book) => total + book.chapters.length, 0)
  }

  return {
    bible,
    loading,
    error,
    getChapter,
    getBookNames,
    searchBible,
    getTotalChapters
  }
}
