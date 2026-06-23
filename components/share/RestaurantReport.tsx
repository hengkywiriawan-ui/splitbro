"use client";

import { useState } from "react";
import type { Item, Member, Restaurant, SessionMode } from "@/lib/types";
import { useT } from "@/lib/i18n/provider";
import { applyTax } from "@/lib/calc/settlement";
import { formatIDR } from "@/lib/format";
import { Card } from "@/components/ui/Card";
import { Money } from "@/components/ui/Money";

function formatDate(date: string | null): string | null {
  if (!date) return null;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
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
  const totals = computeTotals(restaurant, items, mode, members.length);
  const dateLabel = formatDate(restaurant.date);
  const nameById = new Map(members.map((m) => [m.memberId, m.name]));

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
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold text-ink">{restaurant.name}</span>
          {dateLabel && <span className="text-xs text-ink-muted">{dateLabel}</span>}
        </span>
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
      <p className="label-caps mb-1 text-ink-muted">{t("report.title")}</p>
      <div className="flex flex-col">
        {restaurants.map((r) => (
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
    </Card>
  );
}
