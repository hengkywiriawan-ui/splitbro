"use client";

import { useState } from "react";
import type { Item, Member, Restaurant, SessionMode } from "@/lib/types";
import { useT } from "@/lib/i18n/provider";
import { applyTax } from "@/lib/calc/settlement";
import { formatIDR } from "@/lib/format";
import { Card } from "@/components/ui/Card";
import { Money } from "@/components/ui/Money";

function formatDateHeader(date: string | null, noDateLabel: string): string {
  if (!date) return noDateLabel;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return noDateLabel;
  return d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" });
}

// Group restaurants by date (preserving their order within a day), with dated
// groups ascending and any undated restaurants last.
function groupByDate(restaurants: Restaurant[]): { date: string | null; list: Restaurant[] }[] {
  const groups: { date: string | null; list: Restaurant[] }[] = [];
  const index = new Map<string | null, number>();
  for (const r of restaurants) {
    const key = r.date ?? null;
    if (!index.has(key)) {
      index.set(key, groups.length);
      groups.push({ date: key, list: [] });
    }
    groups[index.get(key)!].list.push(r);
  }
  return groups.sort((a, b) => {
    if (a.date === b.date) return 0;
    if (a.date === null) return 1;
    if (b.date === null) return -1;
    return a.date < b.date ? -1 : 1;
  });
}

type RestaurantTotals = {
  subtotal: number;
  tax: number;
  total: number;
  perPerson: number;
};

function computeTotals(
  r: Restaurant,
  items: Item[],
  mode: SessionMode,
  memberCount: number
): RestaurantTotals {
  const subtotal =
    mode === "equal" ? r.totalAmount ?? 0 : items.reduce((sum, i) => sum + i.price, 0);
  const total = applyTax(subtotal, r);
  return {
    subtotal,
    tax: total - subtotal,
    total,
    perPerson: memberCount > 0 ? total / memberCount : 0,
  };
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-ink-muted">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function RestaurantRow({
  restaurant,
  items,
  mode,
  members,
  open,
  onToggle,
}: {
  restaurant: Restaurant;
  items: Item[];
  mode: SessionMode;
  members: Member[];
  open: boolean;
  onToggle: () => void;
}) {
  const { t } = useT();
  const nameById = new Map(members.map((m) => [m.memberId, m.name]));
  const participantCount =
    mode === "equal" && restaurant.participantIds.length > 0
      ? restaurant.participantIds.length
      : members.length;
  const totals = computeTotals(restaurant, items, mode, participantCount);

  return (
    <div className="border-b border-border-subtle last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-3 py-3 text-left transition-colors active:bg-surface-gray"
      >
        <span
          className={`text-ink-muted transition-transform duration-200 ${open ? "rotate-90" : ""}`}
          aria-hidden
        >
          ▸
        </span>
        <span className="min-w-0 flex-1 truncate font-semibold text-ink">{restaurant.name}</span>
        <Money amount={totals.total} tone="gold" className="shrink-0 font-semibold" />
      </button>

      {open && (
        <div className="pb-3 pl-7 pr-1">
          {mode === "item_based" && items.length > 0 && (
            <ul className="mb-2 flex flex-col gap-1.5">
              {items.map((item) => (
                <li key={item.itemId} className="text-sm">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="min-w-0 truncate text-ink">{item.name}</span>
                    <span className="shrink-0 text-ink-muted">{formatIDR(item.price)}</span>
                  </div>
                  {item.assignedTo.length > 0 && (
                    <span className="text-xs text-ink-muted">
                      → {item.assignedTo.map((id) => nameById.get(id) ?? "?").join(", ")}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-col gap-1 border-t border-border-subtle pt-2 text-sm">
            <Line label={t("report.subtotal")} value={formatIDR(totals.subtotal)} />
            {restaurant.taxIncluded ? (
              <p className="text-xs text-ink-muted">{t("restaurant.tax.included")}</p>
            ) : (
              <Line label={`${t("report.tax")} ${restaurant.taxRate}%`} value={formatIDR(totals.tax)} />
            )}
            <div className="mt-1 flex items-center justify-between border-t border-border-subtle pt-2">
              <span className="font-semibold text-ink">{t("report.total")}</span>
              <Money amount={totals.total} tone="primary" className="font-bold" />
            </div>
            {mode === "equal" && (
              <div className="flex items-center justify-between text-ink-muted">
                <span>{t("export.col.perPerson")}</span>
                <span>{formatIDR(totals.perPerson)}</span>
              </div>
            )}
            {mode === "equal" && restaurant.participantIds.length > 0 && (
              <p className="text-xs text-ink-muted">
                {restaurant.participantIds.map((id) => nameById.get(id) ?? "?").join(", ")}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function RestaurantReport({
  restaurants,
  itemsByResto,
  mode,
  members,
}: {
  restaurants: Restaurant[];
  itemsByResto: Record<string, Item[]>;
  mode: SessionMode;
  members: Member[];
}) {
  const { t } = useT();
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());

  if (restaurants.length === 0) return null;

  const groups = groupByDate(restaurants);

  function toggle(id: string) {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <Card className="mt-4">
      <p className="label-caps mb-3 text-ink-muted">{t("report.title")}</p>
      <div className="flex flex-col gap-4">
        {groups.map((g) => (
          <div key={g.date ?? "no-date"}>
            <div className="mb-1.5 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-gold" aria-hidden />
              <p className="text-sm font-semibold text-gold">
                {formatDateHeader(g.date, t("report.noDate"))}
              </p>
            </div>
            <div className="rounded-lg border border-border-subtle px-3">
              {g.list.map((r) => (
                <RestaurantRow
                  key={r.restaurantId}
                  restaurant={r}
                  items={itemsByResto[r.restaurantId] ?? []}
                  mode={mode}
                  members={members}
                  open={openIds.has(r.restaurantId)}
                  onToggle={() => toggle(r.restaurantId)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
