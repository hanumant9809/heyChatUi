import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { createOrJoinRoom } from '../client/clientHelper';
import './JoinCreateChat.css';

export default function JoinCreateChat({ roomName = 'General' }) {
    const [yourName, setYourName] = useState('');
    const [roomId, setRoomId] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleCreateOrJoinRoom = async () => {
        if (!roomId.trim()) {
            alert('Please enter a room ID');
            return;
        }
        
        try {
            setLoading(true);
            const roomData = await createOrJoinRoom(roomId);
            
            console.log('Room created/joined:', roomData);
            // Navigate to chat page with room data
            navigate('/room', { state: { room: roomData, userName: yourName } });
        } catch (error) {
            alert('Failed to create/join room. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="join-create-chat-container">
            <div className="join-card">
                {/* added chat icon */}
                <div className="join-icon" aria-hidden="true">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" fill="currentColor"/>
                    </svg>
                </div>

                <h1 className="join-title">Join/create room</h1>

                <form className="join-form" onSubmit={(e) => e.preventDefault()}>
                    <div className="form-group">
                        <label htmlFor="yourName">Your Name</label>
                        <input 
                            id="yourName" 
                            name="yourName" 
                            type="text" 
                            placeholder="Enter your name"
                            value={yourName}
                            onChange={(e) => setYourName(e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="roomId">Room ID</label>
                        <input 
                            id="roomId" 
                            name="roomId" 
                            type="text" 
                            placeholder={roomName}
                            value={roomId}
                            onChange={(e) => setRoomId(e.target.value)}
                        />
                    </div>

                    <div className="button-row">
                        <button 
                            type="button" 
                            className="btn btn-join"
                            onClick={handleCreateOrJoinRoom}
                            disabled={loading}
                        >
                            {loading ? 'JOINING...' : 'JOIN ROOM'}
                        </button>
                        <button 
                            type="button" 
                            className="btn btn-create"
                            onClick={handleCreateOrJoinRoom}
                            disabled={loading}
                        >
                            {loading ? 'CREATING...' : 'CREAT ROOM'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}