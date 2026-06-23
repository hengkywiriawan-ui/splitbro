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
import type { Item, NewItemInput, ItemPatch } from "@/lib/types";
import type { ItemRepository } from "./types";

function itemCol(sessionId: string, restaurantId: string) {
  return collection(firestore, "sessions", sessionId, "restaurants", restaurantId, "items");
}

function itemDoc(sessionId: string, restaurantId: string, itemId: string) {
  return doc(firestore, "sessions", sessionId, "restaurants", restaurantId, "items", itemId);
}

function docToItem(id: string, sessionId: string, restaurantId: string, data: DocumentData): Item {
  return {
    itemId: id,
    sessionId,
    restaurantId,
    name: data.name as string,
    price: data.price as number,
    assignedTo: (data.assignedTo as string[]) ?? [],
  };
}

export const firestoreItemRepo: ItemRepository = {
  async list(sessionId, restaurantId) {
    const q = query(itemCol(sessionId, restaurantId), orderBy("createdAt", "asc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => docToItem(d.id, sessionId, restaurantId, d.data()));
  },

  async get(sessionId, restaurantId, itemId) {
    const snap = await getDoc(itemDoc(sessionId, restaurantId, itemId));
    if (!snap.exists()) return null;
    return docToItem(snap.id, sessionId, restaurantId, snap.data());
  },

  async create(input: NewItemInput) {
    const docRef = await addDoc(itemCol(input.sessionId, input.restaurantId), {
      name: input.name,
      price: input.price,
      assignedTo: input.assignedTo,
      createdAt: serverTimestamp(),
    });
    const snap = await getDoc(docRef);
    return docToItem(snap.id, input.sessionId, input.restaurantId, snap.data()!);
  },

  async update(sessionId, restaurantId, itemId, patch: ItemPatch) {
    await updateDoc(itemDoc(sessionId, restaurantId, itemId), { ...patch });
  },

  async delete(sessionId, restaurantId, itemId) {
    await deleteDoc(itemDoc(sessionId, restaurantId, itemId));
  },
};
