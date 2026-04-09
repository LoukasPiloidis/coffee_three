import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createHmac, timingSafeEqual } from "node:crypto";
import { KEYSTATIC_CACHE_TAG } from "@/lib/menu";

// POST /api/keystatic-webhook
//
// Target of a GitHub webhook on the repo that Keystatic Cloud commits to.
// When the CMS user hits "Save", Keystatic Cloud commits to GitHub, GitHub
// fires this webhook, and we invalidate every `getMenu` / `getItem` /
// `getSettings` cache entry with a single `revalidateTag` call.
//
// Configure the webhook in GitHub:
//   Repo → Settings → Webhooks → Add webhook
//   Payload URL:  https://<your-domain>/api/keystatic-webhook
//   Content type: application/json
//   Secret:       same value as KEYSTATIC_WEBHOOK_SECRET in .env
//   Events:       "Just the push event"
//
// See deployment.md §15 for the full setup flow.

export const dynamic = "force-dynamic";

function verifySignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string
): boolean {
  if (!signatureHeader?.startsWith("sha256=")) return false;
  const expected = createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  const received = signatureHeader.slice("sha256=".length);
  const expectedBuf = Buffer.from(expected, "hex");
  const receivedBuf = Buffer.from(received, "hex");
  if (expectedBuf.length !== receivedBuf.length) return false;
  return timingSafeEqual(expectedBuf, receivedBuf);
}

export async function POST(req: Request) {
  const secret = process.env.KEYSTATIC_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "webhook_not_configured" },
      { status: 503 }
    );
  }

  const rawBody = await req.text();

  // GitHub sends X-Hub-Signature-256: sha256=<hex>
  const signature = req.headers.get("x-hub-signature-256");
  if (!verifySignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

  // GitHub pings the webhook once on creation with event=ping. Accept it so
  // the "Recent Deliveries" tab shows green.
  const event = req.headers.get("x-github-event");
  if (event === "ping") {
    return NextResponse.json({ ok: true, pong: true });
  }

  // For push events, only revalidate when `content/` (or an image) actually
  // changed. Other pushes (code changes, README edits) don't need to bust
  // the menu cache. We best-effort-parse the payload and fall back to
  // revalidating on any parse failure so we never miss a real update.
  let shouldRevalidate = true;
  try {
    const payload = JSON.parse(rawBody) as {
      commits?: { added?: string[]; removed?: string[]; modified?: string[] }[];
    };
    const changed = new Set<string>();
    for (const c of payload.commits ?? []) {
      for (const p of [
        ...(c.added ?? []),
        ...(c.removed ?? []),
        ...(c.modified ?? []),
      ]) {
        changed.add(p);
      }
    }
    if (changed.size > 0) {
      shouldRevalidate = Array.from(changed).some(
        (p) => p.startsWith("content/") || p.startsWith("public/menu-images/")
      );
    }
  } catch {
    // payload not JSON or malformed — revalidate to be safe
  }

  if (shouldRevalidate) {
    // Next 16's revalidateTag takes a cacheLife profile as the second arg.
    // `{ expire: 0 }` means "expire immediately" — next read refetches from
    // GitHub instead of serving stale.
    revalidateTag(KEYSTATIC_CACHE_TAG, { expire: 0 });
  }

  return NextResponse.json({ ok: true, revalidated: shouldRevalidate });
}
