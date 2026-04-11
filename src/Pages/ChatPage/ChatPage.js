import React, { useState, useRef, useEffect } from 'react';
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';
import { baseUrl } from '../../Axios/AxiosHelper';
import './ChatPage.css';


export default function ChatPage({ roomId = 'General', userName = 'Anonymous', onLeave, onSend, onAttach }) {
	// minimal local state for demo messages and input
	const [messages, setMessages] = useState([
		{ id: 1, from: 'other', text: 'Hi, welcome to the room!', time: '10:00' },
		{ id: 2, from: 'me', text: 'Thanks — happy to be here.', time: '10:02' }
	]);
	const [text, setText] = useState('');
	const messagesRef = useRef(null);
    const [stompClient, setStompClient] = useState(null);



    const sendMessage = (msg) => {
        if (stompClient && stompClient.connected) {
            const messagePayload = {
                roomId: roomId,
                sender: userName,
                content: msg.text,
            };
            stompClient.send(`/app/sendMessage/${roomId}`, {}, JSON.stringify(messagePayload));
        }
        setText('');
    }

    useEffect(() => {
    const connectWebSocket = () => {
        const sock = new SockJS(`${baseUrl}/chat`);

        const client = Stomp.over(sock);
        client.connect({}, () => {
            setStompClient(client);
            client.subscribe(`/topic/rooms/${roomId}`, (message) => { // subscribe to room topic
                const newMessage = JSON.parse(message.body);
                setMessages(prev => [...prev, newMessage]);
            });

        })



    }
    connectWebSocket();
    }, [roomId, userName]);

	useEffect(() => {
		// scroll to bottom on new message
		if (messagesRef.current) {
			messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
		}
	}, [messages]);

	function handleSend() {
		if (!text.trim()) return;
		const newMsg = { id: Date.now(), from: 'me', text: text.trim(), time: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) };
		setMessages(prev => [...prev, newMsg]);
		setText('');
		if (onSend) sendMessage(newMsg);
	}

	function handleAttach(e) {
		if (onAttach) onAttach(e);
		// placeholder behaviour: no-op
	}

	return (
		<div className="chat-page">
			<header className="chat-header">
				<div className="header-left">Room: <span className="meta">{roomId}</span></div>
				<div className="header-center">User: <span className="meta">{userName}</span></div>
				<div className="header-right">
					<button
						type="button"
						className="leave-btn"
						onClick={onLeave ? onLeave : () => {}}
					>
						Leave Room
					</button>
				</div>
			</header>

			<main className="chat-content">
				<div className="messages" ref={messagesRef} role="log" aria-live="polite">
					{messages.map(m => (
						<div key={m.id} className={`message ${m.from === 'me' ? 'message-right' : 'message-left'}`}>
							<div className="bubble">{m.text}</div>
							<div className="msg-time">{m.time}</div>
						</div>
					))}
				</div>
			</main>

			<div className="chat-input-bar">
				<label className="attach-btn" title="Attach file">
					<input type="file" onChange={handleAttach} style={{ display: 'none' }} />
					{/* paperclip icon */}
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
						<path d="M21.44 11.05l-8.49 8.49a5 5 0 01-7.07-7.07l8.49-8.49a3.5 3.5 0 014.95 4.95L10.83 18.97a2 2 0 11-2.83-2.83l7.07-7.07" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
					</svg>
				</label>

				<input
					className="chat-input"
					placeholder="Type a message"
					value={text}
					onChange={(e) => setText(e.target.value)}
					onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
				/>

				<button className="send-btn" type="button" onClick={handleSend} aria-label="Send message">
					{/* send icon */}
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
						<path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
						<path d="M22 2l-7 20 1-7 7-13z" fill="currentColor"/>
					</svg>
					<span className="send-label">Send</span>
				</button>
			</div>
		</div>
	);
}
