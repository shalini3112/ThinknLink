const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000", // Frontend URL
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.get("/", (req, res) => {
    res.send("Scribble Game Server is running!");
});

// WebSocket logic
io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Handle joining room
    socket.on("join_room", (room) => {
        socket.join(room);
        console.log(`User ${socket.id} joined room ${room}`);
        io.to(room).emit("message", `${socket.id} has joined the game`);
    });

    // Handle drawing data
    socket.on("draw", (data) => {
        socket.to(data.room).emit("draw", data);
    });

    // Handle disconnection
    socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

server.listen(5001, () => {
    console.log("Server running on port 5000");
});
