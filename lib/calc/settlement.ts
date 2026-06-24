import type { Session, Restaurant, Item, SharedCost } from "@/lib/types";

export type Breakdown = {
  memberId: string;
  name: string;
  consumption: number;
  sharedShare: number;
  totalTagihan: number;
  deposit: number;
  netDue: number;
};

export function applyTax(
  baseAmount: number,
  r: { taxIncluded: boolean; taxRate: number }
): number {
  if (r.taxIncluded) return baseAmount;
  // Use baseAmount + baseAmount * taxRate / 100 instead of baseAmount * (1 + taxRate/100)
  // to avoid IEEE-754 floating-point accumulation (e.g. 100000 * 1.11 = 111000.00000000001).
  // Both expressions are algebraically identical; the integer-first order avoids the fp error.
  return baseAmount + baseAmount * r.taxRate / 100;
}

export function computeSettlement(
  session: Session,
  restaurants: Restaurant[],
  itemsByResto: Record<string, Item[]>,
  sharedCosts: SharedCost[]
): { breakdown: Breakdown[]; grandTotal: number; totalDeposit: number } {
  const N = session.members.length;
  if (N === 0) return { breakdown: [], grandTotal: 0, totalDeposit: 0 };

  const consumption: Record<string, number> = {};
  const sharedShare: Record<string, number> = {};
  for (const m of session.members) {
    consumption[m.memberId] = 0;
    sharedShare[m.memberId] = 0;
  }

  if (session.mode === "equal") {
    for (const r of restaurants) {
      if (r.totalAmount == null) continue;
      const effectiveTotal = applyTax(r.totalAmount, r);
      // Split among only the members who joined this restaurant. Empty/missing
      // participantIds means everyone (backward compatible with old data).
      const participants =
        r.participantIds && r.participantIds.length > 0
          ? session.members.filter((m) => r.participantIds.includes(m.memberId))
          : session.members;
      if (participants.length === 0) continue;
      const sharePerMember = effectiveTotal / participants.length;
      for (const m of participants) {
        consumption[m.memberId] += sharePerMember;
      }
    }
  } else {
    for (const r of restaurants) {
      const items = itemsByResto[r.restaurantId] ?? [];
      const rawShare: Record<string, number> = {};
      let subtotal = 0;
      for (const item of items) {
        const k = item.assignedTo.length;
        if (k === 0) continue;
        const pricePerHead = item.price / k;
        for (const memberId of item.assignedTo) {
          rawShare[memberId] = (rawShare[memberId] ?? 0) + pricePerHead;
        }
        subtotal += item.price;
      }
      if (subtotal > 0) {
        const effectiveTotal = applyTax(subtotal, r);
        const taxMultiplier = effectiveTotal / subtotal;
        for (const [memberId, raw] of Object.entries(rawShare)) {
          consumption[memberId] = (consumption[memberId] ?? 0) + raw * taxMultiplier;
        }
      }
    }
  }

  // Driver redistribution: a member flagged as driver eats free — their whole
  // consumption is split evenly among the non-drivers (isDriver !== true).
  // No-op when there are no non-drivers, so the grand total is never lost.
  const drivers = session.members.filter((m) => m.isDriver);
  const nonDrivers = session.members.filter((m) => !m.isDriver);
  if (drivers.length > 0 && nonDrivers.length > 0) {
    let driverPot = 0;
    for (const d of drivers) {
      driverPot += consumption[d.memberId] ?? 0;
      consumption[d.memberId] = 0;
    }
    const perNonDriver = driverPot / nonDrivers.length;
    for (const nd of nonDrivers) {
      consumption[nd.memberId] += perNonDriver;
    }
  }

  for (const sc of sharedCosts) {
    const perMember = sc.amount / N;
    for (const m of session.members) {
      sharedShare[m.memberId] += perMember;
    }
  }

  const breakdown: Breakdown[] = session.members.map((m) => {
    const c = consumption[m.memberId] ?? 0;
    const s = sharedShare[m.memberId] ?? 0;
    const totalTagihan = c + s;
    return {
      memberId: m.memberId,
      name: m.name,
      consumption: c,
      sharedShare: s,
      totalTagihan,
      deposit: m.deposit,
      netDue: totalTagihan - m.deposit,
    };
  });

  const grandTotal = breakdown.reduce((acc, b) => acc + b.totalTagihan, 0);
  const totalDeposit = breakdown.reduce((acc, b) => acc + b.deposit, 0);

  return { breakdown, grandTotal, totalDeposit };
}
