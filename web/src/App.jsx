import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider, useSocket } from './context/SocketContext';
import LoginModal from './components/LoginModal';
import ChatSidebar from './components/ChatSidebar';
import ChatHeader from './components/ChatHeader';
import MessageList from './components/MessageList';
import TypingIndicator from './components/TypingIndicator';
import MessageInput from './components/MessageInput';

const AppContent = () => {
  const { currentUser, loading: authLoading } = useAuth();
  const { socket, isConnected, sendMessageSocket, notifyMessageRead } = useSocket();

  const [activeTarget, setActiveTarget] = useState({
    id: 'general',
    name: '# General Chat',
    type: 'room',
    desc: 'Main community hub'
  });

  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  
  // Real-time WhatsApp style states
  const [unreadCounts, setUnreadCounts] = useState({});
  const [lastMessages, setLastMessages] = useState({});

  const BACKEND_BASE = import.meta.env.VITE_BACKEND_URL || (import.meta.env.PROD ? 'https://vedaz-real-time-chat-application.onrender.com' : 'http://localhost:5000');
  const API_URL = `${BACKEND_BASE}/api/messages`;

  // Clear unread count when opening a room/chat
  useEffect(() => {
    if (activeTarget.id) {
      setUnreadCounts((prev) => ({
        ...prev,
        [activeTarget.id]: 0
      }));
    }
  }, [activeTarget.id]);

  // Fetch previous chat history when switching room/user or refreshing app
  const fetchHistory = useCallback(async (roomId) => {
    if (!roomId) return;
    setLoadingMessages(true);
    try {
      const response = await fetch(`${API_URL}/room/${roomId}`);
      if (!response.ok) throw new Error('Failed to fetch messages');
      const data = await response.json();
      setMessages(data.messages || []);

      if (data.messages && data.messages.length > 0) {
        const lastMsg = data.messages[data.messages.length - 1];
        setLastMessages((prev) => ({
          ...prev,
          [roomId]: lastMsg.content
        }));
      }

      // Notify server we read the messages
      notifyMessageRead(roomId);
    } catch (err) {
      console.warn('⚠️ Server message history unreachable, checking local demo history:', err.message);
      // Fallback demo data if backend offline
      setMessages([
        {
          _id: 'local_1',
          senderId: 'demo_user',
          senderName: 'Alex_Rivera',
          senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          room: roomId,
          content: `Welcome to ${roomId}! Your messages sync instantly in real-time via Socket.io.`,
          status: 'read',
          createdAt: new Date()
        }
      ]);
    } finally {
      setLoadingMessages(false);
    }
  }, [notifyMessageRead]);

  useEffect(() => {
    if (currentUser) {
      fetchHistory(activeTarget.id);
    }
  }, [currentUser, activeTarget.id, fetchHistory]);

  // Listen for real-time Socket.io messages and status updates
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMsg) => {
      // Check if message belongs to currently active room or direct message
      const isCurrentActive = newMsg.room === activeTarget.id || (activeTarget.type === 'dm' && (newMsg.senderId === activeTarget.targetUserId || newMsg.receiverId === activeTarget.targetUserId));
      if (isCurrentActive) {
        setMessages((prev) => {
          // Prevent duplicates
          if (prev.some((m) => m._id === newMsg._id)) return prev;

          // If this is our own message and we have a temp message with matching content, replace it!
          if (currentUser && newMsg.senderId === currentUser._id) {
            const tempIndex = prev.findIndex((m) => m._id.startsWith('temp_') && m.content === newMsg.content);
            if (tempIndex !== -1) {
              const updated = [...prev];
              updated[tempIndex] = newMsg;
              return updated;
            }
          }

          return [...prev, newMsg];
        });

        // Send read receipt if we are looking right at this room
        notifyMessageRead(activeTarget.id);
      } else {
        // Increment unread count for this room / DM
        const targetId = newMsg.room;
        setUnreadCounts((prev) => ({
          ...prev,
          [targetId]: (prev[targetId] || 0) + 1
        }));
      }

      // Always update last message
      setLastMessages((prev) => ({
        ...prev,
        [newMsg.room]: newMsg.content
      }));
    };

    const handleStatusUpdated = ({ room, status }) => {
      if (room === activeTarget.id) {
        setMessages((prev) =>
          prev.map((m) => (m.status !== 'read' ? { ...m, status } : m))
        );
      }
    };

    socket.on('message:receive', handleNewMessage);
    socket.on('message:status_updated', handleStatusUpdated);

    return () => {
      socket.off('message:receive', handleNewMessage);
      socket.off('message:status_updated', handleStatusUpdated);
    };
  }, [socket, activeTarget, notifyMessageRead]);

  const handleSendMessage = async (content) => {
    if (!currentUser || !content.trim()) return;

    const payload = {
      senderId: currentUser._id,
      senderName: currentUser.username,
      senderAvatar: currentUser.avatar,
      receiverId: activeTarget.targetUserId || activeTarget.id,
      room: activeTarget.id,
      content,
      status: 'sent'
    };

    // Always update last message
    setLastMessages((prev) => ({
      ...prev,
      [activeTarget.id]: content
    }));

    // Optimistically add to UI immediately for instant feeling
    const tempId = `temp_${Date.now()}`;
    const optimisticMsg = { ...payload, _id: tempId, createdAt: new Date() };
    setMessages((prev) => [...prev, optimisticMsg]);

    // Send via Socket.io first
    if (isConnected) {
      sendMessageSocket(payload, (res) => {
        if (res && res.success && res.message) {
          setMessages((prev) => {
            const alreadyHasReal = prev.some((m) => m._id === res.message._id);
            if (alreadyHasReal) {
              return prev.filter((m) => m._id !== tempId);
            }
            return prev.map((m) => (m._id === tempId ? res.message : m));
          });
        }
      });
    } else {
      // Fallback via REST API if socket is disconnected
      try {
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (data.success && data.data) {
          setMessages((prev) =>
            prev.map((m) => (m._id === tempId ? data.data : m))
          );
        }
      } catch (e) {
        console.error('Failed to send message:', e);
      }
    }
  };

  if (authLoading) {
    return (
      <div className="app-container" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--primary)', fontSize: '16px', fontWeight: '600' }}>
          Initialize Vedaz Chat System...
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginModal />;
  }

  return (
    <div className="app-container">
      <ChatSidebar 
        activeTarget={activeTarget} 
        onSelectTarget={setActiveTarget} 
        unreadCounts={unreadCounts}
        lastMessages={lastMessages}
      />
      
      <main className="chat-area">
        <ChatHeader activeTarget={activeTarget} />
        <MessageList 
          messages={messages} 
          currentUser={currentUser} 
          loading={loadingMessages} 
          activeTarget={activeTarget} 
        />
        <MessageInput activeTarget={activeTarget} onSendMessage={handleSendMessage} />
      </main>
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <SocketProvider>
        <AppContent />
      </SocketProvider>
    </AuthProvider>
  );
};

export default App;
