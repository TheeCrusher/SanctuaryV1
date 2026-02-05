// =============================================================================
// ACCOUNT DETAILS SCREEN
// =============================================================================
// Shows the user's account information.
// In the future, this would allow editing profile details.

import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { Avatar, Card } from '../common'

function AccountDetails() {
  const navigate = useNavigate()
  const { user } = useApp()

  // Account info rows
  const details = [
    { label: 'Full Name', value: user?.name || 'N/A' },
    { label: 'Email', value: user?.email || 'N/A' },
    { label: 'Role', value: 'Spiritual Guide' },
    { label: 'Member Since', value: 'February 2026' },
    { label: 'Status', value: 'Active' }
  ]

  return (
    <div className="screen with-bottom-nav">
      {/* Header */}
      <div className="screen-header">
        <div className="screen-header-top">
          <button className="back-btn" onClick={() => navigate('/profile')}>
            ←
          </button>
          <h1 style={{ fontSize: '20px', fontWeight: '700' }}>Account Details</h1>
          <div style={{ width: '40px' }} />
        </div>
      </div>

      {/* Content */}
      <div className="sub-content">
        {/* Profile Photo Section */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Avatar
            src={user?.photoUrl}
            emoji={user?.avatar}
            size="xl"
            variant="gradient"
          />
        </div>

        {/* Account Info */}
        {details.map((detail, index) => (
          <Card key={index}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', color: '#6b7280' }}>{detail.label}</span>
              <span style={{ fontSize: '15px', fontWeight: '600', color: '#111827' }}>{detail.value}</span>
            </div>
          </Card>
        ))}

        <button
          className="btn-primary"
          style={{ marginTop: '24px' }}
          onClick={() => alert('Edit profile feature coming soon!')}
        >
          Edit Profile
        </button>
      </div>
    </div>
  )
}

export default AccountDetails
