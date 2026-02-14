// ============================================================
// Auth Routes - Register, Login & Password Recovery
// ============================================================
// POST /api/auth/register         - Create a new user account
// POST /api/auth/login            - Log in and get a JWT token
// POST /api/auth/forgot-password  - Send a 6-digit recovery code
// POST /api/auth/verify-code      - Verify the code, get reset token
// POST /api/auth/reset-password   - Set a new password
// ============================================================

import { Router } from 'express'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import pool from '../config/db.js'
import { sendPasswordResetEmail } from '../utils/sendEmail.js'
import dotenv from 'dotenv'

dotenv.config()

const router = Router()

// Helper function to create a JWT token
function createToken(userId) {
  return jwt.sign(
    { userId },                           // Payload: data stored in the token
    process.env.JWT_SECRET,               // Secret key to sign the token
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }  // Token expires in 7 days
  )
}

// ============================================================
// POST /api/auth/register
// ============================================================
// Creates a new user account.
//
// Request body: { name, email, password, role? }
// Response:     { token, user: { id, name, email, avatar, role } }
//
// What happens:
// 1. Check if email is already taken
// 2. Hash the password (NEVER store plain text passwords!)
// 3. Insert the new user into the database
// 4. Create a JWT token and send it back

router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, role, phoneNumber } = req.body

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' })
    }

    // Validate password length (matches the reset-password requirement)
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' })
    }

    // Check if email is already in use
    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    )
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Email is already in use.' })
    }

    // Hash the password with bcrypt (10 "salt rounds" = good security)
    // This turns "Sanctuary123" into something like "$2a$10$X7yz..."
    // Even if someone steals the database, they can't read passwords
    const passwordHash = await bcrypt.hash(password, 10)

    // Insert the new user into the database
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, phone_number)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, avatar, photo_url, role, created_at`,
      [name, email, passwordHash, role || 'seeker', phoneNumber || null]
    )

    const user = result.rows[0]

    // Create a JWT token for this new user
    const token = createToken(user.id)

    // Send back the token and user data
    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        photoUrl: user.photo_url,
        role: user.role
      }
    })
  } catch (error) {
    next(error)
  }
})

// ============================================================
// POST /api/auth/login
// ============================================================
// Logs in an existing user.
//
// Request body: { email, password }
// Response:     { token, user: { id, name, email, avatar, photoUrl, role } }
//
// What happens:
// 1. Find the user by email
// 2. Compare the password with the stored hash
// 3. If match, create a JWT token and send it back

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' })
    }

    // Look up the user by email
    const result = await pool.query(
      'SELECT id, name, email, password_hash, avatar, photo_url, role FROM users WHERE email = $1',
      [email]
    )

    if (result.rows.length === 0) {
      // User not found - use a vague message for security
      // (don't reveal whether the email exists or not)
      return res.status(401).json({ error: 'Invalid email or password.' })
    }

    const user = result.rows[0]

    // Compare the provided password with the stored hash
    // bcrypt.compare handles the hashing comparison internally
    const passwordMatch = await bcrypt.compare(password, user.password_hash)

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' })
    }

    // Create a JWT token
    const token = createToken(user.id)

    // Send back the token and user data (never send password_hash!)
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        photoUrl: user.photo_url,
        role: user.role
      }
    })
  } catch (error) {
    next(error)
  }
})

// ============================================================
// POST /api/auth/forgot-password
// ============================================================
// Sends a 6-digit recovery code to the user's email.
//
// Request body: { email } or { phone }
// Response:     { message: "If an account exists..." }
//
// Security:
// - Always returns success (prevents email enumeration)
// - Old codes are invalidated when a new one is requested
// - Code is hashed before storage (bcrypt)
// - Code expires after 15 minutes

router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email, phone } = req.body
    const method = phone ? 'phone' : 'email'

    // Phone recovery not available yet
    if (method === 'phone') {
      return res.status(400).json({ error: 'SMS recovery is coming soon. Please use email.' })
    }

    if (!email) {
      return res.status(400).json({ error: 'Email is required.' })
    }

    // Look up user — but NEVER reveal if they exist
    const userResult = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    )

    // Always respond with the same message (prevent enumeration)
    const successMsg = 'If an account exists with this email, a recovery code has been sent.'

    if (userResult.rows.length === 0) {
      // No user found — still return success to prevent enumeration
      return res.json({ message: successMsg })
    }

    const userId = userResult.rows[0].id

    // Invalidate any existing unused codes for this user
    await pool.query(
      'UPDATE password_resets SET used = TRUE WHERE user_id = $1 AND used = FALSE',
      [userId]
    )

    // Generate a random 6-digit code
    const code = crypto.randomInt(100000, 999999).toString()

    // Hash the code before storing (security — treat it like a password)
    const codeHash = await bcrypt.hash(code, 10)

    // Store in database with 15-minute expiry
    await pool.query(
      `INSERT INTO password_resets (user_id, code_hash, method, expires_at)
       VALUES ($1, $2, $3, NOW() + INTERVAL '15 minutes')`,
      [userId, codeHash, method]
    )

    // Send the code via email
    try {
      await sendPasswordResetEmail(email, code)
    } catch (emailError) {
      console.error('Email send failed:', emailError)
      // Don't expose email failures to the user
    }

    res.json({ message: successMsg })
  } catch (error) {
    next(error)
  }
})

// ============================================================
// POST /api/auth/verify-code
// ============================================================
// Verifies the 6-digit recovery code.
// Returns a short-lived JWT reset token on success.
//
// Request body: { email, code }
// Response:     { resetToken } or { error }
//
// Security:
// - 5 failed attempts = 30 minute lockout
// - Code must not be expired or already used
// - Reset token expires in 10 minutes

router.post('/verify-code', async (req, res, next) => {
  try {
    const { email, code } = req.body

    if (!email || !code) {
      return res.status(400).json({ error: 'Email and code are required.' })
    }

    // Look up user
    const userResult = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    )

    if (userResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired code.' })
    }

    const userId = userResult.rows[0].id

    // Get the latest unused, non-expired code for this user
    const resetResult = await pool.query(
      `SELECT id, code_hash, attempts, locked_until
       FROM password_resets
       WHERE user_id = $1
         AND used = FALSE
         AND expires_at > NOW()
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId]
    )

    if (resetResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired code.' })
    }

    const reset = resetResult.rows[0]

    // Check if locked out (too many failed attempts)
    if (reset.locked_until && new Date(reset.locked_until) > new Date()) {
      const minutesLeft = Math.ceil((new Date(reset.locked_until) - new Date()) / 60000)
      return res.status(429).json({
        error: `Too many failed attempts. Try again in ${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''}.`
      })
    }

    // Compare the provided code with the stored hash
    const codeMatch = await bcrypt.compare(code, reset.code_hash)

    if (!codeMatch) {
      // Wrong code — increment attempts
      const newAttempts = reset.attempts + 1

      if (newAttempts >= 5) {
        // Lock for 30 minutes after 5 failed attempts
        await pool.query(
          `UPDATE password_resets
           SET attempts = $1, locked_until = NOW() + INTERVAL '30 minutes'
           WHERE id = $2`,
          [newAttempts, reset.id]
        )
        return res.status(429).json({
          error: 'Too many failed attempts. Try again in 30 minutes.'
        })
      }

      await pool.query(
        'UPDATE password_resets SET attempts = $1 WHERE id = $2',
        [newAttempts, reset.id]
      )

      return res.status(400).json({
        error: 'Invalid code. Please try again.',
        attemptsRemaining: 5 - newAttempts
      })
    }

    // Code is correct — mark as used
    await pool.query(
      'UPDATE password_resets SET used = TRUE WHERE id = $1',
      [reset.id]
    )

    // Generate a short-lived reset token (10 minutes)
    const resetToken = jwt.sign(
      { userId, purpose: 'password-reset' },
      process.env.JWT_SECRET,
      { expiresIn: '10m' }
    )

    res.json({ resetToken })
  } catch (error) {
    next(error)
  }
})

// ============================================================
// POST /api/auth/reset-password
// ============================================================
// Sets a new password using the reset token from verify-code.
//
// Request body: { resetToken, newPassword }
// Response:     { message: "Password reset successfully" }
//
// Security:
// - Token must be valid and not expired (10 min)
// - Token must have purpose: 'password-reset'
// - Password minimum 8 characters

router.post('/reset-password', async (req, res, next) => {
  try {
    const { resetToken, newPassword } = req.body

    if (!resetToken || !newPassword) {
      return res.status(400).json({ error: 'Reset token and new password are required.' })
    }

    // Validate password length
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' })
    }

    // Verify the reset token
    let decoded
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET)
    } catch {
      return res.status(400).json({ error: 'Reset link has expired. Please request a new code.' })
    }

    // Ensure token was issued for password reset (not a regular auth token)
    if (decoded.purpose !== 'password-reset') {
      return res.status(400).json({ error: 'Invalid reset token.' })
    }

    // Hash the new password
    const passwordHash = await bcrypt.hash(newPassword, 10)

    // Update the user's password
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [passwordHash, decoded.userId]
    )

    res.json({ message: 'Password reset successfully.' })
  } catch (error) {
    next(error)
  }
})

export default router
