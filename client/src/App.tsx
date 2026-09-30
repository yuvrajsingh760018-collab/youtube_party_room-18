import { useEffect, useState } from "react";
import socket from "./services/socket";
import VideoPlayer from "./components/VideoPlayer";
import "./App.css";

type Participant = {
    userId: string;
    username: string;
    role: string;
};

function App() {

    const [username, setUsername] = useState("");
    const [roomId, setRoomId] = useState("");
    const [currentRoom, setCurrentRoom] = useState("");
    const [role, setRole] = useState("");
    const [participants, setParticipants] = useState<Participant[]>([]);

    const [videoId, setVideoId] = useState("dQw4w9WgXcQ");
    const [newVideoId, setNewVideoId] = useState("");

    // ==========================================
    // SOCKET LISTENERS
    // ==========================================

    useEffect(() => {

        socket.on("connect", () => {
            console.log("Connected to server:", socket.id);
        });

        socket.on("room_created", (data) => {

            console.log("Room created:", data);

            setCurrentRoom(data.roomId);
            setRole(data.role);

            setParticipants([
                {
                    userId: socket.id || "",
                    username: username,
                    role: "host",
                },
            ]);
        });

        socket.on("room_joined", (data) => {

            console.log("Room joined:", data);

            setCurrentRoom(data.roomId);
            setRole(data.role);
        });

        socket.on("participants_updated", (data) => {

            console.log("Participants:", data.participants);

            setParticipants(data.participants);
        });

        socket.on("room_error", (data) => {
            alert(data.message);
        });

        socket.on("video_changed", ({ videoId }) => {

            console.log("Video changed:", videoId);

            setVideoId(videoId);
        });

        socket.on("participant_removed", () => {

            alert("You have been removed from the room");

            setCurrentRoom("");
            setRole("");
            setParticipants([]);
        });

        return () => {

            socket.off("connect");
            socket.off("room_created");
            socket.off("room_joined");
            socket.off("participants_updated");
            socket.off("room_error");
            socket.off("video_changed");
            socket.off("participant_removed");

        };

    }, [username]);


    // ==========================================
    // CREATE ROOM
    // ==========================================

    const createRoom = () => {

        if (!username.trim()) {
            alert("Please enter username");
            return;
        }

        socket.emit("create_room", {
            username: username,
        });
    };


    // ==========================================
    // JOIN ROOM
    // ==========================================

    const joinRoom = () => {

        if (!username.trim() || !roomId.trim()) {
            alert("Please enter username and room ID");
            return;
        }

        socket.emit("join_room", {
            roomId: roomId.toUpperCase(),
            username: username,
        });
    };


    // ==========================================
    // CHANGE VIDEO
    // ==========================================

    const changeVideo = () => {

        if (!newVideoId.trim()) {
            alert("Please enter YouTube Video ID");
            return;
        }

        setVideoId(newVideoId);

        socket.emit("change_video", {
            roomId: currentRoom,
            videoId: newVideoId,
        });

        setNewVideoId("");
    };


    // ==========================================
    // REMOVE PARTICIPANT
    // ==========================================

    const removeParticipant = (userId: string) => {

        socket.emit("remove_participant", {
            roomId: currentRoom,
            userId: userId,
        });
    };


    // ==========================================
    // LEAVE ROOM
    // ==========================================

    const leaveRoom = () => {

        socket.emit("leave_room", {
            roomId: currentRoom,
        });

        setCurrentRoom("");
        setRole("");
        setParticipants([]);
    };


    // ==========================================
    // ROOM SCREEN
    // ==========================================

    if (currentRoom) {

        return (

            <div className="app-container">

                <div className="room-container">

                    {/* HEADER */}

                    <div className="room-header">

                        <div>
                            <h1>YouTube Watch Party</h1>

                            <div className="room-info">

                                <span>
                                    Room:
                                    <strong>{currentRoom}</strong>
                                </span>

                                <span className="role-badge">
                                    {role}
                                </span>

                            </div>
                        </div>

                        <button
                            className="leave-btn"
                            onClick={leaveRoom}
                        >
                            Leave Room
                        </button>

                    </div>


                    {/* VIDEO SECTION */}

                    <div className="video-section">

                        <VideoPlayer
                            videoId={videoId}
                            roomId={currentRoom}
                            isHost={
                                role === "host" ||
                                role === "moderator"
                            }
                        />

                    </div>


                    {/* CHANGE VIDEO */}

                    {(role === "host" ||
                        role === "moderator") && (

                        <div className="control-card">

                            <h3>Change Video</h3>

                            <div className="video-input-row">

                                <input
                                    className="input"
                                    type="text"
                                    placeholder="Enter YouTube Video ID"
                                    value={newVideoId}
                                    onChange={(e) =>
                                        setNewVideoId(e.target.value)
                                    }
                                />

                                <button
                                    className="primary-btn change-btn"
                                    onClick={changeVideo}
                                >
                                    Change Video
                                </button>

                            </div>

                        </div>

                    )}


                    {/* PARTICIPANTS */}

                    <div className="participants-card">

                        <div className="participants-header">

                            <h2>Participants</h2>

                            <span className="participant-count">
                                {participants.length}
                            </span>

                        </div>


                        <div className="participants-list">

                            {participants.map((participant) => (

                                <div
                                    className="participant-item"
                                    key={participant.userId}
                                >

                                    <div className="participant-info">

                                        <div className="avatar">
                                            {participant.username
                                                .charAt(0)
                                                .toUpperCase()}
                                        </div>

                                        <div>

                                            <div className="participant-name">
                                                {participant.username}
                                            </div>

                                            <div className="participant-role">
                                                {participant.role}
                                            </div>

                                        </div>

                                    </div>


                                    <div className="participant-actions">

                                        {/* MAKE MODERATOR */}

                                        {role === "host" &&
                                            participant.role ===
                                                "participant" && (

                                            <button
                                                className="moderator-btn"
                                                onClick={() => {

                                                    socket.emit(
                                                        "assign_role",
                                                        {
                                                            roomId:
                                                                currentRoom,

                                                            userId:
                                                                participant.userId,

                                                            role:
                                                                "moderator",
                                                        }
                                                    );

                                                }}
                                            >
                                                Make Moderator
                                            </button>

                                        )}


                                        {/* REMOVE */}

                                        {role === "host" &&
                                            participant.role !==
                                                "host" && (

                                            <button
                                                className="remove-btn"
                                                onClick={() =>
                                                    removeParticipant(
                                                        participant.userId
                                                    )
                                                }
                                            >
                                                Remove
                                            </button>

                                        )}

                                    </div>

                                </div>

                            ))}

                        </div>

                    </div>

                </div>

            </div>
        );
    }


    // ==========================================
    // HOME SCREEN
    // ==========================================

    return (

        <div className="app-container">

            <div className="home-container">

                <div className="home-card">

                    <div className="logo">
                        ▶
                    </div>

                    <h1>YouTube Watch Party</h1>

                    <p>
                        Watch YouTube videos together in real-time
                    </p>


                    {/* USERNAME */}

                    <input
                        className="input"
                        type="text"
                        placeholder="Enter your username"
                        value={username}
                        onChange={(e) =>
                            setUsername(e.target.value)
                        }
                    />


                    {/* CREATE ROOM */}

                    <button
                        className="primary-btn"
                        onClick={createRoom}
                    >
                        Create Room
                    </button>


                    <div className="divider">
                        <span>OR</span>
                    </div>


                    {/* ROOM CODE */}

                    <input
                        className="input"
                        type="text"
                        placeholder="Enter room code"
                        value={roomId}
                        onChange={(e) =>
                            setRoomId(e.target.value.toUpperCase())
                        }
                    />


                    {/* JOIN ROOM */}

                    <button
                        className="secondary-btn"
                        onClick={joinRoom}
                    >
                        Join Room
                    </button>

                </div>

            </div>

        </div>
    );
}

export default App;