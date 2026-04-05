import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radii } from '../../theme/colors';
import Avatar from '../../components/Avatar';
import { useAuth } from '../../context/AuthContext';
import { uploadMedia } from '../../services/postService';
import { generateId as uuidv4 } from '../../utils/uuid';

export default function EditProfileScreen({ navigation }) {
  const { user, profile, updateUserProfile } = useAuth();
  const [username, setUsername] = useState(profile?.username || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [avatarUri, setAvatarUri] = useState(profile?.avatarUrl || null);
  const [saving, setSaving] = useState(false);

  async function pickAvatar() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow photo library access.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
    }
  }

  async function handleSave() {
    if (!username.trim()) {
      Alert.alert('Username required', 'Please enter a username.');
      return;
    }
    setSaving(true);
    try {
      let avatarUrl = profile?.avatarUrl || null;
      // Upload new avatar if changed
      if (avatarUri && avatarUri !== profile?.avatarUrl) {
        try {
          avatarUrl = await uploadMedia(avatarUri, `avatars/${user.uid}/${uuidv4()}.jpg`);
        } catch {
          // Non-fatal: keep old avatar
        }
      }
      await updateUserProfile({
        username: username.trim(),
        bio: bio.trim(),
        avatarUrl,
      });
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.navCancel}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>Edit Profile</Text>
        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator size="small" color={Colors.cream} />
            : <Text style={styles.saveBtnText}>Save</Text>
          }
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Avatar */}
          <View style={styles.avatarSection}>
            <Avatar uri={avatarUri} username={username || '??'} size={90} />
            <TouchableOpacity style={styles.changePhotoBtn} onPress={pickAvatar}>
              <Text style={styles.changePhotoText}>Change Photo</Text>
            </TouchableOpacity>
          </View>

          {/* Fields */}
          <View style={styles.fields}>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Username</Text>
              <TextInput
                style={styles.fieldInput}
                value={username}
                onChangeText={setUsername}
                placeholder="username"
                placeholderTextColor={Colors.textDim}
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={30}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Bio</Text>
              <TextInput
                style={[styles.fieldInput, styles.bioInput]}
                value={bio}
                onChangeText={setBio}
                placeholder="Tell Nashville about yourself"
                placeholderTextColor={Colors.textDim}
                multiline
                maxLength={150}
              />
              <Text style={styles.charCount}>{150 - bio.length}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Email</Text>
              <Text style={styles.fieldReadonly}>{user?.email || '—'}</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  navCancel: { color: Colors.textSecondary, fontSize: Typography.fontSizes.md },
  navTitle: { color: Colors.text, fontSize: Typography.fontSizes.md, fontWeight: '700' },
  saveBtn: {
    backgroundColor: Colors.primaryRed,
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 7,
    minWidth: 60,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: Colors.cream, fontSize: Typography.fontSizes.sm, fontWeight: '700' },
  content: { paddingBottom: 40 },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderDim,
  },
  changePhotoBtn: { marginTop: Spacing.md },
  changePhotoText: { color: Colors.primaryRed, fontSize: Typography.fontSizes.md, fontWeight: '600' },
  fields: {
    backgroundColor: Colors.surface,
    marginTop: Spacing.xl,
    marginHorizontal: Spacing.lg,
    borderRadius: Radii.lg,
    overflow: 'hidden',
  },
  field: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    minHeight: 52,
    position: 'relative',
  },
  fieldLabel: {
    color: Colors.text,
    fontSize: Typography.fontSizes.sm,
    fontWeight: '600',
    width: 80,
    paddingTop: 2,
  },
  fieldInput: {
    flex: 1,
    color: Colors.text,
    fontSize: Typography.fontSizes.sm,
    lineHeight: 20,
    textAlignVertical: 'top',
  },
  bioInput: {
    minHeight: 70,
    paddingBottom: 20,
  },
  charCount: {
    position: 'absolute',
    bottom: Spacing.sm,
    right: Spacing.lg,
    color: Colors.textDim,
    fontSize: Typography.fontSizes.xs,
  },
  fieldReadonly: {
    flex: 1,
    color: Colors.textDim,
    fontSize: Typography.fontSizes.sm,
    paddingTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderDim,
    marginLeft: 80 + Spacing.lg,
  },
});
