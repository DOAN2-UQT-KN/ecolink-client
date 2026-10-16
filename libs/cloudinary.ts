import axios from "axios";
import type { ICaptureUpload } from "@/apis/incident/models/capture";

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "example";
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "example";

function cloudinaryResourceForPayload(file: File | Blob | string): "image" | "video" {
  if (typeof file === "string") {
    if (file.startsWith("data:video/")) return "video";
    return "image";
  }
  if (file.type.startsWith("video/")) return "video";
  return "image";
}

export const uploadToCloudinary = async (
  file: File | Blob | string,
): Promise<string> => {
  try {
    // If it's already a URL (not a base64 string), return it
    if (typeof file === "string" && !file.startsWith("data:")) {
      return file;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    const resource = cloudinaryResourceForPayload(file);

    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resource}/upload`,
      formData,
    );

    return response.data.secure_url;
  } catch {
    // Callers show their own upload error.
    throw new Error("Failed to upload media to Cloudinary");
  }
};

/**
 * Upload under a capture session (specs/006 P03). The signature covers only `public_id` and
 * `timestamp`, so no `upload_preset` is sent; the server checks the public id later.
 */
export const uploadToCloudinarySigned = async (
  file: File | Blob | string,
  upload: ICaptureUpload,
): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", upload.api_key);
    formData.append("timestamp", String(upload.timestamp));
    formData.append("signature", upload.signature);
    formData.append("public_id", upload.public_id);

    const response = await axios.post(upload.upload_url, formData);
    return response.data.secure_url;
  } catch {
    throw new Error("Failed to upload media to Cloudinary");
  }
};

/**
 * Live photo upload: signed under its capture session while it is valid, else a plain library
 * upload (a capture problem never blocks the report, specs/007 FR-007).
 */
export const uploadWithCapture = async (
  file: File | Blob | string,
  capture?: { id: string; expiresAt: string; upload: ICaptureUpload },
): Promise<{ url: string; captureId?: string }> => {
  if (capture && Date.parse(capture.expiresAt) > Date.now()) {
    try {
      return { url: await uploadToCloudinarySigned(file, capture.upload), captureId: capture.id };
    } catch {
      // Fall back to a library upload below.
    }
  }
  return { url: await uploadToCloudinary(file) };
};
