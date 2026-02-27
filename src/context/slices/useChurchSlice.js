import { useState } from 'react'
import { api } from '../../utils/api'

export function useChurchSlice() {
  const [churches, setChurches] = useState([])
  const [churchSearchQuery, setChurchSearchQuery] = useState('')
  const [churchSearchResults, setChurchSearchResults] = useState([])
  const [favoriteChurchIds, setFavoriteChurchIds] = useState(new Set())

  // Google Places text search — results go into churchSearchResults (separate from the default list)
  async function searchChurches(query) {
    if (!query.trim()) {
      setChurchSearchResults([])
      return
    }
    const data = await api.get(`/churches/search?q=${encodeURIComponent(query)}`)
    setChurchSearchResults(data.results)
  }

  // Reload the default church list after the user changes their state/city in Account Details
  async function reloadChurches(userObj) {
    const params = new URLSearchParams()
    if (userObj?.state) params.set('state', userObj.state)
    if (userObj?.city) params.set('city', userObj.city)
    if (userObj?.preferredChurchId) params.set('preferredChurchId', userObj.preferredChurchId)
    const query = params.toString()
    const res = await api.get(`/churches${query ? '?' + query : ''}`)
    let churchList = res.churches
    if (res.preferred) {
      const prefId = res.preferred.id
      if (!churchList.find(c => c.id === prefId)) {
        churchList = [res.preferred, ...churchList]
      }
    }
    setChurches(churchList)
  }

  // Persist a Google-sourced church to Sanctuary's own DB
  async function saveChurchFromGoogle(churchData) {
    const data = await api.post('/churches/save-from-google', churchData)
    return data.church
  }

  // Optimistic toggle — update UI immediately, revert if the API call fails
  async function toggleFavoriteChurch(churchId) {
    const isFav = favoriteChurchIds.has(churchId)
    setFavoriteChurchIds(prev => {
      const next = new Set(prev)
      if (isFav) next.delete(churchId)
      else next.add(churchId)
      return next
    })
    try {
      if (isFav) {
        await api.delete(`/favorites/${churchId}`)
      } else {
        await api.post(`/favorites/${churchId}`)
      }
    } catch (error) {
      // Revert on failure
      setFavoriteChurchIds(prev => {
        const next = new Set(prev)
        if (isFav) next.add(churchId)
        else next.delete(churchId)
        return next
      })
    }
  }

  function isChurchFavorited(churchId) {
    return favoriteChurchIds.has(churchId)
  }

  // The old local filter (by city/zip). Components that consume `churches` get
  // the filtered list; `allChurches` gives the unfiltered raw list.
  const filteredChurches = churchSearchQuery
    ? churches.filter(c =>
        c.city.toLowerCase().includes(churchSearchQuery.toLowerCase()) ||
        c.zip.includes(churchSearchQuery)
      )
    : churches

  function reset() {
    setChurches([])
    setChurchSearchQuery('')
    setChurchSearchResults([])
    setFavoriteChurchIds(new Set())
  }

  return {
    // Expose filtered list as `churches` and raw list as `allChurches`
    // — matches the original context interface exactly
    churches: filteredChurches,
    allChurches: churches,
    setChurches,
    churchSearchQuery,
    setChurchSearchQuery,
    churchSearchResults,
    searchChurches,
    reloadChurches,
    saveChurchFromGoogle,
    favoriteChurchIds,
    setFavoriteChurchIds,
    toggleFavoriteChurch,
    isChurchFavorited,
    reset,
  }
}
