import { kitSurfaces } from "@/lib/kit/tools-config";
import { kitJson, kitOptions } from "@/lib/kit/http";

export function OPTIONS() {
  return kitOptions();
}

export async function GET() {
  return kitJson({ surfaces: kitSurfaces });
}
