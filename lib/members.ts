import type { Member } from "@/lib/types";

function uid(): string {
  return globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
}

export function addMember(members: Member[], input: Omit<Member, "memberId">): Member[] {
  return [...members, { ...input, memberId: uid() }];
}

export function updateMember(
  members: Member[],
  memberId: string,
  patch: Partial<Omit<Member, "memberId">>
): Member[] {
  return members.map((m) => (m.memberId === memberId ? { ...m, ...patch } : m));
}

export function removeMember(members: Member[], memberId: string): Member[] {
  return members.filter((m) => m.memberId !== memberId);
}
