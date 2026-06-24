"use client";

import { useCallback, useRef, useState } from "react";

export type OcrState = "idle" | "loading" | "scanning" | "done" | "error";
export type ParsedItem = { name: string; price: number };

// OCR runs server-side via /api/ocr (Gemini vision). The model reads the
// receipt and returns structured items directly — no client-side parsing.

export function useOcr() {
  const [state, setState] = useState<OcrState>("idle");
  const [progress, setProgress] = useState(0);
  const [items, setItems] = useState<ParsedItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const scan = useCallback(async (file: File) => {
    setState("loading");
    setProgress(0);
    setError(null);
    setItems([]);
    try {
      setState("scanning");
      // No granular progress from a single request — ease the bar toward 90%.
      setProgress(0.1);
      timerRef.current = setInterval(() => {
        setProgress((p) => (p < 0.9 ? p + (0.9 - p) * 0.15 : p));
      }, 300);

      const form = new FormData();
      form.append("image", file);

      // Attach the Firebase ID token so the server can authorize the call and
      // protect the OCR API key from anonymous abuse (firebase backend only).
      const headers: Record<string, string> = {};
      if ((process.env.NEXT_PUBLIC_BACKEND ?? "mock") === "firebase") {
        try {
          const { firebaseAuth } = await import("@/lib/firebase/config");
          const token = await firebaseAuth.currentUser?.getIdToken();
          if (token) headers.Authorization = `Bearer ${token}`;
        } catch {
          // no token available; the request will be rejected server-side
        }
      }

      const res = await fetch("/api/ocr", { method: "POST", body: form, headers });
      if (!res.ok) throw new Error("ocr request failed");

      const data = (await res.json()) as { items?: ParsedItem[] };
      stopTimer();
      setItems(Array.isArray(data.items) ? data.items : []);
      setProgress(1);
      setState("done");
    } catch {
      stopTimer();
      setError("ocr.error");
      setState("error");
    }
  }, []);

  const reset = useCallback(() => {
    stopTimer();
    setState("idle");
    setProgress(0);
    setItems([]);
    setError(null);
  }, []);

  return { state, progress, items, error, scan, reset };
}
