// =============================================================================
// MORE MENU SCREEN
// =============================================================================
// A hub screen accessed from the 4th bottom nav tab.
// Organized into sections: Discover, Spiritual, My Stuff, Account.

import '../layout/MoreMenu.css'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { Avatar } from '../common'
import { BookOpen, Book, Church, Heart, Calendar, ChevronRight, LogOut, Users, Waves } from 'lucide-react'

function MoreMenu() {
  const navigate = useNavigate()
  const { user, logout } = useApp()

  // Menu organized into sections (Events removed — it's now a main tab)
  const sections = [
    {
      label: 'Discover',
      items: [
        { icon: Users, text: 'Find a Guide', subtitle: 'Browse spiritual guides nationwide', path: '/guides', colorClass: 'icon-gold', tourId: 'more-find-guide' },
        { icon: Church, text: 'Churches', subtitle: 'Find & favorite churches', path: '/churches', colorClass: 'icon-gold' }
      ]
    },
    {
      label: 'Spiritual',
      items: [
        { icon: Book, text: 'Bible', subtitle: 'Read the Word of God', path: '/bibles', colorClass: 'icon-gold' },
        { icon: BookOpen, text: 'Scripture Study', subtitle: 'Verses, plans & daily word', path: '/scripture', colorClass: 'icon-gold' },
        { icon: Heart, text: 'Prayer Board', subtitle: 'Community prayer requests', path: '/prayers', colorClass: 'icon-burgundy', tourId: 'more-prayer-board' },
        { icon: Waves, text: 'Walk on Water', subtitle: 'Dodge serpents & feed the crowd', path: '/walk-on-water', colorClass: 'icon-gold' }
      ]
    },
    {
      label: 'My Stuff',
      items: [
        { icon: Calendar, text: 'Sessions', subtitle: 'Appointments & session notes', path: '/appointments', colorClass: 'icon-gold', tourId: 'more-sessions' }
      ]
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

      {/* Menu Items grouped by section */}
      <div className="screen-content">
        {sections.map((section) => (
          <div key={section.label}>
            <div className="more-section-label">{section.label}</div>
            {section.items.map((item) => (
              <button
                key={item.text}
                className="more-menu-item"
                onClick={() => navigate(item.path)}
                {...(item.tourId ? { 'data-tour-id': item.tourId } : {})}
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
          </div>
        ))}

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
