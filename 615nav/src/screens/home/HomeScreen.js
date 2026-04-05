import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Typography, Spacing } from '../../theme/colors';
import PostCard from '../../components/PostCard';
import { subscribeFeed } from '../../services/postService';
import { useAuth } from '../../context/AuthContext';

// Mock posts for demo/no-Firebase mode
const MOCK_POSTS = [
  {
    id: 'mp1',
    userId: 'user1',
    username: 'nashville_local',
    avatarUrl: null,
    isAnonymous: false,
    caption: 'Incredible sunset over the Cumberland tonight. Nashville never gets old 🌅',
    mediaUrl: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800',
    mediaType: 'image',
    location: 'East Nashville',
    likes: [],
    likeCount: 147,
    commentCount: 23,
    createdAt: { seconds: Math.floor(Date.now() / 1000) - 1800 },
  },
  {
    id: 'mp2',
    userId: 'user2',
    username: 'anonymous',
    avatarUrl: null,
    isAnonymous: true,
    caption: 'Heads up — massive backup on I-24 westbound near Harding. Take surface streets!',
    mediaUrl: null,
    mediaType: null,
    location: 'Antioch',
    likes: [],
    likeCount: 89,
    commentCount: 12,
    createdAt: { seconds: Math.floor(Date.now() / 1000) - 3600 },
  },
  {
    id: 'mp3',
    userId: 'user3',
    username: 'gulch_life',
    avatarUrl: null,
    isAnonymous: false,
    caption: 'New rooftop bar just opened in The Gulch. Views are unreal.',
    mediaUrl: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800',
    mediaType: 'image',
    location: 'The Gulch',
    likes: [],
    likeCount: 312,
    commentCount: 45,
    createdAt: { seconds: Math.floor(Date.now() / 1000) - 7200 },
  },
  {
    id: 'mp4',
    userId: 'user4',
    username: 'music_city_fan',
    avatarUrl: null,
    isAnonymous: false,
    caption: 'Just heard an incredible set at the Ryman. Luke Combs absolutely killed it!',
    mediaUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
    mediaType: 'image',
    location: 'Downtown Nashville',
    likes: [],
    likeCount: 521,
    commentCount: 67,
    createdAt: { seconds: Math.floor(Date.now() / 1000) - 10800 },
  },
  {
    id: 'mp5',
    userId: 'user5',
    username: 'hot_chicken_fan',
    avatarUrl: null,
    isAnonymous: false,
    caption: '2 hour wait at Hattie B\'s but worth every minute. Nashville hot chicken is life.',
    mediaUrl: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800',
    mediaType: 'image',
    location: 'Midtown',
    likes: [],
    likeCount: 203,
    commentCount: 31,
    createdAt: { seconds: Math.floor(Date.now() / 1000) - 14400 },
  },
];

export default function HomeScreen({ navigation }) {
  const { user, profile } = useAuth();
  const [posts, setPosts] = useState(MOCK_POSTS);
  const [refreshing, setRefreshing] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let unsub;
    try {
      unsub = subscribeFeed(newPosts => {
        if (newPosts.length > 0) setPosts(newPosts);
      });
    } catch {
      // Firebase not configured, use mock data
    }
    return () => unsub?.();
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    await new Promise(r => setTimeout(r, 800));
    setRefreshing(false);
  }

  function handleCommentPress(post) {
    navigation.navigate('Comments', { post });
  }

  function handleEditPost(post) {
    navigation.navigate('CreatePost', { editPost: post });
  }

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [1, 0.95],
    extrapolate: 'clamp',
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
        <View style={styles.logoRow}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>615</Text>
          </View>
          <Text style={styles.headerTitle}>NAV</Text>
        </View>
        <TouchableOpacity
          style={styles.composeBtn}
          onPress={() => navigation.navigate('CreatePost')}
        >
          <Ionicons name="add" size={22} color={Colors.cream} />
        </TouchableOpacity>
      </Animated.View>

      {/* Feed */}
      <FlatList
        data={posts}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            onCommentPress={handleCommentPress}
            onEdit={handleEditPost}
            navigation={navigation}
          />
        )}
        contentContainerStyle={styles.feedContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primaryRed}
          />
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="newspaper-outline" size={48} color={Colors.textDim} />
            <Text style={styles.emptyText}>No posts yet</Text>
            <Text style={styles.emptySubtext}>Be the first to share what's happening in Nashville</Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreatePost')}
        activeOpacity={0.85}
      >
        <Ionicons name="camera" size={24} color={Colors.cream} />
      </TouchableOpacity>
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
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoBadge: {
    backgroundColor: Colors.primaryRed,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  logoText: {
    color: Colors.cream,
    fontSize: 15,
    fontWeight: '800',
  },
  headerTitle: {
    color: Colors.text,
    fontSize: Typography.fontSizes.xl,
    fontWeight: '800',
    letterSpacing: 2,
  },
  composeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.primaryRed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedContent: {
    paddingTop: Spacing.md,
    paddingBottom: 100,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: Spacing.xxxl,
  },
  emptyText: {
    color: Colors.text,
    fontSize: Typography.fontSizes.lg,
    fontWeight: '600',
    marginTop: Spacing.md,
  },
  emptySubtext: {
    color: Colors.textDim,
    fontSize: Typography.fontSizes.sm,
    textAlign: 'center',
    marginTop: Spacing.sm,
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: Colors.primaryRed,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primaryRed,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});
