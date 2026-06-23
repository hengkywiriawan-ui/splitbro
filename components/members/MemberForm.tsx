"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export interface MemberFormValues {
  name: string;
  email: string | null;
  phone: string | null;
  deposit: number;
  isDriver: boolean;
}

export function MemberForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: Partial<MemberFormValues>;
  onSubmit: (values: MemberFormValues) => void;
  onCancel?: () => void;
}) {
  const { t } = useT();
  const [name, setName] = useState(initial?.name ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [deposit, setDeposit] = useState(String(initial?.deposit ?? 0));
  const [isDriver, setIsDriver] = useState(initial?.isDriver ?? false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError(t("member.field.name.required"));
      return;
    }
    setError(null);
    const parsed = parseInt(deposit, 10);
    onSubmit({
      name: name.trim(),
      email: email.trim() || null,
      phone: phone.trim() || null,
      deposit: Number.isNaN(parsed) || parsed < 0 ? 0 : parsed,
      isDriver,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">{t("member.field.name")}</span>
        <Input value={name} onChange={(e) => setName(e.target.value)} aria-label={t("member.field.name")} />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">{t("member.field.email")}</span>
        <Input
          type="email"
          value={email ?? ""}
          onChange={(e) => setEmail(e.target.value)}
          aria-label={t("member.field.email")}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">{t("member.field.phone")}</span>
        <Input value={phone ?? ""} onChange={(e) => setPhone(e.target.value)} aria-label={t("member.field.phone")} />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">{t("member.field.deposit")}</span>
        <Input
          type="number"
          min="0"
          value={deposit}
          onChange={(e) => setDeposit(e.target.value)}
          aria-label={t("member.field.deposit")}
        />
      </label>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={isDriver}
          onChange={(e) => setIsDriver(e.target.checked)}
          className="h-4 w-4 accent-gold"
        />
        <span className="text-sm font-medium">{t("member.field.isDriver")}</span>
      </label>
      <p className="text-xs text-ink-muted">{t("member.field.isDriver.hint")}</p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit">{t("common.save")}</Button>
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            {t("common.cancel")}
          </Button>
        )}
      </div>
    </form>
  );
}
