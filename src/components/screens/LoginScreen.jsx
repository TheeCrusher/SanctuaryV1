// =============================================================================
// LOGIN SCREEN COMPONENT
// =============================================================================
// The first screen users see. Handles email/password authentication.
// Shows email/password form with link to Sign Up.

import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'

// Logo image extracted from splash video first frame
const LOGO = "/sanctuary-logo.png"

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
  async function handleSubmit(e) {
    // Prevent the default form submission (which would reload the page)
    e.preventDefault()

    // Clear any previous error
    setError('')

    // Attempt to login (now async - calls the backend API)
    const result = await login(email, password)

    if (result.success) {
      // Login successful - navigate to dashboard
      navigate('/dashboard')
    } else {
      // Login failed - show error message
      setError(result.error)
    }
  }

  // ----- RENDER -----

  return (
    <div className="login-screen">
      {/* Decorative background circles */}
      <div className="login-bg-circle login-bg-circle-1" />
      <div className="login-bg-circle login-bg-circle-2" />

      {/* Logo */}
      <div className="login-logo-area">
        <img src={LOGO} alt="Sanctuary" className="login-logo-image" />
      </div>

      {/* Form Card */}
      <div className="login-card">
        <h2>Welcome Back</h2>
        <div className="login-subtitle">Sign in to continue</div>

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

          {/* Forgot Password Link */}
          <div className="fp-forgot-link">
            <Link to="/forgot-password">Forgot Password?</Link>
          </div>

          {/* Submit Button */}
          <button type="submit" className="login-btn">
            Sign In
          </button>
        </form>
      </div>

      {/* Sign Up Link */}
      <div className="signup-link">
        Don't have an account? <Link to="/signup">Sign Up</Link>
      </div>
    </div>
  )
}

export default LoginScreen
