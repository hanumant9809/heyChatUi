import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';
import ChatService from '../../client/ChatService';
import './ChatPage.css';

export default function ChatPage() {
	const location = useLocation();
	const navigate = useNavigate();
	const { room, userName = 'Anonymous' } = location.state || { room: { roomId: 'General' }, userName: 'Anonymous' };
	const roomId = room?.roomId || 'General';

	// State management
	const [messages, setMessages] = useState([]);
	const [text, setText] = useState('');
	const [isConnected, setIsConnected] = useState(false);
	const [isConnecting, setIsConnecting] = useState(false);
	const [roomJoined, setRoomJoined] = useState(false);
	const [error, setError] = useState(null);
	const messagesRef = useRef(null);
	const connectionAttemptedRef = useRef(false);

	// Connect to WebSocket and join room
	useEffect(() => {
		if (connectionAttemptedRef.current) return; // Prevent multiple connection attempts
		connectionAttemptedRef.current = true;

		setIsConnecting(true);
		setError(null);
		console.log('ChatPage: Attempting to connect to WebSocket for room:', roomId, 'user:', userName);

		const handleConnected = () => {
			setIsConnected(true);
			setIsConnecting(false);
			console.log('ChatPage: Connected to WebSocket, joining room:', roomId);

			// Subscribe to room topic
			const subscribed = ChatService.subscribe(roomId, (message) => {
				console.log('ChatPage: Received message from server:', message);
				
				// Add message from server broadcast (all messages come from server now)
				setMessages(prev => [...prev, {
					id: message.timestamp || Date.now(),
					from: message.sender === userName ? 'me' : 'other',
					text: message.content,
					time: new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
					sender: message.sender
				}]);
			});

			if (subscribed) {
				setRoomJoined(true);
				console.log('ChatPage: Successfully joined room:', roomId);
			} else {
				setError('Failed to join room. Please try again.');
				setRoomJoined(false);
			}
		};

		const handleConnectionError = (err) => {
			setIsConnecting(false);
			setIsConnected(false);
			setError(err.message || 'Failed to connect to chat server. Please check your connection and try again.');
			console.error('ChatPage: Connection error:', err);
		};

		// Connect to WebSocket
		ChatService.connect(handleConnected, handleConnectionError);

		// Cleanup on unmount
		return () => {
			console.log('ChatPage: Unmounting, disconnecting from room:', roomId);
			ChatService.disconnect();
			setIsConnected(false);
			setRoomJoined(false);
			connectionAttemptedRef.current = false;
		};
	}, [roomId, userName]);

	// Auto-scroll to bottom on new messages
	useEffect(() => {
		if (messagesRef.current) {
			messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
		}
	}, [messages]);

	// Handle sending message
	const handleSend = () => {
		console.log('ChatPage: handleSend called, text:', text, 'connected:', isConnected, 'roomJoined:', roomJoined);
		
		if (!text.trim()) return;
		
		if (!isConnected) {
			setError('Not connected to chat. Please wait for the connection to establish.');
			return;
		}

		if (!roomJoined) {
			setError('Not joined to room yet. Please wait...');
			return;
		}

		// Send via WebSocket
		const sent = ChatService.sendMessage(roomId, userName, text.trim());
		
		if (!sent) {
			setError('Failed to send message. Please try again.');
			return;
		}

		// Clear input field immediately for better UX
		setText('');
		setError(null);
		
		// Message will be added to state when it comes back from server broadcast
		console.log('ChatPage: Message sent, waiting for server broadcast...');
	};

	const handleAttach = (e) => {
		console.log('File selected:', e.target.files);
		// TODO: Implement file attachment logic
	};

	const handleLeave = () => {
		console.log('ChatPage: Leaving room');
		ChatService.disconnect();
		navigate('/', { replace: true });
	};

	const handleRetryConnection = () => {
		setError(null);
		connectionAttemptedRef.current = false;
		ChatService.resetReconnectAttempts();
		window.location.reload();
	};

	return (
		<div className="chat-page">
			<header className="chat-header">
				<div className="header-left">Room: <span className="meta">{roomId}</span></div>
				<div className="header-center">User: <span className="meta">{userName}</span></div>
				<div className="header-right">
					<div className="connection-status" style={{ marginRight: '12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
						<span>Status:</span>
						{isConnecting ? (
							<>🟡 Connecting...</>
						) : isConnected && roomJoined ? (
							<>🟢 Connected</>
						) : isConnected && !roomJoined ? (
							<>🟡 Joining</>
						) : (
							<>🔴 Disconnected</>
						)}
					</div>
					<button
						type="button"
						className="leave-btn"
						onClick={handleLeave}
					>
						Leave Room
					</button>
				</div>
			</header>

			{error && (
				<div style={{
					background: '#fee',
					color: '#c33',
					padding: '12px 16px',
					borderBottom: '1px solid #fcc',
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center'
				}}>
					<span>{error}</span>
					<button
						onClick={handleRetryConnection}
						style={{
							background: '#c33',
							color: 'white',
							border: 'none',
							padding: '6px 12px',
							borderRadius: '4px',
							cursor: 'pointer',
							fontSize: '12px'
						}}
					>
						Retry
					</button>
				</div>
			)}

			<main className="chat-content">
				<div className="messages" ref={messagesRef} role="log" aria-live="polite">
					{messages.length === 0 ? (
						<div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
							{roomJoined ? 'No messages yet. Start the conversation!' : 'Joining room...'}
						</div>
					) : (
						messages.map(m => (
							<div key={m.id} className={`message ${m.from === 'me' ? 'message-right' : 'message-left'}`}>
								<div className="bubble">{m.text}</div>
								<div className="msg-time">{m.time}</div>
							</div>
						))
					)}
				</div>
			</main>

			<div className="chat-input-bar">
				<label className="attach-btn" title="Attach file">
					<input type="file" onChange={handleAttach} style={{ display: 'none' }} />
					{/* paperclip icon */}
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
						<path d="M21.44 11.05l-8.49 8.49a5 5 0 01-7.07-7.07l8.49-8.49a3.5 3.5 0 014.95 4.95L10.83 18.97a2 2 0 11-2.83-2.83l7.07-7.07" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
					</svg>
				</label>

				<input
					className="chat-input"
					placeholder={isConnecting ? "Connecting..." : roomJoined ? "Type a message" : "Joining room..."}
					value={text}
					onChange={(e) => setText(e.target.value)}
					onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
					disabled={!isConnected || !roomJoined}
				/>

				<button 
					className="send-btn" 
					type="button" 
					onClick={handleSend} 
					aria-label="Send message"
					disabled={!isConnected || !roomJoined || !text.trim()}
					title={!roomJoined ? "Waiting to join room..." : "Send message"}
				>
					{/* send icon */}
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
						<path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
						<path d="M22 2l-7 20 1-7 7-13z" fill="currentColor" />
					</svg>
					<span className="send-label">Send</span>
				</button>
			</div>
		</div>
	);
}

