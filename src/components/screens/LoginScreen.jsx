// =============================================================================
// LOGIN SCREEN COMPONENT
// =============================================================================
// The first screen users see. Handles email/password authentication.
// Supports two login modes: User (guide/seeker) and Church (church accounts).

import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { Eye, EyeOff, Mail, Lock, Church } from 'lucide-react'
import { IOSInstallPrompt } from '../common'

// Logo image extracted from splash video first frame
const LOGO = "/sanctuary-logo.png"

function LoginScreen() {
  // ----- STATE -----
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loginMode, setLoginMode] = useState('user') // 'user' or 'church'

  // Get login functions from context
  const { login, churchLogin } = useApp()
  const navigate = useNavigate()

  // ----- HANDLERS -----

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!email.includes('@') || !email.includes('.')) {
      setError('Please enter a valid email address.')
      return
    }

    if (loginMode === 'church') {
      const result = await churchLogin(email, password)
      if (result.success) {
        navigate('/church-dashboard')
      } else {
        setError(result.error)
      }
    } else {
      const result = await login(email, password)
      if (result.success) {
        navigate('/dashboard')
      } else {
        setError(result.error)
      }
    }
  }

  // ----- RENDER -----

  return (
    <div className="login-screen">
      {/* iOS PWA install prompt (only shows on iOS Safari) */}
      <IOSInstallPrompt />

      {/* Decorative background circles */}
      <div className="login-bg-circle login-bg-circle-1" />
      <div className="login-bg-circle login-bg-circle-2" />

      {/* Logo */}
      <div className="login-logo-area">
        <img src={LOGO} alt="Sanctuary" className="login-logo-image" />
      </div>

      {/* User / Church Login Toggle */}
      <div className="login-mode-toggle">
        <button
          className={`login-mode-btn ${loginMode === 'user' ? 'active' : ''}`}
          onClick={() => { setLoginMode('user'); setError('') }}
        >
          User
        </button>
        <button
          className={`login-mode-btn ${loginMode === 'church' ? 'active' : ''}`}
          onClick={() => { setLoginMode('church'); setError('') }}
        >
          <Church size={14} />
          Church
        </button>
      </div>

      {/* Form Card */}
      <div className="login-card">
        <h2>{loginMode === 'church' ? 'Church Login' : 'Welcome Back'}</h2>
        <div className="login-subtitle">
          {loginMode === 'church' ? 'Sign in to manage your church page' : 'Sign in to continue'}
        </div>

        {/* Error Message */}
        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Email Field */}
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

          {/* Password Field */}
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

          {/* Submit Button */}
          <button type="submit" className="login-btn">
            Sign In
          </button>
        </form>
      </div>

      {/* Forgot Password & Sign Up — only shown for user mode */}
      {loginMode === 'user' && (
        <>
          <div className="fp-forgot-link">
            <Link to="/forgot-password">Forgot your password?</Link>
          </div>
          <div className="signup-link">
            Don't have an account? <Link to="/signup">Sign Up</Link>
          </div>
        </>
      )}
    </div>
  )
}

export default LoginScreen
