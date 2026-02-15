// =============================================================================
// MORE MENU SCREEN
// =============================================================================
// A hub screen accessed from the 5th bottom nav tab.
// Links to: Profile, Session Notes, Scripture Study, and future features.

import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { Avatar } from '../common'
import { BookOpen, Book, Church, Heart, Calendar, CalendarDays, ChevronRight, LogOut, Users } from 'lucide-react'

function MoreMenu() {
  const navigate = useNavigate()
  const { user, logout } = useApp()
  const menuItems = [
    {
      icon: Users,
      text: 'Find a Guide',
      subtitle: 'Browse spiritual guides nationwide',
      path: '/guides',
      colorClass: 'icon-gold'
    },
    {
      icon: CalendarDays,
      text: 'Events',
      subtitle: 'Community events & gatherings',
      path: '/events',
      colorClass: 'icon-burgundy'
    },
    {
      icon: Church,
      text: 'Churches',
      subtitle: 'Find & favorite churches',
      path: '/churches',
      colorClass: 'icon-gold'
    },
    {
      icon: Book,
      text: 'Bibles',
      subtitle: 'Read the Word of God',
      path: '/bibles',
      colorClass: 'icon-gold'
    },
    {
      icon: Heart,
      text: 'Prayer Board',
      subtitle: 'Community prayer requests',
      path: '/prayers',
      colorClass: 'icon-burgundy'
    },
    {
      icon: BookOpen,
      text: 'Scripture Study',
      subtitle: 'Verses, plans & daily word',
      path: '/scripture',
      colorClass: 'icon-gold'
    },
    {
      icon: Calendar,
      text: 'Sessions',
      subtitle: 'Appointments & session notes',
      path: '/appointments',
      colorClass: 'icon-gold'
    }
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

      {/* Menu Items */}
      <div className="screen-content">
        <div className="more-section-label">Features</div>
        {menuItems.map((item) => (
          <button
            key={item.text}
            className="more-menu-item"
            onClick={() => item.action ? item.action() : navigate(item.path)}
          >
            <div className="more-menu-item-left">
              <span className={`more-menu-item-icon ${item.colorClass || ''}`}>
                <item.icon size={20} />
              </span>
              <div>
                <div className="more-menu-item-text">{item.text}</div>
                <div className="more-menu-item-subtitle">{item.subtitle}</div>
              </div>
            </div>
            <ChevronRight size={18} style={{ color: 'var(--text-faint)' }} />
          </button>
        ))}

        {/* Logout */}
        <div className="more-section-label" style={{ marginTop: '24px' }}>Account</div>
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
