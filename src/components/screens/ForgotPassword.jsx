// =============================================================================
// FORGOT PASSWORD SCREEN (4-step recovery flow)
// =============================================================================
// Step 1: Choose method (email or phone) + enter email/phone
// Step 2: Enter 6-digit verification code
// Step 3: Set new password
// Step 4: Success confirmation
//
// All steps in one component using step state.

import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../utils/api'
import {
  ArrowLeft, Mail, Phone, KeyRound,
  Eye, EyeOff, CheckCircle, ShieldCheck
} from 'lucide-react'

function ForgotPassword() {
  const navigate = useNavigate()

  // Step tracking (1-4)
  const [step, setStep] = useState(1)

  // Step 1 state
  const [method, setMethod] = useState('email') // 'email' or 'phone'
  const [email, setEmail] = useState('')

  // Step 2 state
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [resendCooldown, setResendCooldown] = useState(0)
  const inputRefs = useRef([])

  // Step 3 state
  const [resetToken, setResetToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Shared state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendCooldown])

  // ==========================================
  // STEP 1: Send recovery code
  // ==========================================
  async function handleSendCode() {
    setError('')
    setLoading(true)

    try {
      const body = method === 'email' ? { email: email.trim() } : { phone: phone.trim() }
      await api.post('/auth/forgot-password', body)
      setStep(2)
      setResendCooldown(60)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ==========================================
  // STEP 2: Verify code
  // ==========================================

  // Handle individual digit input
  function handleCodeChange(index, value) {
    // Only allow digits
    const digit = value.replace(/\D/g, '').slice(-1)
    const newCode = [...code]
    newCode[index] = digit
    setCode(newCode)
    setError('')

    // Auto-advance to next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-submit when all 6 digits entered
    if (digit && index === 5) {
      const fullCode = newCode.join('')
      if (fullCode.length === 6) {
        verifyCode(fullCode)
      }
    }
  }

  // Handle backspace to go to previous input
  function handleCodeKeyDown(index, e) {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  // Handle paste (paste full 6-digit code at once)
  function handleCodePaste(e) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 0) return

    const newCode = [...code]
    for (let i = 0; i < 6; i++) {
      newCode[i] = pasted[i] || ''
    }
    setCode(newCode)

    // Focus the next empty box or the last box
    const nextEmpty = newCode.findIndex(d => !d)
    inputRefs.current[nextEmpty === -1 ? 5 : nextEmpty]?.focus()

    // Auto-submit if all 6 digits pasted
    if (pasted.length === 6) {
      verifyCode(pasted)
    }
  }

  async function verifyCode(fullCode) {
    setError('')
    setLoading(true)

    try {
      const data = await api.post('/auth/verify-code', {
        email: email.trim(),
        code: fullCode
      })
      setResetToken(data.resetToken)
      setStep(3)
    } catch (err) {
      setError(err.message || 'Invalid code. Please try again.')
      // Clear code inputs on error
      setCode(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  async function handleResendCode() {
    if (resendCooldown > 0) return
    setError('')

    try {
      await api.post('/auth/forgot-password', { email: email.trim() })
      setResendCooldown(60)
      setCode(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } catch {
      setError('Failed to resend code. Please try again.')
    }
  }

  // ==========================================
  // STEP 3: Reset password
  // ==========================================
  async function handleResetPassword() {
    setError('')

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    try {
      await api.post('/auth/reset-password', {
        resetToken,
        newPassword
      })
      setStep(4)
    } catch (err) {
      setError(err.message || 'Failed to reset password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Password requirement checks
  const hasMinLength = newPassword.length >= 8

  return (
    <div className="screen">
      {/* Header */}
      <div className="screen-header">
        <div className="screen-header-top">
          {step < 4 && (
            <button className="back-btn" onClick={() => step === 1 ? navigate('/login') : setStep(step - 1)}>
              <ArrowLeft size={20} />
            </button>
          )}
          <h1 className="screen-title">
            {step === 1 && 'Forgot Password'}
            {step === 2 && 'Enter Code'}
            {step === 3 && 'New Password'}
            {step === 4 && 'All Done!'}
          </h1>
          <div style={{ width: 32 }} />
        </div>

        {/* Step indicator */}
        {step < 4 && (
          <div className="fp-step-indicator">
            {[1, 2, 3].map(s => (
              <div key={s} className={`fp-step-dot ${s === step ? 'fp-step-active' : ''} ${s < step ? 'fp-step-done' : ''}`} />
            ))}
          </div>
        )}
      </div>

      <div className="screen-content" style={{ padding: '24px 20px' }}>

        {/* ============================== STEP 1 ============================== */}
        {step === 1 && (
          <>
            <p className="fp-description">
              Choose how you'd like to receive your recovery code.
            </p>

            {/* Method selection cards */}
            <div className="fp-method-cards">
              <button
                className={`fp-method-card ${method === 'email' ? 'fp-method-selected' : ''}`}
                onClick={() => setMethod('email')}
              >
                <Mail size={24} />
                <span>Email</span>
              </button>

              <button
                className="fp-method-card fp-method-disabled"
                onClick={() => setMethod('phone')}
              >
                <Phone size={24} />
                <span>Phone</span>
                <span className="fp-coming-soon">Coming Soon</span>
              </button>
            </div>

            {/* Email input */}
            {method === 'email' && (
              <div className="fp-input-section">
                <label className="form-label">Email Address</label>
                <input
                  className="fp-input"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  autoComplete="email"
                />
              </div>
            )}

            {/* Phone disabled message */}
            {method === 'phone' && (
              <div className="fp-input-section">
                <div className="fp-disabled-msg">
                  <Phone size={20} />
                  <p>SMS recovery is coming soon. Please use email for now.</p>
                </div>
              </div>
            )}

            {error && <p className="fp-error">{error}</p>}

            <button
              className="fp-btn"
              onClick={handleSendCode}
              disabled={loading || (method === 'email' && !email.trim()) || method === 'phone'}
            >
              {loading ? 'Sending...' : 'Send Recovery Code'}
            </button>

            <button className="fp-back-link" onClick={() => navigate('/login')}>
              Back to Sign In
            </button>
          </>
        )}

        {/* ============================== STEP 2 ============================== */}
        {step === 2 && (
          <>
            <div className="fp-code-header">
              <div className="fp-code-icon">
                <KeyRound size={32} />
              </div>
              <p className="fp-description">
                We sent a 6-digit code to <strong>{email}</strong>. Enter it below.
              </p>
            </div>

            {/* 6-digit code input */}
            <div className="fp-code-inputs" onPaste={handleCodePaste}>
              {code.map((digit, i) => (
                <input
                  key={i}
                  ref={el => inputRefs.current[i] = el}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleCodeChange(i, e.target.value)}
                  onKeyDown={e => handleCodeKeyDown(i, e)}
                  className="fp-code-box"
                  autoFocus={i === 0}
                />
              ))}
            </div>

            {error && <p className="fp-error">{error}</p>}

            {loading && <p className="fp-verifying">Verifying code...</p>}

            {/* Resend link with cooldown */}
            <div className="fp-resend">
              <span>Didn't receive a code? </span>
              {resendCooldown > 0 ? (
                <span className="fp-cooldown">Resend in {resendCooldown}s</span>
              ) : (
                <button className="fp-resend-btn" onClick={handleResendCode}>
                  Resend Code
                </button>
              )}
            </div>

            <p className="fp-expires-note">Code expires in 15 minutes</p>
          </>
        )}

        {/* ============================== STEP 3 ============================== */}
        {step === 3 && (
          <>
            <div className="fp-code-header">
              <div className="fp-code-icon fp-code-icon-success">
                <ShieldCheck size={32} />
              </div>
              <p className="fp-description">
                Code verified! Create your new password.
              </p>
            </div>

            <div className="fp-input-section">
              <label className="form-label">New Password</label>
              <div className="fp-input-wrapper">
                <input
                  className="fp-input fp-input-password"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="New password"
                />
                <button
                  type="button"
                  className="fp-toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="password-hint">Minimum 8 characters</p>
            </div>

            <div className="fp-input-section">
              <label className="form-label">Confirm Password</label>
              <div className="fp-input-wrapper">
                <input
                  className="fp-input fp-input-password"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
              </div>
            </div>

            {/* Password requirements */}
            <div className="fp-requirements">
              <div className={`fp-req-item ${hasMinLength ? 'fp-req-met' : ''}`}>
                <CheckCircle size={14} />
                <span>At least 8 characters</span>
              </div>
            </div>

            {error && <p className="fp-error">{error}</p>}

            <button
              className="fp-btn"
              onClick={handleResetPassword}
              disabled={loading || !newPassword || !confirmPassword}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </>
        )}

        {/* ============================== STEP 4 ============================== */}
        {step === 4 && (
          <div className="fp-success">
            <div className="fp-success-icon">
              <CheckCircle size={56} />
            </div>
            <h2 className="fp-success-title">Your password has been reset!</h2>
            <p className="fp-success-text">
              You can now sign in with your new password.
            </p>
            <button className="fp-btn" onClick={() => navigate('/login')}>
              Back to Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ForgotPassword
