import React from "react";
import Canvas from "./Canvas";

const Game = ({ socket, room }) => {
    return (
        <div>
            <h2>Game Room: {room}</h2>
            <Canvas socket={socket} room={room} />
        </div>
    );
};

export default Game;

