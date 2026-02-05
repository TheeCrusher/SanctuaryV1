// =============================================================================
// NOTIFICATIONS SCREEN
// =============================================================================
// Notification preferences and settings.
// Uses toggle switches for enabling/disabling different notification types.

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Card } from '../common'

function Notifications() {
  const navigate = useNavigate()

  // State for each notification toggle
  // useState tracks whether each notification type is on or off
  const [settings, setSettings] = useState({
    newAppointments: true,
    appointmentReminders: true,
    messages: true,
    sessionUpdates: true,
    weeklyDigest: false,
    promotions: false
  })

  // Toggle a specific setting on/off
  function toggleSetting(key) {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  // Notification options configuration
  const notificationOptions = [
    {
      key: 'newAppointments',
      title: 'New Appointments',
      description: 'When a seeker requests a session'
    },
    {
      key: 'appointmentReminders',
      title: 'Appointment Reminders',
      description: '30 minutes before a scheduled session'
    },
    {
      key: 'messages',
      title: 'Messages',
      description: 'When you receive a new message'
    },
    {
      key: 'sessionUpdates',
      title: 'Session Updates',
      description: 'Status changes to your sessions'
    },
    {
      key: 'weeklyDigest',
      title: 'Weekly Digest',
      description: 'Summary of your weekly activity'
    },
    {
      key: 'promotions',
      title: 'Promotions & News',
      description: 'Updates about new features and events'
    }
  ]

  return (
    <div className="screen with-bottom-nav">
      {/* Header */}
      <div className="screen-header">
        <div className="screen-header-top">
          <button className="back-btn" onClick={() => navigate('/profile')}>
            <ArrowLeft size={20} />
          </button>
          <h1 style={{ fontSize: '20px', fontWeight: '700' }}>Notifications</h1>
          <div style={{ width: '40px' }} />
        </div>
      </div>

      {/* Content */}
      <div className="sub-content">
        <h2 className="sub-section-title">Push Notifications</h2>

        {notificationOptions.map(option => (
          <Card key={option.key}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', color: '#111827', marginBottom: '2px' }}>
                  {option.title}
                </div>
                <div style={{ fontSize: '13px', color: '#6b7280' }}>
                  {option.description}
                </div>
              </div>

              {/* Toggle Switch */}
              {/* This is a custom CSS toggle built with a styled button */}
              <button
                onClick={() => toggleSetting(option.key)}
                style={{
                  width: '50px',
                  height: '28px',
                  borderRadius: '14px',
                  border: 'none',
                  background: settings[option.key] ? '#1e3a8a' : '#d1d5db',
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  flexShrink: 0
                }}
                aria-label={`Toggle ${option.title}`}
              >
                <div style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  background: 'white',
                  position: 'absolute',
                  top: '3px',
                  left: settings[option.key] ? '25px' : '3px',
                  transition: 'left 0.2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                }} />
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default Notifications
