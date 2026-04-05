import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radii } from '../../theme/colors';
import Avatar from '../../components/Avatar';
import { subscribeNotifications, markAllRead, markRead } from '../../services/notificationService';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { formatTimeAgo } from '../../utils/time';

// Mock notifications for demo
const MOCK_NOTIFICATIONS = [
  {
    id: 'n1',
    toUserId: 'me',
    fromUserId: 'u1',
    fromUsername: 'nashville_local',
    fromAvatar: null,
    type: 'like',
    postId: 'mp1',
    commentText: null,
    read: false,
    createdAt: { seconds: Date.now() / 1000 - 300 },
  },
  {
    id: 'n2',
    toUserId: 'me',
    fromUserId: 'u2',
    fromUsername: 'gulch_life',
    fromAvatar: null,
    type: 'comment',
    postId: 'mp1',
    commentText: 'Great shot! Where exactly was this?',
    read: false,
    createdAt: { seconds: Date.now() / 1000 - 900 },
  },
  {
    id: 'n3',
    toUserId: 'me',
    fromUserId: 'u3',
    fromUsername: 'music_city_fan',
    fromAvatar: null,
    type: 'reply',
    postId: 'mp3',
    commentText: 'Totally agree with you on this!',
    read: true,
    createdAt: { seconds: Date.now() / 1000 - 3600 },
  },
  {
    id: 'n4',
    toUserId: 'me',
    fromUserId: 'system',
    fromUsername: '615Nav',
    fromAvatar: null,
    type: 'system',
    postId: null,
    commentText: 'Flash Flood Watch issued for Davidson County. Stay safe!',
    read: true,
    createdAt: { seconds: Date.now() / 1000 - 7200 },
  },
  {
    id: 'n5',
    toUserId: 'me',
    fromUserId: 'u4',
    fromUsername: 'hot_chicken_fan',
    fromAvatar: null,
    type: 'like',
    postId: 'mp2',
    commentText: null,
    read: true,
    createdAt: { seconds: Date.now() / 1000 - 14400 },
  },
  {
    id: 'n6',
    toUserId: 'me',
    fromUserId: 'u5',
    fromUsername: 'east_side_local',
    fromAvatar: null,
    type: 'comment',
    postId: 'mp2',
    commentText: 'Thanks for the heads up on the traffic!',
    read: true,
    createdAt: { seconds: Date.now() / 1000 - 86400 },
  },
];

const TYPE_CONFIG = {
  like: { icon: 'heart', color: Colors.primaryRed, label: 'liked your post' },
  comment: { icon: 'chatbubble', color: Colors.success, label: 'commented on your post' },
  reply: { icon: 'return-down-forward', color: '#3498DB', label: 'replied to your comment' },
  system: { icon: 'megaphone', color: Colors.warning, label: '' },
};

function NotificationItem({ notif, onPress }) {
  const config = TYPE_CONFIG[notif.type] || TYPE_CONFIG.system;
  const isSystem = notif.type === 'system';

  return (
    <TouchableOpacity
      style={[styles.item, !notif.read && styles.itemUnread]}
      onPress={() => onPress(notif)}
      activeOpacity={0.75}
    >
      {/* Unread indicator */}
      {!notif.read && <View style={styles.unreadDot} />}

      {/* Icon / Avatar */}
      <View style={styles.iconWrap}>
        {isSystem ? (
          <View style={[styles.iconCircle, { backgroundColor: Colors.warning + '25' }]}>
            <Ionicons name="megaphone" size={18} color={Colors.warning} />
          </View>
        ) : (
          <View>
            <Avatar uri={notif.fromAvatar} username={notif.fromUsername} size={42} />
            <View style={[styles.typeDot, { backgroundColor: config.color }]}>
              <Ionicons name={config.icon} size={9} color="#fff" />
            </View>
          </View>
        )}
      </View>

      {/* Text */}
      <View style={styles.textWrap}>
        {isSystem ? (
          <Text style={styles.systemText}>{notif.commentText}</Text>
        ) : (
          <>
            <Text style={styles.notifText}>
              <Text style={styles.username}>{notif.fromUsername}</Text>
              {' '}{config.label}
            </Text>
            {notif.commentText && (
              <Text style={styles.excerpt} numberOfLines={2}>"{notif.commentText}"</Text>
            )}
          </>
        )}
        <Text style={styles.time}>{formatTimeAgo(notif.createdAt)}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function NotificationsScreen({ navigation }) {
  const { user } = useAuth();
  const { setUnreadCount } = useApp();
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [loading, setLoading] = useState(false);

  const unread = notifications.filter(n => !n.read).length;

  useEffect(() => {
    setUnreadCount(unread);
  }, [unread]);

  useEffect(() => {
    let unsub;
    if (user) {
      try {
        unsub = subscribeNotifications(user.uid, incoming => {
          if (incoming.length > 0) setNotifications(incoming);
        });
      } catch {}
    }
    return () => unsub?.();
  }, [user]);

  async function handleMarkAllRead() {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    try {
      if (user) await markAllRead(user.uid);
    } catch {}
  }

  function handleNotifPress(notif) {
    // Mark as read
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
    try {
      markRead(notif.id);
    } catch {}
    // Navigate to related content
    if (notif.postId) {
      // Would navigate to the post
    }
  }

  const todayNotifs = notifications.filter(n => {
    const t = n.createdAt?.seconds ? n.createdAt.seconds * 1000 : Date.now();
    return Date.now() - t < 86400000;
  });
  const olderNotifs = notifications.filter(n => {
    const t = n.createdAt?.seconds ? n.createdAt.seconds * 1000 : Date.now();
    return Date.now() - t >= 86400000;
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unread > 0 && (
          <TouchableOpacity onPress={handleMarkAllRead} style={styles.markAllBtn}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={[]}
        ListHeaderComponent={
          <>
            {todayNotifs.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>Today</Text>
                {todayNotifs.map(n => (
                  <NotificationItem key={n.id} notif={n} onPress={handleNotifPress} />
                ))}
              </>
            )}
            {olderNotifs.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>Earlier</Text>
                {olderNotifs.map(n => (
                  <NotificationItem key={n.id} notif={n} onPress={handleNotifPress} />
                ))}
              </>
            )}
            {notifications.length === 0 && (
              <View style={styles.empty}>
                <Ionicons name="notifications-off-outline" size={52} color={Colors.textDim} />
                <Text style={styles.emptyTitle}>No notifications yet</Text>
                <Text style={styles.emptySub}>Activity on your posts will appear here</Text>
              </View>
            )}
          </>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyExtractor={() => 'header'}
        renderItem={() => null}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderDim,
  },
  headerTitle: {
    color: Colors.text,
    fontSize: Typography.fontSizes.xxl,
    fontWeight: '800',
  },
  markAllBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  markAllText: {
    color: Colors.primaryRed,
    fontSize: Typography.fontSizes.sm,
    fontWeight: '600',
  },
  listContent: { paddingBottom: 100 },
  sectionLabel: {
    color: Colors.textDim,
    fontSize: Typography.fontSizes.xs,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    position: 'relative',
  },
  itemUnread: {
    backgroundColor: Colors.surfaceLight,
  },
  unreadDot: {
    position: 'absolute',
    left: 6,
    top: '50%',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primaryRed,
    marginTop: -3,
  },
  iconWrap: {
    marginRight: Spacing.md,
    position: 'relative',
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.background,
  },
  textWrap: { flex: 1 },
  notifText: {
    color: Colors.text,
    fontSize: Typography.fontSizes.sm,
    lineHeight: 20,
    marginBottom: 2,
  },
  username: { fontWeight: '700' },
  systemText: {
    color: Colors.text,
    fontSize: Typography.fontSizes.sm,
    lineHeight: 20,
    marginBottom: 2,
    fontWeight: '500',
  },
  excerpt: {
    color: Colors.textDim,
    fontSize: Typography.fontSizes.xs,
    lineHeight: 17,
    marginBottom: 4,
  },
  time: {
    color: Colors.textDim,
    fontSize: Typography.fontSizes.xs,
  },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyTitle: { color: Colors.text, fontSize: Typography.fontSizes.lg, fontWeight: '600', marginTop: Spacing.md },
  emptySub: { color: Colors.textDim, fontSize: Typography.fontSizes.sm, marginTop: Spacing.xs },
});
