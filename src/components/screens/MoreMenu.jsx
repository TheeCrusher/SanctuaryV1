// =============================================================================
// MORE MENU SCREEN
// =============================================================================
// A hub screen accessed from the 4th bottom nav tab.
// Organized into sections: Discover, Spiritual, My Stuff, Account.

import '../layout/MoreMenu.css'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { Avatar } from '../common'
import { Compass, Users, BookOpen, Heart, Calendar, LogOut, Waves, CloudRain, ChevronRight } from 'lucide-react'

function MoreMenu() {
  const navigate = useNavigate()
  const { user, logout } = useApp()

  const items = [
    { icon: Compass, text: 'Find Guides', subtitle: 'Browse guides & find churches', path: '/find', colorClass: 'icon-gold', tourId: 'more-find' },
    { icon: Users, text: 'Community', subtitle: 'Connect with believers', path: '/community', colorClass: 'icon-gold' },
    { icon: Heart, text: 'Prayer Board', subtitle: 'Community prayer requests', path: '/prayers', colorClass: 'icon-burgundy', tourId: 'more-prayer-board' },
    { icon: Calendar, text: 'Sessions', subtitle: 'Appointments & session notes', path: '/appointments', colorClass: 'icon-gold', tourId: 'more-sessions' },
    { icon: BookOpen, text: 'Guide Posts', subtitle: 'Devotionals & wisdom from guides', path: '/guide-posts', colorClass: 'icon-gold' },
  ]

  const gameItems = [
    { icon: Waves, text: 'Walk on Water', subtitle: 'Dodge serpents & feed the crowd', path: '/walk-on-water', colorClass: 'icon-gold' },
    { icon: CloudRain, text: 'Word Rain', subtitle: 'Catch the falling verse', path: '/word-rain', colorClass: 'icon-gold' },
  ]

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <div className="screen with-bottom-nav">
      {/* Profile Card */}
      <div className="more-profile-card" onClick={() => navigate('/profile')}>
        <Avatar src={user?.photoUrl} emoji={user?.avatar} size="md" variant="blue" />
        <div className="more-profile-info">
          <div className="more-profile-name">{user?.name || 'User'}</div>
          <div className="more-profile-email">{user?.email || ''}</div>
        </div>
        <ChevronRight size={20} style={{ color: 'var(--text-faint)' }} />
      </div>

      {/* Menu Grid */}
      <div className="screen-content">
        <div className="more-grid-container">
          {items.map((item) => (
            <button
              key={item.text}
              className="more-grid-tile"
              onClick={() => navigate(item.path)}
              {...(item.tourId ? { 'data-tour-id': item.tourId } : {})}
            >
              <span className={`more-grid-tile-icon ${item.colorClass || ''}`}>
                <item.icon size={28} />
              </span>
              <span className="more-grid-tile-text">{item.text}</span>
              <span className="more-grid-tile-subtitle">{item.subtitle}</span>
            </button>
          ))}
        </div>

        {/* Games Section */}
        <div className="more-section-label">Games</div>
        <div className="more-grid-container">
          {gameItems.map((item) => (
            <button
              key={item.text}
              className="more-grid-tile"
              onClick={() => navigate(item.path)}
            >
              <span className={`more-grid-tile-icon ${item.colorClass || ''}`}>
                <item.icon size={28} />
              </span>
              <span className="more-grid-tile-text">{item.text}</span>
              <span className="more-grid-tile-subtitle">{item.subtitle}</span>
            </button>
          ))}
        </div>

        {/* Logout */}
        <div className="more-section-label">Account</div>
        <button className="more-menu-item" onClick={handleLogout}>
          <div className="more-menu-item-left">
            <span className="more-menu-item-icon" style={{ color: 'var(--danger)' }}>
              <LogOut size={20} />
            </span>
            <div>
              <div className="more-menu-item-text" style={{ color: 'var(--danger)' }}>Log Out</div>
            </div>
          </div>
        </button>
      </div>
    </div>
  )
}

export default MoreMenu
