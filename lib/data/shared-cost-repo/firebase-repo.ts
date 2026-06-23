import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  type DocumentData,
  serverTimestamp,
} from "firebase/firestore";
import { firestore } from "@/lib/firebase/config";
import type { SharedCost, NewSharedCostInput, SharedCostPatch } from "@/lib/types";
import type { SharedCostRepository } from "./types";

function costCol(sessionId: string) {
  return collection(firestore, "sessions", sessionId, "sharedCosts");
}

function costDoc(sessionId: string, costId: string) {
  return doc(firestore, "sessions", sessionId, "sharedCosts", costId);
}

function docToSharedCost(id: string, sessionId: string, data: DocumentData): SharedCost {
  return {
    costId: id,
    sessionId,
    name: data.name as string,
    amount: data.amount as number,
  };
}

export const firestoreSharedCostRepo: SharedCostRepository = {
  async list(sessionId) {
    const q = query(costCol(sessionId), orderBy("createdAt", "asc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => docToSharedCost(d.id, sessionId, d.data()));
  },

  async get(sessionId, costId) {
    const snap = await getDoc(costDoc(sessionId, costId));
    if (!snap.exists()) return null;
    return docToSharedCost(snap.id, sessionId, snap.data());
  },

  async create(input: NewSharedCostInput) {
    const docRef = await addDoc(costCol(input.sessionId), {
      name: input.name,
      amount: input.amount,
      createdAt: serverTimestamp(),
    });
    const snap = await getDoc(docRef);
    return docToSharedCost(snap.id, input.sessionId, snap.data()!);
  },

  async update(sessionId, costId, patch: SharedCostPatch) {
    await updateDoc(costDoc(sessionId, costId), { ...patch });
  },

  async delete(sessionId, costId) {
    await deleteDoc(costDoc(sessionId, costId));
  },
};
