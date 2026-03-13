// =============================================================================
// PRIVACY & MESSAGING SETTINGS SCREEN
// =============================================================================
// Full control over discovery visibility and who can message you.
// Navigated to from Account Details.

import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Eye, EyeOff, MessageCircle, Users, UserX } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { Card } from '../common'

const MESSAGE_OPTIONS = [
  {
    value: 'everyone',
    label: 'Everyone',
    desc: 'Anyone on Sanctuary can send you a direct message.',
    icon: MessageCircle
  },
  {
    value: 'connections',
    label: 'Connections only',
    desc: 'Only people you\'re connected with can DM you directly. Others send a message request that you can accept or decline.',
    icon: Users
  },
  {
    value: 'nobody',
    label: 'No one',
    desc: 'Your inbox is closed. No one can send you new messages.',
    icon: UserX
  }
]

function PrivacyMessaging() {
  const navigate = useNavigate()
  const { user, updateProfile } = useApp()

  const isDiscoverable = user?.discoverable !== false
  const messagePermission = user?.messagePermission || 'everyone'

  return (
    <div className="screen with-bottom-nav">
      {/* Header */}
      <div className="screen-header">
        <div className="screen-header-top">
          <button className="back-btn" onClick={() => navigate('/account-details')}>
            <ArrowLeft size={20} />
          </button>
          <h1 className="screen-header-title">Privacy & Messaging</h1>
          <div className="header-spacer" />
        </div>
      </div>

      <div className="sub-content">

        {/* ── Discovery ── */}
        <div className="account-section-label">Discovery</div>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1 }}>
              <span style={{ color: isDiscoverable ? 'var(--accent-gold)' : 'var(--text-faint)' }}>
                {isDiscoverable ? <Eye size={22} /> : <EyeOff size={22} />}
              </span>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {isDiscoverable ? 'Visible' : 'Hidden'}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 3, lineHeight: 1.4 }}>
                  {isDiscoverable
                    ? 'You appear in Suggested for You and guide search results.'
                    : 'You are hidden from all discovery features. Existing connections are not affected.'}
                </div>
              </div>
            </div>
            <div
              className={`theme-toggle ${isDiscoverable ? 'active' : ''}`}
              onClick={() => updateProfile({ discoverable: !isDiscoverable })}
              style={{ flexShrink: 0 }}
            >
              <div className="theme-toggle-thumb" />
            </div>
          </div>
        </Card>

        {/* ── Messaging ── */}
        <div className="account-section-label" style={{ marginTop: 24 }}>Who can message you</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {MESSAGE_OPTIONS.map(opt => {
            const Icon = opt.icon
            const selected = messagePermission === opt.value
            return (
              <button
                key={opt.value}
                className={`pm-option-card ${selected ? 'pm-option-selected' : ''}`}
                onClick={() => updateProfile({ messagePermission: opt.value })}
              >
                <div className="pm-option-left">
                  <span className={`pm-option-icon ${selected ? 'pm-option-icon-active' : ''}`}>
                    <Icon size={20} />
                  </span>
                  <div className="pm-option-text">
                    <div className="pm-option-label">{opt.label}</div>
                    <div className="pm-option-desc">{opt.desc}</div>
                  </div>
                </div>
                <div className={`pm-radio ${selected ? 'pm-radio-selected' : ''}`} />
              </button>
            )
          })}
        </div>

        {/* Context note */}
        <div style={{ marginTop: 20, padding: '12px 14px', borderRadius: 10, background: 'var(--bg-secondary)', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          Changes save instantly. Your existing conversations are not affected by these settings.
        </div>
      </div>
    </div>
  )
}

export default PrivacyMessaging
