export async function uploadImageClient(
  _file: File,
  _opts?: { folder?: string; entityType?: string; entityId?: string }
): Promise<{ url: string; fileId?: string }> {
  throw new Error("uploadImageClient not wired in rhub creative shims yet");
}
