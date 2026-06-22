"use client";

import { useState } from "react";
import type { PaymentInfo } from "@/lib/types";
import { useT } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function PaymentInfoForm({
  initial,
  onSubmit,
}: {
  initial: PaymentInfo;
  onSubmit: (info: PaymentInfo) => void;
}) {
  const { t } = useT();
  const [bankName, setBankName] = useState(initial.bankName ?? "");
  const [accountNumber, setAccountNumber] = useState(initial.accountNumber ?? "");
  const [accountName, setAccountName] = useState(initial.accountName ?? "");
  const [ewallet, setEwallet] = useState(initial.ewallet ?? "");
  const [note, setNote] = useState(initial.note ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      bankName: bankName.trim() || null,
      accountNumber: accountNumber.trim() || null,
      accountName: accountName.trim() || null,
      ewallet: ewallet.trim() || null,
      note: note.trim() || null,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">{t("payment.field.bankName")}</span>
        <Input value={bankName} onChange={(e) => setBankName(e.target.value)} />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">{t("payment.field.accountNumber")}</span>
        <Input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">{t("payment.field.accountName")}</span>
        <Input value={accountName} onChange={(e) => setAccountName(e.target.value)} />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">{t("payment.field.ewallet")}</span>
        <Input value={ewallet} onChange={(e) => setEwallet(e.target.value)} />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">{t("payment.field.note")}</span>
        <Input value={note} onChange={(e) => setNote(e.target.value)} />
      </label>
      <Button type="submit">{t("common.save")}</Button>
    </form>
  );
}
