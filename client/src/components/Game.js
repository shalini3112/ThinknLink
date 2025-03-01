import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";

const Game = ({ socket }) => {
    const { roomId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const username = new URLSearchParams(location.search).get("username");

    const [players, setPlayers] = useState([]);
    const [words, setWords] = useState(["Gold", "Apple"]);
    const [chain, setChain] = useState([words[0]]);
    const [newWord, setNewWord] = useState("");
    const [timer, setTimer] = useState(null);
    const [timeLeft, setTimeLeft] = useState(30);

    useEffect(() => {

        window.history.replaceState(null, "", "/"); 
        // Join room when the component mounts
        socket.emit("join-room", { roomId, username 
        });

        // Listen for updated player list from the server
        socket.on("update-players", (playerList) => {
            setPlayers(playerList);
        });

        // Handle timer start from server
        socket.on("start-timer", (time) => {
            setTimeLeft(time);
            setTimer(setInterval(() => setTimeLeft((t) => t - 1), 1000));
        });

        // Handle game over scenario
        socket.on("game-over", () => {
            clearInterval(timer);
            navigate(`/results/${roomId}`);
        });

        // Handle browser back button (popstate event)
        const handleBackButton = () => {
            socket.emit("leave-room", { roomId, username }); // Send leave-room event
            socket.disconnect(); // Disconnect from the server
            navigate("/"); // Redirect to the home page after disconnect
            
        };



        window.addEventListener("popstate", handleBackButton);

        // Cleanup the event listeners when the component unmounts
        return () => {
            socket.off("update-players");
            socket.off("start-timer");
            socket.off("game-over");

            // Remove back button event listener
            window.removeEventListener("popstate", handleBackButton);

            // Emit leave-room event to server if the user navigates away manually
            socket.emit("leave-room", { roomId, username });
            // socket.disconnect();
        };
    }, [socket, roomId, username, navigate, timer]);

    const addWord = () => {
        if (!newWord.trim()) return;
        setChain([...chain, newWord]);
        setNewWord("");
    };

    const submitChain = () => {
        socket.emit("submit-chain", { roomId, username, chain });
    };

    return (
        <div style={{ textAlign: "center", marginTop: "50px" }}>
            <h2>Room ID: {roomId}</h2>
            <h3>Players: {players.join(", ")}</h3>
            <h4>Time Left: {timeLeft}s</h4>
            <div style={{ fontSize: "24px", margin: "20px" }}>
                {chain.join(" → ")}
            </div>
            <input 
                type="text" 
                placeholder="Enter a linking word" 
                value={newWord} 
                onChange={(e) => setNewWord(e.target.value)}
            />
            <button onClick={addWord}>Add</button>
            <button onClick={submitChain}>Submit</button>
        </div>
    );
};

export default Game;