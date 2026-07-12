import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Hash, MessageCircle, LogOut, Users, Sparkles } from 'lucide-react';

const ROOMS = [
  { id: 'general', name: 'general', label: '# General Chat', desc: 'Main community hub' },
  { id: 'tech', name: 'tech', label: '# Tech & Architecture', desc: 'React, Node, Sockets' },
  { id: 'random', name: 'random', label: '# Random & Fun', desc: 'Everything else' },
];

const ChatSidebar = ({ activeTarget, onSelectTarget, unreadCounts = {}, lastMessages = {} }) => {
  const { currentUser, logout } = useAuth();
  const { usersList, isConnected } = useSocket();

  // Filter out current user from contacts list
  const contacts = usersList.filter((u) => u._id !== (currentUser ? currentUser._id : null));

  return (
    <aside className="sidebar">
      {/* Sidebar Top Logo */}
      <div className="sidebar-header">
        <div className="logo-container">
          <div className="logo-icon">V</div>
          <span className="logo-text">Vedaz Chat</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: isConnected ? 'var(--status-online)' : 'var(--status-offline)' }}>
          <span className={`status-dot ${isConnected ? 'online' : 'offline'}`}></span>
          {isConnected ? 'Live' : 'Connecting...'}
        </div>
      </div>

      {/* Current User Strip */}
      {currentUser && (
        <div className="current-user-strip">
          <div className="user-badge">
            <div className="avatar-wrapper">
              <img src={currentUser.avatar} alt="My Avatar" className="avatar" />
              <span className="status-indicator online"></span>
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
                {currentUser.username}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--status-online)' }}>● Online</div>
            </div>
          </div>
          <button
            onClick={logout}
            title="Log out"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <LogOut size={18} />
          </button>
        </div>
      )}

      {/* Navigation Sections */}
      <div className="sidebar-sections">
        {/* Rooms Section */}
        <div>
          <div className="section-title">CHANNELS & ROOMS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {ROOMS.map((room) => {
              const isActive = activeTarget?.type === 'room' && activeTarget?.id === room.id;
              const lastMsgText = lastMessages[room.id] || room.desc;
              const unreadCount = unreadCounts[room.id] || 0;

              return (
                <div
                  key={room.id}
                  className={`list-item ${isActive ? 'active' : ''}`}
                  onClick={() => onSelectTarget({ id: room.id, name: room.label, type: 'room', desc: room.desc })}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                    <div className="room-icon">
                      <Hash size={18} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: unreadCount > 0 ? '700' : '600', fontSize: '14px', color: isActive ? 'var(--text-primary)' : (unreadCount > 0 ? 'var(--text-primary)' : 'var(--text-secondary)') }}>
                        {room.label}
                      </div>
                      <div style={{ fontSize: '11.5px', color: unreadCount > 0 ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: unreadCount > 0 ? '600' : '400', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {lastMsgText}
                      </div>
                    </div>
                  </div>
                  {unreadCount > 0 && (
                    <div style={{
                      background: 'var(--primary)',
                      color: 'white',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      minWidth: '20px',
                      height: '20px',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 6px',
                      boxShadow: '0 2px 8px var(--primary-glow)',
                      marginLeft: '8px'
                    }}>
                      {unreadCount}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Direct Messages Section */}
        <div>
          <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingRight: '8px' }}>
            <span>DIRECT MESSAGES</span>
            <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: '10px' }}>
              {contacts.filter(c => c.isOnline).length} Online
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {contacts.length === 0 ? (
              <div style={{ padding: '12px', fontSize: '12.5px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                No other users found yet. Invite colleagues or open another tab!
              </div>
            ) : (
              contacts.map((user) => {
                const dmRoomId = [currentUser?._id, user._id].sort().join('_');
                const isActive = activeTarget?.type === 'dm' && activeTarget?.id === dmRoomId;
                const lastMsgText = lastMessages[dmRoomId] || (user.isOnline ? 'Active now' : 'Offline');
                const unreadCount = unreadCounts[dmRoomId] || 0;

                return (
                  <div
                    key={user._id}
                    className={`list-item ${isActive ? 'active' : ''}`}
                    onClick={() =>
                      onSelectTarget({
                        id: dmRoomId,
                        name: user.username,
                        type: 'dm',
                        targetUserId: user._id,
                        avatar: user.avatar,
                        isOnline: user.isOnline,
                      })
                    }
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                      <div className="avatar-wrapper">
                        <img src={user.avatar} alt={user.username} className="avatar" style={{ width: '36px', height: '36px' }} />
                        <span className={`status-indicator ${user.isOnline ? 'online' : 'offline'}`}></span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: unreadCount > 0 ? '700' : '600', fontSize: '14px', color: isActive ? 'var(--text-primary)' : (unreadCount > 0 ? 'var(--text-primary)' : 'var(--text-secondary)') }}>
                          {user.username}
                        </div>
                        <div style={{ fontSize: '11.5px', color: unreadCount > 0 ? 'var(--text-primary)' : (user.isOnline ? 'var(--status-online)' : 'var(--text-muted)'), fontWeight: unreadCount > 0 ? '600' : '400', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {lastMsgText}
                        </div>
                      </div>
                    </div>
                    {unreadCount > 0 && (
                      <div style={{
                        background: 'var(--primary)',
                        color: 'white',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        minWidth: '20px',
                        height: '20px',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0 6px',
                        boxShadow: '0 2px 8px var(--primary-glow)',
                        marginLeft: '8px'
                      }}>
                        {unreadCount}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default ChatSidebar;
