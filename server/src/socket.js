// ============================================================
// Socket.io Server
// ============================================================
// Handles real-time messaging via WebSockets.
// Features: JWT auth on connect, user rooms, typing indicators,
// online status, new message broadcasting.

import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'

// Track online users: userId -> Set of socket ids
const onlineUsers = new Map()

export function setupSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  })

  // Authenticate socket connections using JWT
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token
    if (!token) {
      return next(new Error('Authentication required'))
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'sanctuary-dev-secret')
      socket.userId = decoded.id
      socket.userName = decoded.name
      next()
    } catch {
      next(new Error('Invalid token'))
    }
  })

  io.on('connection', (socket) => {
    const userId = socket.userId
    console.log(`🔌 User ${userId} connected (socket: ${socket.id})`)

    // Track online status
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set())
    }
    onlineUsers.get(userId).add(socket.id)

    // Join the user's personal room for direct messages
    socket.join(`user:${userId}`)

    // Broadcast online status to all connected clients
    io.emit('user_online', { userId })

    // Send current online users list to newly connected client
    const onlineIds = [...onlineUsers.keys()]
    socket.emit('online_users', { userIds: onlineIds })

    // ---- JOIN CONVERSATION ROOM ----
    socket.on('join_conversation', ({ conversationId }) => {
      socket.join(`conv:${conversationId}`)
    })

    socket.on('leave_conversation', ({ conversationId }) => {
      socket.leave(`conv:${conversationId}`)
    })

    // ---- NEW MESSAGE ----
    // When a message is saved via REST API, the route handler emits this
    // We re-broadcast to all participants in the conversation room
    socket.on('send_message', ({ conversationId, message }) => {
      socket.to(`conv:${conversationId}`).emit('new_message', {
        conversationId,
        message
      })
    })

    // ---- TYPING INDICATORS ----
    socket.on('typing_start', ({ conversationId }) => {
      socket.to(`conv:${conversationId}`).emit('user_typing', {
        conversationId,
        userId,
        userName: socket.userName
      })
    })

    socket.on('typing_stop', ({ conversationId }) => {
      socket.to(`conv:${conversationId}`).emit('user_stop_typing', {
        conversationId,
        userId
      })
    })

    // ---- DISCONNECT ----
    socket.on('disconnect', () => {
      console.log(`🔌 User ${userId} disconnected (socket: ${socket.id})`)

      const sockets = onlineUsers.get(userId)
      if (sockets) {
        sockets.delete(socket.id)
        if (sockets.size === 0) {
          onlineUsers.delete(userId)
          io.emit('user_offline', { userId })
        }
      }
    })
  })

  return io
}
