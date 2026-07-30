const PINATA_API = "https://api.pinata.cloud";
const PINATA_JWT = import.meta.env.VITE_PINATA_JWT ?? "";
const PINATA_GATEWAY =
  import.meta.env.VITE_PINATA_GATEWAY ?? "https://gateway.pinata.cloud/ipfs";

export function isPinataConfigured(): boolean {
  return PINATA_JWT.length > 0;
}

export interface UploadResult {
  ipfsHash: string;
  gatewayUrl: string;
}

/**
 * Upload an image file to IPFS via Pinata.
 * Returns the IPFS CID and a gateway URL.
 */
export async function uploadImage(
  file: File,
  onProgress?: (percent: number) => void
): Promise<UploadResult> {
  if (!isPinataConfigured()) {
    throw new Error(
      "Pinata is not configured. Set VITE_PINATA_JWT in your .env file."
    );
  }

  const formData = new FormData();
  formData.append("file", file);

  // Optional pinata metadata
  formData.append(
    "pinataMetadata",
    JSON.stringify({
      name: `tezforge-nft-${Date.now()}`,
    })
  );

  const xhr = new XMLHttpRequest();

  const result = await new Promise<UploadResult>((resolve, reject) => {
    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve({
            ipfsHash: data.IpfsHash,
            gatewayUrl: `${PINATA_GATEWAY}/${data.IpfsHash}`,
          });
        } catch {
          reject(new Error("Failed to parse Pinata response"));
        }
      } else {
        try {
          const err = JSON.parse(xhr.responseText);
          reject(new Error(err.error?.message ?? err.message ?? "Upload failed"));
        } catch {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      }
    });

    xhr.addEventListener("error", () => reject(new Error("Network error during upload")));
    xhr.addEventListener("abort", () => reject(new Error("Upload aborted")));

    xhr.open("POST", `${PINATA_API}/pinning/pinFileToIPFS`);
    xhr.setRequestHeader("Authorization", `Bearer ${PINATA_JWT}`);
    xhr.send(formData);
  });

  return result;
}

/**
 * Upload a JSON metadata object to IPFS via Pinata.
 * Returns the IPFS CID and a gateway URL.
 */
export async function uploadMetadata(
  metadata: Record<string, unknown>
): Promise<UploadResult> {
  if (!isPinataConfigured()) {
    throw new Error(
      "Pinata is not configured. Set VITE_PINATA_JWT in your .env file."
    );
  }

  const response = await fetch(`${PINATA_API}/pinning/pinJSONToIPFS`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${PINATA_JWT}`,
    },
    body: JSON.stringify({
      pinataMetadata: {
        name: `tezforge-metadata-${Date.now()}`,
      },
      pinataContent: metadata,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message ?? err.message ?? "Metadata upload failed");
  }

  const data = await response.json();
  return {
    ipfsHash: data.IpfsHash,
    gatewayUrl: `${PINATA_GATEWAY}/${data.IpfsHash}`,
  };
}