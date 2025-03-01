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

let rooms = {};

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("create-room", ({ roomId, username }) => {
        rooms[roomId] = { players: [username], submissions: [], timerStarted: false };
        socket.join(roomId);
        io.to(roomId).emit("update-players", rooms[roomId].players);
    });

    socket.on("join-room", ({ roomId, username }) => {
        if (rooms[roomId]) {
            rooms[roomId].players.push(username);
            socket.join(roomId);
            io.to(roomId).emit("update-players", rooms[roomId].players);
        }
    });

    socket.on("submit-chain", ({ roomId, username, chain }) => {
        rooms[roomId].submissions.push({ username, chain });

        if (!rooms[roomId].timerStarted) {
            rooms[roomId].timerStarted = true;
            io.to(roomId).emit("start-timer", 30);
            setTimeout(() => io.to(roomId).emit("game-over"), 30000);
        }
    });

    socket.on("get-results", ({ roomId }) => {
        io.to(roomId).emit("results", rooms[roomId].submissions);
    });

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
    });
});

server.listen(5001, () => {
    console.log("Server running on port 5001");
});