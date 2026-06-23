import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { firebaseAuth, firestore } from "@/lib/firebase/config";
import type { AuthProvider } from "./types";
import type { User } from "@/lib/types";

function toUser(fbUser: import("firebase/auth").User): User {
  return {
    uid: fbUser.uid,
    email: fbUser.email ?? "",
    displayName: fbUser.displayName ?? fbUser.email ?? "",
    photoURL: fbUser.photoURL,
  };
}

async function upsertUserDoc(fbUser: import("firebase/auth").User): Promise<void> {
  const ref = doc(firestore, "users", fbUser.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      uid: fbUser.uid,
      email: fbUser.email,
      displayName: fbUser.displayName ?? fbUser.email ?? "",
      photoURL: fbUser.photoURL,
      createdAt: serverTimestamp(),
    });
  }
}

export const firebaseAuthProvider: AuthProvider = {
  async getCurrentUser() {
    const fbUser = firebaseAuth.currentUser;
    return fbUser ? toUser(fbUser) : null;
  },

  async signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(firebaseAuth, provider);
    await upsertUserDoc(result.user);
    return toUser(result.user);
  },

  async signInWithEmail(email, password) {
    const result = await signInWithEmailAndPassword(firebaseAuth, email, password);
    return toUser(result.user);
  },

  async signOut() {
    await firebaseSignOut(firebaseAuth);
  },

  onAuthChange(cb) {
    return onAuthStateChanged(firebaseAuth, (fbUser) => {
      cb(fbUser ? toUser(fbUser) : null);
    });
  },
};
