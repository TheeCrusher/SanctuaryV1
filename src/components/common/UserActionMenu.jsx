// =============================================================================
// USER ACTION MENU
// =============================================================================
// A small popup overlay that appears when tapping a user's name anywhere.
// Shows quick actions: "Visit Profile" (always) and "Message" (contextual).
// Rendered once in App.jsx, triggered from any component via AppContext.

import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { Avatar } from '../common'
import { User, MessageCircle } from 'lucide-react'

function UserActionMenu() {
  const navigate = useNavigate()
  const { userActionMenu, hideUserActionMenu, startNewConversation } = useApp()

  if (!userActionMenu) return null

  const { userId, userName, photoUrl, avatar, showMessage } = userActionMenu

  function handleVisitProfile() {
    hideUserActionMenu()
    navigate(`/user/${userId}`)
  }

  async function handleMessage() {
    hideUserActionMenu()
    const conv = await startNewConversation(userId)
    if (conv) navigate('/chat')
  }

  return (
    <div className="user-action-overlay" onClick={hideUserActionMenu}>
      <div className="user-action-card" onClick={(e) => e.stopPropagation()}>
        <div className="user-action-header">
          <Avatar
            src={photoUrl}
            emoji={avatar}
            name={userName}
            size="sm"
            variant="blue"
          />
          <span className="user-action-name">{userName}</span>
        </div>
        <div className="user-action-buttons">
          <button className="user-action-btn" onClick={handleVisitProfile}>
            <User size={18} />
            Visit Profile
          </button>
          {showMessage && (
            <button className="user-action-btn" onClick={handleMessage}>
              <MessageCircle size={18} />
              Message
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default UserActionMenu
