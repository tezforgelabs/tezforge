export interface UploadResult {
  ipfsHash: string;
  gatewayUrl: string;
}

const unavailableMessage =
  "NFT uploads are unavailable.";

export function isPinataConfigured(): boolean {
  return false;
}

export async function uploadImage(
  _file: File,
  _onProgress?: (percent: number) => void,
): Promise<UploadResult> {
  void _file;
  void _onProgress;
  throw new Error(unavailableMessage);
}

export async function uploadMetadata(
  _metadata: Record<string, unknown>,
): Promise<UploadResult> {
  void _metadata;
  throw new Error(unavailableMessage);
}
