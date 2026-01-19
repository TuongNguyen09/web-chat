/**
 * Cloudinary Uploader Utility
 * Centralized upload logic for all components
 */
import axios from "axios";
import toast from "react-hot-toast";
import { logger } from "./logger";
import { ENV_CONFIG } from "../config/env";

/**
 * Upload file to Cloudinary with axios (supports progress)
 * @param {File} file - File to upload
 * @param {Object} options - Configuration options
 * @param {string} options.folder - Cloudinary folder (default: "uploads")
 * @param {Function} options.onProgress - Progress callback: (progress) => {}
 * @returns {Promise<Object>} - Cloudinary response
 */
export const uploadFileToCloudinary = async (file, options = {}) => {
  if (!file) {
    throw new Error("File is required");
  }

  const {
    folder = "uploads",
    onProgress = null,
  } = options;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", ENV_CONFIG.CLOUDINARY.UPLOAD_PRESET);
  formData.append("folder", folder);

  try {
    const response = await axios.post(ENV_CONFIG.CLOUDINARY.API_URL, formData, {
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      },
    });

    return response.data;
  } catch (err) {
    logger.error("uploadFileToCloudinary", err, { folder, fileName: file.name });
    throw err;
  }
};

/**
 * Upload image to Cloudinary using fetch (simpler)
 * Useful when progress tracking is not needed
 * @param {File} file - Image file to upload
 * @param {Object} options - Configuration options
 * @param {string} options.folder - Cloudinary folder (default: "uploads")
 * @returns {Promise<Object>} - Cloudinary response
 */
export const uploadImageToCloudinary = async (file, options = {}) => {
  if (!file) {
    throw new Error("File is required");
  }

  const { folder = "uploads" } = options;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", ENV_CONFIG.CLOUDINARY.UPLOAD_PRESET);
  formData.append("folder", folder);

  try {
    const url = `https://api.cloudinary.com/v1_1/${ENV_CONFIG.CLOUDINARY.CLOUD_NAME}/image/upload`;
    const res = await fetch(url, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: Upload failed`);
    }

    const data = await res.json();
    return data;
  } catch (err) {
    logger.error("uploadImageToCloudinary", err, { folder, fileName: file.name });
    throw err;
  }
};

export default uploadFileToCloudinary;
