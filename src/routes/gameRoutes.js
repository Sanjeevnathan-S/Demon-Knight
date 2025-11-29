const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');  // JWT library for token generation
const Player= require('../models/Player');
require('dotenv').config();//env files are used to store sensitive data

const JWT_SECRET=process.env.JWT_SECRET;

//single-player save
router.post('/save-score', async (req, res) => {
  try {
    const token = req.headers['authorization'];
    if (!token) return res.status(401).json({ success: false, message: 'No token provided' });

    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;

    const { score} = req.body;
    const player = await Player.findById(userId);
    if (!player) {
      return res.status(404).json({ success: false, message: 'Player not found — re-register to save progress.' });
    }

    // Update player stats
    player.singlePlayer.score = score;
    player.singlePlayer.totalGames += 1;
    player.singlePlayer.lastPlayed = new Date();

    if (score > player.singlePlayer.highScore) {
      player.singlePlayer.highScore = score;
    }

    await player.save();

    res.json({
      success: true,
      message: 'Game data saved successfully',
      highScore: player.singlePlayer.highScore,
    });
  } catch (error) {
    console.error('Error saving score:', error);
    res.status(500).json({ success: false, message: 'Error saving score' });
  }
});

//single-player leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const topPlayers = await Player.find(
      {},
      { username: 1, 'singlePlayer.highScore': 1, _id: 0 }
    )
      .sort({ 'singlePlayer.highScore': -1 })
      .limit(10);

    const leaderboard = topPlayers.map((p, index) => ({
      rank: index + 1,
      username: p.username,
      highScore: p.singlePlayer.highScore
    }));

    res.json({ success: true, leaderboard:leaderboard });
  } catch (err) {
    console.error('Error fetching leaderboard:', err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

router.get('/HI',async (req,res)=>{
  try{
    const token=req.headers['authorization'];
    if(!token) return res.status(401).json({success:false, message:'No token provided'});

    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;
    const player = await Player.findById(userId);
    if(!player)return res.status(404).json({success:false,message:'Player not found'});
    res.json({ success:true, highScore:player.singlePlayer.highScore});
  }catch(err){
    console.error('Error fetching high score');
    res.status(500).json({ success: false, message: 'Internal Server Error'});
  }
});

module.exports = router;
