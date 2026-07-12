import React, { useEffect, useRef } from 'react';
import { Check, CheckCheck } from 'lucide-react';
import { useSocket } from '../context/SocketContext';

const formatTime = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const MessageList = ({ messages, currentUser, loading, activeTarget }) => {
  const bottomRef = useRef(null);
  const { typingUsers, usersList } = useSocket();

  const activeTypers = typingUsers[activeTarget?.id] || [];

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  if (loading) {
    return (
      <div className="messages-container" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--text-secondary)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>Loading chat history...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="messages-container">
      {messages.length === 0 ? (
        <div style={{ textAlign: 'center', margin: 'auto', color: 'var(--text-muted)', maxWidth: '360px' }}>
          <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '4px' }}>
            No messages here yet
          </div>
          <div style={{ fontSize: '13px' }}>
            Be the first to say hello! Your messages will be delivered instantly via Socket.io and stored in MongoDB.
          </div>
        </div>
      ) : (
        messages.map((msg, index) => {
          const isOutgoing = currentUser && (msg.senderId === currentUser._id || msg.senderName === currentUser.username);

          return (
            <div key={msg._id || index} className={`message-wrapper ${isOutgoing ? 'outgoing' : 'incoming'}`}>
              {!isOutgoing && (
                <img
                  src={msg.senderAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                  alt={msg.senderName}
                  className="avatar"
                  style={{ width: '34px', height: '34px', alignSelf: 'flex-end', marginBottom: '2px' }}
                />
              )}
              <div className="message-bubble">
                {!isOutgoing && <div className="message-sender-name">{msg.senderName}</div>}
                <div>{msg.content}</div>
                <div className="message-footer">
                  <span>{formatTime(msg.createdAt || msg.timestamp || new Date())}</span>
                  {isOutgoing && (
                    <span className={`status-icon ${msg.status === 'read' ? 'read' : ''}`} title={`Status: ${msg.status || 'sent'}`}>
                      {msg.status === 'read' ? (
                        <CheckCheck size={15} color="#38BDF8" />
                      ) : msg.status === 'delivered' ? (
                        <CheckCheck size={15} />
                      ) : (
                        <Check size={15} />
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}
      
      {/* Messenger style typing bubbles inside chat list */}
      {activeTypers.map((typerName) => {
        const typerUser = usersList.find((u) => u.username === typerName);
        return (
          <div key={`typing_${typerName}`} className="message-wrapper incoming" style={{ marginBottom: '8px' }}>
            <img
              src={typerUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
              alt={typerName}
              className="avatar"
              style={{ width: '34px', height: '34px', alignSelf: 'flex-end', marginBottom: '2px' }}
            />
            <div className="message-bubble" style={{ display: 'flex', alignItems: 'center', height: '38px', padding: '10px 18px' }}>
              <div className="typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        );
      })}
      
      <div ref={bottomRef} />
    </div>
  );
};

export default MessageList;
