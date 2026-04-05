import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radii } from '../../theme/colors';
import Avatar from '../../components/Avatar';
import { useAuth } from '../../context/AuthContext';
import { fetchUserPosts } from '../../services/postService';
import { formatTimeAgo } from '../../utils/time';

const { width: SCREEN_W } = Dimensions.get('window');
const GRID_SIZE = (SCREEN_W - Spacing.lg * 2 - Spacing.sm * 2) / 3;

const TABS = ['Posts', 'Saved', 'Activity'];

// Mock data for demo
const MOCK_ACTIVITY = [
  { id: 'a1', type: 'post', text: 'You posted in East Nashville', time: { seconds: Date.now()/1000 - 1800 } },
  { id: 'a2', type: 'visited', text: 'Visited Barista Parlor', time: { seconds: Date.now()/1000 - 7200 } },
  { id: 'a3', type: 'like', text: 'Liked a post in The Gulch', time: { seconds: Date.now()/1000 - 14400 } },
  { id: 'a4', type: 'comment', text: 'Commented on a post in Midtown', time: { seconds: Date.now()/1000 - 86400 } },
];

const ACTIVITY_ICONS = {
  post: { name: 'create-outline', color: Colors.primaryRed },
  visited: { name: 'location-outline', color: Colors.success },
  like: { name: 'heart-outline', color: Colors.primaryRed },
  comment: { name: 'chatbubble-outline', color: '#3498DB' },
};

export default function ProfileScreen({ navigation }) {
  const { user, profile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('Posts');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) loadPosts();
  }, [user]);

  async function loadPosts() {
    setLoading(true);
    try {
      const p = await fetchUserPosts(user.uid);
      setPosts(p);
    } catch {
      // Use mock
    }
    setLoading(false);
  }

  function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  }

  const stats = [
    { label: 'Posts', value: posts.length || 0 },
    { label: 'Visited', value: profile?.visitedPlaces?.length || 0 },
    { label: 'Saved', value: profile?.savedPosts?.length || 0 },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => navigation.navigate('EditProfile')}
            >
              <Ionicons name="settings-outline" size={22} color={Colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile info */}
        <View style={styles.profileSection}>
          <TouchableOpacity onPress={() => navigation.navigate('EditProfile')}>
            <Avatar uri={profile?.avatarUrl} username={profile?.username || user?.email} size={80} />
            <View style={styles.editAvatarBadge}>
              <Ionicons name="camera" size={12} color={Colors.cream} />
            </View>
          </TouchableOpacity>

          <View style={styles.profileInfo}>
            <Text style={styles.username}>{profile?.username || user?.displayName || 'User'}</Text>
            {profile?.bio ? (
              <Text style={styles.bio}>{profile.bio}</Text>
            ) : (
              <TouchableOpacity onPress={() => navigation.navigate('EditProfile')}>
                <Text style={styles.addBio}>+ Add bio</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {stats.map((s, i) => (
            <View key={s.label} style={[styles.statItem, i < stats.length - 1 && styles.statDivider]}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Edit profile button */}
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <Text style={styles.editBtnText}>Edit Profile</Text>
        </TouchableOpacity>

        {/* Content tabs */}
        <View style={styles.tabs}>
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab content */}
        {activeTab === 'Posts' && (
          <View style={styles.gridContainer}>
            {posts.length === 0 ? (
              <View style={styles.emptyTab}>
                <Ionicons name="images-outline" size={44} color={Colors.textDim} />
                <Text style={styles.emptyTitle}>No posts yet</Text>
                <Text style={styles.emptySub}>Share what's happening in Nashville</Text>
              </View>
            ) : (
              <View style={styles.grid}>
                {posts.map(post => (
                  <TouchableOpacity key={post.id} style={styles.gridItem}>
                    {post.mediaUrl ? (
                      <Image source={{ uri: post.mediaUrl }} style={styles.gridImage} />
                    ) : (
                      <View style={[styles.gridImage, styles.gridTextPost]}>
                        <Text style={styles.gridTextContent} numberOfLines={3}>{post.caption}</Text>
                      </View>
                    )}
                    {post.mediaType === 'video' && (
                      <View style={styles.videoOverlay}>
                        <Ionicons name="play" size={16} color={Colors.white} />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {activeTab === 'Saved' && (
          <View style={styles.emptyTab}>
            <Ionicons name="bookmark-outline" size={44} color={Colors.textDim} />
            <Text style={styles.emptyTitle}>No saved posts</Text>
            <Text style={styles.emptySub}>Posts you save will appear here</Text>
          </View>
        )}

        {activeTab === 'Activity' && (
          <View style={styles.activityList}>
            {MOCK_ACTIVITY.map(item => {
              const iconConf = ACTIVITY_ICONS[item.type] || ACTIVITY_ICONS.post;
              return (
                <View key={item.id} style={styles.activityItem}>
                  <View style={[styles.activityIcon, { backgroundColor: iconConf.color + '20' }]}>
                    <Ionicons name={iconConf.name} size={16} color={iconConf.color} />
                  </View>
                  <View style={styles.activityText}>
                    <Text style={styles.activityTitle}>{item.text}</Text>
                    <Text style={styles.activityTime}>{formatTimeAgo(item.time)}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Sign out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={18} color={Colors.error} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: 100 },
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
  headerActions: { flexDirection: 'row', gap: Spacing.sm },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileSection: {
    alignItems: 'center',
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    position: 'relative',
  },
  editAvatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primaryRed,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.background,
  },
  profileInfo: { alignItems: 'center', marginTop: Spacing.md },
  username: {
    color: Colors.text,
    fontSize: Typography.fontSizes.xl,
    fontWeight: '700',
    marginBottom: 4,
  },
  bio: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSizes.sm,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: Spacing.xxxl,
  },
  addBio: { color: Colors.primaryRed, fontSize: Typography.fontSizes.sm, fontWeight: '500' },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    paddingVertical: Spacing.lg,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statDivider: {
    borderRightWidth: 1,
    borderRightColor: Colors.borderDim,
  },
  statValue: {
    color: Colors.text,
    fontSize: Typography.fontSizes.xl,
    fontWeight: '800',
  },
  statLabel: {
    color: Colors.textDim,
    fontSize: Typography.fontSizes.xs,
    marginTop: 2,
  },
  editBtn: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    paddingVertical: 10,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  editBtnText: { color: Colors.text, fontSize: Typography.fontSizes.sm, fontWeight: '600' },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderDim,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: Colors.primaryRed },
  tabText: { color: Colors.textDim, fontSize: Typography.fontSizes.sm, fontWeight: '600' },
  tabTextActive: { color: Colors.primaryRed },
  gridContainer: { marginTop: Spacing.md },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  gridItem: {
    width: GRID_SIZE,
    height: GRID_SIZE,
    borderRadius: Radii.sm,
    overflow: 'hidden',
    position: 'relative',
  },
  gridImage: { width: '100%', height: '100%' },
  gridTextPost: {
    backgroundColor: Colors.surface,
    padding: Spacing.sm,
    justifyContent: 'center',
  },
  gridTextContent: {
    color: Colors.text,
    fontSize: Typography.fontSizes.xs,
    lineHeight: 15,
  },
  videoOverlay: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTab: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: Spacing.xxxl,
  },
  emptyTitle: { color: Colors.text, fontSize: Typography.fontSizes.md, fontWeight: '600', marginTop: Spacing.md },
  emptySub: { color: Colors.textDim, fontSize: Typography.fontSizes.sm, textAlign: 'center', marginTop: Spacing.xs },
  activityList: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderDim,
    gap: Spacing.md,
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityText: { flex: 1 },
  activityTitle: { color: Colors.text, fontSize: Typography.fontSizes.sm },
  activityTime: { color: Colors.textDim, fontSize: Typography.fontSizes.xs, marginTop: 2 },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xxxl,
    paddingVertical: 13,
    borderRadius: Radii.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.error + '40',
  },
  signOutText: { color: Colors.error, fontSize: Typography.fontSizes.md, fontWeight: '600' },
});
