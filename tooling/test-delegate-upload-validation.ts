/**
 * Exercise delegate credential upload validation (same rules as API routes).
 *
 * Endpoints that use this validation:
 *   POST /api/conf/[confId]/delegates/[delegateId]/documents  (public — no session)
 *   POST /api/conf/[confId]/delegates/[delegateId]/self-documents  (participant cookie)
 *   POST /api/conf/[confId]/payments/[paymentId]/upload  (manager — proof uses travel-doc rules)
 *
 * Phase 1 — offline (always runs, no server):
 *   npm run test:delegate-uploads
 *
 * Phase 2 — HTTP smoke against a running app (optional):
 *   CONF_ID=cuid... DELEGATE_ID=cuid... BASE_URL=http://localhost:3000 \
 *     npm run test:delegate-uploads -- --http
 *
 * The HTTP check POSTs only a rejected payload (wrong type) so you can verify JSON
 * error bodies without requiring EKD Digital Assets credentials.
 * A successful binary upload may still return 500 if asset upload is not configured.
 *
 * Authenticated routes (self-documents, payment proof): extend this script with a
 * Cookie header from your browser, or exercise those flows in-app while logged in.
 */

import { Buffer } from "node:buffer";

import {
  CONFERENCE_UPLOAD_MAX_SIZE_BYTES,
  validateDelegateDocumentUpload,
  type DelegateDocumentKind,
} from "../src/lib/conf/upload-validation";

const PNG_1X1 = Uint8Array.from(
  Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAmmHcXQAAAABJRU5ErkJggg==",
    "base64",
  ),
);

/** Minimal valid GIF (1×1 transparent). */
const GIF_1X1 = Uint8Array.from(
  Buffer.from(
    "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
    "base64",
  ),
);

const MINIMAL_PDF = new Uint8Array(
  Buffer.from(
    "%PDF-1.1\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n",
    "latin1",
  ),
);

function file(name: string, bytes: Uint8Array, mime: string): File {
  return new File([new Uint8Array(bytes)], name, { type: mime });
}

function section(title: string) {
  console.log(`\n━━ ${title} ━━`);
}

async function runOfflineSuite(): Promise<{ pass: number; fail: number }> {
  let pass = 0;
  let fail = 0;

  function expect(ok: boolean, label: string, detail?: string) {
    if (ok) {
      pass++;
      console.log(`  ✓ ${label}`);
    } else {
      fail++;
      console.error(`  ✗ ${label}${detail ? ` — ${detail}` : ""}`);
    }
  }

  section("Travel docs (passport / stamp / visa)");

  const pngOk = file("passport.png", PNG_1X1, "image/png");
  let r = validateDelegateDocumentUpload(pngOk, "passport");
  expect(r.ok, "PNG accepted for passport", r.error);

  const pdfOk = file("scan.pdf", MINIMAL_PDF, "application/pdf");
  r = validateDelegateDocumentUpload(pdfOk, "visa");
  expect(r.ok, "PDF accepted for visa", r.error);

  const pngOctet = file("mystery.png", PNG_1X1, "application/octet-stream");
  r = validateDelegateDocumentUpload(pngOctet, "passport");
  expect(r.ok, "PNG with octet-stream infers from .png extension", r.error);

  const badTxt = file("notes.txt", new TextEncoder().encode("hello"), "text/plain");
  r = validateDelegateDocumentUpload(badTxt, "passport");
  expect(
    !r.ok && Boolean(r.error?.includes("not an accepted type")),
    "Plain text rejected for passport",
    r.error,
  );
  if (!r.ok) console.log(`      → ${r.error}`);

  const heic = file("IMG_1234.heic", PNG_1X1, "image/heic");
  r = validateDelegateDocumentUpload(heic, "passport");
  expect(
    !r.ok,
    "HEIC MIME rejected even if bytes look like image",
    r.error,
  );
  if (!r.ok) console.log(`      → ${r.error}`);

  const bookletPdf = file("face.pdf", MINIMAL_PDF, "application/pdf");
  r = validateDelegateDocumentUpload(bookletPdf, "booklet");
  expect(!r.ok, "PDF rejected for booklet photo", r.error);
  if (!r.ok) console.log(`      → ${r.error}`);

  section("Booklet photo (images only)");

  const gifOk = file("booklet.gif", GIF_1X1, "image/gif");
  r = validateDelegateDocumentUpload(gifOk, "booklet");
  expect(r.ok, "GIF accepted for booklet", r.error);

  section("Size limit");

  const tooBig = new Uint8Array(CONFERENCE_UPLOAD_MAX_SIZE_BYTES + 1);
  tooBig.fill(0x4e);
  const hugePng = file("huge.png", tooBig, "image/png");
  r = validateDelegateDocumentUpload(hugePng, "passport");
  expect(
    !r.ok && Boolean(r.error?.toLowerCase().includes("large")),
    "Oversize file rejected",
    r.error,
  );
  if (!r.ok) console.log(`      → ${r.error}`);

  section("Every kind accepts small PNG");

  const kinds: DelegateDocumentKind[] = [
    "passport",
    "entry-stamp",
    "visa",
    "booklet",
  ];
  for (const kind of kinds) {
    const small = file(`${kind}.png`, PNG_1X1, "image/png");
    const vr = validateDelegateDocumentUpload(small, kind);
    expect(vr.ok, `kind=${kind}`, vr.error);
  }

  return { pass, fail };
}

async function runHttpInvalidProbe(): Promise<void> {
  const base = (process.env.BASE_URL || "http://localhost:3000").replace(/\/$/, "");
  const confId = process.env.CONF_ID || "";
  const delegateId = process.env.DELEGATE_ID || "";

  if (!confId || !delegateId) {
    console.error(
      "\nHTTP probe skipped: set CONF_ID and DELEGATE_ID (cuid strings from your DB).",
    );
    return;
  }

  section(`HTTP invalid upload → ${base}/api/conf/.../documents`);

  const bad = file("reject-me.txt", new TextEncoder().encode("not an image"), "text/plain");
  const fd = new FormData();
  fd.append("kind", "passport");
  fd.append("file", bad);

  const url = `${base}/api/conf/${confId}/delegates/${delegateId}/documents`;
  const res = await fetch(url, { method: "POST", body: fd });
  const text = await res.text();
  let body: unknown = text;
  try {
    body = JSON.parse(text) as Record<string, unknown>;
  } catch {
    /* plain text */
  }

  console.log(`  Status: ${res.status}`);
  console.log(`  Body:`, JSON.stringify(body, null, 2));

  if (res.status !== 400) {
    console.error(
      "  ✗ Expected HTTP 400 for invalid passport file type (got " + res.status + ")",
    );
    process.exitCode = 1;
    return;
  }

  const err =
    typeof body === "object" && body !== null && "error" in body
      ? String((body as { error: unknown }).error)
      : text;
  if (!err.toLowerCase().includes("accepted")) {
    console.warn("  ⚠ Error text might be unexpected; check message clarity:", err.slice(0, 200));
  } else {
    console.log("  ✓ Got 400 with validation-style error message.");
  }
}

async function main() {
  const wantsHttp = process.argv.includes("--http");

  console.log("Delegate upload validation self-test");
  console.log("(uses src/lib/conf/upload-validation.ts — same logic as API routes)\n");

  const { pass, fail } = await runOfflineSuite();

  console.log(`\nOffline summary: ${pass} passed, ${fail} failed`);
  if (fail > 0) {
    process.exitCode = 1;
    return;
  }

  if (wantsHttp) {
    await runHttpInvalidProbe();
  } else {
    console.log(
      "\nTip: run with --http and CONF_ID / DELEGATE_ID to POST a bad file to the live /documents route.",
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
