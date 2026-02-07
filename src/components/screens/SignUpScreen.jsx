// =============================================================================
// SIGN UP SCREEN COMPONENT — 3-Step Onboarding
// =============================================================================
// Step 1: Account basics (name, email, password, role)
// Step 2: About you (location, denomination, church) — skippable
// Step 3: Your interests (tappable chips) — skippable

import { useState, useEffect } from 'react'
import { useNavigate, Link, Navigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { Eye, EyeOff, Mail, Lock, User, MapPin, Church, BookOpen, Compass, Heart } from 'lucide-react'

const LOGO = "/sanctuary-logo.png"

const DENOMINATIONS = [
  'Non-denominational',
  'Baptist',
  'Catholic',
  'Methodist',
  'Pentecostal',
  'Lutheran',
  'Presbyterian',
  'Church of Christ',
  'Episcopal',
  'Assembly of God',
  'Other'
]

const INTEREST_OPTIONS = [
  'Hiking', 'Sports', 'Painting', 'Reading',
  'Music', 'Cooking', 'Volunteering', 'Travel',
  'Fitness', 'Photography', 'Gardening', 'Writing',
  'Bible Study', 'Worship', 'Youth Ministry', 'Community Service'
]

function SignUpScreen() {
  const [step, setStep] = useState(1)

  // ----- STEP 1 STATE -----
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState('seeker')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [onboarding, setOnboarding] = useState(false)

  // ----- STEP 2 STATE -----
  const [location, setLocation] = useState('')
  const [denomination, setDenomination] = useState('')
  const [churchName, setChurchName] = useState('')

  // ----- STEP 3 STATE -----
  const [selectedInterests, setSelectedInterests] = useState([])

  const { user, register, updateProfile } = useApp()
  const navigate = useNavigate()

  // If already logged in and NOT in the onboarding flow, redirect to dashboard
  if (user && !onboarding) {
    return <Navigate to="/dashboard" replace />
  }

  // ----- STEP 1: Create Account -----
  async function handleCreateAccount(e) {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)
    setOnboarding(true)
    const result = await register(name, email, password, role)
    setLoading(false)

    if (result.success) {
      setStep(2)
    } else {
      setError(result.error)
    }
  }

  // ----- STEP 2: Save profile info -----
  async function handleSaveProfile() {
    setLoading(true)
    await updateProfile({
      location: location || undefined,
      denomination: denomination || undefined,
      churchName: churchName || undefined
    })
    setLoading(false)
    setStep(3)
  }

  // ----- STEP 3: Save interests -----
  async function handleSaveInterests() {
    setLoading(true)
    await updateProfile({ interests: selectedInterests })
    setLoading(false)
    navigate('/dashboard')
  }

  function toggleInterest(interest) {
    setSelectedInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    )
  }

  // ----- RENDER -----
  return (
    <div className="login-screen">
      {/* Decorative background circles */}
      <div className="login-bg-circle login-bg-circle-1" />
      <div className="login-bg-circle login-bg-circle-2" />

      {/* Progress dots */}
      <div className="signup-progress">
        <div className={`signup-dot ${step >= 1 ? 'active' : ''}`} />
        <div className={`signup-dot ${step >= 2 ? 'active' : ''}`} />
        <div className={`signup-dot ${step >= 3 ? 'active' : ''}`} />
      </div>

      {/* ==================== STEP 1: Account ==================== */}
      {step === 1 && (
        <>
          <div className="login-logo-area">
            <img src={LOGO} alt="Sanctuary" className="login-logo-image" />
          </div>

          <div className="login-card">
            <h2>Create Account</h2>
            <div className="login-subtitle">Join the Sanctuary community</div>

            {error && <div className="login-error">{error}</div>}

            <form onSubmit={handleCreateAccount}>
              {/* Full Name */}
              <div className="login-input-group">
                <User size={18} className="login-input-icon" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full name"
                  required
                />
              </div>

              {/* Email */}
              <div className="login-input-group">
                <Mail size={18} className="login-input-icon" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  required
                />
              </div>

              {/* Password */}
              <div className="login-input-group">
                <Lock size={18} className="login-input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                />
                <button
                  type="button"
                  className="login-toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Confirm Password */}
              <div className="login-input-group">
                <Lock size={18} className="login-input-icon" />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  required
                />
                <button
                  type="button"
                  className="login-toggle-password"
                  onClick={() => setShowConfirm(!showConfirm)}
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Role Selector */}
              <div className="signup-step-title">I am a...</div>
              <div className="signup-role-cards">
                <button
                  type="button"
                  className={`signup-role-card ${role === 'seeker' ? 'selected' : ''}`}
                  onClick={() => setRole('seeker')}
                >
                  <Compass size={24} />
                  <div className="signup-role-title">Seeker</div>
                  <div className="signup-role-desc">Looking for spiritual guidance</div>
                </button>
                <button
                  type="button"
                  className={`signup-role-card ${role === 'guide' ? 'selected' : ''}`}
                  onClick={() => setRole('guide')}
                >
                  <Heart size={24} />
                  <div className="signup-role-title">Guide</div>
                  <div className="signup-role-desc">Here to help others grow</div>
                </button>
              </div>

              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>

            <div className="signup-link">
              Already have an account? <Link to="/login">Sign In</Link>
            </div>
          </div>
        </>
      )}

      {/* ==================== STEP 2: About You ==================== */}
      {step === 2 && (
        <div className="login-card">
          <h2>About You</h2>
          <div className="login-subtitle">Help us personalize your experience</div>

          {/* City / Area */}
          <div className="login-input-group">
            <MapPin size={18} className="login-input-icon" />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Your city or area"
            />
          </div>

          {/* Denomination */}
          <div className="login-input-group">
            <BookOpen size={18} className="login-input-icon" />
            <select
              value={denomination}
              onChange={(e) => setDenomination(e.target.value)}
              className="signup-select"
            >
              <option value="">Select denomination</option>
              {DENOMINATIONS.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Church Name */}
          <div className="login-input-group">
            <Church size={18} className="login-input-icon" />
            <input
              type="text"
              value={churchName}
              onChange={(e) => setChurchName(e.target.value)}
              placeholder="Church you attend"
            />
          </div>

          <button
            type="button"
            className="login-btn"
            onClick={handleSaveProfile}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Continue'}
          </button>

          <button
            type="button"
            className="signup-skip"
            onClick={() => setStep(3)}
          >
            Skip for now
          </button>
        </div>
      )}

      {/* ==================== STEP 3: Interests ==================== */}
      {step === 3 && (
        <div className="login-card">
          <h2>Your Interests</h2>
          <div className="login-subtitle">Select topics you enjoy (pick as many as you like)</div>

          <div className="signup-interests-grid">
            {INTEREST_OPTIONS.map(interest => (
              <button
                key={interest}
                type="button"
                className={`signup-interest-chip ${selectedInterests.includes(interest) ? 'selected' : ''}`}
                onClick={() => toggleInterest(interest)}
              >
                {interest}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="login-btn"
            onClick={handleSaveInterests}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Get Started'}
          </button>

          <button
            type="button"
            className="signup-skip"
            onClick={() => navigate('/dashboard')}
          >
            Skip for now
          </button>
        </div>
      )}
    </div>
  )
}

export default SignUpScreen
