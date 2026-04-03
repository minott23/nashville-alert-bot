import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radii } from '../../theme/colors';
import Avatar from '../../components/Avatar';
import { subscribeComments, addComment } from '../../services/postService';
import { useAuth } from '../../context/AuthContext';
import { formatTimeAgo } from '../../utils/time';

const MOCK_COMMENTS = [
  { id: 'c1', postId: 'mp1', userId: 'u1', username: 'nashville_fan', avatarUrl: null, text: 'Beautiful shot! What time was this?', parentId: null, likeCount: 5, createdAt: { seconds: Date.now() / 1000 - 900 } },
  { id: 'c2', postId: 'mp1', userId: 'u2', username: 'east_side_local', avatarUrl: null, text: 'Around 7:30pm, perfect golden hour!', parentId: 'c1', likeCount: 2, createdAt: { seconds: Date.now() / 1000 - 600 } },
  { id: 'c3', postId: 'mp1', userId: 'u3', username: 'visitor_2026', avatarUrl: null, text: 'Moving here next month, this confirms it.', parentId: null, likeCount: 12, createdAt: { seconds: Date.now() / 1000 - 300 } },
];

function CommentItem({ comment, onReply, depth = 0 }) {
  return (
    <View style={[styles.commentRow, depth > 0 && styles.commentReply]}>
      <Avatar uri={comment.avatarUrl} username={comment.username} size={32} />
      <View style={styles.commentContent}>
        <View style={styles.commentBubble}>
          <Text style={styles.commentUsername}>{comment.username}</Text>
          <Text style={styles.commentText}>{comment.text}</Text>
        </View>
        <View style={styles.commentMeta}>
          <Text style={styles.commentTime}>{formatTimeAgo(comment.createdAt)}</Text>
          {comment.likeCount > 0 && (
            <Text style={styles.commentLikes}>{comment.likeCount} likes</Text>
          )}
          <TouchableOpacity onPress={() => onReply(comment)}>
            <Text style={styles.replyBtn}>Reply</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default function CommentsScreen({ navigation, route }) {
  const { post } = route.params;
  const { user, profile } = useAuth();
  const [comments, setComments] = useState(MOCK_COMMENTS);
  const [text, setText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [sending, setSending] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    let unsub;
    try {
      unsub = subscribeComments(post.id, incoming => {
        if (incoming.length > 0) setComments(incoming);
      });
    } catch {}
    return () => unsub?.();
  }, [post.id]);

  async function handleSend() {
    if (!text.trim() || !user) return;
    setSending(true);
    try {
      await addComment({
        postId: post.id,
        userId: user.uid,
        username: profile?.username || 'User',
        avatarUrl: profile?.avatarUrl || null,
        text: text.trim(),
        parentId: replyingTo?.id || null,
      });
      setText('');
      setReplyingTo(null);
    } catch (e) {
      // Firebase not configured – add locally
      const newComment = {
        id: `local_${Date.now()}`,
        postId: post.id,
        userId: user?.uid || 'guest',
        username: profile?.username || 'You',
        avatarUrl: profile?.avatarUrl || null,
        text: text.trim(),
        parentId: replyingTo?.id || null,
        likeCount: 0,
        createdAt: { seconds: Date.now() / 1000 },
      };
      setComments(prev => [...prev, newComment]);
      setText('');
      setReplyingTo(null);
    } finally {
      setSending(false);
    }
  }

  function handleReply(comment) {
    setReplyingTo(comment);
    setText(`@${comment.username} `);
    inputRef.current?.focus();
  }

  // Build threaded structure
  const topLevel = comments.filter(c => !c.parentId);
  const replies = (parentId) => comments.filter(c => c.parentId === parentId);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
          <Ionicons name="chevron-down" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Comments</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <FlatList
          data={topLevel}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View>
              <CommentItem comment={item} onReply={handleReply} depth={0} />
              {replies(item.id).map(r => (
                <CommentItem key={r.id} comment={r} onReply={handleReply} depth={1} />
              ))}
            </View>
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="chatbubbles-outline" size={40} color={Colors.textDim} />
              <Text style={styles.emptyText}>No comments yet</Text>
              <Text style={styles.emptySub}>Be the first to comment</Text>
            </View>
          }
        />

        {/* Reply indicator */}
        {replyingTo && (
          <View style={styles.replyIndicator}>
            <Text style={styles.replyIndicatorText}>
              Replying to <Text style={{ color: Colors.primaryRed }}>@{replyingTo.username}</Text>
            </Text>
            <TouchableOpacity onPress={() => { setReplyingTo(null); setText(''); }}>
              <Ionicons name="close" size={16} color={Colors.textDim} />
            </TouchableOpacity>
          </View>
        )}

        {/* Input */}
        <View style={styles.inputRow}>
          <Avatar uri={profile?.avatarUrl} username={profile?.username || '??'} size={32} />
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Add a comment…"
            placeholderTextColor={Colors.textDim}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!text.trim() || sending}
          >
            {sending
              ? <ActivityIndicator size="small" color={Colors.cream} />
              : <Ionicons name="arrow-up" size={18} color={Colors.cream} />
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
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
    fontSize: Typography.fontSizes.md,
    fontWeight: '700',
  },
  listContent: { padding: Spacing.lg, paddingBottom: 20 },
  commentRow: {
    flexDirection: 'row',
    marginBottom: Spacing.lg,
  },
  commentReply: {
    marginLeft: 44,
    marginBottom: Spacing.md,
  },
  commentContent: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  commentBubble: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.md,
    padding: Spacing.md,
  },
  commentUsername: {
    color: Colors.text,
    fontSize: Typography.fontSizes.sm,
    fontWeight: '600',
    marginBottom: 3,
  },
  commentText: {
    color: Colors.text,
    fontSize: Typography.fontSizes.sm,
    lineHeight: 19,
  },
  commentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.xs,
    paddingLeft: Spacing.sm,
  },
  commentTime: { color: Colors.textDim, fontSize: Typography.fontSizes.xs },
  commentLikes: { color: Colors.textDim, fontSize: Typography.fontSizes.xs },
  replyBtn: { color: Colors.textSecondary, fontSize: Typography.fontSizes.xs, fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: Colors.text, fontSize: Typography.fontSizes.md, fontWeight: '600', marginTop: Spacing.md },
  emptySub: { color: Colors.textDim, fontSize: Typography.fontSizes.sm, marginTop: Spacing.xs },
  replyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surfaceLight,
    borderTopWidth: 1,
    borderTopColor: Colors.borderDim,
  },
  replyIndicatorText: { color: Colors.textSecondary, fontSize: Typography.fontSizes.sm },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderDim,
    backgroundColor: Colors.background,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    color: Colors.text,
    fontSize: Typography.fontSizes.sm,
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    maxHeight: 100,
  },
  sendBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.primaryRed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: Colors.borderDim },
});
