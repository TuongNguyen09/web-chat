/**
 * Chat-related utility functions
 * Provides consistent chat operations across the application
 */

import { DEFAULT_AVATAR, DEFAULT_GROUP_IMAGE } from "../constants/defaults";

/**
 * Check if a chat is a group chat
 * @param {Object} chat - Chat entity
 * @returns {boolean} True if chat is a group chat
 */
export const isGroupChat = (chat) => {
  if (!chat) return false;
  return Boolean(chat.group ?? chat.isGroup);
};

/**
 * Get chat title (group name or partner name)
 * @param {Object} chat - Chat entity
 * @param {string} currentUserId - Current user ID
 * @param {string} defaultGroupName - Default group name (default: "Group Chat")
 * @returns {string} Chat title
 */
export const getChatTitle = (chat, currentUserId, defaultGroupName = "Group Chat") => {
  if (!chat) return "Unknown";
  
  if (isGroupChat(chat)) {
    return chat.chatName || defaultGroupName;
  }
  
  // Private chat - find partner
  const members = chat.members || chat.users || [];
  const partner = members.find((u) => u.id !== currentUserId);
  return partner?.fullName || "Unknown User";
};

/**
 * Get chat avatar URL
 * @param {Object} chat - Chat entity
 * @param {string} currentUserId - Current user ID
 * @param {Object} defaults - Default images object with avatar and groupImage
 * @returns {string} Avatar URL
 */
export const getChatAvatar = (chat, currentUserId, defaults = {}) => {
  if (!chat) return defaults.avatar || DEFAULT_AVATAR;
  
  const defaultAvatar = defaults.avatar || DEFAULT_AVATAR;
  const defaultGroupImage = defaults.groupImage || DEFAULT_GROUP_IMAGE;
  
  if (isGroupChat(chat)) {
    return chat.chatImage || defaultGroupImage;
  }
  
  // Private chat - find partner
  const members = chat.members || chat.users || [];
  const partner = members.find((u) => u.id !== currentUserId);
  return partner?.profilePicture || defaultAvatar;
};

/**
 * Get partner user from private chat
 * @param {Object} chat - Chat entity
 * @param {string} currentUserId - Current user ID
 * @returns {Object|null} Partner user object or null
 */
export const getChatPartner = (chat, currentUserId) => {
  if (!chat || isGroupChat(chat)) return null;
  
  const members = chat.members || chat.users || [];
  return members.find((u) => u.id !== currentUserId) || null;
};

/**
 * Get all members of a chat (excluding current user for private chats)
 * @param {Object} chat - Chat entity
 * @param {string} currentUserId - Current user ID
 * @returns {Array} Array of member objects
 */
export const getChatMembers = (chat, currentUserId) => {
  if (!chat) return [];
  
  const members = chat.members || chat.users || [];
  
  // For group chats, return all members
  if (isGroupChat(chat)) {
    return members;
  }
  
  // For private chats, return only the partner
  const partner = members.find((u) => u.id !== currentUserId);
  return partner ? [partner] : [];
};

/**
 * Check if current user is admin of a group chat
 * @param {Object} chat - Chat entity
 * @param {string} currentUserId - Current user ID
 * @returns {boolean} True if user is admin
 */
export const isUserAdmin = (chat, currentUserId) => {
  if (!chat || !isGroupChat(chat) || !currentUserId) return false;
  
  // Check if user is creator
  if (chat.createdBy?.id === currentUserId) return true;
  
  // Check if user is in admins list
  if (Array.isArray(chat.admins)) {
    return chat.admins.some((admin) => admin.id === currentUserId);
  }
  
  return false;
};

/**
 * Check if current user is creator of a group chat
 * @param {Object} chat - Chat entity
 * @param {string} currentUserId - Current user ID
 * @returns {boolean} True if user is creator
 */
export const isUserCreator = (chat, currentUserId) => {
  if (!chat || !isGroupChat(chat) || !currentUserId) return false;
  return chat.createdBy?.id === currentUserId;
};
