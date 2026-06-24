import { getAuth } from "firebase-admin/auth";
import { getAdminApp } from "./admin";

// Isolated from admin.ts so that importing Firestore admin (e.g. the public
// share route) never loads firebase-admin/auth -> jwks-rsa -> jose (ESM-only).
export function getAdminAuth() {
  return getAuth(getAdminApp());
}
