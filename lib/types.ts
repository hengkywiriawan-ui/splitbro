export type SessionMode = "equal" | "item_based";
export type SessionStatus = "active" | "closed";

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
}

export interface PaymentInfo {
  bankName: string | null;
  accountNumber: string | null;
  accountName: string | null;
  ewallet: string | null;
  note: string | null;
}

export interface Member {
  memberId: string;
  name: string;
  email: string | null;
  phone: string | null;
  deposit: number;
  isDriver: boolean; // driver eats free; their consumption is split among non-drivers
}

export interface Session {
  id: string;
  name: string;
  adminId: string;
  mode: SessionMode;
  currency: "IDR";
  defaultTaxRate: number;
  status: SessionStatus;
  shareToken: string;
  shareExpiresAt: number; // epoch ms; public share link blocked after this
  paymentInfo: PaymentInfo;
  members: Member[];
  createdAt: number; // epoch ms in mock; maps to Firestore Timestamp later
  updatedAt: number;
}

// Public share link lifetime: 10 weeks (70 days) from session creation.
export const SHARE_TTL_MS = 70 * 24 * 60 * 60 * 1000;

export interface NewSessionInput {
  name: string;
  mode: SessionMode;
  adminId: string;
  defaultTaxRate?: number; // defaults to 11 in the repository
}

export type SessionPatch = Partial<Omit<Session, "id" | "adminId" | "mode" | "shareToken" | "createdAt">>;

export const EMPTY_PAYMENT_INFO: PaymentInfo = {
  bankName: null,
  accountNumber: null,
  accountName: null,
  ewallet: null,
  note: null,
};

export interface Restaurant {
  restaurantId: string;
  sessionId: string;
  name: string;
  date: string | null;
  order: number;
  taxIncluded: boolean;
  taxRate: number;
  totalAmount: number | null;
}

export interface NewRestaurantInput {
  sessionId: string;
  name: string;
  date?: string | null;
  order?: number;
  taxIncluded?: boolean;
  taxRate?: number;
  totalAmount?: number | null;
}

export type RestaurantPatch = Partial<Omit<Restaurant, "restaurantId" | "sessionId">>;

export interface Item {
  itemId: string;
  sessionId: string;
  restaurantId: string;
  name: string;
  price: number;        // total price for the item, not per person
  assignedTo: string[]; // memberId[], min 1
}

export interface NewItemInput {
  sessionId: string;
  restaurantId: string;
  name: string;
  price: number;
  assignedTo: string[];
}

export type ItemPatch = Partial<Omit<Item, "itemId" | "sessionId" | "restaurantId">>;

export interface SharedCost {
  costId: string;
  sessionId: string;
  name: string;
  amount: number;
}

export interface NewSharedCostInput {
  sessionId: string;
  name: string;
  amount: number;
}

export type SharedCostPatch = Partial<Omit<SharedCost, "costId" | "sessionId">>;
