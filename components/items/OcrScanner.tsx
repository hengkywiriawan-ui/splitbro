"use client";

import { useRef, useState } from "react";
import { useT } from "@/lib/i18n/provider";
import { useOcr, type ParsedItem } from "@/lib/ocr/use-ocr";
import { Button } from "@/components/ui/Button";
import { Money } from "@/components/ui/Money";

export function OcrScanner({
  onAddItems,
}: {
  onAddItems: (items: ParsedItem[]) => void;
}) {
  const { t } = useT();
  const { state, progress, items, error, scan, reset } = useOcr();
  const fileRef = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    scan(file);
    e.target.value = "";
  }

  function toggleItem(i: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  function handleConfirm() {
    onAddItems(items.filter((_, i) => selected.has(i)));
    reset();
    setSelected(new Set());
  }

  function handleReset() {
    reset();
    setSelected(new Set());
  }

  if (state === "idle" || state === "error") {
    return (
      <div className="flex flex-col gap-1">
        <Button variant="outline" onClick={() => fileRef.current?.click()}>
          📷 {t("ocr.scan")}
        </Button>
        {state === "error" && error && (
          <p className="text-sm text-danger">{t("ocr.error")}</p>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFile}
        />
      </div>
    );
  }

  if (state === "loading" || state === "scanning") {
    return (
      <div className="flex flex-col gap-2 rounded-lg border border-border-subtle bg-card p-4">
        <p className="text-sm text-ink-muted">{t("ocr.scanning")}</p>
        <div className="h-2 overflow-hidden rounded-full bg-surface-gray">
          <div
            className="h-full bg-gold transition-all duration-200"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border-subtle bg-card p-4">
      <p className="font-semibold text-ink">{t("ocr.draft.title")}</p>
      {items.length === 0 ? (
        <p className="text-sm text-ink-muted">{t("ocr.draft.empty")}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((item, i) => (
            <label
              key={i}
              className="flex cursor-pointer items-center gap-3 py-1"
            >
              <input
                type="checkbox"
                checked={selected.has(i)}
                onChange={() => toggleItem(i)}
                className="h-4 w-4 accent-gold"
              />
              <span className="flex-1 truncate text-sm font-medium text-ink">
                {item.name}
              </span>
              <Money amount={item.price} tone="primary" />
            </label>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        {selected.size > 0 && (
          <Button onClick={handleConfirm}>
            {t("ocr.draft.confirm")} ({selected.size})
          </Button>
        )}
        <Button variant="ghost" onClick={handleReset}>
          {t("common.cancel")}
        </Button>
      </div>
    </div>
  );
}
