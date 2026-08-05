import axios from "axios";

/**
 * Payload for the Blockscout verification endpoint.
 */
export interface VerificationPayload {
  /** Blockscout explorer base URL (e.g. https://blockscout.previewnet.tezosx.nomadic-labs.com) */
  blockscout_url: string;
  /** Chain identifier (e.g. "tezos-x-previewnet") */
  chain: string;
  /** Deployed contract address */
  address: string;
  /** Contract type label (e.g. "LaunchpadERC20Plain", "LaunchpadPresale") */
  contract_type: string;
  /** License type identifier (e.g. "mit") */
  license_type: string;
  /** Whether to auto-detect constructor arguments from the deployment tx */
  autodetect_constructor_args: boolean;
}

/**
 * Response from the verification server.
 */
export interface VerificationResponse {
  success: boolean;
  message?: string;
  error?: string;
}

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_VERIFICATION_API_URL ?? "/api/verify",
  timeout: 30_000,
});

/**
 * Submit a contract for verification on Blockscout via the local verification server.
 *
 * The request is sent as `multipart/form-data` with the metadata fields as form fields.
 * The server generates the source code internally, so no file is attached.
 */
export async function submitVerification(
  payload: VerificationPayload,
): Promise<VerificationResponse> {
  const formData = new FormData();
  formData.append("blockscout_url", payload.blockscout_url);
  formData.append("chain", payload.chain);
  formData.append("address", payload.address);
  formData.append("contract_type", payload.contract_type);
  formData.append("license_type", payload.license_type);
  formData.append("autodetect_constructor_args", String(payload.autodetect_constructor_args));

  const { data } = await apiClient.post<VerificationResponse>("", formData);
  return data;
}