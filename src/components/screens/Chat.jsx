// =============================================================================
// CHAT SCREEN
// =============================================================================
// Shows the actual chat conversation with messages.
// Features: real-time via Socket.io, typing indicators, online status.

import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { Avatar } from '../common'
import { ArrowLeft, MessageCircle, Send } from 'lucide-react'

function Chat() {
  const navigate = useNavigate()
  const [messageText, setMessageText] = useState('')
  const messagesEndRef = useRef(null)
  const typingTimeoutRef = useRef(null)

  const {
    selectedConversation,
    sendMessage,
    onlineUsers,
    typingUsers,
    emitTypingStart,
    emitTypingStop,
    joinConversationRoom,
    leaveConversationRoom,
    user,
    showUserActionMenu
  } = useApp()

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selectedConversation?.msgs])

  // Join/leave the socket room for this conversation
  useEffect(() => {
    if (selectedConversation?.id) {
      joinConversationRoom(selectedConversation.id)
      return () => leaveConversationRoom(selectedConversation.id)
    }
  }, [selectedConversation?.id])

  if (!selectedConversation) {
    navigate('/community')
    return null
  }

  const otherPersonId = selectedConversation.personId
  const isOnline = onlineUsers.has(otherPersonId)
  const convTyping = (typingUsers[selectedConversation.id] || []).filter(t => t.userId !== user?.id)

  function handleSend() {
    if (messageText.trim()) {
      sendMessage(messageText)
      setMessageText('')
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleInputChange(e) {
    setMessageText(e.target.value)

    // Emit typing indicator
    if (selectedConversation?.id) {
      emitTypingStart(selectedConversation.id)

      // Auto-stop typing after 2 seconds of inactivity
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = setTimeout(() => {
        emitTypingStop(selectedConversation.id)
      }, 2000)
    }
  }

  return (
    <div className="screen">
      {/* Chat Header */}
      <div className="chat-header">
        <button className="back-btn" onClick={() => navigate('/community')}>
          <ArrowLeft size={20} />
        </button>
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flex: 1 }}
          onClick={() => showUserActionMenu({
            userId: otherPersonId,
            userName: selectedConversation.name,
            photoUrl: selectedConversation.photoUrl,
            avatar: selectedConversation.avatar,
            showMessage: false
          })}
        >
          <div style={{ position: 'relative' }}>
            <Avatar
              src={selectedConversation.photoUrl}
              emoji={selectedConversation.avatar}
              name={selectedConversation.name}
              size="sm"
              variant="blue"
            />
            {isOnline && <span className="online-dot online-dot-sm" />}
          </div>
          <div>
            <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
              {selectedConversation.name}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {convTyping.length > 0
                ? <span className="typing-text">typing...</span>
                : isOnline
                  ? 'Online'
                  : 'Offline'
              }
            </div>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="chat-messages" id="chatMsgs">
        {selectedConversation.msgs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-faint)' }}>
            <div style={{ marginBottom: '12px' }}><MessageCircle size={48} /></div>
            <div>No messages yet</div>
            <div style={{ fontSize: '14px' }}>Start the conversation!</div>
          </div>
        ) : (
          selectedConversation.msgs.map(msg => (
            <div
              key={msg.id}
              className={`bubble-wrap ${msg.own ? 'own' : ''}`}
            >
              <div className={`bubble ${msg.own ? 'bubble-own' : 'bubble-other'}`}>
                {!msg.own && (
                  <div className="bubble-sender">{msg.sender}</div>
                )}
                <div className="bubble-text">{msg.text}</div>
                <div className="bubble-time">{msg.time}</div>
              </div>
            </div>
          ))
        )}

        {/* Typing indicator bubble */}
        {convTyping.length > 0 && (
          <div className="bubble-wrap">
            <div className="bubble bubble-other typing-bubble">
              <div className="typing-dots">
                <span /><span /><span />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input Bar */}
      <div className="chat-input-bar">
        <input
          type="text"
          className="chat-input"
          placeholder="Type a message..."
          value={messageText}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
        />
        <button
          className="send-btn"
          onClick={handleSend}
          disabled={!messageText.trim()}
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  )
}

export default Chat
