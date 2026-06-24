import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

export const runtime = "nodejs";
export const maxDuration = 30;

type ParsedItem = { name: string; price: number };

const GEMINI_MODEL = "gemini-2.5-flash";

// Long edge cap: smaller images cost fewer tokens; .rotate() applies EXIF
// orientation so sideways phone photos are read upright (big accuracy win).
const MAX_EDGE = 1568;

// Reject oversized uploads before reading the whole body into memory.
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

// In firebase mode the route spends the OCR API key, so require a valid Firebase
// ID token (admin login) — otherwise anyone could drain the quota/billing.
async function isAuthorized(req: NextRequest): Promise<boolean> {
  const backend = process.env.NEXT_PUBLIC_BACKEND ?? "mock";
  if (backend !== "firebase") return true;
  const match = (req.headers.get("authorization") ?? "").match(/^Bearer (.+)$/);
  if (!match) return false;
  try {
    const { getAdminAuth } = await import("@/lib/firebase/admin");
    await getAdminAuth().verifyIdToken(match[1]);
    return true;
  } catch {
    return false;
  }
}

const PROMPT = `This image is a receipt. Extract ONLY the orderable line items (food, drinks, products).

For each item return:
- "name": the item name as printed
- "price": the line TOTAL in Indonesian Rupiah as a plain integer (no separators, no decimals). If a quantity is shown, this is the line total (qty x unit price).

IGNORE: subtotal, total, grand total, tax/PPN/pajak, service charge, rounding/pembulatan, payment, cash/tunai, change/kembalian, discount/diskon, and any header/footer text.

Return a JSON array. If you cannot read any items, return an empty array.`;

function toItem(raw: unknown): ParsedItem | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const name = String(r.name ?? "").trim();
  const price = Math.round(Number(r.price));
  if (!name || !Number.isFinite(price) || price <= 0) return null;
  return { name, price };
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ocr not configured" }, { status: 500 });
  }

  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("image");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "no image" }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "image too large" }, { status: 413 });
  }

  let base64: string;
  try {
    const input = Buffer.from(await file.arrayBuffer());
    const processed = await sharp(input)
      .rotate()
      .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();
    base64 = processed.toString("base64");
  } catch {
    return NextResponse.json({ error: "image processing failed" }, { status: 400 });
  }

  const body = {
    contents: [
      {
        parts: [
          { text: PROMPT },
          { inline_data: { mime_type: "image/jpeg", data: base64 } },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            name: { type: "STRING" },
            price: { type: "NUMBER" },
          },
          required: ["name", "price"],
        },
      },
    },
  };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify(body),
    });
  } catch {
    return NextResponse.json({ error: "gemini unreachable" }, { status: 502 });
  }

  if (!res.ok) {
    return NextResponse.json({ error: "gemini error" }, { status: 502 });
  }

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== "string") {
    return NextResponse.json({ items: [] });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return NextResponse.json({ items: [] });
  }

  const items: ParsedItem[] = Array.isArray(parsed)
    ? parsed.map(toItem).filter((it): it is ParsedItem => it !== null)
    : [];

  return NextResponse.json({ items });
}
