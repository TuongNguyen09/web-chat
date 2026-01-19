/**
 * Environment Configuration
 * Loads all environment variables with proper defaults
 */

export const ENV_CONFIG = {
  // API Configuration
  API: {
    BASE_URL: process.env.REACT_APP_API_URL || "http://localhost:8080/whatsapp",
    WS_URL: process.env.REACT_APP_WS_URL || "http://localhost:8080/whatsapp/ws",
  },

  // Cloudinary Configuration
  CLOUDINARY: {
    CLOUD_NAME: process.env.REACT_APP_CLOUDINARY_CLOUD_NAME || "dj923dmx3",
    UPLOAD_PRESET: process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET || "whatsapp",
    API_URL: process.env.REACT_APP_CLOUDINARY_API_URL || "https://api.cloudinary.com/v1_1/dj923dmx3/auto/upload",
  },

  // App Environment
  ENV: process.env.REACT_APP_ENV || "development",
  IS_PRODUCTION: process.env.REACT_APP_ENV === "production",
  IS_DEVELOPMENT: process.env.REACT_APP_ENV === "development",
};

export default ENV_CONFIG;
