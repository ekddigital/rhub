/**
 * Shared HTTP helpers for `/api/v1/kit/*` — CORS + JSON (DRY).
 * Set `KIT_API_CORS_ORIGIN` in production (e.g. `https://app.example.com`).
 */

import { NextResponse } from "next/server";

const CORS_ORIGIN = process.env.KIT_API_CORS_ORIGIN ?? "*";

export function kitApiHeaders(extra?: HeadersInit): HeadersInit {
  return {
    "Access-Control-Allow-Origin": CORS_ORIGIN,
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, X-API-Key, X-Requested-With",
    ...extra,
  };
}

export function kitJson<T>(data: T, init?: { status?: number }) {
  return NextResponse.json(data, {
    status: init?.status ?? 200,
    headers: kitApiHeaders(),
  });
}

export function kitError(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    { status, headers: kitApiHeaders() },
  );
}

export function kitOptions() {
  return new NextResponse(null, { status: 204, headers: kitApiHeaders() });
}
