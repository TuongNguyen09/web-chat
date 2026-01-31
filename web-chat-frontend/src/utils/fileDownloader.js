/**
 * File Downloader Utility
 * Centralized file download logic
 */
import toast from "react-hot-toast";
import { logger } from "./logger";

/**
 * Download file from URL
 * @param {string} url - File URL to download
 * @param {string} filename - Name of file to save as
 * @returns {Promise<void>}
 */
export const downloadFile = async (url, filename = "attachment") => {
  if (!url) {
    toast.error("URL không hợp lệ");
    logger.error("downloadFile", new Error("URL is empty"), { url, filename });
    return;
  }

  try {
    const response = await fetch(url, { credentials: "omit" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const blob = await response.blob();
    if (blob.size === 0) {
      throw new Error("File is empty");
    }

    const tempUrl = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = tempUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();

    a.remove();
    URL.revokeObjectURL(tempUrl);
  } catch (err) {
    toast.error("Không tải được file");
    logger.error("downloadFile", err, { url, filename });
  }
};

/**
 * Download multiple files
 * @param {Array} files - Array of {url, filename} objects
 */
export const downloadFiles = async (files = []) => {
  if (!Array.isArray(files) || files.length === 0) return;

  for (const file of files) {
    await downloadFile(file.url, file.filename);
    // Small delay between downloads to avoid blocking
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
};

export default downloadFile;
