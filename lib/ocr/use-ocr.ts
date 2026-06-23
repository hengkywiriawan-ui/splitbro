"use client";

import { useCallback, useState } from "react";

export type OcrState = "idle" | "loading" | "scanning" | "done" | "error";
export type ParsedItem = { name: string; price: number };

// --- Image preprocessing (biggest accuracy win for Tesseract on receipts) ---

const MIN_LONG_EDGE = 1000; // upscale small crops so chars are tall enough
const MAX_LONG_EDGE = 2000; // cap to bound mobile memory
const MIN_PRICE = 100; // ignore qty/line-numbers picked up as price

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("image load failed"));
    };
    img.src = url;
  });
}

function otsuThreshold(hist: number[], total: number): number {
  let sum = 0;
  for (let i = 0; i < 256; i++) sum += i * hist[i];
  let sumB = 0;
  let wB = 0;
  let maxVar = 0;
  let threshold = 127;
  for (let t = 0; t < 256; t++) {
    wB += hist[t];
    if (wB === 0) continue;
    const wF = total - wB;
    if (wF === 0) break;
    sumB += t * hist[t];
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;
    const between = wB * wF * (mB - mF) * (mB - mF);
    if (between > maxVar) {
      maxVar = between;
      threshold = t;
    }
  }
  return threshold;
}

// Upscale → grayscale → Otsu binarize. Returns a clean black/white canvas.
async function preprocess(file: File): Promise<HTMLCanvasElement> {
  const img = await loadImage(file);
  const longEdge = Math.max(img.width, img.height);
  let scale = 1;
  if (longEdge < MIN_LONG_EDGE) scale = MIN_LONG_EDGE / longEdge;
  if (longEdge * scale > MAX_LONG_EDGE) scale = MAX_LONG_EDGE / longEdge;

  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    URL.revokeObjectURL(img.src);
    throw new Error("canvas unsupported");
  }
  ctx.drawImage(img, 0, 0, w, h);
  URL.revokeObjectURL(img.src);

  const imageData = ctx.getImageData(0, 0, w, h);
  const d = imageData.data;
  const pixels = w * h;
  const gray = new Uint8ClampedArray(pixels);
  const hist = new Array(256).fill(0);
  for (let i = 0, p = 0; i < d.length; i += 4, p++) {
    const g = (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114) | 0;
    gray[p] = g;
    hist[g]++;
  }
  const t = otsuThreshold(hist, pixels);
  for (let i = 0, p = 0; i < d.length; i += 4, p++) {
    const v = gray[p] < t ? 0 : 255;
    d[i] = v;
    d[i + 1] = v;
    d[i + 2] = v;
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

// --- Receipt text parsing ---

// Lines that are totals/taxes/payment, not orderable items.
const JUNK_PATTERNS = [
  "subtotal",
  "sub total",
  "total",
  "ppn",
  "pajak",
  "tax",
  "service",
  "tunai",
  "cash",
  "kembali",
  "change",
  "diskon",
  "discount",
  "bayar",
  "jumlah",
  "qty",
  "struk",
  "kasir",
  "meja",
  "tanggal",
  "npwp",
  "terima kasih",
  "thank",
];

function isJunkLine(lower: string): boolean {
  return JUNK_PATTERNS.some((p) => lower.includes(p));
}

function parsePrice(token: string): number | null {
  let s = token.replace(/[^\d.,]/g, "");
  // drop a trailing 2-digit decimal part (",00" / ".00")
  s = s.replace(/[.,]\d{2}$/, "");
  // remaining dots/commas are thousand separators
  s = s.replace(/[.,]/g, "");
  const n = parseInt(s, 10);
  return Number.isNaN(n) || n < MIN_PRICE ? null : n;
}

function parseReceiptText(text: string): ParsedItem[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .flatMap((line) => {
      if (isJunkLine(line.toLowerCase())) return [];

      // price = right-most number group on the line
      const priceMatch = line.match(/(\d[\d.,]*)\s*$/);
      if (!priceMatch || priceMatch.index === undefined) return [];

      const price = parsePrice(priceMatch[1]);
      if (price === null) return [];

      // name = everything before the price, minus a leading qty ("2", "2x")
      const name = line
        .slice(0, priceMatch.index)
        .replace(/^\s*\d+\s*[xX]?\s*/, "")
        .trim();

      // require a real name (has letters, not just punctuation/digits)
      if (name.length < 2 || !/[a-zA-Z]/.test(name)) return [];

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
      const { createWorker, PSM } = await import("tesseract.js");

      // Preprocess; fall back to the raw file if canvas processing fails.
      let source: HTMLCanvasElement | File = file;
      try {
        source = await preprocess(file);
      } catch {
        source = file;
      }

      setState("scanning");
      const worker = await createWorker("ind+eng", 1, {
        logger: (m: { status: string; progress: number }) => {
          if (m.status === "recognizing text") setProgress(m.progress);
        },
      });
      await worker.setParameters({
        tessedit_pageseg_mode: PSM.SINGLE_COLUMN, // variable-size single column (receipt)
        preserve_interword_spaces: "1", // keep the gap between item name and price
      });
      const {
        data: { text },
      } = await worker.recognize(source);
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
