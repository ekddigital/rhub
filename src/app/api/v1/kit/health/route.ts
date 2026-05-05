import { kitJson, kitOptions } from "@/lib/kit/http";

export function OPTIONS() {
  return kitOptions();
}

export async function GET() {
  return kitJson({ ok: true, service: "kit", time: new Date().toISOString() });
}
