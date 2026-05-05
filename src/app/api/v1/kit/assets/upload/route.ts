import { uploadFileToEKDDigitalAssets } from "@/lib/conf/assets";
import { kitJson, kitError, kitOptions } from "@/lib/kit/http";
import { getKitSession } from "@/lib/kit/session";

const ASSET_TYPE_MAP: Record<
  string,
  "image" | "video" | "document" | "other"
> = {
  image: "image",
  images: "image",
  video: "video",
  videos: "video",
  document: "document",
  documents: "document",
  other: "other",
};

export function OPTIONS() {
  return kitOptions();
}

export async function POST(req: Request) {
  const session = await getKitSession();
  if (!session?.user) {
    return kitError("Authentication required", 401);
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return kitError("Expected multipart form data", 400);
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return kitError("Missing file field", 400);
  }

  const assetTypeRaw = (form.get("asset_type") as string) || "image";
  const assetType = ASSET_TYPE_MAP[assetTypeRaw.toLowerCase()] ?? "image";
  const projectName = (form.get("project_name") as string) || undefined;
  const clientId = (form.get("client_id") as string) || undefined;
  const source = (form.get("source") as string) || "kit-upload";

  try {
    const result = await uploadFileToEKDDigitalAssets({
      file,
      assetType,
      projectName,
      clientId,
      source,
      requestId: crypto.randomUUID(),
    });

    return kitJson({
      id: result.id,
      url: result.publicUrl,
      public_url: result.publicUrl,
      download_url: result.downloadUrl,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    console.error("[kit.assets.upload.POST]", error);
    return kitError(message, 502);
  }
}
