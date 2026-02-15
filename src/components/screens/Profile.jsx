// =============================================================================
// PROFILE SCREEN
// =============================================================================
// Shows user profile info with editable bio, specialization, and location.
// Allows photo upload, dark mode toggle, and logout.

import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { useTheme } from '../../context/ThemeContext'
import { Avatar } from '../common'
import { compressImage } from '../../utils/imageCompress'
import { User, Bell, CreditCard, Mail, HelpCircle, FileText, Lock, LogOut, Camera, ChevronRight, Moon, Sun, MapPin, BookOpen, Edit3, Check, X, ShieldOff, Users, Clock, Compass } from 'lucide-react'

const SPECIALIZATIONS = [
  'Bible Study',
  'Prayer',
  'Counseling',
  'Youth Ministry',
  'Worship & Music',
  'Family Ministry',
  'Missions',
  'General Guidance'
]

function Profile() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const { user, logout, updateUserPhoto, updateProfile } = useApp()
  const { theme, toggleTheme } = useTheme()

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    bio: '',
    specialization: '',
    location: ''
  })
  const [saving, setSaving] = useState(false)
  const [showPhoto, setShowPhoto] = useState(false)

  function handleCameraClick(e) {
    e.stopPropagation()
    fileInputRef.current?.click()
  }

  function handleAvatarClick() {
    setShowPhoto(true)
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const compressed = await compressImage(file)
      updateUserPhoto(compressed)
    } catch (err) {
      console.error('Image compression failed:', err)
    }
    e.target.value = ''
  }

  function handleLogout() {
    logout()
    navigate('/login')
  }

  function startEditing() {
    setEditData({
      bio: user?.bio || '',
      specialization: user?.specialization || '',
      location: user?.location || ''
    })
    setIsEditing(true)
  }

  function cancelEditing() {
    setIsEditing(false)
  }

  async function saveProfile() {
    setSaving(true)
    await updateProfile(editData)
    setSaving(false)
    setIsEditing(false)
  }

  const accountItems = [
    { icon: User, text: 'Account Details', path: '/account-details' },
    { icon: Bell, text: 'Notifications', path: '/notifications' },
    { icon: CreditCard, text: 'Payment Method', path: '/payment-method' },
    { icon: ShieldOff, text: 'Blocked Users', path: '/blocked-users' }
  ]

  const supportItems = [
    { icon: Mail, text: 'Contact Us', path: '/contact' },
    { icon: HelpCircle, text: 'FAQs', path: '/help' },
    { icon: FileText, text: 'Terms & Conditions', path: '/terms' },
    { icon: Lock, text: 'Privacy Policy', path: '/privacy' }
  ]

  return (
    <div className="screen with-bottom-nav">
      {/* Profile Header */}
      <div className={`profile-header ${user?.role === 'guide' ? 'profile-header-guide' : ''}`}>
        <div className="profile-avatar-wrap">
          <div onClick={handleAvatarClick} className={user?.role === 'guide' ? 'profile-avatar-guide' : 'profile-avatar-seeker'} style={{ cursor: 'pointer', borderRadius: '50%' }}>
            <Avatar
              src={user?.photoUrl}
              emoji={user?.avatar}
              size="xl"
              variant="gradient"
            />
          </div>
          <div className="camera-overlay" onClick={handleCameraClick}><Camera size={16} /></div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        <div className="profile-name">{user?.name || 'User'}</div>
        <div className="profile-email">{user?.email || ''}</div>

        {/* Profile details (bio, specialization, location) */}
        {!isEditing ? (
          <div className="profile-details">
            {user?.specialization && (
              <div className="profile-detail-row">
                <BookOpen size={14} />
                <span>{user.specialization}</span>
              </div>
            )}
            {user?.location && (
              <div className="profile-detail-row">
                <MapPin size={14} />
                <span>{user.location}</span>
              </div>
            )}
            {user?.bio && (
              <div className="profile-bio">{user.bio}</div>
            )}
            <button className="profile-edit-btn" onClick={startEditing}>
              <Edit3 size={14} />
              {user?.bio ? 'Edit Profile' : 'Add Bio & Details'}
            </button>
          </div>
        ) : (
          <div className="profile-edit-form">
            <div className="form-group">
              <label className="form-label">Bio</label>
              <textarea
                value={editData.bio}
                onChange={e => setEditData(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Tell others about yourself..."
                maxLength={200}
                rows={3}
              />
              <div className="profile-char-count">{editData.bio.length}/200</div>
            </div>
            <div className="form-group">
              <label className="form-label">Specialization</label>
              <select
                value={editData.specialization}
                onChange={e => setEditData(prev => ({ ...prev, specialization: e.target.value }))}
              >
                <option value="">Select a specialization</option>
                {SPECIALIZATIONS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Location</label>
              <input
                type="text"
                value={editData.location}
                onChange={e => setEditData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="City, State"
                maxLength={100}
              />
            </div>
            <div className="profile-edit-actions">
              <button className="btn-secondary" onClick={cancelEditing} disabled={saving}>
                <X size={16} /> Cancel
              </button>
              <button className="btn-primary" onClick={saveProfile} disabled={saving}>
                <Check size={16} /> {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Menu Content */}
      <div className="screen-content">
        {/* Guide Availability Settings (guide-only) */}
        {user?.role === 'guide' && (
          <>
            <div className="menu-section-label">Guide Settings</div>
            <div className="menu-item" style={{ justifyContent: 'space-between' }}>
              <div className="menu-item-left">
                <span className="menu-item-icon"><Users size={20} /></span>
                <span className="menu-item-text">Accepting New Seekers</span>
              </div>
              <div
                className={`theme-toggle ${user?.acceptingSeekers !== false ? 'active' : ''}`}
                onClick={() => updateProfile({ acceptingSeekers: user?.acceptingSeekers === false })}
              >
                <div className="theme-toggle-thumb" />
              </div>
            </div>
            <div className="menu-item" style={{ justifyContent: 'space-between' }}>
              <div className="menu-item-left">
                <span className="menu-item-icon"><Clock size={20} /></span>
                <span className="menu-item-text">Max Pending Requests</span>
              </div>
              <select
                value={user?.maxPendingRequests || 5}
                onChange={e => updateProfile({ maxPendingRequests: Number(e.target.value) })}
                style={{
                  padding: '6px 10px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '14px'
                }}
              >
                {Array.from({ length: 20 }, (_, i) => i + 1).map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </>
        )}

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

        {/* Dark Mode Toggle */}
        <div className="menu-section-label">Appearance</div>
        <button className="menu-item" onClick={toggleTheme}>
          <div className="menu-item-left">
            <span className="menu-item-icon">
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </span>
            <span className="menu-item-text">
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </span>
          </div>
          <div className={`theme-toggle ${theme === 'dark' ? 'active' : ''}`}>
            <div className="theme-toggle-thumb" />
          </div>
        </button>

        {/* Restart Onboarding Tour */}
        <div className="menu-section-label">Help</div>
        <button className="menu-item" onClick={async () => {
          await updateProfile({ onboardingCompleted: false })
          navigate('/dashboard')
        }}>
          <div className="menu-item-left">
            <span className="menu-item-icon"><Compass size={20} /></span>
            <span className="menu-item-text">Restart Onboarding Tour</span>
          </div>
          <span className="menu-item-arrow"><ChevronRight size={18} /></span>
        </button>

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

      {/* Photo Preview Modal */}
      {showPhoto && (
        <div className="photo-preview-overlay" onClick={() => setShowPhoto(false)}>
          <div className="photo-preview-content">
            {user?.photoUrl ? (
              <img src={user.photoUrl} alt={user?.name || 'Profile'} className="photo-preview-img" />
            ) : (
              <div className="photo-preview-emoji">{user?.avatar || '🙏'}</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Profile
