import { useState } from 'react'
import { api } from '../../utils/api'

export function useScriptureSlice() {
  // ----- SCRIPTURE STATE -----
  const [scriptureDailyVerse, setScriptureDailyVerse] = useState(null)
  const [scriptureVerses, setScriptureVerses] = useState([])
  const [scriptureBookmarkIds, setScriptureBookmarkIds] = useState(new Set())
  const [readingPlans, setReadingPlans] = useState([])
  const [memorizationStats, setMemorizationStats] = useState({ streak: { current: 0, longest: 0 }, verseStats: [] })

  // ----- BIBLE READER STATE -----
  const [bibleHighlights, setBibleHighlights] = useState([])
  const [bibleBookmarks, setBibleBookmarks] = useState([])

  // ---- SCRIPTURE FUNCTIONS ----

  // Optimistic toggle — flip UI immediately, revert if API fails
  async function toggleVerseBookmark(verseId) {
    const isBookmarked = scriptureBookmarkIds.has(verseId)
    setScriptureBookmarkIds(prev => {
      const next = new Set(prev)
      if (isBookmarked) next.delete(verseId)
      else next.add(verseId)
      return next
    })
    try {
      if (isBookmarked) await api.delete(`/scripture/bookmarks/${verseId}`)
      else await api.post(`/scripture/bookmarks/${verseId}`)
    } catch (error) {
      // Revert on failure
      setScriptureBookmarkIds(prev => {
        const next = new Set(prev)
        if (isBookmarked) next.add(verseId)
        else next.delete(verseId)
        return next
      })
    }
  }

  async function getRandomVerse() {
    const { verse } = await api.get('/scripture/verses/random')
    return verse
  }

  async function getReadingPlanDetail(planId) {
    const { plan } = await api.get(`/scripture/plans/${planId}`)
    return plan
  }

  async function getReadingProgress(planId) {
    const { progress } = await api.get(`/scripture/plans/${planId}/progress`)
    return progress
  }

  async function markDayComplete(planId, dayNumber) {
    const { progress } = await api.post(`/scripture/plans/${planId}/progress`, { dayNumber })
    return progress
  }

  async function createCustomPlan(name, category, duration) {
    const { plan } = await api.post('/scripture/plans/custom', { name, category, duration })
    setReadingPlans(prev => [plan, ...prev])
    return plan
  }

  async function createSurprisePlan(duration = 7) {
    const { plan } = await api.post('/scripture/plans/surprise', { duration })
    setReadingPlans(prev => [plan, ...prev])
    return plan
  }

  async function deleteCustomPlan(planId) {
    await api.delete(`/scripture/plans/${planId}`)
    setReadingPlans(prev => prev.filter(p => p.id !== planId))
  }

  async function recordGameRound(verseId, mode, correct) {
    const data = await api.post('/scripture/memorization/record', { verseId, mode, correct })
    setMemorizationStats(prev => ({ ...prev, streak: data.streak }))
    return data
  }

  // ---- BIBLE READER FUNCTIONS ----

  async function addBibleHighlight(book, chapter, verse, color = 'yellow') {
    const { highlight } = await api.post('/bible/highlights', { book, chapter, verse, color })
    // Replace existing highlight for the same verse, otherwise prepend
    setBibleHighlights(prev => {
      const filtered = prev.filter(h => !(h.book === book && h.chapter === chapter && h.verse === verse))
      return [highlight, ...filtered]
    })
    return highlight
  }

  async function removeBibleHighlight(id) {
    await api.delete(`/bible/highlights/${id}`)
    setBibleHighlights(prev => prev.filter(h => h.id !== id))
  }

  async function updateBibleHighlight(id, color) {
    const { highlight } = await api.put(`/bible/highlights/${id}`, { color })
    setBibleHighlights(prev => prev.map(h => h.id === id ? highlight : h))
    return highlight
  }

  async function addBibleBookmark(book, chapter, verse = null, note = '') {
    const { bookmark } = await api.post('/bible/bookmarks', { book, chapter, verse, note })
    // Replace existing bookmark for the same location, otherwise prepend
    setBibleBookmarks(prev => {
      const filtered = prev.filter(b => !(b.book === book && b.chapter === chapter && b.verse === verse))
      return [bookmark, ...filtered]
    })
    return bookmark
  }

  async function removeBibleBookmark(id) {
    await api.delete(`/bible/bookmarks/${id}`)
    setBibleBookmarks(prev => prev.filter(b => b.id !== id))
  }

  function reset() {
    setScriptureDailyVerse(null)
    setScriptureVerses([])
    setScriptureBookmarkIds(new Set())
    setReadingPlans([])
    setMemorizationStats({ streak: { current: 0, longest: 0 }, verseStats: [] })
    setBibleHighlights([])
    setBibleBookmarks([])
  }

  return {
    // Scripture
    scriptureDailyVerse,
    setScriptureDailyVerse,
    scriptureVerses,
    setScriptureVerses,
    scriptureBookmarkIds,
    setScriptureBookmarkIds,
    readingPlans,
    setReadingPlans,
    memorizationStats,
    setMemorizationStats,
    toggleVerseBookmark,
    getRandomVerse,
    getReadingPlanDetail,
    getReadingProgress,
    markDayComplete,
    createCustomPlan,
    createSurprisePlan,
    deleteCustomPlan,
    recordGameRound,

    // Bible Reader
    bibleHighlights,
    setBibleHighlights,
    bibleBookmarks,
    setBibleBookmarks,
    addBibleHighlight,
    removeBibleHighlight,
    updateBibleHighlight,
    addBibleBookmark,
    removeBibleBookmark,

    reset,
  }
}
