const mongoose = require('mongoose');

const gameDataSchema = new mongoose.Schema({
  id: {type:String, required:true},//username
  session:{type:String,required:true},//start or end point of game
  score: { type: Number,default:0},
  kills: { type: Number, default:0},
  lastPlayed: { type: Date, default: Date.now },
  highScore: { type: Number, default: 0 },
  waveReached: { type: String, default:'wave0' }, // Wave the player reached
});

const GameData = mongoose.model('GameData', gameDataSchema);

module.exports = GameData;
/*
const PlayerSchema = new mongoose.Schema({
  playerId: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  password: { type:String, required:true},

  // Single-player stats
  singlePlayer: {
    highScore: { type: Number, default: 0 },
    score: { type: Number, default: 0 },
    totalGames: { type: Number, default: 0 },
    lastPlayed: { type: Date, default: Date.now }
  },

  // Multiplayer stats
  multiplayer: {
    coins: { type: Number, default: 100 }, // starting coins
    totalWins: { type: Number, default: 0 },
    totalLosses: { type: Number, default: 0 }
  }
});

module.exports = mongoose.model('Player', PlayerSchema);

const MultiplayerSessionSchema = new mongoose.Schema({
  players: {
    type: [
      {
        playerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: true },
        coinsAtStart: { type: Number, default: 0 },
        color: { type: String, required: true }, // for distinguishing players
        score: { type: Number, default: 0 },
        alive: { type: Boolean, default: true }
      }
    ],
    validate: [arrayLimit, '{PATH} exceeds the limit of 5 players']
  },
  startTime: { type: Date, default: Date.now },
  status: { type: String, enum: ['waiting', 'ongoing', 'finished'], default: 'waiting' }
});

function arrayLimit(val) {
  return val.length <= 5;
}

module.exports = mongoose.model('MultiplayerSession', MultiplayerSessionSchema);*/