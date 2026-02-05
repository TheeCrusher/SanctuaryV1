// =============================================================================
// PROFILE SCREEN
// =============================================================================
// Shows user profile info and settings menu.
// Allows photo upload and logout.

import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { Avatar } from '../common'
import { User, Bell, CreditCard, Mail, HelpCircle, FileText, Lock, LogOut, Camera, ChevronRight } from 'lucide-react'

function Profile() {
  const navigate = useNavigate()

  // Ref for the hidden file input
  const fileInputRef = useRef(null)

  // Get user data and functions from context
  const { user, logout, updateUserPhoto } = useApp()

  // Handle clicking the avatar to upload photo
  function handleAvatarClick() {
    fileInputRef.current?.click()
  }

  // Handle file selection for photo upload
  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return

    // Convert file to base64 data URL
    const reader = new FileReader()
    reader.onloadend = () => {
      updateUserPhoto(reader.result)
    }
    reader.readAsDataURL(file)

    // Reset input so same file can be selected again
    e.target.value = ''
  }

  // Handle logout
  function handleLogout() {
    logout()
    navigate('/login')
  }

  // Top menu items (account-related)
  const accountItems = [
    { icon: User, text: 'Account Details', path: '/account-details' },
    { icon: Bell, text: 'Notifications', path: '/notifications' },
    { icon: CreditCard, text: 'Payment Method', path: '/payment-method' }
  ]

  // Support menu items
  const supportItems = [
    { icon: Mail, text: 'Contact Us', path: '/contact' },
    { icon: HelpCircle, text: 'FAQs', path: '/help' },
    { icon: FileText, text: 'Terms & Conditions', path: '/terms' },
    { icon: Lock, text: 'Privacy Policy', path: '/privacy' }
  ]

  return (
    <div className="screen with-bottom-nav">
      {/* Profile Header */}
      <div className="profile-header">
        {/* Avatar with camera overlay */}
        <div className="profile-avatar-wrap" onClick={handleAvatarClick}>
          <Avatar
            src={user?.photoUrl}
            emoji={user?.avatar}
            size="xl"
            variant="gradient"
          />
          <div className="camera-overlay"><Camera size={16} /></div>
        </div>

        {/* Hidden file input for photo upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        {/* User Info */}
        <div className="profile-name">{user?.name || 'User'}</div>
        <div className="profile-email">{user?.email || ''}</div>
      </div>

      {/* Menu Content */}
      <div className="screen-content">
        {/* Account Section (top items) */}
        {accountItems.map(item => (
          <button
            key={item.path}
            className="menu-item"
            onClick={() => navigate(item.path)}
          >
            <div className="menu-item-left">
              <span className="menu-item-icon"><item.icon size={20} /></span>
              <span className="menu-item-text">{item.text}</span>
            </div>
            <span className="menu-item-arrow"><ChevronRight size={18} /></span>
          </button>
        ))}

        {/* Support Section */}
        <div className="menu-section-label">Support</div>

        {supportItems.map(item => (
          <button
            key={item.path}
            className="menu-item"
            onClick={() => navigate(item.path)}
          >
            <div className="menu-item-left">
              <span className="menu-item-icon"><item.icon size={20} /></span>
              <span className="menu-item-text">{item.text}</span>
            </div>
            <span className="menu-item-arrow"><ChevronRight size={18} /></span>
          </button>
        ))}

        {/* Logout */}
        <div className="menu-section-label">Account</div>

        <button className="menu-item" onClick={handleLogout}>
          <div className="menu-item-left">
            <span className="menu-item-icon"><LogOut size={20} /></span>
            <span className="menu-item-text danger">Log Out</span>
          </div>
          <span className="menu-item-arrow danger"><ChevronRight size={18} /></span>
        </button>
      </div>
    </div>
  )
}

export default Profile
