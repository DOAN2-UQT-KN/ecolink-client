import { IBaseResponse } from "@/types/BaseResponse";

/** Signed upload params: only `public_id` and `timestamp` are signed. */
export interface ICaptureUpload {
  upload_url: string;
  cloud_name: string;
  api_key: string;
  timestamp: number;
  signature: string;
  public_id: string;
}

export type ICreateCaptureResponse = IBaseResponse<{
  capture_id: string;
  expires_at: string;
  upload: ICaptureUpload;
}>;
