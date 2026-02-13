// =============================================================================
// ACCOUNT DETAILS SCREEN
// =============================================================================
// Shows the user's account information with edit functionality.
// View mode: read-only Card rows
// Edit mode: editable form fields for name, phone, state, city, denomination, churchName

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, X, MapPin } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { Avatar, Card } from '../common'
import { US_STATES, getStateName } from '../../utils/constants'

const DENOMINATIONS = [
  'Non-denominational', 'Baptist', 'Catholic', 'Methodist', 'Pentecostal',
  'Lutheran', 'Presbyterian', 'Church of Christ', 'Episcopal', 'Assembly of God', 'Other'
]

function AccountDetails() {
  const navigate = useNavigate()
  const { user, updateProfile, reloadChurches } = useApp()

  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editData, setEditData] = useState({})

  function startEditing() {
    setEditData({
      name: user?.name || '',
      phoneNumber: user?.phoneNumber || '',
      state: user?.state || '',
      city: user?.city || '',
      denomination: user?.denomination || '',
      churchName: user?.churchName || ''
    })
    setIsEditing(true)
  }

  function cancelEditing() {
    setIsEditing(false)
    setEditData({})
  }

  async function handleSave() {
    setSaving(true)
    const oldState = user?.state
    // Build location string for display
    const locationStr = editData.city
      ? `${editData.city}, ${editData.state}`
      : (editData.state ? getStateName(editData.state) : undefined)

    await updateProfile({
      name: editData.name || undefined,
      phoneNumber: editData.phoneNumber || undefined,
      state: editData.state || undefined,
      city: editData.city || undefined,
      location: locationStr,
      denomination: editData.denomination || undefined,
      churchName: editData.churchName || undefined
    })

    // If state changed, reload churches to reflect new location
    if (editData.state !== oldState) {
      await reloadChurches({
        state: editData.state,
        city: editData.city,
        preferredChurchId: user?.preferredChurchId
      })
    }

    setSaving(false)
    setIsEditing(false)
  }

  function updateField(field, value) {
    setEditData(prev => ({ ...prev, [field]: value }))
  }

  // View mode data
  const details = [
    { label: 'Full Name', value: user?.name || 'N/A' },
    { label: 'Email', value: user?.email || 'N/A' },
    { label: 'Phone', value: user?.phoneNumber || 'Not set' },
    { label: 'State', value: user?.state ? getStateName(user.state) : 'Not set' },
    { label: 'City', value: user?.city || 'Not set' },
    { label: 'Denomination', value: user?.denomination || 'Not set' },
    { label: 'Church', value: user?.churchName || 'Not set' },
    { label: 'Role', value: user?.role === 'guide' ? 'Guide' : 'Seeker' },
    { label: 'Status', value: 'Active' }
  ]

  return (
    <div className="screen with-bottom-nav">
      {/* Header */}
      <div className="screen-header">
        <div className="screen-header-top">
          <button className="back-btn" onClick={() => navigate('/profile')}>
            <ArrowLeft size={20} />
          </button>
          <h1 style={{ fontSize: '20px', fontWeight: '700' }}>Account Details</h1>
          {isEditing ? (
            <button className="back-btn" onClick={cancelEditing}>
              <X size={20} />
            </button>
          ) : (
            <div style={{ width: '40px' }} />
          )}
        </div>
      </div>

      {/* Content */}
      <div className="sub-content">
        {/* Profile Photo */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Avatar
            src={user?.photoUrl}
            emoji={user?.avatar}
            size="xl"
            variant="gradient"
          />
        </div>

        {isEditing ? (
          <>
            {/* Edit Mode */}
            <Card>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Name */}
                <div>
                  <label className="account-edit-label">Full Name</label>
                  <input
                    type="text"
                    value={editData.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    className="account-edit-input"
                    placeholder="Your name"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="account-edit-label">Phone</label>
                  <input
                    type="tel"
                    value={editData.phoneNumber}
                    onChange={(e) => updateField('phoneNumber', e.target.value)}
                    className="account-edit-input"
                    placeholder="Phone number"
                  />
                </div>

                {/* State */}
                <div>
                  <label className="account-edit-label">State</label>
                  <select
                    value={editData.state}
                    onChange={(e) => updateField('state', e.target.value)}
                    className="account-edit-input"
                  >
                    <option value="">Select state</option>
                    {US_STATES.map(s => (
                      <option key={s.abbr} value={s.abbr}>{s.name}</option>
                    ))}
                  </select>
                </div>

                {/* City */}
                <div>
                  <label className="account-edit-label">City</label>
                  <input
                    type="text"
                    value={editData.city}
                    onChange={(e) => updateField('city', e.target.value)}
                    className="account-edit-input"
                    placeholder="City (optional)"
                  />
                </div>

                {/* Denomination */}
                <div>
                  <label className="account-edit-label">Denomination</label>
                  <select
                    value={editData.denomination}
                    onChange={(e) => updateField('denomination', e.target.value)}
                    className="account-edit-input"
                  >
                    <option value="">Select denomination</option>
                    {DENOMINATIONS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                {/* Church Name */}
                <div>
                  <label className="account-edit-label">Church</label>
                  <input
                    type="text"
                    value={editData.churchName}
                    onChange={(e) => updateField('churchName', e.target.value)}
                    className="account-edit-input"
                    placeholder="Church you attend"
                  />
                </div>
              </div>
            </Card>

            {/* Read-only fields */}
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Email</span>
                <span style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>{user?.email}</span>
              </div>
            </Card>
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Role</span>
                <span style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>{user?.role === 'guide' ? 'Guide' : 'Seeker'}</span>
              </div>
            </Card>

            <button
              className="btn-primary"
              style={{ marginTop: '24px' }}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </>
        ) : (
          <>
            {/* View Mode */}
            {details.map((detail, index) => (
              <Card key={index}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{detail.label}</span>
                  <span style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>{detail.value}</span>
                </div>
              </Card>
            ))}

            <button
              className="btn-primary"
              style={{ marginTop: '24px' }}
              onClick={startEditing}
            >
              Edit Profile
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default AccountDetails
