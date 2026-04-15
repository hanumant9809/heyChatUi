import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { createRoom, joinRoom, createOrJoinRoom } from '../client/clientHelper';
import './JoinCreateChat.css';

export default function JoinCreateChat({ roomName = 'General' }) {
    const [yourName, setYourName] = useState('');
    const [roomId, setRoomId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const validateInputs = () => {
        if (!yourName.trim()) {
            setError('Please enter your name');
            return false;
        }
        
        if (!roomId.trim()) {
            setError('Please enter a room ID');
            return false;
        }

        setError('');
        return true;
    };

    /**
     * Create a new room
     * This will create a room and fail if it already exists
     */
    const handleCreateRoom = async () => {
        if (!validateInputs()) return;
        
        try {
            setLoading(true);
            console.log('JoinCreateChat: Creating new room:', roomId);
            const roomData = await createRoom(roomId);
            
            console.log('JoinCreateChat: Room created:', roomData);
            navigate('/room', { state: { room: roomData, userName: yourName.trim() } });
        } catch (error) {
            console.error('JoinCreateChat: Error creating room:', error);
            if (error.response?.status === 409 || error.response?.status === 400) {
                setError('Room already exists. Use "Join Room" button instead.');
            } else {
                setError('Failed to create room. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    /**
     * Join an existing room
     */
    const handleJoinRoom = async () => {
        if (!validateInputs()) return;
        
        try {
            setLoading(true);
            console.log('JoinCreateChat: Joining room:', roomId, 'as user:', yourName);
            const roomData = await joinRoom(roomId, yourName.trim());
            
            console.log('JoinCreateChat: Successfully joined room:', roomData);
            navigate('/room', { state: { room: roomData, userName: yourName.trim() } });
        } catch (error) {
            console.error('JoinCreateChat: Error joining room:', error);
            setError('Failed to join room. Room may not exist. Try creating it first.');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Create or join room - intelligent fallback
     * Tries to create, if fails, tries to join
     */
    const handleCreateOrJoin = async () => {
        if (!validateInputs()) return;
        
        try {
            setLoading(true);
            console.log('JoinCreateChat: Attempting to create or join room:', roomId);
            const roomData = await createOrJoinRoom(roomId, yourName.trim());
            
            console.log('JoinCreateChat: Successfully created or joined room:', roomData);
            navigate('/room', { state: { room: roomData, userName: yourName.trim() } });
        } catch (error) {
            console.error('JoinCreateChat: Error creating/joining room:', error);
            setError('Failed to create or join room. Please try again.');
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

                {error && (
                    <div style={{
                        background: '#fee',
                        color: '#c33',
                        padding: '10px 12px',
                        borderRadius: '6px',
                        marginBottom: '16px',
                        fontSize: '13px',
                        border: '1px solid #fcc'
                    }}>
                        {error}
                    </div>
                )}

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
                            disabled={loading}
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
                            disabled={loading}
                        />
                    </div>

                    <div className="button-row">
                        <button 
                            type="button" 
                            className="btn btn-join"
                            onClick={handleJoinRoom}
                            disabled={loading}
                            title="Join an existing room"
                        >
                            {loading ? 'JOINING...' : 'JOIN ROOM'}
                        </button>
                        <button 
                            type="button" 
                            className="btn btn-create"
                            onClick={handleCreateRoom}
                            disabled={loading}
                            title="Create a new room"
                        >
                            {loading ? 'CREATING...' : 'CREATE ROOM'}
                        </button>
                    </div>

                    <div style={{ marginTop: '12px' }}>
                        <button 
                            type="button" 
                            className="btn"
                            onClick={handleCreateOrJoin}
                            disabled={loading}
                            style={{
                                width: '100%',
                                background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                                color: 'white',
                                height: '44px'
                            }}
                            title="Try to create room, or join if it exists"
                        >
                            {loading ? 'PROCESSING...' : 'CREATE OR JOIN'}
                        </button>
                    </div>
                </form>

                <div style={{
                    marginTop: '20px',
                    paddingTop: '16px',
                    borderTop: '1px solid rgba(15,23,42,0.06)',
                    fontSize: '12px',
                    color: '#6b7280',
                    lineHeight: '1.6'
                }}>
                    <p style={{ margin: '0 0 8px 0' }}>
                        <strong>How to use:</strong>
                    </p>
                    <ul style={{ margin: '0', paddingLeft: '16px' }}>
                        <li>To create a new room, click "CREATE ROOM"</li>
                        <li>To join an existing room, click "JOIN ROOM"</li>
                        <li>Or use "CREATE OR JOIN" to auto-detect</li>
                        <li>Share the Room ID with others to join together</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}