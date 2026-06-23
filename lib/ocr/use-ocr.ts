"use client";

import { useCallback, useState } from "react";

export type OcrState = "idle" | "loading" | "scanning" | "done" | "error";
export type ParsedItem = { name: string; price: number };

function parseReceiptText(text: string): ParsedItem[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .flatMap((line) => {
      const m = line.match(/^(.+?)\s+([\d.,]+)\s*$/);
      if (!m) return [];
      const name = m[1].trim();
      const raw = m[2].replace(/\./g, "").replace(/,/g, "");
      const price = parseInt(raw, 10);
      if (!name || isNaN(price) || price <= 0) return [];
      return [{ name, price }];
    });
}

export function useOcr() {
  const [state, setState] = useState<OcrState>("idle");
  const [progress, setProgress] = useState(0);
  const [items, setItems] = useState<ParsedItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const scan = useCallback(async (file: File) => {
    setState("loading");
    setProgress(0);
    setError(null);
    setItems([]);
    try {
      const { createWorker } = await import("tesseract.js");
      setState("scanning");
      const worker = await createWorker("ind+eng", 1, {
        logger: (m: { status: string; progress: number }) => {
          if (m.status === "recognizing text") setProgress(m.progress);
        },
      });
      const {
        data: { text },
      } = await worker.recognize(file);
      await worker.terminate();
      setItems(parseReceiptText(text));
      setState("done");
    } catch {
      setError("ocr.error");
      setState("error");
    }
  }, []);

  const reset = useCallback(() => {
    setState("idle");
    setProgress(0);
    setItems([]);
    setError(null);
  }, []);

  return { state, progress, items, error, scan, reset };
}
