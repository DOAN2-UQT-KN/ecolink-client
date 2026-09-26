import axios from "axios";
import requestApi from "@/utils/requestApi";
import {
  IPresignDocumentRequest,
  IPresignDocumentResponse,
} from "./models/presignDocument";

/** Upload slot while the application is editable; the tracking link authorises it. */
export const presignDocumentForApplication = async ({
  applicationId,
  trackingToken,
  data,
}: {
  applicationId: string;
  trackingToken: string;
  data: IPresignDocumentRequest;
}): Promise<IPresignDocumentResponse> => {
  return await requestApi.post<IPresignDocumentResponse>(
    `/api/v1/organization-applications/${applicationId}/documents/presign?token=${encodeURIComponent(
      trackingToken,
    )}`,
    data,
  );
};

/** The draft being edited; its tracking token authorises uploads. */
export type ApplicationUploadCredential = {
  applicationId: string;
  trackingToken: string;
};

/**
 * Uploads one legal document.
 *
 * Unlike logos and banners — which go through the public Cloudinary preset in
 * `incidents/create/_services/upload.service.ts` — these files are personal data. The server
 * signs every upload so the browser cannot choose the folder or make the file public, and it
 * never learns a URL it could share: reading the file back goes through the admin API.
 */
export const uploadApplicationDocument = async (
  credential: ApplicationUploadCredential,
  file: File,
  docType: IPresignDocumentRequest["doc_type"],
): Promise<string> => {
  const data: IPresignDocumentRequest = {
    doc_type: docType,
    file_name: file.name,
    mime_type: file.type,
    size_bytes: file.size,
  };
  const presigned = await presignDocumentForApplication({ ...credential, data });

  const { document_id, upload_url, fields } = presigned.data;

  const formData = new FormData();
  Object.entries(fields).forEach(([key, value]) => formData.append(key, value));
  formData.append("file", file);

  // Raw axios on purpose: this goes straight to the storage provider, not to our API, so the
  // auth interceptors in `libs/axiosClient` must not run.
  await axios.post(upload_url, formData);

  return document_id;
};
