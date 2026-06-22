"use client";

import { useT } from "@/lib/i18n/provider";
import { Button } from "./Button";

export function LangToggle() {
  const { lang, setLang, t } = useT();
  return (
    <Button variant="secondary" onClick={() => setLang(lang === "id" ? "en" : "id")}>
      {t("lang.toggle")}
    </Button>
  );
}
