import { initializeApp, getApps } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { initializeAppCheck, ReCaptchaV3Provider, type AppCheck } from "firebase/app-check";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const firebaseAuth = getAuth(app);

// Persist the session in IndexedDB so it survives app/tab close on mobile.
// Without this, a cold start can drop the session and force re-login.
if (typeof window !== "undefined") {
  void setPersistence(firebaseAuth, browserLocalPersistence);
}

// App Check (optional): protects backend calls from abuse outside the app.
// Inert until NEXT_PUBLIC_FIREBASE_APPCHECK_KEY (a reCAPTCHA v3 site key) is set.
let firebaseAppCheck: AppCheck | null = null;
if (typeof window !== "undefined") {
  const appCheckKey = process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_KEY;
  if (appCheckKey) {
    // reCAPTCHA rejects localhost (api2/pat 401). In development use an App Check
    // debug token instead — register the token it logs in the App Check console.
    if (process.env.NODE_ENV !== "production") {
      (self as unknown as { FIREBASE_APPCHECK_DEBUG_TOKEN?: boolean }).FIREBASE_APPCHECK_DEBUG_TOKEN =
        true;
    }
    firebaseAppCheck = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(appCheckKey),
      isTokenAutoRefreshEnabled: true,
    });
  }
}
export { firebaseAppCheck };

export const firestore = getFirestore(app);
