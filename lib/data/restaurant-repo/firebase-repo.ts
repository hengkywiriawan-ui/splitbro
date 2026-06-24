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
import type { Restaurant, NewRestaurantInput, RestaurantPatch } from "@/lib/types";
import type { RestaurantRepository } from "./types";

function restoCol(sessionId: string) {
  return collection(firestore, "sessions", sessionId, "restaurants");
}

function restoDoc(sessionId: string, restaurantId: string) {
  return doc(firestore, "sessions", sessionId, "restaurants", restaurantId);
}

function docToRestaurant(id: string, sessionId: string, data: DocumentData): Restaurant {
  return {
    restaurantId: id,
    sessionId,
    name: data.name as string,
    date: (data.date as string | null) ?? null,
    order: (data.order as number) ?? 0,
    taxIncluded: (data.taxIncluded as boolean) ?? false,
    taxRate: (data.taxRate as number) ?? 11,
    totalAmount: (data.totalAmount as number | null) ?? null,
    participantIds: (data.participantIds as string[]) ?? [],
  };
}

export const firestoreRestaurantRepo: RestaurantRepository = {
  async list(sessionId) {
    const q = query(restoCol(sessionId), orderBy("order", "asc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => docToRestaurant(d.id, sessionId, d.data()));
  },

  async get(sessionId, restaurantId) {
    const snap = await getDoc(restoDoc(sessionId, restaurantId));
    if (!snap.exists()) return null;
    return docToRestaurant(snap.id, sessionId, snap.data());
  },

  async create(input: NewRestaurantInput) {
    const col = restoCol(input.sessionId);
    const snap = await getDocs(col);
    const maxOrder = snap.docs.reduce((m, d) => Math.max(m, (d.data().order as number) ?? 0), -1);
    const docRef = await addDoc(col, {
      name: input.name,
      date: input.date ?? null,
      order: input.order ?? maxOrder + 1,
      taxIncluded: input.taxIncluded ?? false,
      taxRate: input.taxRate ?? 11,
      totalAmount: input.totalAmount ?? null,
      participantIds: input.participantIds ?? [],
      createdAt: serverTimestamp(),
    });
    const newSnap = await getDoc(docRef);
    return docToRestaurant(newSnap.id, input.sessionId, newSnap.data()!);
  },

  async update(sessionId, restaurantId, patch: RestaurantPatch) {
    await updateDoc(restoDoc(sessionId, restaurantId), { ...patch });
  },

  async delete(sessionId, restaurantId) {
    const itemsSnap = await getDocs(
      collection(firestore, "sessions", sessionId, "restaurants", restaurantId, "items")
    );
    await Promise.all(itemsSnap.docs.map((d) => deleteDoc(d.ref)));
    await deleteDoc(restoDoc(sessionId, restaurantId));
  },
};
