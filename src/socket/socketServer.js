// src/socket/socketServer.js
const jwt = require('jsonwebtoken');
const MultiplayerSession = require('../models/MultiplayerSession');
const Player = require('../models/Player');

// activeUsers: socketId -> { userId, username }
const activeUsers = new Map();
// sessionId => { players: Map<userId, PlayerData>, projectiles: [] }
const sessions = new Map(); 
// userId -> { left, right, jump, etc. }
const playerInputs = new Map(); 

const GAME_WIDTH = 1800;
let ioRef=null;

module.exports = (io) => {
  ioRef=io;
  io.on('connection', (socket) => {
    console.log(' New socket connected:', socket.id);

    //listen to client inputs
      socket.on("playerInput", ({ left, right, jump, crouch, fire, attack, attack2, combo, dash }) => {
      const user = activeUsers.get(socket.id);
      if (user) {
        playerInputs.set(user.userId, {
          left,
          right,
          jump,
          crouch,
          fire,
          attack,
          attack2,
          combo,
          dash,
        });
        //console.log(playerInputs);
      }
    });

    // Register the user immediately using the token
    socket.on('registerUser', async ({ token }) => {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const player = await Player.findById(decoded.userId);
        if (!player) return;

        activeUsers.set(socket.id, {
          userId: player._id.toString(),
          username: player.username
        });

        console.log(` Registered ${player.username} (${socket.id})`);
        socket.emit('userRegistered', { userId: player._id.toString(), username: player.username });
        updatePlayerList(io);
      } catch (err) {
        console.error(' Invalid token:', err.message);
      }
    });

    // Create a new multiplayer session
    socket.on('createSession', async ({ color }) => {
      const user = activeUsers.get(socket.id);
      if (!user) {
        console.error(' User not registered for socket:', socket.id);
        return;
      }

      console.log(' Creating session for userId:', user.userId);

      const session = await MultiplayerSession.create({
        players: [{ 
          playerId: user.userId, 
          username: user.username, 
          color 
        }],
        createdBy: user.userId,
        status: 'waiting'
      });

      socket.join(session._id.toString());
      socket.emit('sessionCreated', { sessionId: session._id, players: session.players, createdBy:session.createdBy.toString() });
    });

    // Invite player
    socket.on('invitePlayer', ({ sessionId, targetPlayerId }) => {
      for (const [sockId, user] of activeUsers.entries()) {
        if (user.userId === targetPlayerId) {
          io.to(sockId).emit('inviteReceived', { sessionId });
          break;
        }
      }
    });

    // Accept invite
    socket.on('acceptInvite', async ({ sessionId, color }) => {
      const user = activeUsers.get(socket.id);
      if (!user) return;

      const session = await MultiplayerSession.findById(sessionId);
      if (session && session.status === 'waiting') {
        session.players.push({ playerId: user.userId, username: user.username, color });
        await session.save();
        socket.join(sessionId);//join session room
        io.to(sessionId).emit('playerJoined', {players:session.players, createdBy: session.createdBy.toString()});
      }
    });

    // Start game
    socket.on('startGame', async ({ sessionId }) => {
      const user = activeUsers.get(socket.id);
      if (!user) return;

      const session = await MultiplayerSession.findById(sessionId);
      if (session) {
        session.status = 'ongoing';
        await session.save();

        if (!sessions.has(sessionId)) {
      const playersMap = new Map();
      const spacing = GAME_WIDTH / (session.players.length + 1);
      
      session.players.forEach((p, index) => {
        const username = p.username || `Player${index + 1}`;
        const spawnX = spacing * (index + 1); // Spread players evenly
        
        playersMap.set(p.playerId._id.toString(), new PlayerData(
          p.playerId._id.toString(),
          username,
          spawnX,
          740, // Ground level
          p.color
        ));
      });
      
      sessions.set(sessionId, {
        players: playersMap,
        projectiles: [],
        deathCounter: session.players.length,
        gameEnded: false
      });
    }
        io.to(sessionId).emit('gameStarted', { sessionId });
      }
    });

    // Disconnect
    socket.on('disconnect', () => {

      const user = activeUsers.get(socket.id);
      if (user) {
        playerInputs.delete(user.userId);
        if (getSessionByPlayerId(user.userId)) {
          socket.to(getSessionByPlayerId(user.userId)).emit('playerDisconnected', { userId: user.userId });
        }
      }

      activeUsers.delete(socket.id);
      updatePlayerList(io);
      console.log(' Socket disconnected:', socket.id);
    });


    socket.on('joinGame', async ({ sessionId,token}) =>{
      try{
        const decoded= jwt.verify(token, process.env.JWT_SECRET);
        const player= await Player.findById(decoded.userId);
        if(!player)return;

        const userId= player._id.toString();
        const username= player.username;

        const session= await MultiplayerSession.findById(sessionId);
        if(!session) return;

        if (session.status !== 'ongoing' && session.status !== 'waiting') {
          socket.emit('joinFailed', { reason: 'Game already ended or not available.' });
          return;
        }

        socket.join(sessionId);

        activeUsers.set(socket.id,{ userId, username, sessionId});

        socket.emit('gameInit',{
          selfId: userId,
          players: session.players.map(p=>({
            userId:p.playerId,
            color:p.color,
            username:p.username || "Player"
          }))
        });

        console.log(`[${userId}] joined game session ${sessionId}`);
      }catch(err){
        console.error('joinGame error: ',err.message);
      }
    });

  });
};

// Helper to broadcast player list
function updatePlayerList(io) {
  const players = Array.from(activeUsers.values());
  io.emit('playerList', players);
}
function getUsernameById(userId) {
  for (const { userId: id, username } of activeUsers.values()) {
    if (id === userId) return username;
  }
  return "Player";
}

class PlayerData {
  constructor(userId, username ,x, y,color='gray') {
    this.userId = userId;
    this.username = username;
    this.color=color;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;

    this.width = 128;
    this.height = 128;
    this.speed = 10;
    this.gravity = 2;
    this.jumpForce = -40;
    this.rank=null;

    this.health = 10000;
    this.dead = false;
    this.deathTime = null;

    this.isGrounded = true;
    this.jumpCount = 0;
    this.maxJumps = 3;

    this.direction = "right";
    this.currentAnim = "idle";
    this.frameIndex = 0;
    this.frameTimer = 0;
    this.frameInterval = 3;
    this.fireCooldown = 0;
    this.lastFiredAt = Date.now();
  }

  setAnimation(name) {
    if (this.currentAnim !== name) {
      this.currentAnim = name;
      this.frameIndex = 0;
      this.frameTimer = 0;
    }
  }

  applyInput(input) {
    // Input is an object like { left, right, jump, crouch, fire, attack, dash }
    // Reset horizontal velocity each frame unless input persists

     // if already animating an attack, ignore new attack input until finished
    if (["attack", "attack2", "combo", "dash"].includes(this.currentAnim)) {
      this.frameUpdate();
      return;
    }

    this.vx = 0;

    if (this.dead) {
      this.frameUpdate();
      return;
    }

    // Jump
    if (input.jump && this.jumpCount < this.maxJumps) {
      this.vy = this.jumpForce;
      this.isGrounded = false;
      this.jumpCount += 1;
      this.setAnimation("jump");
    }

    // Crouch
    if (input.crouch && this.isGrounded) {
      this.setAnimation("crouch");
    }

    // Horizontal Movement
    if (input.right) {
      this.vx = this.speed;
      this.direction = "right";
      if (this.isGrounded && !input.attack) {
        this.setAnimation("walk");
      }
    }
    else if (input.left) {
      this.vx = -this.speed;
      this.direction = "left";
      if (this.isGrounded && !input.attack) {
        this.setAnimation("walk");
      }
    }
    else {
      // No horizontal move
      if (this.isGrounded && !input.attack) {
        this.setAnimation("idle");
      }
    }
   
    // Dash
    if (input.dash && this.isGrounded) {
      const dashDistance = this.speed * 4;
      this.vx = (this.direction === "right" ? dashDistance : -dashDistance);
      this.setAnimation("dash");
    }

    if (input.fire && Date.now() - this.lastFiredAt >= 500) {
      this.lastFiredAt = Date.now(); // 500ms cooldown at 20fps (50ms tick)

      const handOffsetY = this.height * 0.35;
      const projectileHeight = 32;

      const projectileX = this.x + (this.direction === "right" ? this.width * 0.9 : -20);
      const projectileY = this.y - handOffsetY + projectileHeight; 

      const projectile = new ProjectileData(this.userId, projectileX, projectileY, this.direction);
      const session = getSessionByPlayerId(this.userId);

      if (session) {
        session.projectiles.push(projectile);
      }
    }

    // Attack
    if (input.combo) {
      this.setAnimation("combo");
    } else if (input.attack2) {
      this.setAnimation("attack2");
    } else if (input.attack || input.fire ) {
      this.setAnimation("attack");
    }
  }

  applyPhysics() {
    // Apply velocities
    this.x += this.vx;
    this.y += this.vy;

    // Gravity
    this.vy += this.gravity;

    // Floor collision (example groundY)
    const groundY = 740; 
    if (this.y >= groundY) {
      this.y = groundY;
      this.vy = 0;
      this.isGrounded = true;
      this.jumpCount = 0;
    } else {
      this.isGrounded = false;
    }

    // Boundaries (left + right)
    if (this.x < 0) this.x = 0;
    if (this.x > GAME_WIDTH - this.width) this.x = GAME_WIDTH - this.width;
  }

  frameUpdate(){
    this.frameTimer++;
    if (this.frameTimer >= this.frameInterval) {
      this.frameTimer = 0;
      this.frameIndex++;
      const animLength = getAnimationLength(this.currentAnim);
      if (this.frameIndex >= animLength){
        
        if(this.currentAnim==='death')this.setAnimation('dead');
        else this.frameIndex = 0;
        if (["attack","attack2","combo","dash"].includes(this.currentAnim))this.setAnimation("idle");//remove buffer once finished
      } 
    }

  }
  update(input, session, sessionId) {
    if (this.fireCooldown > 0) {
      this.fireCooldown--;
    }
    this.applyInput(input);
    this.applyPhysics();
    this.frameUpdate();

    handleDeath(this, session, sessionId);
  }

  getStateForClient() {
    return {
      userId: this.userId,
      username: this.username,
      color: this.color,
      x: this.x,
      y: this.y,
      direction: this.direction,
      currentAnim: this.currentAnim,
      frameIndex: this.frameIndex,
      health: this.health,
      dead: this.dead
    };
  }
}

class ProjectileData {
  constructor(ownerId, x, y, direction, speed = 12) {
    this.ownerId = ownerId;
    this.x = x;
    this.y = y;
    this.direction = direction; // "left" or "right"
    this.speed = speed;

    this.width = 32;
    this.height = 32;

    this.dead = false; 
    this.currentAnim = "fly";
    this.frameIndex = 0;
    this.frameTimer = 0;
    this.frameInterval = 8;
  }

  update() {
    if (this.dead) {
      this.frameUpdate();
      return;
    }

    this.x += this.direction === "right" ? this.speed : -this.speed;

    // Out-of-bounds = mark dead
    if (this.x < 0 || this.x > GAME_WIDTH) {
      this.dead = true;
      this.setAnimation("dead"); 
    }

    this.frameUpdate();
  }

  setAnimation(name) {
    if (this.currentAnim !== name) {
      this.currentAnim = name;
      this.frameIndex = 0;
      this.frameTimer = 0;
    }
  }

  frameUpdate() {
    this.frameTimer++;
    if (this.frameTimer >= this.frameInterval) {
      this.frameTimer = 0;
      this.frameIndex++;
      const animLength = getAnimationLength(this.currentAnim);
      if (this.frameIndex >= animLength) {
        if (this.currentAnim === "dead") {
          this.dead = true; // Permanently remove after animation
        } else {
          this.frameIndex = 0;
        }
      }
    }
  }
}



//game loop
setInterval(() => {
  sessions.forEach((session, sessionId) => {

    session.players.forEach((player, userId) => {
      const input = playerInputs.get(userId) || {};
      player.update(input, session, sessionId);
    });

    handlePlayerCollisions(session,sessionId); //player-player
    updateProjectiles(session);
    checkProjectileHits(ioRef,session,sessionId);//player-projectile
    broadcastSessionState(ioRef,sessionId, session);
    updateDeadPlayers(ioRef,session,sessionId);
  });
}, 50);

function handlePlayerCollisions(session,sessionId ) {
  const playersArray = Array.from(session.players.values());
  
  // Check every pair of players for collisions
  for (let i = 0; i < playersArray.length; i++) {
    const playerA = playersArray[i];
    for (let j = i + 1; j < playersArray.length; j++) {
      const playerB = playersArray[j];

      if (!playerA.dead && !playerB.dead && isPlayerColliding(playerA, playerB)) {
        handleCollision(playerA, playerB);
        // Check for death
        handleDeath(playerA, session, sessionId);
        handleDeath(playerB, session, sessionId);
      }
    }
  }
}

function handleCollision(playerA, playerB) {
  
  const damage = 50;
    if (["attack", "attack2", "combo", "dash"].includes(playerA.currentAnim)) {
    playerB.health -= damage;
  }

  if (["attack", "attack2", "combo", "dash"].includes(playerB.currentAnim)) {
    playerA.health -= damage;
  }

}

function updateProjectiles(session) {
  session.projectiles.forEach(proj => {
    proj.update();
  });

  // Remove projectiles marked as dead
  session.projectiles = session.projectiles.filter(p => !p.dead);
}

function isColliding(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}


function checkProjectileHits(io,session, sessionId) {
  session.projectiles.forEach(proj => {
    session.players.forEach((player, userId) => {
      if (player.userId === proj.ownerId || player.dead) return;

      if (isColliding(proj, player)) {
        player.health -= 200;
        proj.dead=true;
        proj.setAnimation("dead");

        handleDeath(player, session, sessionId);
      }
    });
  });
}

function broadcastSessionState(io, sessionId, session) {
  const playersState = [];
  session.players.forEach((player, userId) => {
    playersState.push({
      userId: player.userId,
      username: player.username,
      color:player.color,
      x: player.x,
      y: player.y,
      direction: player.direction,
      health: player.health,
      currentAnim: player.currentAnim,
      frameIndex: player.frameIndex,
      dead: player.dead,
    });
  });

  const projectilesState = session.projectiles.map(p => ({
    ownerId: p.ownerId,
    x: p.x,
    y: p.y,
    direction: p.direction,
    currentAnim: p.currentAnim,
    frameIndex: p.frameIndex,
    dead: p.dead,
  }));

  io.to(sessionId).emit('stateUpdate', {
    players: playersState,
    projectiles: projectilesState
  });
}

function updateDeadPlayers(io,session,sessionId) {
if (!session.gameEnded && session.deathCounter === 1) {
  const winner = Array.from(session.players.values()).find(p => !p.dead);
  if (winner) {
    winner.rank = 1;
    session.gameEnded = true;

    const rankings = Array.from(session.players.values())
      .map(p => ({
        userId: p.userId,
        username: p.username,
        rank: p.rank
      }))
      .sort((a, b) => a.rank - b.rank); // lowest rank = winner

    rankings.forEach(({ userId, rank }) => {
      const coins = (6 - rank) * 100; // Adjust max rank if needed
      Player.findByIdAndUpdate(userId, { $inc: { coins } }).catch(console.error);
    });

    ioRef.to(sessionId).emit('gameOver', {
      winnerId: winner.userId,
      username: winner.username,
      rankings
    });

    MultiplayerSession.findByIdAndUpdate(sessionId, { status: 'finished' }).catch(console.error);
    console.log(`Game Over in session ${sessionId}. Winner: ${winner.username}`);
  }
}
}

function getAnimationLength(animName) {
  const animationFrames = {
    idle: 10,
    walk: 10,
    jump: 3,
    crouch: 1,
    attack: 4,
    attack2: 6,
    combo: 10,
    slide: 4,
    dash: 2,
    death: 10,
    fly: 4,//projectile anim
    dead: 1 //put full stop
  };

  return animationFrames[animName] || 1; 
}

function isPlayerColliding(playerA, playerB) {
  return (
    playerA.x < playerB.x + playerB.width &&
    playerA.x + playerA.width > playerB.x &&
    playerA.y < playerB.y + playerB.height &&
    playerA.y + playerA.height > playerB.y
  );
}

function getSessionByPlayerId(userId) {
  for (const session of sessions.values()) {
    if (session.players.has(userId)) return session;
  }
  return null;
}

//centralize death trigger
function handleDeath(player, session, sessionId) {
  if (player.health <= 0 && !player.dead) {
    player.health = 0;
    player.dead = true;
    player.setAnimation('death');
    player.deathTime = Date.now();

    if (player.rank == null) {
      player.rank = session.deathCounter;
      session.deathCounter--;
    }

    ioRef.to(sessionId).emit('playerDied', { userId: player.userId });
  }
}

//session cleanup
setInterval(() => {
  for (const [id, s] of sessions.entries()) {
    if (s.gameEnded && Date.now() - s.endTime > 60000) {
      sessions.delete(id);
    }
  }
}, 60000);