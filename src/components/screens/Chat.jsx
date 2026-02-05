// =============================================================================
// CHAT SCREEN
// =============================================================================
// Shows the actual chat conversation with messages.
// Allows sending new messages.

import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { Avatar } from '../common'
import { ArrowLeft, MessageCircle, Send } from 'lucide-react'

function Chat() {
  const navigate = useNavigate()

  // State for the message input
  const [messageText, setMessageText] = useState('')

  // Ref to scroll to bottom of messages
  // useRef gives us a reference to a DOM element
  const messagesEndRef = useRef(null)

  // Get chat data from context
  const { selectedConversation, sendMessage } = useApp()

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selectedConversation?.msgs])

  // If no conversation selected, redirect back to messages
  if (!selectedConversation) {
    navigate('/messages')
    return null
  }

  // Handle sending a message
  function handleSend() {
    if (messageText.trim()) {
      sendMessage(messageText)
      setMessageText('')
    }
  }

  // Handle Enter key to send message
  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="screen">
      {/* Chat Header */}
      <div className="chat-header">
        <button className="back-btn" onClick={() => navigate('/messages')}>
          <ArrowLeft size={20} />
        </button>
        <Avatar
          emoji={selectedConversation.avatar}
          size="sm"
          variant="blue"
        />
        <div>
          <div style={{ fontWeight: '600', color: '#111827' }}>
            {selectedConversation.name}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>
            Active now
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="chat-messages" id="chatMsgs">
        {selectedConversation.msgs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: '#9ca3af' }}>
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
        {/* Invisible element to scroll to */}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input Bar */}
      <div className="chat-input-bar">
        <input
          type="text"
          className="chat-input"
          placeholder="Type a message..."
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
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
