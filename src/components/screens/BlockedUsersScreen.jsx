// =============================================================================
// BLOCKED USERS SCREEN
// =============================================================================
// Shows a list of users the current user has blocked.
// Each blocked user has an "Unblock" button to remove the block.
// Accessible from Profile > Account > Blocked Users.

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Avatar } from '../common'
import { ArrowLeft, ShieldOff } from 'lucide-react'
import { api } from '../../utils/api'

function BlockedUsersScreen() {
  const navigate = useNavigate()
  const [blockedUsers, setBlockedUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [unblockingId, setUnblockingId] = useState(null)

  useEffect(() => {
    async function loadBlocked() {
      try {
        const data = await api.get('/blocks')
        setBlockedUsers(data.blocked || [])
      } catch (error) {
        console.error('Failed to load blocked users:', error)
      } finally {
        setLoading(false)
      }
    }
    loadBlocked()
  }, [])

  async function handleUnblock(userId) {
    setUnblockingId(userId)
    try {
      await api.delete(`/blocks/${userId}`)
      setBlockedUsers(prev => prev.filter(u => u.id !== userId))
    } catch (error) {
      console.error('Failed to unblock user:', error)
    } finally {
      setUnblockingId(null)
    }
  }

  return (
    <div className="screen with-bottom-nav">
      <div className="screen-header">
        <div className="screen-header-top">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
          </button>
          <h1 className="section-title">Blocked Users</h1>
          <div style={{ width: 40 }} />
        </div>
      </div>

      <div className="screen-content">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>
            Loading...
          </div>
        ) : blockedUsers.length === 0 ? (
          <div className="empty-state">
            <ShieldOff size={48} style={{ color: 'var(--text-secondary)', marginBottom: 12 }} />
            <div className="empty-text">No blocked users</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              Users you block will appear here
            </div>
          </div>
        ) : (
          blockedUsers.map(user => (
            <div key={user.id} className="blocked-user-card">
              <div className="blocked-user-info">
                <Avatar
                  src={user.photoUrl}
                  emoji={user.avatar}
                  name={user.name}
                  size="md"
                />
                <div className="blocked-user-details">
                  <div className="blocked-user-name">{user.name}</div>
                  <div className="blocked-user-role">{user.role}</div>
                </div>
              </div>
              <button
                className="unblock-btn"
                onClick={() => handleUnblock(user.id)}
                disabled={unblockingId === user.id}
              >
                {unblockingId === user.id ? 'Unblocking...' : 'Unblock'}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default BlockedUsersScreen
