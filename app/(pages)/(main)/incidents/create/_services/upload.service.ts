import axios from "axios";

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "example";
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "example";

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

    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      formData,
    );

    return response.data.secure_url;
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    throw new Error("Failed to upload image to Cloudinary");
  }
};

export const uploadMultipleImages = async (
  files: (File | Blob | string)[],
): Promise<string[]> => {
  if (files.length === 0) return [];

  const uploadPromises = files.map((file) => uploadToCloudinary(file));

  return Promise.all(uploadPromises);
};
