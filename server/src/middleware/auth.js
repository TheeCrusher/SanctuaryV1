// ============================================================
// JWT Authentication Middleware
// ============================================================
// This middleware checks if a request has a valid JWT token.
// It's used on "protected" routes -- routes that require
// the user to be logged in.
//
// How it works:
// 1. Looks for a token in the "Authorization" header
//    (format: "Bearer eyJhbGciOiJI...")
// 2. Verifies the token is valid and not expired
// 3. Attaches the user's ID to the request (req.user)
// 4. If no token or invalid token, sends a 401 error
//
// Usage in route files:
//   import { authenticate } from '../middleware/auth.js'
//   router.get('/protected-route', authenticate, (req, res) => {
//     // req.user.id is available here
//   })
// ============================================================

import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

dotenv.config()

export function authenticate(req, res, next) {
  // Get the Authorization header
  const authHeader = req.headers.authorization

  // Check if it exists and starts with "Bearer "
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided. Please log in.' })
  }

  // Extract the token (everything after "Bearer ")
  const token = authHeader.split(' ')[1]

  try {
    // Verify the token using the same secret that was used to create it
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Attach the user info to the request object
    // Now any route handler can access req.user.id
    req.user = { id: decoded.userId }

    // Continue to the next middleware or route handler
    next()
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token. Please log in again.' })
  }
}
