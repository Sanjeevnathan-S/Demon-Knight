const socket = io('http://127.0.0.1:3000', {
  transports: ['websocket', 'polling']
});
const token = localStorage.getItem('token');
let myUserId = null;
let myUsername = null;
let currentSessionId = null;
let invitedBy = null;

// Wait until socket connected
socket.on('connect', () => {
  console.log(' Connected to Socket.IO:', socket.id);
  if (token) {
    socket.emit('registerUser', { token });
  } else {
    alert('No token found. Please log in again.');
    window.location.href = '/';
  }
})
;
//set client variables after registration
socket.on('userRegistered', ({ userId, username }) => {
  myUserId = userId;
  myUsername = username;
});

// Listen for updated player list
socket.on('playerList', (players) => {
  const me = players.find(p => p.userId === myUserId);
  if (me) {
    document.getElementById('welcomeUser').textContent = `Welcome, ${me.username}!`;
  }

  const list = document.getElementById('onlinePlayers');
  list.innerHTML = '';
  players.forEach(p => {
    if (p.userId === myUserId) return; // skip self
    const li = document.createElement('li');
    li.textContent = p.username;
    li.onclick = () => invitePlayer(p.userId);
    list.appendChild(li);
  });
});


// Invite player
function invitePlayer(targetPlayerId) {
  if (!currentSessionId) {
    // First create a new session for inviter
    socket.emit('createSession', { color: getRandomColor() });
    socket.once('sessionCreated', ({ sessionId }) => {
      currentSessionId = sessionId;
      socket.emit('invitePlayer', { sessionId, targetPlayerId });
      alert('Invite sent!');
    });
  } else {
    // Already in session, just send invite
    socket.emit('invitePlayer', { sessionId: currentSessionId, targetPlayerId });
    alert('Invite sent!');
  }
}

// Receive invite
socket.on('inviteReceived', ({ sessionId }) => {
  const li = document.createElement('li');
  li.textContent = `Invite from session ${sessionId}`;
  li.onclick = () => acceptInvite(sessionId);
  document.getElementById('inviteList').appendChild(li);
});

// Accept invite
function acceptInvite(sessionId) {
  socket.emit('acceptInvite', { sessionId, color: getRandomColor() });
  invitedBy = sessionId;
  currentSessionId = sessionId;
  alert('Joined session!');
}

// Update session player list
socket.on('playerJoined', ({players,createdBy}) => {
  const list = document.getElementById('sessionPlayers');
  list.innerHTML = '';
  players.forEach(p => {
    const li = document.createElement('li');
    li.textContent = `Player: ${p.username} | Color: ${p.color}`;
    list.appendChild(li);
  });
  // Show start button for inviter only when session player >=2
  if (players.length >= 2 && myUserId===createdBy) {
    document.getElementById('startBtn').style.display = 'block';
  }else{
    document.getElementById('startBtn').style.display = 'none';
  }
});

// Start game
function startGame() {
  if (!currentSessionId) return alert('No session active');
  socket.emit('startGame', { sessionId: currentSessionId });
}

// Game started — redirect everyone
socket.on('gameStarted', ({ sessionId }) => {
  //alert('Game starting!');
  window.location.href = `/game-multi.html?sessionId=${encodeURIComponent(sessionId)}&userId=${encodeURIComponent(myUserId)}&username=${encodeURIComponent(myUsername)}`;
});

// Utility: generate color for each player
function getRandomColor() {
  const colors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
  return colors[Math.floor(Math.random() * colors.length)];
}