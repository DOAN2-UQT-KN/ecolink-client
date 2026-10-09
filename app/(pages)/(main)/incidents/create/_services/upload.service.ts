import { uploadToCloudinary } from "@/libs/cloudinary";

/** Uploads images and/or videos (Cloudinary `image/upload` vs `video/upload`). */
export const uploadMultipleImages = async (
  files: (File | Blob | string)[],
): Promise<string[]> => {
  if (files.length === 0) return [];

  const uploadPromises = files.map((file) => uploadToCloudinary(file));

  return Promise.all(uploadPromises);
};
