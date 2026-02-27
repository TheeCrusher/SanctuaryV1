// =============================================================================
// CHURCH PROFILE EDITOR
// =============================================================================
// Allows church accounts to edit their custom description, service times,
// and programs. These override the Google-sourced defaults when present.

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { churchApi } from '../../utils/api'
import { ArrowLeft, Save, Check } from 'lucide-react'

function ChurchProfileEditor() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  // Form fields
  const [displayName, setDisplayName] = useState('')
  const [customDescription, setCustomDescription] = useState('')
  const [customHours, setCustomHours] = useState('')
  const [customPrograms, setCustomPrograms] = useState('')

  // Placeholders from Google data
  const [placeholders, setPlaceholders] = useState({
    description: 'Describe your church community...',
    hours: 'e.g. Sunday: 9:00 AM, 11:00 AM\nWednesday: 7:00 PM',
  })

  useEffect(() => {
    async function loadProfile() {
      try {
        const { churchAccount } = await churchApi.get('/church-auth/me')
        const { church } = churchAccount
        setDisplayName(churchAccount.displayName || '')
        setCustomDescription(church.customDescription || '')
        setCustomHours(church.customHours || '')
        setCustomPrograms(church.customPrograms || '')

        // Set Google data as placeholders
        if (church.shortDescription) {
          setPlaceholders(prev => ({ ...prev, description: church.shortDescription }))
        }
        if (church.hours) {
          setPlaceholders(prev => ({ ...prev, hours: church.hours }))
        }
      } catch (error) {
        // ignore
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [])

  async function handleSave() {
    setSaving(true)
    setSuccess(false)
    try {
      await churchApi.put('/church-auth/profile', {
        displayName,
        customDescription,
        customHours,
        customPrograms,
      })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2000)
    } catch (error) {
      // ignore
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="screen" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div className="loading-spinner" />
      </div>
    )
  }

  return (
    <div className="church-editor">
      {/* Header */}
      <div className="church-editor-header">
        <button className="church-back-btn" onClick={() => navigate('/church-dashboard')}>
          <ArrowLeft size={20} />
        </button>
        <h2>Edit Profile</h2>
      </div>

      {/* Display Name */}
      <div className="church-editor-field">
        <label className="church-editor-label">Display Name</label>
        <input
          type="text"
          className="church-editor-input"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="e.g. Willow Creek Admin"
        />
      </div>

      {/* Description */}
      <div className="church-editor-field">
        <label className="church-editor-label">Church Description</label>
        <textarea
          className="church-editor-textarea"
          value={customDescription}
          onChange={(e) => setCustomDescription(e.target.value)}
          placeholder={placeholders.description}
          rows={5}
        />
      </div>

      {/* Service Times */}
      <div className="church-editor-field">
        <label className="church-editor-label">Service Times</label>
        <textarea
          className="church-editor-textarea"
          value={customHours}
          onChange={(e) => setCustomHours(e.target.value)}
          placeholder={placeholders.hours}
          rows={4}
        />
      </div>

      {/* Programs & Ministries */}
      <div className="church-editor-field">
        <label className="church-editor-label">Programs & Ministries</label>
        <textarea
          className="church-editor-textarea"
          value={customPrograms}
          onChange={(e) => setCustomPrograms(e.target.value)}
          placeholder="e.g. Youth Group, Bible Study, Outreach, Music Ministry..."
          rows={4}
        />
      </div>

      {/* Success Message */}
      {success && (
        <div className="church-editor-success">
          <Check size={16} /> Changes saved!
        </div>
      )}

      {/* Save Button */}
      <button
        className="church-editor-save"
        onClick={handleSave}
        disabled={saving}
      >
        <Save size={18} />
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  )
}

export default ChurchProfileEditor
