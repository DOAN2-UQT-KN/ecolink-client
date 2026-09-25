import { IBaseResponse } from "@/types/BaseResponse";
import { ApplicationDocType } from "./application";

export interface IPresignDocumentRequest {
  doc_type: ApplicationDocType;
  file_name: string;
  mime_type: string;
  size_bytes: number;
}

export type IPresignDocumentResponse = IBaseResponse<{
  document_id: string;
  upload_url: string;
  /** Signed fields that must accompany the file, exactly as given. */
  fields: Record<string, string>;
  expires_at: string;
}>;
