import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import ChatScreen from './src/screens/ChatScreen';
import { connectSocket, disconnectSocket, getSocket } from './src/services/socket';
import { COLORS } from './src/constants/theme';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('login'); // 'login' | 'home' | 'chat'
  const [currentUser, setCurrentUser] = useState(null);
  const [activeChat, setActiveChat] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(false);

  // Real-time WhatsApp style states
  const [unreadCounts, setUnreadCounts] = useState({});
  const [lastMessages, setLastMessages] = useState({});

  useEffect(() => {
    if (currentUser) {
      const socket = connectSocket(currentUser._id, currentUser.username);

      socket.on('users:list', (list) => {
        setUsersList(list);
      });

      socket.on('user:status', ({ userId, isOnline }) => {
        setUsersList((prev) =>
          prev.map((u) => (u._id === userId ? { ...u, isOnline } : u))
        );
      });

      // Handle incoming messages to update unread counts and last message previews
      socket.on('message:receive', (newMsg) => {
        const isCurrentActive = activeChat && (newMsg.room === activeChat.id ||
          (activeChat.type === 'dm' &&
            (newMsg.senderId === activeChat.targetUserId || newMsg.receiverId === activeChat.targetUserId)));

        if (!isCurrentActive) {
          setUnreadCounts((prev) => ({
            ...prev,
            [newMsg.room]: (prev[newMsg.room] || 0) + 1,
          }));
        }

        setLastMessages((prev) => ({
          ...prev,
          [newMsg.room]: newMsg.content,
        }));
      });

      // Request users list
      socket.emit('users:get');

      return () => {
        socket.off('users:list');
        socket.off('user:status');
        socket.off('message:receive');
      };
    } else {
      disconnectSocket();
    }
  }, [currentUser, activeChat]);

  const handleLogin = (user) => {
    setCurrentUser(user);
    setCurrentScreen('home');
  };

  const handleLogout = () => {
    disconnectSocket();
    setCurrentUser(null);
    setActiveChat(null);
    setCurrentScreen('login');
  };

  const handleSelectChat = (chatTarget) => {
    setUnreadCounts((prev) => ({
      ...prev,
      [chatTarget.id]: 0,
    }));
    setActiveChat(chatTarget);
    setCurrentScreen('chat');
  };

  const handleBackToHome = () => {
    setActiveChat(null);
    setCurrentScreen('home');
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (currentScreen === 'login' || !currentUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  if (currentScreen === 'home') {
    return (
      <HomeScreen
        currentUser={currentUser}
        usersList={usersList}
        unreadCounts={unreadCounts}
        lastMessages={lastMessages}
        onSelectChat={handleSelectChat}
        onLogout={handleLogout}
      />
    );
  }

  if (currentScreen === 'chat' && activeChat) {
    return (
      <ChatScreen
        activeTarget={activeChat}
        currentUser={currentUser}
        usersList={usersList}
        onBack={handleBackToHome}
      />
    );
  }

  return null;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
