// ============================================================
// Church Account JWT Authentication Middleware
// ============================================================
// Same pattern as auth.js but for church accounts.
// Verifies the JWT has type: 'church' and sets req.church.
//
// Usage in route files:
//   import { authenticateChurch } from '../middleware/churchAuth.js'
//   router.get('/protected-route', authenticateChurch, (req, res) => {
//     // req.church.accountId and req.church.churchId are available
//   })
// ============================================================

import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

dotenv.config()

export function authenticateChurch(req, res, next) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided. Please log in.' })
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Ensure this is a church token, not a user token
    if (decoded.type !== 'church') {
      return res.status(401).json({ error: 'Invalid token type. Church login required.' })
    }

    req.church = {
      accountId: decoded.churchAccountId,
      churchId: decoded.churchId
    }

    next()
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token. Please log in again.' })
  }
}
