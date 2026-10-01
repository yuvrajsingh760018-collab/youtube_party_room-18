# 🎬 YouTube Watch Party

A real-time YouTube Watch Party application where multiple users can
join the same room and watch YouTube videos together with synchronized
playback.

---

## 🚀 Live Demo

### Frontend
https://youtube-party-room-18.vercel.app

### Backend
https://youtube-party-room-18.onrender.com

---

## 🚀 Features

- Create a watch party room
- Join a room using a unique room code
- Real-time video synchronization
- Play/Pause synchronization
- Seek synchronization
- Late-joiner synchronization
- Change YouTube video
- Host and Participant roles
- Promote Participant to Moderator
- Remove participants
- Leave room
- Handle user disconnection
- Backend permission validation
- Responsive UI

---

## 👥 Roles

### Host
- Create room
- Play/Pause video
- Seek video
- Change video
- Promote participant to Moderator
- Remove participants

### Moderator
- Play/Pause video
- Seek video
- Change video

### Participant
- Watch synchronized video
- Cannot control playback
- Cannot change video

---

## 🛠️ Tech Stack

### Frontend

- React
- TypeScript
- Vite
- Socket.IO Client
- React YouTube

### Backend

- Node.js
- Express.js
- Socket.IO
- CORS

---

## 📁 Project Structure

```text
youtube_watch_party/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   └── VideoPlayer.tsx
│   │   ├── services/
│   │   │   └── socket.ts
│   │   ├── App.tsx
│   │   └── App.css
│   │
│   ├── package.json
│   └── .env
│
├── server/
│   ├── server.js
│   ├── package.json
│   └── .env
│
└── README.md


## 🔄 Real-Time Events

The application uses Socket.IO for real-time communication between users.

### Room Events
- `join_room` – Join an existing watch party room
- `leave_room` – Leave the current room
- `room_created` – Notify the host when a room is created
- `room_joined` – Notify a user after joining a room

### Video Events
- `play` – Synchronize video playback
- `pause` – Synchronize video pause
- `seek_video` – Synchronize video seeking
- `change_video` – Change the current YouTube video
- `sync_state` – Send the current video state to a newly joined user

### User & Role Events
- `user_joined` – Notify users when someone joins
- `user_left` – Notify users when someone leaves
- `assign_role` – Promote a participant to moderator
- `remove_participant` – Remove a participant from the room

## 🧪 Testing

The application was tested for the following scenarios:

- Multiple users joining the same room
- Room creation and joining using room code
- Play synchronization between users
- Pause synchronization between users
- Seek synchronization between users
- Late-joiner synchronization
- YouTube video change synchronization
- Host and Participant role handling
- Participant promotion to Moderator
- Participant removal by Host
- User leave and disconnect handling
- Backend permission validation
- Frontend and deployed backend communication
- Production deployment testing using Vercel and Render

All major real-time watch party features were tested successfully in the deployed environment.

## 🌐 Deployment

The application is deployed using Vercel and Render.

### Frontend
- Platform: Vercel
- URL: https://youtube-party-room-18.vercel.app

### Backend
- Platform: Render
- URL: https://youtube-party-room-18.onrender.com