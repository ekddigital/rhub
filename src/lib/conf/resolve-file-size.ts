/**
 * Resolve upload size in bytes. Some mobile browsers report file.size as 0
 * until the blob is read.
 */
export async function resolveFileByteSize(file: File): Promise<number> {
  if (Number.isFinite(file.size) && file.size > 0) {
    return file.size;
  }

  try {
    const buffer = await file.arrayBuffer();
    if (buffer.byteLength > 0) {
      return buffer.byteLength;
    }
  } catch {
    // fall through
  }

  return file.size;
}
