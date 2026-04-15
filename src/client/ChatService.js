import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';

class ChatService {
  constructor() {
    this.stompClient = null;
    this.connected = false;
    this.connecting = false;
    this.apiBaseUrl = process.env.REACT_APP_API_BASE_URL;
    this.subscriptions = {};
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;
  }

  /**
   * Connect to WebSocket
   * @param {Function} onConnected - Callback when connection is established
   * @param {Function} onError - Callback when connection fails
   */
  connect(onConnected, onError) {
    if (this.connecting || this.connected) {
      console.warn('Already connecting or connected');
      return;
    }

    try {
      this.connecting = true;
      // Remove /api suffix and add /chat for WebSocket endpoint
      const wsUrl = this.apiBaseUrl.replace(/\/api$/, '') + '/api/chat';
      
      console.log('ChatService: Connecting to WebSocket at:', wsUrl);

      // Pass factory function to Stomp.over() instead of socket instance
      this.stompClient = Stomp.over(() => new SockJS(wsUrl));
      // Disable default logging for cleaner console
      this.stompClient.debug = () => {};
      
      this.stompClient.connect({}, 
        (frame) => {
          this.connected = true;
          this.connecting = false;
          this.reconnectAttempts = 0;
          console.log('ChatService: WebSocket Connected successfully');
          if (onConnected) onConnected();
        }, 
        (error) => {
          this.connecting = false;
          console.error('ChatService: WebSocket connection error:', error);
          this.handleConnectionError(error, onConnected, onError);
        }
      );
    } catch (error) {
      this.connecting = false;
      console.error('ChatService: Error initiating WebSocket connection:', error);
      if (onError) onError(error);
    }
  }

  /**
   * Handle connection errors with retry logic
   */
  handleConnectionError(error, onConnected, onError) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`ChatService: Retrying connection (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      setTimeout(() => {
        this.connect(onConnected, onError);
      }, this.reconnectDelay);
    } else {
      console.error('ChatService: Max reconnection attempts reached');
      if (onError) onError(new Error('Failed to connect to chat. Maximum retry attempts exceeded.'));
    }
  }

  /**
   * Subscribe to a room topic
   * @param {string} roomId - The room ID to subscribe to
   * @param {Function} onMessageReceived - Callback when message is received
   */
  subscribe(roomId, onMessageReceived) {
    if (!this.stompClient || !this.connected) {
      console.warn('ChatService: WebSocket not connected. Cannot subscribe to room:', roomId);
      return false;
    }

    const topic = `/topic/room/${roomId}`;
    console.log('ChatService: Subscribing to topic:', topic);
    
    try {
      const subscription = this.stompClient.subscribe(topic, (message) => {
        try {
          const receivedMessage = JSON.parse(message.body);
          console.log('ChatService: Received message from topic:', topic, receivedMessage);
          if (onMessageReceived) {
            onMessageReceived(receivedMessage);
          }
        } catch (error) {
          console.error('ChatService: Error parsing message:', error, 'Raw body:', message.body);
        }
      }, (error) => {
        console.error('ChatService: Subscription error for topic:', topic, error);
      });

      // Store subscription reference for potential unsubscribe
      this.subscriptions[roomId] = subscription;
      console.log('ChatService: Successfully subscribed to topic:', topic);
      return true;
    } catch (error) {
      console.error('ChatService: Error subscribing to room:', roomId, error);
      return false;
    }
  }

  /**
   * Unsubscribe from a room topic
   * @param {string} roomId - The room ID to unsubscribe from
   */
  unsubscribe(roomId) {
    if (this.subscriptions[roomId]) {
      this.subscriptions[roomId].unsubscribe();
      delete this.subscriptions[roomId];
      console.log('ChatService: Unsubscribed from room:', roomId);
    }
  }

  /**
   * Send a message to a room
   * @param {string} roomId - The room ID
   * @param {string} sender - Sender name
   * @param {string} content - Message content
   * @returns {boolean} - True if message was sent, false otherwise
   */
  sendMessage(roomId, sender, content) {
    if (!this.stompClient || !this.connected) {
      console.warn('ChatService: WebSocket not connected. Unable to send message.');
      return false;
    }

    try {
      const messageRequest = {
        roomId: roomId,
        sender: sender,
        content: content,
        timestamp: new Date().toISOString()
      };

      const destination = `/app/sendMessage/${roomId}`;
      console.log('ChatService: Sending message to:', destination, messageRequest);
      
      this.stompClient.send(destination, {}, JSON.stringify(messageRequest));
      return true;
    } catch (error) {
      console.error('ChatService: Error sending message:', error);
      return false;
    }
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect() {
    try {
      // Unsubscribe from all rooms
      Object.keys(this.subscriptions).forEach(roomId => {
        this.unsubscribe(roomId);
      });

      if (this.stompClient && this.connected) {
        this.stompClient.disconnect(() => {
          this.connected = false;
          this.stompClient = null;
          console.log('ChatService: WebSocket disconnected');
        });
      } else {
        this.connected = false;
        this.stompClient = null;
      }
    } catch (error) {
      console.error('ChatService: Error during disconnect:', error);
      this.connected = false;
      this.stompClient = null;
    }
  }

  /**
   * Check if connected
   * @returns {boolean} Connection status
   */
  isConnected() {
    return this.connected;
  }

  /**
   * Check if currently connecting
   * @returns {boolean} Connecting status
   */
  isConnecting() {
    return this.connecting;
  }

  /**
   * Reset connection attempt counter
   */
  resetReconnectAttempts() {
    this.reconnectAttempts = 0;
  }
}

const chatService = new ChatService();
export default chatService;
