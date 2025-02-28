import React, { useState } from "react";
import io from "socket.io-client";
import Game from "./components/Game";

const socket = io.connect("http://localhost:5001");

function App() {
    const [room, setRoom] = useState("");
    const [joined, setJoined] = useState(false);

    const joinRoom = () => {
        if (room !== "") {
            socket.emit("join_room", room);
            setJoined(true);
        }
    };

    return (
        <div>
            {!joined ? (
                <div>
                    <h2>Join a Room</h2>
                    <input type="text" placeholder="Room ID" onChange={(e) => setRoom(e.target.value)} />
                    <button onClick={joinRoom}>Join</button>
                </div>
            ) : (
                <Game socket={socket} room={room} />
            )}
        </div>
    );
}

export default App;

