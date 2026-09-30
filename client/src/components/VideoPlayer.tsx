import YouTube from "react-youtube";
import { useEffect, useRef } from "react";
import socket from "../services/socket";

type VideoPlayerProps = {
    videoId: string;
    roomId: string;
    isHost: boolean;
};

function VideoPlayer({
    videoId,
    roomId,
    isHost
}: VideoPlayerProps) {

    const playerRef = useRef<any>(null);

    // Last known player time
    const lastTimeRef = useRef(0);

    // Store sync state if player is not ready
    const pendingSyncRef = useRef<{
        videoId: string;
        currentTime: number;
        isPlaying: boolean;
    } | null>(null);


    // ==========================================
    // APPLY SYNC STATE
    // ==========================================

    const applySync = (
        syncedVideoId: string,
        currentTime: number,
        isPlaying: boolean
    ) => {

        if (!playerRef.current) {
            return;
        }

        console.log(
            "Applying sync:",
            syncedVideoId,
            currentTime,
            isPlaying
        );

        lastTimeRef.current = currentTime;

        playerRef.current.loadVideoById(
            syncedVideoId,
            currentTime
        );

        if (!isPlaying) {

            setTimeout(() => {

                if (playerRef.current) {

                    playerRef.current.seekTo(
                        currentTime,
                        true
                    );

                    playerRef.current.pauseVideo();
                }

            }, 300);
        }
    };


    // ==========================================
    // YOUTUBE PLAYER READY
    // ==========================================

    const onReady = (event: any) => {

        playerRef.current = event.target;

        console.log("YouTube player ready");

        if (pendingSyncRef.current) {

            const {
                videoId,
                currentTime,
                isPlaying
            } = pendingSyncRef.current;

            applySync(
                videoId,
                currentTime,
                isPlaying
            );

            pendingSyncRef.current = null;

        } else {

            lastTimeRef.current =
                playerRef.current.getCurrentTime() || 0;
        }
    };


    // ==========================================
    // HOST PLAY
    // ==========================================

    const onPlay = () => {

        if (!isHost) return;

        const currentTime =
            playerRef.current?.getCurrentTime() || 0;

        lastTimeRef.current = currentTime;

        socket.emit("play_video", {
            roomId,
            currentTime
        });
    };


    // ==========================================
    // HOST PAUSE
    // ==========================================

    const onPause = () => {

        if (!isHost) return;

        const currentTime =
            playerRef.current?.getCurrentTime() || 0;

        lastTimeRef.current = currentTime;

        socket.emit("pause_video", {
            roomId,
            currentTime
        });
    };


    // ==========================================
    // SOCKET LISTENERS
    // ==========================================

    useEffect(() => {

        // ======================================
        // PLAY
        // ======================================

        const handlePlay = ({
            currentTime
        }: {
            currentTime: number;
        }) => {

            console.log(
                "Received PLAY:",
                currentTime
            );

            if (!playerRef.current) return;

            lastTimeRef.current = currentTime;

            playerRef.current.seekTo(
                currentTime,
                true
            );

            playerRef.current.playVideo();
        };


        // ======================================
        // PAUSE
        // ======================================

        const handlePause = ({
            currentTime
        }: {
            currentTime: number;
        }) => {

            console.log(
                "Received PAUSE:",
                currentTime
            );

            if (!playerRef.current) return;

            lastTimeRef.current = currentTime;

            playerRef.current.seekTo(
                currentTime,
                true
            );

            playerRef.current.pauseVideo();
        };


        // ======================================
        // SEEK
        // ======================================

        const handleSeek = ({
            currentTime
        }: {
            currentTime: number;
        }) => {

            console.log(
                "Received SEEK:",
                currentTime
            );

            if (!playerRef.current) return;

            lastTimeRef.current = currentTime;

            playerRef.current.seekTo(
                currentTime,
                true
            );
        };


        // ======================================
        // LATE JOINER SYNC
        // ======================================

        const handleSyncState = ({
            videoId,
            currentTime,
            isPlaying
        }: {
            videoId: string;
            currentTime: number;
            isPlaying: boolean;
        }) => {

            console.log(
                "Received SYNC STATE:",
                videoId,
                currentTime,
                isPlaying
            );

            if (!playerRef.current) {

                pendingSyncRef.current = {
                    videoId,
                    currentTime,
                    isPlaying
                };

                return;
            }

            applySync(
                videoId,
                currentTime,
                isPlaying
            );
        };


        socket.on(
            "video_play",
            handlePlay
        );

        socket.on(
            "video_pause",
            handlePause
        );

        socket.on(
            "video_seek",
            handleSeek
        );

        socket.on(
            "sync_state",
            handleSyncState
        );


        return () => {

            socket.off(
                "video_play",
                handlePlay
            );

            socket.off(
                "video_pause",
                handlePause
            );

            socket.off(
                "video_seek",
                handleSeek
            );

            socket.off(
                "sync_state",
                handleSyncState
            );

        };

    }, []);


    // ==========================================
    // SEEK DETECTION
    // ==========================================

    useEffect(() => {

        if (!isHost) {
            return;
        }

        const interval = setInterval(() => {

            if (!playerRef.current) {
                return;
            }

            const playerState =
                playerRef.current.getPlayerState();

            // 1 = playing
            if (playerState !== 1) {
                return;
            }

            const currentTime =
                playerRef.current.getCurrentTime();

            const previousTime =
                lastTimeRef.current;

            const difference =
                Math.abs(
                    currentTime - previousTime
                );

            /*
             * Normal playback:
             * 0.5 sec -> 0.5 sec -> 0.5 sec
             *
             * User seeks:
             * 30 sec -> 120 sec
             *
             * If jump is greater than 1.5 seconds,
             * treat it as a seek.
             */

            if (difference > 1.5) {

                console.log(
                    "SEEK DETECTED:",
                    currentTime
                );

                socket.emit(
                    "seek_video",
                    {
                        roomId,
                        currentTime
                    }
                );
            }

            lastTimeRef.current = currentTime;

        }, 500);


        return () => {
            clearInterval(interval);
        };

    }, [isHost, roomId]);


    // ==========================================
    // YOUTUBE PLAYER
    // ==========================================

    return (

        <YouTube
            key={videoId}
            videoId={videoId}

            opts={{
                width: "800",
                height: "450",

                playerVars: {
                    autoplay: 0,
                    controls: isHost ? 1 : 0
                }
            }}

            onReady={onReady}
            onPlay={onPlay}
            onPause={onPause}
        />

    );
}

export default VideoPlayer;