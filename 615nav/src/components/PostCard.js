import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActionSheetIOS,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { Colors, Typography, Spacing, Radii } from '../theme/colors';
import Avatar from './Avatar';
import { toggleLike, deletePost } from '../services/postService';
import { useAuth } from '../context/AuthContext';
import { formatTimeAgo } from '../utils/time';

const { width: SCREEN_W } = Dimensions.get('window');

export default function PostCard({ post, onCommentPress, onEdit, navigation }) {
  const { user, profile } = useAuth();
  const [liked, setLiked] = useState(post.likes?.includes(user?.uid));
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const videoRef = useRef(null);

  const isOwner = user?.uid === post.userId;

  async function handleLike() {
    if (!user) return;
    const prev = liked;
    setLiked(!prev);
    setLikeCount(c => prev ? c - 1 : c + 1);
    try {
      await toggleLike(post.id, user.uid);
    } catch {
      setLiked(prev);
      setLikeCount(c => prev ? c + 1 : c - 1);
    }
  }

  function handleOptions() {
    if (Platform.OS === 'ios') {
      const options = isOwner
        ? ['Edit Post', 'Delete Post', 'Cancel']
        : ['Mute Post', 'Report', 'Cancel'];
      const destructiveButtonIndex = isOwner ? 1 : undefined;
      const cancelButtonIndex = options.length - 1;
      ActionSheetIOS.showActionSheetWithOptions(
        { options, destructiveButtonIndex, cancelButtonIndex },
        idx => {
          if (isOwner) {
            if (idx === 0) onEdit?.(post);
            if (idx === 1) confirmDelete();
          }
        }
      );
    } else {
      Alert.alert(
        'Post Options',
        '',
        isOwner
          ? [
              { text: 'Edit Post', onPress: () => onEdit?.(post) },
              { text: 'Delete Post', style: 'destructive', onPress: confirmDelete },
              { text: 'Cancel', style: 'cancel' },
            ]
          : [
              { text: 'Mute Post', onPress: () => {} },
              { text: 'Report', onPress: () => {} },
              { text: 'Cancel', style: 'cancel' },
            ]
      );
    }
  }

  function confirmDelete() {
    Alert.alert('Delete Post', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deletePost(post.id, post.mediaStoragePath),
      },
    ]);
  }

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <Avatar
          uri={post.isAnonymous ? null : post.avatarUrl}
          username={post.isAnonymous ? 'AN' : post.username}
          size={38}
        />
        <View style={styles.headerInfo}>
          <Text style={styles.username}>
            {post.isAnonymous ? 'Anonymous' : post.username}
          </Text>
          <View style={styles.metaRow}>
            {post.location && (
              <>
                <Ionicons name="location-outline" size={11} color={Colors.textDim} />
                <Text style={styles.meta}>{post.location}</Text>
                <Text style={styles.metaDot}> · </Text>
              </>
            )}
            <Text style={styles.meta}>{formatTimeAgo(post.createdAt)}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleOptions} style={styles.optionsBtn} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
          <Ionicons name="ellipsis-horizontal" size={18} color={Colors.textDim} />
        </TouchableOpacity>
      </View>

      {/* Media */}
      {post.mediaUrl && post.mediaType === 'image' && (
        <Image
          source={{ uri: post.mediaUrl }}
          style={styles.media}
          resizeMode="cover"
        />
      )}
      {post.mediaUrl && post.mediaType === 'video' && (
        <TouchableOpacity activeOpacity={0.9} onPress={() => setVideoPlaying(v => !v)} style={styles.videoContainer}>
          <Video
            ref={videoRef}
            source={{ uri: post.mediaUrl }}
            style={styles.media}
            resizeMode={ResizeMode.COVER}
            shouldPlay={videoPlaying}
            isLooping
            useNativeControls={false}
          />
          {!videoPlaying && (
            <View style={styles.playOverlay}>
              <Ionicons name="play-circle" size={56} color="rgba(255,255,255,0.9)" />
            </View>
          )}
        </TouchableOpacity>
      )}

      {/* Caption */}
      {post.caption ? (
        <Text style={styles.caption}>{post.caption}</Text>
      ) : null}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={handleLike}>
          <Ionicons
            name={liked ? 'heart' : 'heart-outline'}
            size={22}
            color={liked ? Colors.primaryRed : Colors.textSecondary}
          />
          <Text style={[styles.actionCount, liked && { color: Colors.primaryRed }]}>
            {likeCount > 0 ? likeCount : ''}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={() => onCommentPress?.(post)}>
          <Ionicons name="chatbubble-outline" size={20} color={Colors.textSecondary} />
          <Text style={styles.actionCount}>
            {post.commentCount > 0 ? post.commentCount : ''}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn}>
          <Ionicons name="share-outline" size={21} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerInfo: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  username: {
    color: Colors.text,
    fontSize: Typography.fontSizes.sm,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  meta: {
    color: Colors.textDim,
    fontSize: Typography.fontSizes.xs,
    marginLeft: 2,
  },
  metaDot: {
    color: Colors.textDim,
    fontSize: Typography.fontSizes.xs,
  },
  optionsBtn: { padding: Spacing.xs },
  media: {
    width: '100%',
    aspectRatio: 1.3,
  },
  videoContainer: { position: 'relative' },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  caption: {
    color: Colors.text,
    fontSize: Typography.fontSizes.md,
    lineHeight: 22,
    padding: Spacing.md,
    paddingTop: Spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderDim,
    gap: Spacing.lg,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  actionCount: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSizes.sm,
    fontWeight: '500',
  },
});
