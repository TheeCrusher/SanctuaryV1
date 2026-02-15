// =============================================================================
// BOTTOM NAVIGATION COMPONENT
// =============================================================================
// The main navigation bar fixed at the bottom of the screen.
// Shows 5 tabs: Home, Community, Events, More, Profile Photo
//
// Uses React Router to:
//   - Navigate to different screens when tapped
//   - Highlight the currently active screen

import { useNavigate, useLocation } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { Home, Users, CalendarDays, MoreHorizontal } from 'lucide-react'

// Consistent colors for initials — matches Avatar component
const INITIALS_COLORS = [
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e', '#ef4444', '#f97316',
  '#f59e0b', '#84cc16', '#22c55e', '#14b8a6',
  '#06b6d4', '#3b82f6', '#2563eb', '#7c3aed'
]

function getInitials(name) {
  if (!name) return ''
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function getColorForName(name) {
  if (!name) return INITIALS_COLORS[0]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return INITIALS_COLORS[Math.abs(hash) % INITIALS_COLORS.length]
}

function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useApp()

  // Helper function to check if a path is currently active
  function isActive(path) {
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  // Events tab is active for /events and any sub-routes
  function isEventsActive() {
    return location.pathname === '/events' || location.pathname.startsWith('/events/')
  }

  // "More" is active when viewing any screen accessible from the More menu.
  // Events removed — it now has its own tab.
  function isMoreActive() {
    const morePaths = ['/more', '/scripture', '/churches', '/prayers', '/appointments', '/calendar', '/guides', '/bibles']
    return morePaths.some(p =>
      location.pathname === p || location.pathname.startsWith(p + '/')
    )
  }

  // Profile is active on own profile screen
  function isProfileActive() {
    return location.pathname === '/profile' || location.pathname.startsWith('/profile/')
  }

  // Role-based ring color for the profile photo
  const ringClass = user?.role === 'guide' ? 'nav-profile-guide' : 'nav-profile-seeker'
  const initials = getInitials(user?.name)

  return (
    <nav className="bottom-nav">
      <div className="nav-items">
        {/* Home */}
        <button
          className={`nav-btn ${isActive('/dashboard') ? 'active' : ''}`}
          onClick={() => navigate('/dashboard')}
          aria-label="Home"
          title="Home"
          data-tour-id="nav-home"
        >
          <Home size={24} />
        </button>

        {/* Community */}
        <button
          className={`nav-btn ${isActive('/community') ? 'active' : ''}`}
          onClick={() => navigate('/community')}
          aria-label="Community"
          title="Community"
          data-tour-id="nav-community"
        >
          <Users size={24} />
        </button>

        {/* Events */}
        <button
          className={`nav-btn ${isEventsActive() ? 'active' : ''}`}
          onClick={() => navigate('/events')}
          aria-label="Events"
          title="Events"
          data-tour-id="nav-events"
        >
          <CalendarDays size={24} />
        </button>

        {/* More */}
        <button
          className={`nav-btn ${isMoreActive() ? 'active' : ''}`}
          onClick={() => navigate('/more')}
          aria-label="More"
          title="More"
          data-tour-id="nav-more"
        >
          <MoreHorizontal size={24} />
        </button>

        {/* Profile Photo */}
        <button
          className={`nav-btn nav-btn-profile ${ringClass} ${isProfileActive() ? 'active' : ''}`}
          onClick={() => navigate('/profile')}
          aria-label="Profile"
          title="Profile"
          data-tour-id="nav-profile"
        >
          {user?.photoUrl ? (
            <img src={user.photoUrl} alt="Profile" />
          ) : initials ? (
            <span
              className="nav-profile-initials"
              style={{ background: getColorForName(user?.name) }}
            >
              {initials}
            </span>
          ) : (
            <span className="nav-profile-initials" style={{ background: INITIALS_COLORS[0] }}>?</span>
          )}
        </button>
      </div>
    </nav>
  )
}

export default BottomNav
