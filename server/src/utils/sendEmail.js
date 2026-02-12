// =============================================================================
// EMAIL UTILITY (Resend)
// =============================================================================
// Sends transactional emails for password reset codes.
// Uses Resend (free tier: 3,000 emails/month).
//
// Usage:
//   import { sendPasswordResetEmail } from '../utils/sendEmail.js'
//   await sendPasswordResetEmail('user@example.com', '123456')

import { Resend } from 'resend'

// Lazy initialization — only create the client when actually sending.
// This prevents the server from crashing on startup if the API key
// isn't configured yet (e.g. during local development).
let resend = null
function getResendClient() {
  if (!resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not set. Add it to server/.env')
    }
    resend = new Resend(process.env.RESEND_API_KEY)
  }
  return resend
}

export async function sendPasswordResetEmail(toEmail, code) {
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="font-size: 40px; margin-bottom: 8px;">🙏</div>
        <h1 style="color: #1e3a8a; font-size: 24px; margin: 0;">Sanctuary</h1>
      </div>

      <h2 style="color: #1e3a8a; font-size: 20px; text-align: center; margin-bottom: 8px;">
        Password Reset Code
      </h2>

      <p style="color: #6b7280; text-align: center; margin-bottom: 24px;">
        Enter this code in the app to reset your password:
      </p>

      <div style="background: #f3f4f6; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
        <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #1e3a8a;">
          ${code}
        </span>
      </div>

      <p style="color: #9ca3af; font-size: 14px; text-align: center; margin-bottom: 8px;">
        This code expires in <strong>15 minutes</strong>.
      </p>

      <p style="color: #9ca3af; font-size: 14px; text-align: center;">
        If you didn't request a password reset, you can safely ignore this email.
      </p>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0 16px;" />

      <p style="color: #d1d5db; font-size: 12px; text-align: center;">
        Sanctuary - Spiritual Guidance App
      </p>
    </div>
  `

  const client = getResendClient()
  const { data, error } = await client.emails.send({
    from: 'Sanctuary <onboarding@resend.dev>',
    to: [toEmail],
    subject: 'Your Sanctuary Password Reset Code',
    html
  })

  if (error) {
    console.error('Failed to send email:', error)
    throw new Error('Failed to send recovery email')
  }

  return data
}
