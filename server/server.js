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
        rooms[roomId] = { 
            players: {}, 
            submissions: [], 
            timerStarted: false 
        };

        rooms[roomId].players[socket.id] = username;
        socket.join(roomId);

        io.to(roomId).emit("update-players", Object.values(rooms[roomId].players));
    });

    socket.on("join-room", ({ roomId, username }, callback) => {
        if (!rooms[roomId]) {
            if (typeof callback === "function") {
                callback({ success: false, message: "Invalid Room ID! Room does not exist." });
            }
            return;
        }

        Object.keys(rooms[roomId].players).forEach((id) => {
            if (rooms[roomId].players[id] === username) {
                delete rooms[roomId].players[id];
            }
        });

        rooms[roomId].players[socket.id] = username;
        socket.join(roomId);

        io.to(roomId).emit("update-players", Object.values(rooms[roomId].players));

        if (typeof callback === "function") {
            callback({ success: true });
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
            io.to(roomId).emit("start-timer", 30);
            setTimeout(() => io.to(roomId).emit("game-over"), 30000);
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