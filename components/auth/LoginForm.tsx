"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/provider";
import { useT } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

export function LoginForm() {
  const { signInGoogle, signInEmail } = useAuth();
  const { t } = useT();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function go(action: () => Promise<void>) {
    try {
      setError(null);
      await action();
      router.push("/sessions");
    } catch {
      setError(t("login.error"));
    }
  }

  return (
    <Card className="mx-auto mt-16 w-full max-w-sm">
      <h1 className="mb-4 text-xl font-bold">{t("login.title")}</h1>
      <Button className="w-full" onClick={() => go(signInGoogle)}>
        {t("login.google")}
      </Button>
      <div className="my-4 h-px bg-gray-200" />
      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          void go(() => signInEmail(email, password));
        }}
      >
        <Input
          type="email"
          placeholder={t("login.email")}
          aria-label={t("login.email")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          type="password"
          placeholder={t("login.password")}
          aria-label={t("login.password")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" variant="secondary">
          {t("login.submit")}
        </Button>
      </form>
    </Card>
  );
}
