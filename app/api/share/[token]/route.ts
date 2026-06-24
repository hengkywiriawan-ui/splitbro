import { NextRequest, NextResponse } from "next/server";
import { EMPTY_PAYMENT_INFO, SHARE_TTL_MS } from "@/lib/types";
import type { Session, Member, Restaurant, Item, SharedCost } from "@/lib/types";

function isShareExpired(session: Pick<Session, "shareExpiresAt" | "createdAt">): boolean {
  const expiresAt = session.shareExpiresAt || session.createdAt + SHARE_TTL_MS;
  return Date.now() > expiresAt;
}

// The public report only needs names and amounts — never leak member PII
// (email/phone) to anyone holding the share link.
function sanitizeMembers(members: Member[]): Member[] {
  return members.map((m) => ({
    memberId: m.memberId,
    name: m.name,
    deposit: m.deposit,
    isDriver: m.isDriver,
    email: null,
    phone: null,
  }));
}

type SharePayload = {
  session: Session;
  restaurants: Restaurant[];
  itemsByResto: Record<string, Item[]>;
  sharedCosts: SharedCost[];
};

function tsToMs(ts: unknown): number {
  if (ts && typeof (ts as { toMillis(): number }).toMillis === "function") {
    return (ts as { toMillis(): number }).toMillis();
  }
  return Date.now();
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
): Promise<NextResponse<SharePayload | { error: string }>> {
  const { token } = await params;
  const backend = process.env.NEXT_PUBLIC_BACKEND ?? "mock";

  if (backend === "firebase") {
    return handleFirebase(token);
  }
  return handleMock(token);
}

async function handleFirebase(
  token: string
): Promise<NextResponse<SharePayload | { error: string }>> {
  const { getAdminDb } = await import("@/lib/firebase/admin");
  const db = getAdminDb();

  const sessionSnap = await db
    .collection("sessions")
    .where("shareToken", "==", token)
    .limit(1)
    .get();

  if (sessionSnap.empty) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const sessionDoc = sessionSnap.docs[0];
  const sd = sessionDoc.data();

  const session: Session = {
    id: sessionDoc.id,
    name: sd.name as string,
    adminId: sd.adminId as string,
    mode: sd.mode as "equal" | "item_based",
    currency: "IDR",
    defaultTaxRate: (sd.defaultTaxRate as number) ?? 11,
    status: (sd.status as "active" | "closed") ?? "active",
    shareToken: sd.shareToken as string,
    shareExpiresAt: (sd.shareExpiresAt as number) ?? tsToMs(sd.createdAt) + SHARE_TTL_MS,
    paymentInfo: (sd.paymentInfo as Session["paymentInfo"]) ?? EMPTY_PAYMENT_INFO,
    members: sanitizeMembers((sd.members as Member[]) ?? []),
    createdAt: tsToMs(sd.createdAt),
    updatedAt: tsToMs(sd.updatedAt),
  };

  if (isShareExpired(session)) {
    return NextResponse.json({ error: "expired" }, { status: 410 });
  }

  const [restoSnap, costSnap] = await Promise.all([
    db
      .collection("sessions")
      .doc(sessionDoc.id)
      .collection("restaurants")
      .orderBy("order", "asc")
      .get(),
    db
      .collection("sessions")
      .doc(sessionDoc.id)
      .collection("sharedCosts")
      .orderBy("createdAt", "asc")
      .get(),
  ]);

  const restaurants: Restaurant[] = restoSnap.docs.map((d) => {
    const r = d.data();
    return {
      restaurantId: d.id,
      sessionId: sessionDoc.id,
      name: r.name as string,
      date: (r.date as string | null) ?? null,
      order: (r.order as number) ?? 0,
      taxIncluded: (r.taxIncluded as boolean) ?? false,
      taxRate: (r.taxRate as number) ?? 11,
      totalAmount: (r.totalAmount as number | null) ?? null,
      participantIds: (r.participantIds as string[]) ?? [],
    };
  });

  const sharedCosts: SharedCost[] = costSnap.docs.map((d) => {
    const c = d.data();
    return {
      costId: d.id,
      sessionId: sessionDoc.id,
      name: c.name as string,
      amount: c.amount as number,
    };
  });

  const itemsByResto: Record<string, Item[]> = {};
  if (session.mode === "item_based") {
    await Promise.all(
      restaurants.map(async (r) => {
        const itemSnap = await db
          .collection("sessions")
          .doc(sessionDoc.id)
          .collection("restaurants")
          .doc(r.restaurantId)
          .collection("items")
          .orderBy("createdAt", "asc")
          .get();
        itemsByResto[r.restaurantId] = itemSnap.docs.map((d) => {
          const i = d.data();
          return {
            itemId: d.id,
            sessionId: sessionDoc.id,
            restaurantId: r.restaurantId,
            name: i.name as string,
            price: i.price as number,
            assignedTo: (i.assignedTo as string[]) ?? [],
          };
        });
      })
    );
  }

  return NextResponse.json({
    session: { ...session, members: sanitizeMembers(session.members) },
    restaurants,
    itemsByResto,
    sharedCosts,
  });
}

async function handleMock(
  token: string
): Promise<NextResponse<SharePayload | { error: string }>> {
  const { getSessionRepo } = await import("@/lib/data/index");
  const { getRestaurantRepo } = await import("@/lib/data/restaurant-repo/index");
  const { getItemRepo } = await import("@/lib/data/item-repo/index");
  const { getSharedCostRepo } = await import("@/lib/data/shared-cost-repo/index");

  const session = await getSessionRepo().findByShareToken(token);
  if (!session) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (isShareExpired(session)) {
    return NextResponse.json({ error: "expired" }, { status: 410 });
  }

  const [restaurants, sharedCosts] = await Promise.all([
    getRestaurantRepo().list(session.id),
    getSharedCostRepo().list(session.id),
  ]);

  const itemsByResto: Record<string, Item[]> = {};
  if (session.mode === "item_based") {
    const itemRepo = getItemRepo();
    const entries = await Promise.all(
      restaurants.map(
        async (r) =>
          [r.restaurantId, await itemRepo.list(session.id, r.restaurantId)] as const
      )
    );
    Object.assign(itemsByResto, Object.fromEntries(entries));
  }

  return NextResponse.json({
    session: { ...session, members: sanitizeMembers(session.members) },
    restaurants,
    itemsByResto,
    sharedCosts,
  });
}
