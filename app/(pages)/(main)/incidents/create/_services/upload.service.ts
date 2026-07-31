import axios from "axios";

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
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    throw new Error("Failed to upload media to Cloudinary");
  }
};

/** Uploads images and/or videos (Cloudinary `image/upload` vs `video/upload`). */
export const uploadMultipleImages = async (
  files: (File | Blob | string)[],
): Promise<string[]> => {
  if (files.length === 0) return [];

  const uploadPromises = files.map((file) => uploadToCloudinary(file));

  return Promise.all(uploadPromises);
};
