import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, Sparkles, User, ArrowRight } from 'lucide-react';

const AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
];

const LoginModal = () => {
  const { login, loading } = useAuth();
  const [username, setUsername] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || username.trim() === '') {
      setErrorMsg('Please enter a username to continue');
      return;
    }
    setErrorMsg('');
    await login(username.trim(), selectedAvatar);
  };

  return (
    <div className="modal-overlay">
      <div className="login-card glass-panel">
        <div className="login-icon-box">
          <MessageSquare size={32} />
        </div>

        <h2 className="login-title">Welcome to Vedaz Chat</h2>
        <p className="login-desc">
          Experience instant real-time messaging with ultra-low latency Socket.io and glassmorphic aesthetics.
        </p>

        <form onSubmit={handleSubmit} className="login-form">
          <div>
            <label className="input-label">Choose your Avatar</label>
            <div className="avatar-grid">
              {AVATARS.map((url, idx) => (
                <img
                  key={idx}
                  src={url}
                  alt={`Avatar ${idx}`}
                  className={`avatar-choice ${selectedAvatar === url ? 'selected' : ''}`}
                  onClick={() => setSelectedAvatar(url)}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="input-label" htmlFor="username">Username</label>
            <div style={{ position: 'relative', marginTop: '6px' }}>
              <input
                id="username"
                type="text"
                className="login-input"
                placeholder="e.g. Alex_Rivera"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
              />
            </div>
            {errorMsg && <p style={{ color: '#F43F5E', fontSize: '12px', marginTop: '6px' }}>{errorMsg}</p>}
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Joining Room...' : (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                Join Real-Time Chat <ArrowRight size={18} />
              </span>
            )}
          </button>
        </form>

        <div style={{ marginTop: '20px', fontSize: '12px', color: 'var(--text-muted)' }}>
          <Sparkles size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
          No password required — instant dummy authentication for instant evaluation!
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
