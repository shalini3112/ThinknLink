

import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";

const Game = ({ socket }) => {
    const { roomId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const username = new URLSearchParams(location.search).get("username");

    const [players, setPlayers] = useState([]);
    const [timer, setTimer] = useState(null);
    const [timeLeft, setTimeLeft] = useState(null);
    const [submitted, setSubmitted] = useState(false);

    const [words, setWords] = useState([]);
    const [chain, setChain] = useState([]);
    const [newWord, setNewWord] = useState("");

    // Chat-related states
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState("");

    useEffect(() => {
        window.history.replaceState(null, "", "/");

        // Join the room
        socket.emit("join-room", { roomId, username });

        // Listen for updates
        socket.on("update-players", (playerList) => {
            setPlayers(playerList);
        });

        socket.on("game-words", (wordPair) => {
            setWords(wordPair);
            setChain(wordPair);
        });

        socket.on("chat-history", (history) => {
            setChatMessages(history);
        });

        socket.on("receive-chat-message", (message) => {
            setChatMessages((prevMessages) => [...prevMessages, message]);
        });

        socket.on("start-timer", (time) => {
            setTimeLeft(time);
            setTimer(setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev > 0) return prev - 1;
                    clearInterval(timer);
                    
                    return 0;
                });
            }, 1000));
        });

        socket.on("game-over", () => {
            clearInterval(timer);
            if(!submitted)
            submitChain();
            navigate(`/results/${roomId}`);
        });

        // Handle browser back button
        const handleBackButton = () => {
            socket.emit("leave-room", { roomId, username });
            socket.disconnect();
            navigate("/");
        };

        window.addEventListener("popstate", handleBackButton);

        return () => {
            socket.off("update-players");
            socket.off("game-words");
            socket.off("chat-history");
            socket.off("receive-chat-message");
            socket.off("start-timer");
            socket.off("game-over");

            window.removeEventListener("popstate", handleBackButton);

            socket.emit("leave-room", { roomId, username });
        };
    }, [socket, roomId, username, navigate, timer]);

    // Add words to the chain
    const addWord = () => {
        if (!newWord.trim() || submitted) return;
        setChain([...chain.slice(0, -1), newWord, chain[chain.length - 1]]);
        setNewWord("");
    };

    // Handle Enter key for word input
    const handleKeyPress = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            addWord();
        }
    };

    // Submit the chain
    const submitChain = () => {
        socket.emit("submit-chain", { roomId, username, chain });
        setSubmitted(true);
    };

    // Send chat message
    const sendMessage = () => {
        if (chatInput.trim() !== "") {
            socket.emit("send-chat-message", { roomId, username, message: chatInput });
            setChatInput("");
        }
    };

    return (
        <div style={{ textAlign: "center", marginTop: "50px" }}>
            <h2>Room ID: {roomId}</h2>
            <h3>Players: {players.join(", ")}</h3>

            {timeLeft !== null && <h4>Time Left: {timeLeft}s</h4>}

            <div style={{ fontSize: "24px", margin: "20px" }}>
                {chain.join(" → ")}
            </div>

            <input 
                type="text" 
                placeholder="Enter a linking word" 
                value={newWord} 
                onChange={(e) => setNewWord(e.target.value)}
                onKeyDown={handleKeyPress}
                disabled={submitted} 
            />
            <button onClick={addWord} disabled={submitted}>Add</button>
            <button onClick={submitChain} disabled={submitted}>Submit</button>

            {/* Chat Box */}
            <div style={{
                border: "1px solid black",
                width: "300px",
                height: "200px",
                overflowY: "scroll",
                margin: "20px auto",
                padding: "10px",
                textAlign: "left",
                background: "#f9f9f9"
            }}>
                {chatMessages.map((msg, index) => (
                    <p key={index}><strong>{msg.username}:</strong> {msg.message}</p>
                ))}
            </div>

            <input 
                type="text" 
                placeholder="Type a message..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button onClick={sendMessage}>Send</button>

        </div>
    );
};

export default Game;

