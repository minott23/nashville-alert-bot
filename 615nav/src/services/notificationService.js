import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
  serverTimestamp,
  writeBatch,
  getDocs,
} from 'firebase/firestore';
import { db } from './firebase';

const NOTIFS_COLLECTION = 'notifications';

export async function createNotification({ toUserId, fromUserId, fromUsername, fromAvatar, type, postId, commentText }) {
  if (toUserId === fromUserId) return; // don't notify self
  await addDoc(collection(db, NOTIFS_COLLECTION), {
    toUserId,
    fromUserId,
    fromUsername,
    fromAvatar,
    type, // 'like' | 'comment' | 'reply' | 'system'
    postId: postId || null,
    commentText: commentText || null,
    read: false,
    createdAt: serverTimestamp(),
  });
}

export function subscribeNotifications(userId, callback) {
  const q = query(
    collection(db, NOTIFS_COLLECTION),
    where('toUserId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

export async function markAllRead(userId) {
  const q = query(
    collection(db, NOTIFS_COLLECTION),
    where('toUserId', '==', userId),
    where('read', '==', false)
  );
  const snap = await getDocs(q);
  const batch = writeBatch(db);
  snap.docs.forEach(d => batch.update(d.ref, { read: true }));
  await batch.commit();
}

export async function markRead(notifId) {
  await updateDoc(doc(db, NOTIFS_COLLECTION, notifId), { read: true });
}
