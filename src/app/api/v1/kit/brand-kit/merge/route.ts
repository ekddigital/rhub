import { mergeBrandKit } from "@/lib/creative/brand-kit";
import {
  mergeBrandKitBodySchema,
} from "@/lib/kit/brand-kit-zod";
import { kitJson, kitError, kitOptions } from "@/lib/kit/http";

export function OPTIONS() {
  return kitOptions();
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return kitError("Invalid JSON body", 400);
  }

  const parsed = mergeBrandKitBodySchema.safeParse(body);
  if (!parsed.success) {
    return kitError(parsed.error.message, 400);
  }

  const merged = mergeBrandKit(parsed.data.base, parsed.data.override);
  return kitJson({ brandKit: merged });
}
