// =============================================================================
// BOTTOM NAVIGATION COMPONENT
// =============================================================================
// The main navigation bar fixed at the bottom of the screen.
// Shows 4 icons: Home, Community, More, Profile
//
// Uses React Router to:
//   - Navigate to different screens when tapped
//   - Highlight the currently active screen

import { useNavigate, useLocation } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { Home, Users, MoreHorizontal, User } from 'lucide-react'

function BottomNav() {
  // useNavigate gives us a function to programmatically change routes
  const navigate = useNavigate()

  // useLocation tells us the current URL path
  const location = useLocation()

  // Get user data for the profile avatar
  const { user } = useApp()

  // Helper function to check if a path is currently active
  function isActive(path) {
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  // "More" is active when viewing any screen accessible from the More menu.
  // NOTE: Update this array when adding/removing items from the More menu.
  function isMoreActive() {
    const morePaths = ['/more', '/notes', '/scripture', '/churches', '/prayers', '/appointments', '/calendar', '/events', '/guides', '/bibles']
    return morePaths.some(p =>
      location.pathname === p || location.pathname.startsWith(p + '/')
    )
  }

  // Navigation items configuration (3 main tabs)
  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Home' },
    { path: '/community', icon: Users, label: 'Community' }
  ]

  return (
    <nav className="bottom-nav">
      <div className="nav-items">
        {/* Main nav buttons */}
        {navItems.map((item) => (
          <button
            key={item.path}
            className={`nav-btn ${isActive(item.path) ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
            aria-label={item.label}
            title={item.label}
          >
            <item.icon size={24} />
          </button>
        ))}

        {/* More button - links to Notes, Scripture, Churches */}
        <button
          className={`nav-btn ${isMoreActive() ? 'active' : ''}`}
          onClick={() => navigate('/more')}
          aria-label="More"
          title="More"
        >
          <MoreHorizontal size={24} />
        </button>

        {/* Profile button */}
        <button
          className={`nav-btn nav-btn-profile ${isActive('/profile') ? 'active' : ''}`}
          onClick={() => navigate('/profile')}
          aria-label="Profile"
          title="Profile"
        >
          {user?.photoUrl ? (
            <img src={user.photoUrl} alt="Profile" />
          ) : (
            <User size={22} />
          )}
        </button>
      </div>
    </nav>
  )
}

export default BottomNav
