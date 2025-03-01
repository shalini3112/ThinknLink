import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";

const Home = ({ socket }) => {
    const [username, setUsername] = useState("");
    const [roomId, setRoomId] = useState("");
    const navigate = useNavigate();

    const createRoom = () => {
        if (!username) return alert("Enter your name!");
        const newRoomId = uuidv4().slice(0, 6); // Short room ID
        socket.emit("create-room", { roomId: newRoomId, username });
        navigate(`/game/${newRoomId}?username=${username}`);
    };

    const joinRoom = () => {
        if (!username || !roomId) {
            alert("Enter name and room ID!");
            return;
        }
    
        socket.emit("join-room", { roomId, username }, (response) => {
            if (response && !response.success) {
                alert(response.message);
                return;
            }
            navigate(`/game/${roomId}?username=${username}`);
        });
    };

    return (
        <div style={{ textAlign: "center", marginTop: "50px" }}>
            <h1>ThinkNLink</h1>
            <input 
                type="text" 
                placeholder="Enter your name" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)}
            />
            <br />
            <button onClick={createRoom}>Create Room</button>
            <br /><br />
            <input
                type="text"
                placeholder="Enter Room ID"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
            />
            <button onClick={joinRoom}>Join Room</button>
        </div>
    );
};

export default Home;