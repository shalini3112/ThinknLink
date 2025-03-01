import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./components/Home";
import Game from "./components/Game";
import Results from "./components/Results";
import { io } from "socket.io-client";

const socket = io("http://localhost:5001");

const App = () => {
    return (
        
            <Routes>
                <Route path="/" element={<Home socket={socket} />} />
                <Route path="/game/:roomId" element={<Game socket={socket} />} />
                <Route path="/results/:roomId" element={<Results socket={socket} />} />
            </Routes>
        
    );
};

export default App;