import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Switch,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Typography, Spacing, Radii } from '../../theme/colors';
import Avatar from '../../components/Avatar';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { createPost, updatePost } from '../../services/postService';
import { getLocationLabel } from '../../services/locationService';

export default function CreatePostScreen({ navigation, route }) {
  const editPost = route.params?.editPost;
  const { user, profile } = useAuth();
  const { location } = useApp();

  const [caption, setCaption] = useState(editPost?.caption || '');
  const [media, setMedia] = useState(editPost?.mediaUrl ? { uri: editPost.mediaUrl, type: editPost.mediaType } : null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [locationLabel, setLocationLabel] = useState('Nashville');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (location) {
      getLocationLabel(location.latitude, location.longitude).then(setLocationLabel);
    }
  }, [location]);

  async function pickMedia(type) {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: type === 'video'
        ? ImagePicker.MediaTypeOptions.Videos
        : ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (!result.canceled && result.assets[0]) {
      setMedia({ uri: result.assets[0].uri, type });
    }
  }

  async function openCamera() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow camera access.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      const isVideo = result.assets[0].type === 'video';
      setMedia({ uri: result.assets[0].uri, type: isVideo ? 'video' : 'image' });
    }
  }

  async function handlePost() {
    if (!caption.trim() && !media) {
      Alert.alert('Empty post', 'Add a caption or media to post.');
      return;
    }
    setUploading(true);
    try {
      if (editPost) {
        await updatePost(editPost.id, { caption: caption.trim() });
      } else {
        await createPost({
          userId: user.uid,
          username: profile?.username || user.displayName || 'User',
          avatarUrl: profile?.avatarUrl || null,
          caption: caption.trim(),
          mediaUri: media?.uri || null,
          mediaType: media?.type || null,
          location: locationLabel,
          isAnonymous,
        });
      }
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to post. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Nav */}
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navBtn}>
          <Text style={styles.navCancel}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>{editPost ? 'Edit Post' : 'New Post'}</Text>
        <TouchableOpacity
          style={[styles.postBtn, uploading && styles.postBtnDisabled]}
          onPress={handlePost}
          disabled={uploading}
        >
          {uploading
            ? <ActivityIndicator size="small" color={Colors.cream} />
            : <Text style={styles.postBtnText}>{editPost ? 'Save' : 'Post'}</Text>
          }
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView style={styles.flex} keyboardShouldPersistTaps="handled">
          {/* Composer */}
          <View style={styles.composer}>
            <Avatar
              uri={isAnonymous ? null : profile?.avatarUrl}
              username={isAnonymous ? 'AN' : (profile?.username || '??')}
              size={44}
            />
            <TextInput
              style={styles.captionInput}
              placeholder="What's happening in Nashville?"
              placeholderTextColor={Colors.textDim}
              value={caption}
              onChangeText={setCaption}
              multiline
              autoFocus
              maxLength={500}
            />
          </View>

          {/* Media preview */}
          {media && (
            <View style={styles.mediaPreview}>
              <Image source={{ uri: media.uri }} style={styles.previewImage} resizeMode="cover" />
              <TouchableOpacity style={styles.removeMedia} onPress={() => setMedia(null)}>
                <Ionicons name="close-circle" size={26} color={Colors.white} />
              </TouchableOpacity>
              {media.type === 'video' && (
                <View style={styles.videoTag}>
                  <Ionicons name="videocam" size={13} color={Colors.white} />
                  <Text style={styles.videoTagText}>Video</Text>
                </View>
              )}
            </View>
          )}

          {/* Location row */}
          <View style={styles.locationRow}>
            <Ionicons name="location" size={15} color={Colors.primaryRed} />
            <Text style={styles.locationText}>{locationLabel}</Text>
          </View>

          {/* Anonymous toggle */}
          <View style={styles.anonRow}>
            <View>
              <Text style={styles.anonLabel}>Post Anonymously</Text>
              <Text style={styles.anonSub}>Hide your name and photo</Text>
            </View>
            <Switch
              value={isAnonymous}
              onValueChange={setIsAnonymous}
              trackColor={{ false: Colors.borderDim, true: Colors.primaryRed }}
              thumbColor={Colors.cream}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom toolbar */}
      {!editPost && (
        <View style={styles.toolbar}>
          <TouchableOpacity style={styles.toolbarBtn} onPress={() => pickMedia('image')}>
            <Ionicons name="image-outline" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolbarBtn} onPress={() => pickMedia('video')}>
            <Ionicons name="videocam-outline" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolbarBtn} onPress={openCamera}>
            <Ionicons name="camera-outline" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
          <View style={styles.charCount}>
            <Text style={[styles.charCountText, caption.length > 450 && { color: Colors.primaryRed }]}>
              {500 - caption.length}
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderDim,
  },
  navBtn: { minWidth: 60 },
  navCancel: { color: Colors.textSecondary, fontSize: Typography.fontSizes.md },
  navTitle: {
    color: Colors.text,
    fontSize: Typography.fontSizes.md,
    fontWeight: '700',
  },
  postBtn: {
    backgroundColor: Colors.primaryRed,
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 7,
    minWidth: 60,
    alignItems: 'center',
  },
  postBtnDisabled: { opacity: 0.6 },
  postBtnText: {
    color: Colors.cream,
    fontSize: Typography.fontSizes.sm,
    fontWeight: '700',
  },
  composer: {
    flexDirection: 'row',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  captionInput: {
    flex: 1,
    color: Colors.text,
    fontSize: Typography.fontSizes.md,
    lineHeight: 22,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  mediaPreview: {
    marginHorizontal: Spacing.lg,
    borderRadius: Radii.md,
    overflow: 'hidden',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: 220,
  },
  removeMedia: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  videoTag: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 4,
  },
  videoTagText: {
    color: Colors.white,
    fontSize: Typography.fontSizes.xs,
    fontWeight: '600',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    gap: 4,
  },
  locationText: {
    color: Colors.primaryRed,
    fontSize: Typography.fontSizes.sm,
    fontWeight: '500',
  },
  anonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radii.md,
  },
  anonLabel: {
    color: Colors.text,
    fontSize: Typography.fontSizes.md,
    fontWeight: '500',
  },
  anonSub: {
    color: Colors.textDim,
    fontSize: Typography.fontSizes.xs,
    marginTop: 2,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderDim,
    backgroundColor: Colors.background,
  },
  toolbarBtn: {
    marginRight: Spacing.lg,
    padding: Spacing.xs,
  },
  charCount: { flex: 1, alignItems: 'flex-end' },
  charCountText: {
    color: Colors.textDim,
    fontSize: Typography.fontSizes.sm,
  },
});
