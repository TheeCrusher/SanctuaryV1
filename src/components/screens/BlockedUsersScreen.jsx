// =============================================================================
// BLOCKED USERS SCREEN
// =============================================================================
// Shows a list of users the current user has blocked.
// Each blocked user has an "Unblock" button to remove the block.
// Accessible from Profile > Account > Blocked Users.

import './BlockedUsersScreen.css'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Avatar, EmptyState, LoadingSpinner } from '../common'
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
        // ignore
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
      // ignore
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
          <div className="header-spacer" />
        </div>
      </div>

      <div className="screen-content">
        {loading ? (
          <LoadingSpinner />
        ) : blockedUsers.length === 0 ? (
          <EmptyState
            icon={ShieldOff}
            title="No blocked users"
            subtitle="Users you block will appear here"
          />
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
