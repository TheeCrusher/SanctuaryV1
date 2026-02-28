// =============================================================================
// ACCOUNT DETAILS SCREEN
// =============================================================================
// Shows the user's account information with edit functionality.
// View mode: read-only Card rows
// Edit mode: editable form fields for name, phone, state, city, denomination, churchName

import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, X, MapPin } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { Avatar, Card } from '../common'
import { US_STATES, getStateName } from '../../utils/constants'
import { api } from '../../utils/api'

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
  const [churchSuggestions, setChurchSuggestions] = useState([])
  const churchTimer = useRef(null)

  function startEditing() {
    setEditData({
      name: user?.name || '',
      phoneNumber: user?.phoneNumber || '',
      state: user?.state || '',
      city: user?.city || '',
      denomination: user?.denomination || '',
      churchName: user?.churchName || '',
      preferredChurchId: user?.preferredChurchId || null
    })
    setChurchSuggestions([])
    setIsEditing(true)
  }

  function handleChurchInput(val) {
    setEditData(prev => ({ ...prev, churchName: val, preferredChurchId: null }))
    clearTimeout(churchTimer.current)
    if (val.trim().length < 2) { setChurchSuggestions([]); return }
    churchTimer.current = setTimeout(async () => {
      try {
        const data = await api.get(`/churches?q=${encodeURIComponent(val.trim())}&limit=5`)
        setChurchSuggestions(data.churches || [])
      } catch { setChurchSuggestions([]) }
    }, 400)
  }

  function selectChurch(church) {
    setEditData(prev => ({ ...prev, churchName: church.name, preferredChurchId: church.id }))
    setChurchSuggestions([])
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
      churchName: editData.churchName || undefined,
      preferredChurchId: editData.preferredChurchId ?? undefined
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
    { label: 'Church', value: user?.churchName || 'Not set', linked: !!user?.preferredChurchId },
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
          <h1 className="screen-header-title">Account Details</h1>
          {isEditing ? (
            <button className="back-btn" onClick={cancelEditing}>
              <X size={20} />
            </button>
          ) : (
            <div className="header-spacer" />
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

                {/* Church Name — searchable */}
                <div style={{ position: 'relative' }}>
                  <label className="account-edit-label">Church</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      value={editData.churchName}
                      onChange={(e) => handleChurchInput(e.target.value)}
                      className="account-edit-input"
                      placeholder="Search for your church..."
                      autoComplete="off"
                    />
                    {editData.preferredChurchId && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontSize: '12px', color: 'var(--accent-gold)' }}>
                        <Check size={12} /> Linked to church profile
                      </div>
                    )}
                    {!editData.preferredChurchId && editData.churchName && (
                      <div style={{ marginTop: '4px', fontSize: '12px', color: 'var(--text-faint)' }}>
                        <MapPin size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                        Type to search and link a church
                      </div>
                    )}
                  </div>
                  {churchSuggestions.length > 0 && (
                    <div className="account-church-dropdown">
                      {churchSuggestions.map(ch => (
                        <button
                          key={ch.id}
                          type="button"
                          className="account-church-option"
                          onClick={() => selectChurch(ch)}
                        >
                          <span className="account-church-option-name">{ch.name}</span>
                          <span className="account-church-option-addr">{ch.city}, {ch.state}</span>
                        </button>
                      ))}
                    </div>
                  )}
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
                  <span style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {detail.value}
                    {detail.linked && <Check size={14} color="var(--accent-gold)" />}
                  </span>
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
