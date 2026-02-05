// =============================================================================
// BOTTOM NAVIGATION COMPONENT
// =============================================================================
// The main navigation bar fixed at the bottom of the screen.
// Shows icons for: Home, Appointments, Messages, Churches, Profile
//
// Uses React Router to:
//   - Navigate to different screens when tapped
//   - Highlight the currently active screen

import { useNavigate, useLocation } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { Home, Calendar, MessageCircle, Church, User } from 'lucide-react'

function BottomNav() {
  // useNavigate gives us a function to programmatically change routes
  const navigate = useNavigate()

  // useLocation tells us the current URL path
  const location = useLocation()

  // Get user data for the profile avatar
  const { user } = useApp()

  // Helper function to check if a path is currently active
  // This is used to highlight the active nav button
  function isActive(path) {
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  // Navigation items configuration
  // Each item has: path (URL), icon (emoji), and label (for accessibility)
  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Home' },
    { path: '/appointments', icon: Calendar, label: 'Appointments' },
    { path: '/messages', icon: MessageCircle, label: 'Messages' },
    { path: '/churches', icon: Church, label: 'Churches' }
  ]

  return (
    <nav className="bottom-nav">
      <div className="nav-items">
        {/* Map through nav items to create buttons */}
        {/* .map() is how we loop through arrays in React */}
        {navItems.map((item) => (
          <button
            key={item.path}  // React needs unique keys for list items
            className={`nav-btn ${isActive(item.path) ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
            aria-label={item.label}
            title={item.label}
          >
            <item.icon size={24} />
          </button>
        ))}

        {/* Profile button is special - shows user photo or emoji */}
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
