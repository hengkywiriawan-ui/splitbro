import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Keep this module free of firebase-admin/auth: that pulls in jwks-rsa -> jose
// (ESM-only) which crashes (ERR_REQUIRE_ESM) when bundled. The public share
// route only needs Firestore. Auth lives in admin-auth.ts.
export function getAdminApp(): App {
  const existing = getApps().find((a) => a.name === "[DEFAULT]");
  if (existing) return existing;

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON env var is not set");
  }

  return initializeApp({ credential: cert(JSON.parse(serviceAccountJson) as object) });
}

export function getAdminDb() {
  return getFirestore(getAdminApp());
}
