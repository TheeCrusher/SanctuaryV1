import { useState } from 'react'
import { api, churchApi, setChurchToken, removeChurchToken } from '../../utils/api'

export function useAuthSlice() {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // ----- CHURCH ACCOUNT STATE -----
  // Church accounts are a separate auth system — different token, different user object.
  const [churchAccount, setChurchAccount] = useState(null)

  // These two functions are self-contained (no cross-slice side effects needed)
  async function updateUserPhoto(photoUrl) {
    try {
      const { user: updatedUser } = await api.put('/users/me', { photoUrl })
      setUser(updatedUser)
    } catch (error) {
      // ignore
    }
  }

  async function updateProfile(data) {
    try {
      const { user: updatedUser } = await api.put('/users/me', data)
      setUser(updatedUser)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Church login/logout are also self-contained — they only touch churchAccount state
  async function churchLogin(email, password) {
    try {
      const data = await churchApi.post('/church-auth/login', { email, password })
      setChurchToken(data.token)
      setChurchAccount(data.churchAccount)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  function churchLogout() {
    removeChurchToken()
    setChurchAccount(null)
  }

  function reset() {
    setUser(null)
    // isLoading intentionally NOT reset — it's only used during initial boot
  }

  return {
    user,
    setUser,
    isLoading,
    setIsLoading,
    churchAccount,
    setChurchAccount,
    updateUserPhoto,
    updateProfile,
    churchLogin,
    churchLogout,
    reset,
  }
}
