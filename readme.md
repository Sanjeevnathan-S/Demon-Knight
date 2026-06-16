# ⚔️ Demon Knight

A real-time multiplayer browser fighting game built with **Node.js**, **Socket.IO**, **MongoDB**, and **JWT authentication**. Demon Knight combines fast-paced combat with a server-authoritative multiplayer architecture to provide low-latency gameplay and secure online sessions.

## 🎮 Live Demo

**Play here:** https://demon-knight.onrender.com/

---

## 📸 Overview

Demon Knight is a multiplayer combat game where players battle in real time using melee attacks, dashes, combos, and projectiles.

The project was designed as both a game and a study of:

* Real-time networking
* WebSocket communication
* Operating System synchronization concepts
* Multiplayer game architecture
* Server-authoritative game design
* Database-backed player progression

---

## ✨ Features

### Single Player

* Score tracking
* Persistent high scores
* Leaderboard support
* Player progression storage

### Multiplayer

* Real-time combat
* Session-based matchmaking
* Lobby and invitation system
* Up to 5 players per session
* Projectile and melee combat
* Live state synchronization

### Security

* JWT authentication
* Password hashing
* Server-side validation
* Server-authoritative gameplay logic

---

## 🏗️ Tech Stack

### Frontend

* HTML5 Canvas
* JavaScript (ES6)
* Socket.IO Client

### Backend

* Node.js
* Express.js
* Socket.IO
* JWT Authentication

### Database

* MongoDB
* Mongoose

### Deployment

* Docker
* Render

---

## 🌐 Multiplayer Architecture

The multiplayer system uses **WebSockets through Socket.IO** for persistent bidirectional communication.

### Communication Flow

Client Input → Socket.IO → Game Server → Physics & Collision Engine → State Broadcast → Clients

### Benefits

* Low latency communication
* Automatic reconnection support
* Room-based session isolation
* Efficient event-driven architecture

---

## ⚡ Real-Time Synchronization

### Server Tick Rate

* **50 Hz (20ms)**

### Client Input Rate

* **~50 Hz (20ms)**

Recent update:

* Increased client socket input emission frequency from **20 Hz** to **50 Hz** for more responsive gameplay and reduced input delay.

### Why?

Higher input transmission frequency allows:

* Faster attack registration
* Smoother movement updates
* Lower perceived latency
* Improved multiplayer responsiveness

---

## 🧠 Operating System Concepts Applied

### Producer–Consumer Pattern

The multiplayer input system follows the classic producer-consumer model:

**Producer**

* Keyboard event handlers
* Generates player inputs asynchronously

**Consumer**

* Network transmission loop
* Sends buffered inputs to the server at a fixed interval

### Synchronization

The game uses controlled update intervals to:

* Prevent race conditions
* Maintain consistent state updates
* Keep client and server synchronized

---

## 🎯 Server-Authoritative Design

All critical gameplay logic runs on the server:

* Movement validation
* Collision detection
* Damage calculation
* Health management
* Win condition checks

This ensures consistent game state across all clients and reduces client-side manipulation risks.

---

## ⚔️ Combat System

### Melee Combat

* Attack
* Combo attacks
* Dash attacks

### Projectile System

* Server-validated projectiles
* Collision-based damage
* Cooldown management
* Automatic cleanup

---

## 📦 Database Design

### Player Collection

Stores:

* Username
* Hashed password
* Single-player statistics
* Multiplayer statistics
* Coins
* Wins and losses

### Multiplayer Session Collection

Stores:

* Session state
* Player references
* Lobby information
* Match history

---

## 🏠 Multiplayer Session Flow

1. Create Session
2. Invite Players
3. Join Lobby
4. Start Match
5. Real-Time Gameplay
6. Match Completion
7. Statistics Saved

Session states:

WAITING → ONGOING → FINISHED

---

## 📊 Network Optimizations

### Room-Based Broadcasting

Only players in the same session receive updates.

Benefits:

* Lower bandwidth usage
* Better scalability
* Reduced unnecessary traffic

### Delta Updates

Only changed state information is transmitted whenever possible.

Benefits:

* Reduced network load
* Faster synchronization
* Improved scalability

---

## 📡 Event-Driven Communication Layer

The system is built around real-time event-based communication using Socket.IO.

### Client → Server Events
* playerInput
* createSession
* invitePlayer
* acceptInvite

### Server → Client Events
* stateUpdate
* gameStarted
* playerJoined
* gameOver

## 🚀 Running Locally

### Clone Repository

```bash
git clone <your-repo-url>
cd demon-knight
```

### Install Dependencies

```bash
npm install
```

### Configure Environment Variables

Create a `.env` file:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
PORT=3000
```

### Start Server

```bash
npm start
```

Application will be available at:

```text
http://localhost:3000
```

---

## 🐳 Docker

### Build Image

```bash
docker build -t demon-knight .
```

### Run Container

```bash
docker run -p 3000:3000 demon-knight
```

---

## 📈 Future Improvements

* Client-side interpolation
* Lag compensation
* Redis session storage
* Matchmaking system
* Tournament mode
* Horizontal scaling

---

## 📚 Educational Concepts Demonstrated

### Computer Networks

* WebSockets
* TCP communication
* Real-time networking
* Bandwidth optimization

### Operating Systems

* Producer-Consumer pattern
* Synchronization
* Critical sections
* Buffer management

### Software Engineering

* MVC architecture for clear separation of concerns
* REST APIs for authentication and game data management
* Event-driven communication using Socket.IO for real-time updates
* JWT-based authentication system for secure access control
* EReal-time state synchronization between client and server

---

## ⚔️ Built With Purpose

Developed as a real-time multiplayer game project exploring networking, operating systems concepts, and modern web application architecture.

---