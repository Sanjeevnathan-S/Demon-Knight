const mongoose = require('mongoose');
const PlayerSchema = new mongoose.Schema({
  username: { type: String, required: true ,unique:true},
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