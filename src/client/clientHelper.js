import apiClient from './client';
import { API_ENDPOINTS } from '../constants/apiConstants';

/**
 * Create a new room
 * @param {string} roomId - The room ID
 * @returns {Promise} - Returns the room response data
 */
export const createRoom = async (roomId) => {
  try {
    const response = await apiClient.post(API_ENDPOINTS.ROOM_CREATE, {
      roomId: roomId,
    });
    console.log('clientHelper: Room created successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('clientHelper: Error creating room:', error);
    throw error;
  }
};

/**
 * Join an existing room
 * @param {string} roomId - The room ID to join
 * @param {string} userName - The user's name (optional)
 * @returns {Promise} - Returns the room response data with user information
 */
export const joinRoom = async (roomId, userName = null) => {
  try {
    const payload = {
      roomId: roomId,
    };
    
    // Add userName if provided
    if (userName) {
      payload.userName = userName;
    }
    
    const response = await apiClient.post(API_ENDPOINTS.ROOM_JOIN, payload);
    console.log('clientHelper: User joined room successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('clientHelper: Error joining room:', error);
    throw error;
  }
};

/**
 * Create or join a room (for backward compatibility)
 * Tries to create first, if already exists, user joins
 * @param {string} roomId - The room ID
 * @param {string} userName - The user's name (optional)
 * @returns {Promise} - Returns the room response data
 */
export const createOrJoinRoom = async (roomId, userName = null) => {
  try {
    // First, try to create the room
    return await createRoom(roomId);
  } catch (error) {
    // If room already exists (409 Conflict), try to join
    if (error.response?.status === 409 || error.response?.status === 400) {
      console.log('clientHelper: Room already exists, attempting to join...');
      return await joinRoom(roomId, userName);
    }
    throw error;
  }
};
