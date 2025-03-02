const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

const wordList = [
    "Dog", "Car", "Tree", "Book", "Phone", "Table", "Water", "Light",
    "Chair", "House", "Clock", "Road", "Paper", "Shoe", "Laptop", "Bag",
    "School", "Rain", "Sun", "Door", "Glass", "Ball", "Flower", "Bed",
    "Window", "Bridge", "Bottle", "Camera", "Watch", "Pencil", "Fire",
    "Train", "River", "Mountain", "Keyboard", "Mouse", "Speaker", "Hat",
    "Jacket", "Mirror", "Fence", "Cloud", "Sky", "Ocean", "Toothbrush"
];

let rooms = {};

const getRandomWords = () => {
    let firstIndex = Math.floor(Math.random() * wordList.length);
    let secondIndex;
    do {
        secondIndex = Math.floor(Math.random() * wordList.length);
    } while (secondIndex === firstIndex);
    return [wordList[firstIndex], wordList[secondIndex]];
};

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("create-room", ({ roomId, username }) => {
        rooms[roomId] = { 
            players: {}, 
            submissions: [], 
            timerStarted: false,
            words: getRandomWords(),
            chat: [] // Store chat messages
        };

        rooms[roomId].players[socket.id] = username;
        socket.join(roomId);

        io.to(roomId).emit("update-players", Object.values(rooms[roomId].players));
        io.to(socket.id).emit("game-words", rooms[roomId].words);
        io.to(socket.id).emit("chat-history", rooms[roomId].chat);
    });

    socket.on("join-room", ({ roomId, username }, callback) => {
        if (!rooms[roomId]) {
            if (typeof callback === "function") {
                callback({ success: false, message: "Invalid Room ID! Room does not exist." });
            }
            return;
        }

        rooms[roomId].players[socket.id] = username;
        socket.join(roomId);

        io.to(roomId).emit("update-players", Object.values(rooms[roomId].players));
        io.to(socket.id).emit("game-words", rooms[roomId].words);
        io.to(socket.id).emit("chat-history", rooms[roomId].chat);

        if (typeof callback === "function") {
            callback({ success: true });
        }
    });

    // Handle chat messages
    socket.on("send-chat-message", ({ roomId, username, message }) => {
        if (rooms[roomId]) {
            const chatMessage = { username, message };
            rooms[roomId].chat.push(chatMessage);
            io.to(roomId).emit("receive-chat-message", chatMessage);
        }
    });

    socket.on("leave-room", ({ roomId, username }) => {
        if (rooms[roomId] && rooms[roomId].players[socket.id]) {
            delete rooms[roomId].players[socket.id];

            if (Object.keys(rooms[roomId].players).length === 0) {
                delete rooms[roomId];
            } else {
                io.to(roomId).emit("update-players", Object.values(rooms[roomId].players));
            }
        }
    });

    socket.on("submit-chain", ({ roomId, username, chain }) => {
        if (!rooms[roomId]) return;

        rooms[roomId].submissions.push({ username, chain });

        if (!rooms[roomId].timerStarted) {
            rooms[roomId].timerStarted = true;
            io.to(roomId).emit("start-timer", 5);
            setTimeout(() => io.to(roomId).emit("game-over"), 5000);
        }
    });

    socket.on("get-results", ({ roomId }) => {
        if (rooms[roomId]) {
            io.to(roomId).emit("results", rooms[roomId].submissions);
        }
    });

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
        for (const roomId in rooms) {
            if (rooms[roomId].players[socket.id]) {
                delete rooms[roomId].players[socket.id];
                if (Object.keys(rooms[roomId].players).length === 0) {
                    delete rooms[roomId];
                } else {
                    io.to(roomId).emit("update-players", Object.values(rooms[roomId].players));
                }
            }
        }
    });
});

server.listen(5001, () => {
    console.log("Server running on port 5001");
});