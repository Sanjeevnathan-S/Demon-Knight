const mongoose = require('mongoose');
const MultiplayerSessionSchema = new mongoose.Schema({
  players: {
    type: [
      {
        playerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: true },
        username: { type:String},
        coinsAtStart: { type: Number, default: 0 },
        color: { type: String, required: true }, // for distinguishing players
        score: { type: Number, default: 0 },
        alive: { type: Boolean, default: true }
      }
    ],
    validate: [arrayLimit, '{PATH} exceeds the limit of 5 players']
  },
  createdBy: { type:String },
  startTime: { type: Date, default: Date.now },
  status: { type: String, enum: ['waiting', 'ongoing', 'finished'], default: 'waiting' }
});

function arrayLimit(val) {
  return val.length <= 5;
}

module.exports = mongoose.model('MultiplayerSession', MultiplayerSessionSchema);