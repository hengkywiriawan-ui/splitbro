import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

export const runtime = "nodejs";
export const maxDuration = 30;

type ParsedItem = { name: string; price: number };

// Claude Haiku 4.5 is vision-capable, fast, and cheap. Switch to
// "claude-sonnet-4-6" for maximum accuracy at higher cost.
const CLAUDE_MODEL = "claude-haiku-4-5-20251001";

// Anthropic recommends the long edge <= 1568px; larger images cost more tokens
// without improving accuracy. .rotate() applies EXIF orientation (phone photos).
const MAX_EDGE = 1568;

const PROMPT = `This image is a receipt. Extract ONLY the orderable line items (food, drinks, products).

For each item provide:
- name: the item name as printed
- price: the line TOTAL in Indonesian Rupiah as a plain integer (no separators, no decimals). If a quantity is shown, this is the line total (qty x unit price).

IGNORE: subtotal, total, grand total, tax/PPN/pajak, service charge, rounding/pembulatan, payment, cash/tunai, change/kembalian, discount/diskon, and any header/footer text.

Call the record_items tool with the result. If you cannot read any items, return an empty list.`;

const RECORD_ITEMS_TOOL = {
  name: "record_items",
  description: "Record the line items read from the receipt.",
  input_schema: {
    type: "object" as const,
    properties: {
      items: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            price: { type: "number" },
          },
          required: ["name", "price"],
        },
      },
    },
    required: ["items"],
  },
};

function toItem(raw: unknown): ParsedItem | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const name = String(r.name ?? "").trim();
  const price = Math.round(Number(r.price));
  if (!name || !Number.isFinite(price) || price <= 0) return null;
  return { name, price };
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ocr not configured" }, { status: 500 });
  }

  const form = await req.formData();
  const file = form.get("image");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "no image" }, { status: 400 });
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
    model: CLAUDE_MODEL,
    max_tokens: 2048,
    tools: [RECORD_ITEMS_TOOL],
    tool_choice: { type: "tool", name: "record_items" },
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: "image/jpeg", data: base64 } },
          { type: "text", text: PROMPT },
        ],
      },
    ],
  };

  let res: Response;
  try {
    res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });
  } catch {
    return NextResponse.json({ error: "claude unreachable" }, { status: 502 });
  }

  if (!res.ok) {
    return NextResponse.json({ error: "claude error" }, { status: 502 });
  }

  const data = (await res.json()) as {
    content?: { type: string; name?: string; input?: unknown }[];
  };
  const toolUse = data.content?.find((b) => b.type === "tool_use" && b.name === "record_items");
  const rawItems = (toolUse?.input as { items?: unknown[] } | undefined)?.items;

  const items: ParsedItem[] = Array.isArray(rawItems)
    ? rawItems.map(toItem).filter((it): it is ParsedItem => it !== null)
    : [];

  return NextResponse.json({ items });
}
