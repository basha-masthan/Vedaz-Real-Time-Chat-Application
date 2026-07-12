import React, { useState, useRef } from 'react';
import { Send, Smile } from 'lucide-react';
import { useSocket } from '../context/SocketContext';

const QUICK_EMOJIS = ['🚀', '🔥', '❤️', '👍', '🎉', '✨', '😊', '💡', '💻', '👏'];

const MessageInput = ({ activeTarget, onSendMessage }) => {
  const [content, setContent] = useState('');
  const [showEmojis, setShowEmojis] = useState(false);
  const { sendTypingStart, sendTypingStop } = useSocket();
  const typingTimerRef = useRef(null);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setContent(val);

    const roomId = activeTarget?.id || 'general';
    sendTypingStart(roomId);

    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
    }

    typingTimerRef.current = setTimeout(() => {
      sendTypingStop(roomId);
    }, 1500);
  };

  const handleSend = (e) => {
    if (e) e.preventDefault();
    if (!content.trim()) return;

    const roomId = activeTarget?.id || 'general';
    sendTypingStop(roomId);

    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
    }

    onSendMessage(content.trim());
    setContent('');
    setShowEmojis(false);
  };

  const handleEmojiClick = (emoji) => {
    const newVal = content + emoji;
    setContent(newVal);
    const roomId = activeTarget?.id || 'general';
    sendTypingStart(roomId);
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Emoji Picker Popover */}
      {showEmojis && (
        <div
          style={{
            position: 'absolute',
            bottom: '76px',
            left: '24px',
            background: 'var(--bg-sidebar)',
            border: '1px solid var(--border-glow)',
            borderRadius: '16px',
            padding: '12px',
            display: 'flex',
            gap: '8px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            zIndex: 50,
          }}
        >
          {QUICK_EMOJIS.map((em, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleEmojiClick(em)}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: 'none',
                fontSize: '20px',
                padding: '6px',
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'transform 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.2)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              {em}
            </button>
          ))}
        </div>
      )}

      <div className="chat-input-container">
        <button
          type="button"
          onClick={() => setShowEmojis(!showEmojis)}
          title="Quick Emojis"
          style={{
            background: showEmojis ? 'var(--primary-glow)' : 'transparent',
            border: 'none',
            color: showEmojis ? 'var(--primary)' : 'var(--text-secondary)',
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <Smile size={22} />
        </button>

        <form onSubmit={handleSend} className="chat-input-form">
          <input
            type="text"
            className="chat-input"
            placeholder={`Message ${activeTarget?.type === 'room' ? activeTarget.name : activeTarget?.name || 'room'}...`}
            value={content}
            onChange={handleInputChange}
          />
          <button type="submit" className="send-button" disabled={!content.trim()} title="Send Message">
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default MessageInput;
