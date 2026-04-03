import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  limit,
  startAfter,
  getDocs,
  getDoc,
  onSnapshot,
  arrayUnion,
  arrayRemove,
  increment,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from './firebase';
import { generateId as uuidv4 } from '../utils/uuid';

const POSTS_COLLECTION = 'posts';
const COMMENTS_COLLECTION = 'comments';

// ── Posts ─────────────────────────────────────────────────────────────────────

export async function createPost({ userId, username, avatarUrl, caption, mediaUri, mediaType, location, isAnonymous }) {
  let mediaUrl = null;
  let mediaStoragePath = null;

  if (mediaUri) {
    const ext = mediaType === 'video' ? 'mp4' : 'jpg';
    const path = `posts/${userId}/${uuidv4()}.${ext}`;
    mediaStoragePath = path;
    mediaUrl = await uploadMedia(mediaUri, path);
  }

  const post = {
    userId,
    username: isAnonymous ? 'Anonymous' : username,
    avatarUrl: isAnonymous ? null : avatarUrl,
    isAnonymous,
    caption,
    mediaUrl,
    mediaStoragePath,
    mediaType: mediaType || null,
    location,
    likes: [],
    likeCount: 0,
    commentCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    isMuted: false,
  };

  const docRef = await addDoc(collection(db, POSTS_COLLECTION), post);
  return docRef.id;
}

export async function updatePost(postId, { caption }) {
  await updateDoc(doc(db, POSTS_COLLECTION, postId), {
    caption,
    updatedAt: serverTimestamp(),
  });
}

export async function deletePost(postId, mediaStoragePath) {
  if (mediaStoragePath) {
    try {
      await deleteObject(ref(storage, mediaStoragePath));
    } catch {}
  }
  await deleteDoc(doc(db, POSTS_COLLECTION, postId));
}

export async function toggleLike(postId, userId) {
  const postRef = doc(db, POSTS_COLLECTION, postId);
  const snap = await getDoc(postRef);
  if (!snap.exists()) return;
  const likes = snap.data().likes || [];
  if (likes.includes(userId)) {
    await updateDoc(postRef, { likes: arrayRemove(userId), likeCount: increment(-1) });
    return false;
  } else {
    await updateDoc(postRef, { likes: arrayUnion(userId), likeCount: increment(1) });
    return true;
  }
}

export function subscribeFeed(callback, pageSize = 20) {
  const q = query(
    collection(db, POSTS_COLLECTION),
    orderBy('createdAt', 'desc'),
    limit(pageSize)
  );
  return onSnapshot(q, snapshot => {
    const posts = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(posts);
  });
}

export async function fetchMorePosts(lastDoc, pageSize = 20) {
  const q = query(
    collection(db, POSTS_COLLECTION),
    orderBy('createdAt', 'desc'),
    startAfter(lastDoc),
    limit(pageSize)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function fetchUserPosts(userId) {
  const q = query(
    collection(db, POSTS_COLLECTION),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ── Comments ──────────────────────────────────────────────────────────────────

export async function addComment({ postId, userId, username, avatarUrl, text, parentId = null }) {
  const comment = {
    postId,
    userId,
    username,
    avatarUrl,
    text,
    parentId,
    likes: [],
    likeCount: 0,
    createdAt: serverTimestamp(),
  };
  const docRef = await addDoc(collection(db, COMMENTS_COLLECTION), comment);
  await updateDoc(doc(db, POSTS_COLLECTION, postId), { commentCount: increment(1) });
  return docRef.id;
}

export function subscribeComments(postId, callback) {
  const q = query(
    collection(db, COMMENTS_COLLECTION),
    where('postId', '==', postId),
    orderBy('createdAt', 'asc')
  );
  return onSnapshot(q, snapshot => {
    const comments = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(comments);
  });
}

// ── Media Upload ──────────────────────────────────────────────────────────────

export async function uploadMedia(uri, path, onProgress) {
  const response = await fetch(uri);
  const blob = await response.blob();
  const storageRef = ref(storage, path);
  return new Promise((resolve, reject) => {
    const task = uploadBytesResumable(storageRef, blob);
    task.on('state_changed',
      snap => onProgress && onProgress(snap.bytesTransferred / snap.totalBytes),
      reject,
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        resolve(url);
      }
    );
  });
}
