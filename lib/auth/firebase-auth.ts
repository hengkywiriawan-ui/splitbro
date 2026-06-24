import {
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
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
      approved: false, // admin must approve in Firestore before login is allowed
      createdAt: serverTimestamp(),
    });
  }
}

// Login is gated: only accounts with users/{uid}.approved === true may sign in.
async function ensureApproved(uid: string): Promise<boolean> {
  const snap = await getDoc(doc(firestore, "users", uid));
  return snap.exists() && snap.data().approved === true;
}

export const firebaseAuthProvider: AuthProvider = {
  getCurrentUser() {
    // Wait for the first auth-state event so persistence (IndexedDB) is restored
    // before answering — currentUser is null synchronously on a cold start,
    // which would otherwise force a needless re-login when reopening the app.
    return new Promise<User | null>((resolve) => {
      const off = onAuthStateChanged(firebaseAuth, (fbUser) => {
        off();
        resolve(fbUser ? toUser(fbUser) : null);
      });
    });
  },

  async signInWithGoogle() {
    // Redirect (not popup) — reliable in standalone PWA and avoids COOP issues.
    // The result is handled by completeRedirect() when the app reloads.
    await signInWithRedirect(firebaseAuth, new GoogleAuthProvider());
    return new Promise<User>(() => {}); // page unloads; never resolves here
  },

  async completeRedirect() {
    const result = await getRedirectResult(firebaseAuth);
    if (!result) return;
    await upsertUserDoc(result.user);
    if (!(await ensureApproved(result.user.uid))) {
      await firebaseSignOut(firebaseAuth);
      throw new Error("auth/not-approved");
    }
  },

  async signInWithEmail(email, password) {
    const result = await signInWithEmailAndPassword(firebaseAuth, email, password);
    await upsertUserDoc(result.user);
    if (!(await ensureApproved(result.user.uid))) {
      await firebaseSignOut(firebaseAuth);
      throw new Error("auth/not-approved");
    }
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
