// ============================================================
// Socket.io Client Helper
// ============================================================
// Manages the WebSocket connection to the backend.
// Connects with JWT auth, provides event helpers.

import { io } from 'socket.io-client'
import { getToken } from './api'

let socket = null

export function connectSocket() {
  if (socket?.connected) return socket

  const token = getToken()
  if (!token) return null

  socket = io('/', {
    auth: { token },
    transports: ['websocket', 'polling']
  })

  socket.on('connect', () => {
    console.log('Socket connected:', socket.id)
  })

  socket.on('connect_error', (err) => {
    console.error('Socket connection error:', err.message)
  })

  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

export function getSocket() {
  return socket
}
