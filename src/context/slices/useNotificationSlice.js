import { useState } from 'react'
import { api } from '../../utils/api'

export function useNotificationSlice() {
  const [notifications, setNotifications] = useState([])
  const [unreadNotifCount, setUnreadNotifCount] = useState(0)

  async function fetchNotifications() {
    try {
      const data = await api.get('/notifications')
      setNotifications(data.notifications)
      setUnreadNotifCount(data.unreadCount)
    } catch (error) {
      // ignore — bell icon screen handles its own error state
    }
  }

  async function markNotificationRead(id) {
    try {
      await api.patch(`/notifications/${id}/read`)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
      setUnreadNotifCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      // ignore
    }
  }

  async function markAllNotificationsRead() {
    try {
      await api.patch('/notifications/read-all')
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadNotifCount(0)
    } catch (error) {
      // ignore
    }
  }

  async function deleteNotification(id) {
    try {
      const removed = notifications.find(n => n.id === id)
      await api.delete(`/notifications/${id}`)
      setNotifications(prev => prev.filter(n => n.id !== id))
      if (removed && !removed.isRead) {
        setUnreadNotifCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      // ignore
    }
  }

  function reset() {
    setNotifications([])
    setUnreadNotifCount(0)
  }

  return {
    notifications,
    setNotifications,
    unreadNotifCount,
    setUnreadNotifCount,
    fetchNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
    reset,
  }
}
