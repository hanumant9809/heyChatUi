import apiClient from './client';
import { API_ENDPOINTS } from '../constants/apiConstants';

/**
 * Create or join a room
 * @param {string} roomId - The room ID
 * @returns {Promise} - Returns the room response data
 */
export const createOrJoinRoom = async (roomId) => {
  try {
    const response = await apiClient.post(API_ENDPOINTS.ROOM_CREATE, {
      roomId: roomId,
    });
    return response.data;
  } catch (error) {
    console.error('Error creating/joining room:', error);
    throw error;
  }
};
