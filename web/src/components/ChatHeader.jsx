import React from 'react';
import { Hash, Users, Sparkles } from 'lucide-react';
import { useSocket } from '../context/SocketContext';

const ChatHeader = ({ activeTarget }) => {
  const { usersList, isConnected } = useSocket();

  const onlineCount = usersList.filter((u) => u.isOnline).length;

  return (
    <header className="chat-header">
      <div className="chat-header-info">
        {activeTarget?.type === 'room' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="room-icon" style={{ width: '42px', height: '42px', fontSize: '18px' }}>
              <Hash size={22} />
            </div>
            <div>
              <div className="header-title">{activeTarget.name}</div>
              <div className="header-subtitle">
                <Users size={14} style={{ opacity: 0.8 }} />
                <span>{onlineCount} active member{onlineCount !== 1 ? 's' : ''} in room</span>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="avatar-wrapper">
              <img src={activeTarget?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'} alt="Contact Avatar" className="avatar" />
              <span className={`status-indicator ${activeTarget?.isOnline ? 'online' : 'offline'}`}></span>
            </div>
            <div>
              <div className="header-title">{activeTarget?.name}</div>
              <div className="header-subtitle">
                <span className={`status-dot ${activeTarget?.isOnline ? 'online' : 'offline'}`}></span>
                <span>{activeTarget?.isOnline ? 'Active right now' : 'Currently offline'}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', background: 'rgba(255, 255, 255, 0.04)', padding: '6px 14px', borderRadius: '20px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sparkles size={14} color="var(--primary)" />
          <span>Real-Time Socket Synced</span>
        </div>
      </div>
    </header>
  );
};

export default ChatHeader;
