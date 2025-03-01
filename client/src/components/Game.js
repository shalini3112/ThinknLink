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
        socket.emit("join-room", { roomId, username });

        socket.on("update-players", (playerList) => {
            setPlayers(playerList);
        });

        const handleBackButton = () => {
            socket.disconnect();  // Disconnect from the server
            navigate("/"); // Redirect to home page after disconnect
        };

        window.addEventListener("popstate", handleBackButton);


        socket.on("start-timer", (time) => {
            setTimeLeft(time);
            setTimer(setInterval(() => setTimeLeft((t) => t - 1), 1000));
        });

        socket.on("game-over", () => {
            clearInterval(timer);
            navigate(`/results/${roomId}`);
        });

        return () => {
            socket.off("update-players");
            socket.off("start-timer");
            
            window.removeEventListener("popstate", handleBackButton);
            

            socket.off("game-over");
        };
    }, [socket, roomId, username, navigate]);

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