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
  paymentInfo: PaymentInfo;
  members: Member[];
  createdAt: number; // epoch ms in mock; maps to Firestore Timestamp later
  updatedAt: number;
}

export interface NewSessionInput {
  name: string;
  mode: SessionMode;
  adminId: string;
  defaultTaxRate?: number; // defaults to 11 in the repository
}

export const EMPTY_PAYMENT_INFO: PaymentInfo = {
  bankName: null,
  accountNumber: null,
  accountName: null,
  ewallet: null,
  note: null,
};
