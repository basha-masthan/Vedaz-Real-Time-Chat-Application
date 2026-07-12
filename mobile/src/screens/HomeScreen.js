import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  ScrollView,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { COLORS } from '../constants/theme';

const CHANNELS = [
  { id: 'general', name: '# General Chat', desc: 'Main community room' },
  { id: 'tech', name: '# Tech & Architecture', desc: 'React, Node, Sockets' },
  { id: 'random', name: '# Random & Fun', desc: 'Everything else' },
];

const HomeScreen = ({ currentUser, usersList, unreadCounts = {}, lastMessages = {}, onSelectChat, onLogout }) => {
  const contacts = usersList.filter((u) => u._id !== currentUser?._id);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      
      {/* Top Bar */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Image source={{ uri: currentUser?.avatar }} style={styles.avatar} />
          <View>
            <Text style={styles.userName}>{currentUser?.username}</Text>
            <View style={styles.statusRow}>
              <View style={[styles.dot, { backgroundColor: COLORS.online }]} />
              <Text style={styles.statusText}>Online & Ready</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Channels Section */}
        <Text style={styles.sectionTitle}>CHANNELS & ROOMS</Text>
        <View style={styles.sectionCard}>
          {CHANNELS.map((ch, idx) => {
            const lastMsg = lastMessages[ch.id] || ch.desc;
            const unreadCount = unreadCounts[ch.id] || 0;
            return (
              <TouchableOpacity
                key={ch.id}
                style={[
                  styles.listItem,
                  idx < CHANNELS.length - 1 && styles.borderBottom
                ]}
                onPress={() => onSelectChat({ id: ch.id, name: ch.name, type: 'room' })}
                activeOpacity={0.7}
              >
                <View style={styles.iconBox}>
                  <Text style={styles.iconText}>#</Text>
                </View>
                <View style={styles.itemTextCol}>
                  <Text style={[styles.itemTitle, unreadCount > 0 && { fontWeight: 'bold', color: '#FFF' }]}>{ch.name}</Text>
                  <Text style={[styles.itemSubtitle, unreadCount > 0 && { color: '#FFF', fontWeight: '600' }]} numberOfLines={1}>{lastMsg}</Text>
                </View>
                {unreadCount > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Direct Messages Section */}
        <Text style={[styles.sectionTitle, { marginTop: 28 }]}>DIRECT MESSAGES</Text>
        <View style={styles.sectionCard}>
          {contacts.length === 0 ? (
            <View style={{ padding: 16, alignItems: 'center' }}>
              <Text style={{ color: COLORS.textMuted, fontSize: 13, fontStyle: 'italic' }}>
                No active contacts right now. Switch rooms to chat!
              </Text>
            </View>
          ) : (
            contacts.map((user, idx) => {
              const dmRoomId = [currentUser?._id, user._id].sort().join('_');
              const lastMsg = lastMessages[dmRoomId] || (user.isOnline ? 'Active now' : 'Offline');
              const unreadCount = unreadCounts[dmRoomId] || 0;
              return (
                <TouchableOpacity
                  key={user._id}
                  style={[
                    styles.listItem,
                    idx < contacts.length - 1 && styles.borderBottom
                  ]}
                  onPress={() =>
                    onSelectChat({
                      id: dmRoomId,
                      name: user.username,
                      type: 'dm',
                      targetUserId: user._id,
                      avatar: user.avatar,
                      isOnline: user.isOnline,
                    })
                  }
                  activeOpacity={0.7}
                >
                  <View style={{ position: 'relative' }}>
                    <Image source={{ uri: user.avatar }} style={styles.contactAvatar} />
                    <View
                      style={[
                        styles.badge,
                        { backgroundColor: user.isOnline ? COLORS.online : COLORS.offline }
                      ]}
                    />
                  </View>
                  <View style={styles.itemTextCol}>
                    <Text style={[styles.itemTitle, unreadCount > 0 && { fontWeight: 'bold', color: '#FFF' }]}>{user.username}</Text>
                    <Text
                      style={[
                        styles.itemSubtitle,
                        unreadCount > 0 ? { color: '#FFF', fontWeight: '600' } : (user.isOnline && { color: COLORS.online })
                      ]}
                      numberOfLines={1}
                    >
                      {lastMsg}
                    </Text>
                  </View>
                  {unreadCount > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  logoutBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  logoutText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  scroll: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.textMuted,
    marginBottom: 10,
    marginLeft: 4,
    letterSpacing: 1,
  },
  sectionCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  contactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  badge: {
    position: 'absolute',
    bottom: 0,
    right: 10,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.card,
  },
  itemTextCol: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  itemSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  unreadBadge: {
    backgroundColor: COLORS.primary,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  unreadBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
});

export default HomeScreen;
