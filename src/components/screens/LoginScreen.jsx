// =============================================================================
// LOGIN SCREEN COMPONENT
// =============================================================================
// The first screen users see. Handles email/password authentication.
// Test credentials: test@sanctuary.com / Sanctuary123

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'

// Logo image as base64 (embedded in the code)
const LOGO = "data:image/jpeg;base64,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"

function LoginScreen() {
  // ----- STATE -----
  // useState creates a "state variable" that React will track
  // When it changes, the component re-renders (updates the UI)

  const [email, setEmail] = useState('')         // User's email input
  const [password, setPassword] = useState('')   // User's password input
  const [error, setError] = useState('')         // Error message to display
  const [showPassword, setShowPassword] = useState(false)  // Toggle password visibility

  // Get the login function from our app context
  const { login } = useApp()

  // Get navigate function for redirecting after login
  const navigate = useNavigate()

  // ----- HANDLERS -----

  // Called when the form is submitted
  function handleSubmit(e) {
    // Prevent the default form submission (which would reload the page)
    e.preventDefault()

    // Clear any previous error
    setError('')

    // Attempt to login
    const result = login(email, password)

    if (result.success) {
      // Login successful - navigate to dashboard
      navigate('/dashboard')
    } else {
      // Login failed - show error message
      setError(result.error)
    }
  }

  // Quick login for development/testing
  function handleDevLogin() {
    const result = login('test@sanctuary.com', 'Sanctuary123')
    if (result.success) {
      navigate('/dashboard')
    }
  }

  // ----- RENDER -----

  return (
    <div className="screen">
      <div className="screen-content">
        {/* Logo */}
        <div className="logo-container">
          <img src={LOGO} alt="Sanctuary" className="logo-image" />
        </div>

        {/* Welcome Text */}
        <div className="text-center" style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>
            Welcome Back
          </h1>
          <p style={{ fontSize: '14px', color: '#6b7280' }}>
            Sign in to continue your spiritual journey
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="alert-error">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          {/* Email Field */}
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          {/* Password Field */}
          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <div className="input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button type="submit" className="btn-primary" style={{ marginTop: '8px' }}>
            Sign In
          </button>
        </form>

        {/* Dev Quick Login */}
        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={handleDevLogin}
          >
            Quick Login (Demo)
          </button>
          <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px' }}>
            test@sanctuary.com / Sanctuary123
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginScreen
