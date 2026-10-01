const express = require("express");
const cors = require("cors");
const { Server } = require("socket.io");
const http = require("http");

const app = express();

app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: [
            "http://localhost:5173",
            "http://localhost:5174",
            "https://youtube-party-room-18.vercel.app"
        ],
        methods: ["GET", "POST"]
    }
});

// ==========================================
// ROOM STORAGE
// ==========================================

const rooms = {};


// ==========================================
// HOME ROUTE
// ==========================================

app.get("/", (req, res) => {
    res.send("Watch Party Server is running!");
});


io.on("connection", (socket) => {

    console.log("User connected:", socket.id);


    // ==========================================
    // CREATE ROOM
    // ==========================================

    socket.on("create_room", ({ username }) => {

        const roomId = Math.random()
            .toString(36)
            .substring(2, 8)
            .toUpperCase();

        rooms[roomId] = {

            hostId: socket.id,

            videoId: "dQw4w9WgXcQ",

            // Current video position
            currentTime: 0,

            // Current play/pause state
            isPlaying: false,

            participants: [
                {
                    userId: socket.id,
                    username: username,
                    role: "host"
                }
            ]
        };

        socket.join(roomId);

        socket.emit("room_created", {
            roomId: roomId,
            role: "host"
        });

        console.log(
            `${username} created room ${roomId}`
        );
    });


    // ==========================================
    // JOIN ROOM
    // ==========================================

    socket.on("join_room", ({ roomId, username }) => {

        const room = rooms[roomId];

        if (!room) {

            socket.emit("room_error", {
                message: "Room not found"
            });

            return;
        }

        room.participants.push({

            userId: socket.id,

            username: username,

            role: "participant"

        });

        socket.join(roomId);

        socket.emit("room_joined", {

            roomId: roomId,

            role: "participant"

        });


        // Update participant list
        io.to(roomId).emit(
            "participants_updated",
            {
                participants: room.participants
            }
        );


        // ==========================================
        // SEND CURRENT STATE TO NEW USER
        // ==========================================

        socket.emit("sync_state", {

            videoId: room.videoId,

            currentTime: room.currentTime,

            isPlaying: room.isPlaying

        });


        console.log(
            `${username} joined room ${roomId}`
        );

    });


    // ==========================================
    // PLAY VIDEO
    // ==========================================

    socket.on(
        "play_video",
        ({ roomId, currentTime }) => {

            const room = rooms[roomId];

            if (!room) return;


            const user =
                room.participants.find(
                    (participant) =>
                        participant.userId === socket.id
                );


            if (!user) return;


            // Only Host and Moderator
            if (
                user.role !== "host" &&
                user.role !== "moderator"
            ) {

                console.log(
                    `${user.username} is not allowed to play video`
                );

                return;
            }


            // Save current state
            room.currentTime = currentTime;

            room.isPlaying = true;


            // Send to other users
            socket.to(roomId).emit(
                "video_play",
                {
                    currentTime: currentTime
                }
            );

        }
    );


    // ==========================================
    // PAUSE VIDEO
    // ==========================================

    socket.on(
        "pause_video",
        ({ roomId, currentTime }) => {

            const room = rooms[roomId];

            if (!room) return;


            const user =
                room.participants.find(
                    (participant) =>
                        participant.userId === socket.id
                );


            if (!user) return;


            // Only Host and Moderator
            if (
                user.role !== "host" &&
                user.role !== "moderator"
            ) {

                console.log(
                    `${user.username} is not allowed to pause video`
                );

                return;
            }


            // Save current state
            room.currentTime = currentTime;

            room.isPlaying = false;


            // Send to other users
            socket.to(roomId).emit(
                "video_pause",
                {
                    currentTime: currentTime
                }
            );

        }
    );

    // ==========================================
// SEEK VIDEO
// ==========================================

socket.on("seek_video", ({ roomId, currentTime }) => {

    console.log(
        "SEEK:",
        roomId,
        currentTime
    );

    const room = rooms[roomId];

    // Room exist nahi karta
    if (!room) {
        return;
    }

    // Find user
    const user = room.participants.find(
        (participant) =>
            participant.userId === socket.id
    );

    // User room mein nahi hai
    if (!user) {
        return;
    }

    // Only Host and Moderator can seek
    if (
        user.role !== "host" &&
        user.role !== "moderator"
    ) {

        console.log(
            "Permission denied for seek:",
            socket.id
        );

        return;
    }

    // Save current position
    room.currentTime = currentTime;

    // Send seek event to everyone except sender
    socket.to(roomId).emit(
        "video_seek",
        {
            currentTime
        }
    );

});


    // ==========================================
    // ASSIGN MODERATOR
    // ==========================================

    socket.on(
        "assign_role",
        ({ roomId, userId, role }) => {

            const room = rooms[roomId];

            if (!room) return;


            const requester =
                room.participants.find(
                    (participant) =>
                        participant.userId === socket.id
                );


            if (!requester) return;


            // Only Host
            if (requester.role !== "host") {

                console.log(
                    `${requester.username} is not allowed to assign roles`
                );

                return;
            }


            const target =
                room.participants.find(
                    (participant) =>
                        participant.userId === userId
                );


            if (!target) return;


            // Host role cannot change
            if (target.role === "host") {

                return;

            }


            // Valid roles only
            if (
                role !== "moderator" &&
                role !== "participant"
            ) {

                return;

            }


            target.role = role;


            io.to(roomId).emit(
                "participants_updated",
                {
                    participants:
                        room.participants
                }
            );


            io.to(roomId).emit(
                "role_assigned",
                {
                    userId: target.userId,
                    role: target.role
                }
            );


            console.log(
                `${target.username} is now ${target.role}`
            );

        }
    );


    // ==========================================
    // CHANGE VIDEO
    // ==========================================

    socket.on(
        "change_video",
        ({ roomId, videoId }) => {

            const room = rooms[roomId];

            if (!room) return;


            const user =
                room.participants.find(
                    (participant) =>
                        participant.userId === socket.id
                );


            if (!user) return;


            // Host and Moderator only
            if (
                user.role !== "host" &&
                user.role !== "moderator"
            ) {

                console.log(
                    `${user.username} is not allowed to change video`
                );

                return;
            }


            // Save new video
            room.videoId = videoId;

            // Reset position
            room.currentTime = 0;

            // New video starts paused
            room.isPlaying = false;


            socket.to(roomId).emit(
                "video_changed",
                {
                    videoId: videoId
                }
            );


            console.log(
                `${user.username} changed video to ${videoId}`
            );

        }
    );


    // ==========================================
    // REMOVE PARTICIPANT
    // ==========================================

    socket.on(
        "remove_participant",
        ({ roomId, userId }) => {

            const room = rooms[roomId];

            if (!room) return;


            const requester =
                room.participants.find(
                    (participant) =>
                        participant.userId === socket.id
                );


            if (!requester) return;


            // Only Host
            if (requester.role !== "host") {

                console.log(
                    `${requester.username} is not allowed to remove participants`
                );

                return;
            }


            const target =
                room.participants.find(
                    (participant) =>
                        participant.userId === userId
                );


            if (!target) return;


            // Host cannot remove himself
            if (target.role === "host") return;


            room.participants =
                room.participants.filter(
                    (participant) =>
                        participant.userId !== userId
                );


            io.to(userId).emit(
                "participant_removed"
            );


            const targetSocket =
                io.sockets.sockets.get(userId);


            if (targetSocket) {

                targetSocket.leave(roomId);

            }


            io.to(roomId).emit(
                "participants_updated",
                {
                    participants:
                        room.participants
                }
            );


            console.log(
                `${target.username} was removed from room ${roomId}`
            );

        }
    );


    // ==========================================
    // LEAVE ROOM
    // ==========================================

    socket.on(
        "leave_room",
        ({ roomId }) => {

            const room = rooms[roomId];

            if (!room) return;


            const user =
                room.participants.find(
                    (participant) =>
                        participant.userId === socket.id
                );


            if (!user) return;


            room.participants =
                room.participants.filter(
                    (participant) =>
                        participant.userId !== socket.id
                );


            socket.leave(roomId);


            io.to(roomId).emit(
                "participants_updated",
                {
                    participants:
                        room.participants
                }
            );


            console.log(
                `${user.username} left room ${roomId}`
            );

        }
    );


    // ==========================================
    // DISCONNECT
    // ==========================================

    socket.on("disconnect", () => {

        console.log(
            "User disconnected:",
            socket.id
        );


        for (const roomId in rooms) {

            const room = rooms[roomId];


            const user =
                room.participants.find(
                    (participant) =>
                        participant.userId === socket.id
                );


            if (!user) {

                continue;

            }


            // Host disconnected
            if (user.role === "host") {

                io.to(roomId).emit(
                    "room_closed",
                    {
                        message:
                            "Host has left the room"
                    }
                );


                delete rooms[roomId];


                console.log(
                    `Room ${roomId} closed because host left`
                );


                return;
            }


            // Participant / Moderator disconnected
            room.participants =
                room.participants.filter(
                    (participant) =>
                        participant.userId !== socket.id
                );


            io.to(roomId).emit(
                "participants_updated",
                {
                    participants:
                        room.participants
                }
            );


            console.log(
                `${user.username} left room ${roomId}`
            );


            return;

        }

    });

});


// ==========================================
// START SERVER
// ==========================================

const PORT = process.env.PORT || 5000;

server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});