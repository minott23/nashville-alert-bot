import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  signInAnonymously,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '../services/firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await loadProfile(firebaseUser.uid);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  async function loadProfile(uid) {
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      if (snap.exists()) {
        setProfile(snap.data());
      }
    } catch (e) {
      console.warn('loadProfile error:', e.message);
    }
  }

  async function signUp(email, password, username) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: username });
    const userProfile = {
      uid: cred.user.uid,
      username,
      email,
      avatarUrl: null,
      bio: '',
      savedPosts: [],
      visitedPlaces: [],
      createdAt: serverTimestamp(),
    };
    await setDoc(doc(db, 'users', cred.user.uid), userProfile);
    setProfile(userProfile);
    return cred.user;
  }

  async function signIn(email, password) {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    await loadProfile(cred.user.uid);
    return cred.user;
  }

  async function signOut() {
    await firebaseSignOut(auth);
    setProfile(null);
  }

  async function updateUserProfile(updates) {
    if (!user) return;
    await updateDoc(doc(db, 'users', user.uid), { ...updates, updatedAt: serverTimestamp() });
    if (updates.username) {
      await updateProfile(user, { displayName: updates.username });
    }
    setProfile(prev => ({ ...prev, ...updates }));
  }

  async function toggleSavePost(postId) {
    if (!user || !profile) return;
    const saved = profile.savedPosts || [];
    const isSaved = saved.includes(postId);
    const newSaved = isSaved ? saved.filter(id => id !== postId) : [...saved, postId];
    await updateDoc(doc(db, 'users', user.uid), { savedPosts: newSaved });
    setProfile(prev => ({ ...prev, savedPosts: newSaved }));
    return !isSaved;
  }

  async function toggleVisitedPlace(placeId) {
    if (!user || !profile) return;
    const visited = profile.visitedPlaces || [];
    const isVisited = visited.includes(placeId);
    const newVisited = isVisited ? visited.filter(id => id !== placeId) : [...visited, placeId];
    await updateDoc(doc(db, 'users', user.uid), { visitedPlaces: newVisited });
    setProfile(prev => ({ ...prev, visitedPlaces: newVisited }));
    return !isVisited;
  }

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      signUp,
      signIn,
      signOut,
      updateUserProfile,
      toggleSavePost,
      toggleVisitedPlace,
      refreshProfile: () => user && loadProfile(user.uid),
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
