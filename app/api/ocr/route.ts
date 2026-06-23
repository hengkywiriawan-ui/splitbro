import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

type ParsedItem = { name: string; price: number };

const GEMINI_MODEL = "gemini-2.5-flash";

const PROMPT = `You are a receipt parser. Look at this receipt image and extract ONLY the orderable line items (food, drinks, products).

For each item return:
- "name": the item name as printed (string)
- "price": the line TOTAL price in Indonesian Rupiah as a plain integer — no thousand separators, no decimals. If a quantity is shown, this is the total for that line (qty × unit price).

IGNORE these lines entirely: subtotal, total, grand total, tax/PPN/pajak, service charge, rounding/pembulatan, payment, cash/tunai, change/kembalian, discount/diskon, and any header/footer text.

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

  const form = await req.formData();
  const file = form.get("image");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "no image" }, { status: 400 });
  }

  const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
  const mimeType = file.type || "image/jpeg";

  const body = {
    contents: [
      {
        parts: [
          { text: PROMPT },
          { inline_data: { mime_type: mimeType, data: base64 } },
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
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
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
