import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  Image
} from 'react-native';
import { COLORS } from '../constants/theme';
import { getSocket, SOCKET_URL } from '../services/socket';

const formatTime = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const ChatScreen = ({ activeTarget, currentUser, usersList = [], onBack }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [typingText, setTypingText] = useState('');
  const [loading, setLoading] = useState(true);

  const flatListRef = useRef(null);
  const typingTimerRef = useRef(null);
  const socket = getSocket();

  // Fetch initial message history
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch(`${SOCKET_URL}/api/messages/room/${activeTarget.id}`);
        if (response.ok) {
          const data = await response.json();
          setMessages(data.messages || []);
        }
      } catch (err) {
        console.warn('⚠️ Server unreachable from emulator/device, using local demo history.');
        setMessages([
          {
            _id: 'mobile_msg_1',
            senderId: 'demo_bot',
            senderName: 'System Bot',
            content: `Welcome to ${activeTarget.name}! Real-time instant messaging is active via Socket.io.`,
            status: 'read',
            createdAt: new Date(),
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    if (socket && socket.connected) {
      socket.emit('message:read', { room: activeTarget.id, readByUserId: currentUser?._id });
    }
  }, [activeTarget.id, currentUser?._id, socket]);

  // Listen for Socket real-time events
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMsg) => {
      if (newMsg.room === activeTarget.id || (activeTarget.type === 'dm' && (newMsg.senderId === activeTarget.targetUserId || newMsg.receiverId === activeTarget.targetUserId))) {
        setMessages((prev) => {
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
        socket.emit('message:read', { room: activeTarget.id, readByUserId: currentUser?._id });
      }
    };

    const handleStatusUpdated = ({ room, status }) => {
      if (room === activeTarget.id) {
        setMessages((prev) => prev.map((m) => (m.status !== 'read' ? { ...m, status } : m)));
      }
    };

    const handleTypingStart = ({ room, senderName, senderId }) => {
      if (room === activeTarget.id && senderId !== currentUser?._id) {
        setTypingText(`${senderName} is typing...`);
      }
    };

    const handleTypingStop = ({ room, senderId }) => {
      if (room === activeTarget.id && senderId !== currentUser?._id) {
        setTypingText('');
      }
    };

    socket.on('message:receive', handleNewMessage);
    socket.on('message:status_updated', handleStatusUpdated);
    socket.on('typing:start', handleTypingStart);
    socket.on('typing:stop', handleTypingStop);

    return () => {
      socket.off('message:receive', handleNewMessage);
      socket.off('message:status_updated', handleStatusUpdated);
      socket.off('typing:start', handleTypingStart);
      socket.off('typing:stop', handleTypingStop);
    };
  }, [socket, activeTarget, currentUser?._id]);

  const handleInputChange = (text) => {
    setInputText(text);
    if (!socket || !socket.connected) return;

    socket.emit('typing:start', {
      room: activeTarget.id,
      senderId: currentUser?._id,
      senderName: currentUser?.username,
    });

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      socket.emit('typing:stop', { room: activeTarget.id, senderId: currentUser?._id });
    }, 1500);
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const content = inputText.trim();
    setInputText('');

    if (socket && socket.connected && typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
      socket.emit('typing:stop', { room: activeTarget.id, senderId: currentUser?._id });
    }

    const payload = {
      senderId: currentUser?._id,
      senderName: currentUser?.username,
      senderAvatar: currentUser?.avatar,
      receiverId: activeTarget.targetUserId || activeTarget.id,
      room: activeTarget.id,
      content,
      status: 'sent',
    };

    const tempId = `temp_${Date.now()}`;
    const optimisticMsg = { ...payload, _id: tempId, createdAt: new Date() };
    setMessages((prev) => [...prev, optimisticMsg]);

    if (socket && socket.connected) {
      socket.emit('message:send', payload, (res) => {
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
      try {
        const response = await fetch(`${SOCKET_URL}/api/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await response.json();
        if (data.success && data.data) {
          setMessages((prev) => prev.map((m) => (m._id === tempId ? data.data : m)));
        }
      } catch (err) {
        console.error('Failed to send message via REST:', err);
      }
    }
  };

  const renderMessageItem = ({ item }) => {
    const isOutgoing = item.senderId === currentUser?._id || item.senderName === currentUser?.username;

    return (
      <View style={[styles.messageRow, isOutgoing ? styles.rowOutgoing : styles.rowIncoming]}>
        <View style={[styles.bubble, isOutgoing ? styles.bubbleOutgoing : styles.bubbleIncoming]}>
          {!isOutgoing ? <Text style={styles.senderName}>{item.senderName}</Text> : null}
          <Text style={[styles.messageText, isOutgoing ? { color: '#FFF' } : { color: COLORS.text }]}>
            {item.content}
          </Text>
          <View style={styles.bubbleFooter}>
            <Text style={[styles.timeText, isOutgoing ? { color: 'rgba(255,255,255,0.75)' } : { color: COLORS.textMuted }]}>
              {formatTime(item.createdAt || item.timestamp || new Date())}
            </Text>
            {isOutgoing ? (
              <Text style={[styles.tickText, item.status === 'read' && { color: COLORS.read }]}>
                {item.status === 'read' ? '✓✓' : item.status === 'delivered' ? '✓✓' : '✓'}
              </Text>
            ) : null}
          </View>
        </View>
      </View>
    );
  };

  const renderListFooter = () => {
    if (!typingText) return null;

    const senderName = typingText.split(' ')[0];
    const typingUser = usersList.find((u) => u.username === senderName);
    
    return (
      <View style={[styles.messageRow, styles.rowIncoming, { marginBottom: 12, alignItems: 'flex-end' }]}>
        <Image 
          source={{ uri: typingUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' }} 
          style={{ width: 30, height: 30, borderRadius: 15, marginRight: 8, marginBottom: 2 }} 
        />
        <View style={[styles.bubble, styles.bubbleIncoming, { paddingVertical: 12, paddingHorizontal: 16, minWidth: 60, height: 38, justifyContent: 'center' }]}>
          <Text style={{ color: COLORS.textMuted, fontSize: 13, fontWeight: 'bold' }}>typing...</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.card} />
      
      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{activeTarget.name}</Text>
          <View style={styles.headerSubtitleRow}>
            <View style={[styles.dot, { backgroundColor: activeTarget.isOnline === false ? COLORS.offline : COLORS.online }]} />
            <Text style={styles.headerSubtitle}>
              {activeTarget.type === 'room' ? 'Active Channel' : activeTarget.isOnline ? 'Active right now' : 'Currently offline'}
            </Text>
          </View>
        </View>
        <View style={{ width: 60 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item, index) => item._id || index.toString()}
          renderItem={renderMessageItem}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListFooterComponent={renderListFooter}
        />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder={`Message ${activeTarget.name}...`}
            placeholderTextColor={COLORS.textMuted}
            value={inputText}
            onChangeText={handleInputChange}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendBtn, !inputText.trim() && { opacity: 0.5 }]}
            onPress={handleSend}
            disabled={!inputText.trim()}
          >
            <Text style={styles.sendText}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  backText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  headerSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  headerSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  messageList: {
    padding: 16,
    paddingBottom: 24,
  },
  messageRow: {
    marginVertical: 4,
    flexDirection: 'row',
  },
  rowOutgoing: {
    justifyContent: 'flex-end',
  },
  rowIncoming: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  bubbleOutgoing: {
    backgroundColor: COLORS.bubbleOutgoing,
    borderBottomRightRadius: 4,
  },
  bubbleIncoming: {
    backgroundColor: COLORS.bubbleIncoming,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  senderName: {
    fontSize: 11.5,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 21,
  },
  bubbleFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  timeText: {
    fontSize: 11,
    marginRight: 4,
  },
  tickText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#E2E8F0',
  },
  typingStrip: {
    paddingHorizontal: 20,
    paddingVertical: 6,
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
  },
  typingText: {
    fontSize: 12,
    color: COLORS.primary,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.inputBg,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    maxHeight: 100,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  sendText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ChatScreen;
