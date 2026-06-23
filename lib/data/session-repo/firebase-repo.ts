import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  type DocumentData,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { firestore } from "@/lib/firebase/config";
import { EMPTY_PAYMENT_INFO } from "@/lib/types";
import type { Session, NewSessionInput, SessionPatch } from "@/lib/types";
import type { SessionRepository } from "../types";

function generateShareToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(18)))
    .map((b) => b.toString(36).padStart(2, "0"))
    .join("")
    .slice(0, 24);
}

function docToSession(id: string, data: DocumentData): Session {
  return {
    id,
    name: data.name as string,
    adminId: data.adminId as string,
    mode: data.mode as "equal" | "item_based",
    currency: (data.currency as "IDR") ?? "IDR",
    defaultTaxRate: (data.defaultTaxRate as number) ?? 11,
    status: (data.status as "active" | "closed") ?? "active",
    shareToken: data.shareToken as string,
    paymentInfo: (data.paymentInfo as Session["paymentInfo"]) ?? EMPTY_PAYMENT_INFO,
    members: (data.members as Session["members"]) ?? [],
    createdAt: (data.createdAt as { toMillis(): number } | null)?.toMillis() ?? Date.now(),
    updatedAt: (data.updatedAt as { toMillis(): number } | null)?.toMillis() ?? Date.now(),
  };
}

export const firestoreSessionRepo: SessionRepository = {
  async listByAdmin(adminId) {
    const q = query(
      collection(firestore, "sessions"),
      where("adminId", "==", adminId),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => docToSession(d.id, d.data()));
  },

  async get(id) {
    const snap = await getDoc(doc(firestore, "sessions", id));
    if (!snap.exists()) return null;
    return docToSession(snap.id, snap.data());
  },

  async create(input: NewSessionInput) {
    const docRef = await addDoc(collection(firestore, "sessions"), {
      name: input.name,
      adminId: input.adminId,
      mode: input.mode,
      currency: "IDR",
      defaultTaxRate: input.defaultTaxRate ?? 11,
      status: "active",
      shareToken: generateShareToken(),
      paymentInfo: EMPTY_PAYMENT_INFO,
      members: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    const snap = await getDoc(docRef);
    return docToSession(snap.id, snap.data()!);
  },

  async update(id, patch: SessionPatch) {
    const ref = doc(firestore, "sessions", id);
    await updateDoc(ref, { ...patch, updatedAt: serverTimestamp() });
  },

  async delete(id) {
    const batch = writeBatch(firestore);
    const [restoSnap, costSnap] = await Promise.all([
      getDocs(collection(firestore, "sessions", id, "restaurants")),
      getDocs(collection(firestore, "sessions", id, "sharedCosts")),
    ]);
    const itemDeletions = restoSnap.docs.map((r) =>
      getDocs(collection(firestore, "sessions", id, "restaurants", r.id, "items"))
    );
    const itemSnaps = await Promise.all(itemDeletions);
    itemSnaps.forEach((snp) => snp.docs.forEach((d) => batch.delete(d.ref)));
    restoSnap.docs.forEach((d) => batch.delete(d.ref));
    costSnap.docs.forEach((d) => batch.delete(d.ref));
    batch.delete(doc(firestore, "sessions", id));
    await batch.commit();
  },

  async findByShareToken(token) {
    const q = query(
      collection(firestore, "sessions"),
      where("shareToken", "==", token)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const d = snap.docs[0];
    return docToSession(d.id, d.data());
  },
};
