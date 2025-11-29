const express = require('express');
const mongoose = require('mongoose');
const gameRoutes = require('./src/routes/gameRoutes');
require('dotenv').config(); // env files are used to store sensitive stuff
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');  // JWT library for token generation
const Player =require('./src/models/Player');
const path = require('path');
const { Server } = require('socket.io');
const http =require('http');
//const cors=require('cors');//useful when I redirect stuffs to another domain or port(cross-orgin)
const socketServer=require('./src/socket/socketServer');

const app = express();
const server = http.createServer(app);
const io = new Server(server);


const port = 3000;//use http://localhost:3000/ to run app
const JWT_SECRET = process.env.JWT_SECRET;

//app.use(cors);
app.use(express.json());//To parse JSON

//serve static files
app.use(express.static(path.join(__dirname, 'public')));

console.log(process.env.MONGODB_URI);

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.use('/api/game', gameRoutes); // Register routes AFTER DB connection
    socketServer(io);
    server.listen(port, '0.0.0.0',() => {
      console.log(`Server listening on port ${port}`);
    });
  })
  .catch(err => {
    console.error('Failed to connect to MongoDB', err);
  });


//server initial page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));//cross platform path usage
});

// Login (POST Request)
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const player = await Player.findOne({ username });
    const match= await bcrypt.compare(password,player.password);
    if (!player || !match ) {
      return res.status(400).json({ success: false, message: 'Invalid username or password.' });
    }

    const token = jwt.sign({ userId: player._id }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ success: true, token });
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).json({ success: false, message: 'Server error. Please try again later.' });
  }
});

// Multiplayer Login (POST Request)
app.post('/api/multiplayer-login', async (req, res) => {
  const { username, password } = req.body;
  
  try {
    if (typeof username !== 'string') {
      return res.status(400).json({ success: false, message: 'Invalid username format.' });
    }
    if (!password || typeof password !== 'string') {
      return res.status(400).json({ success: false, message: 'Invalid or missing password' });
    }
    const player = await Player.findOne({ username });
    const match= await bcrypt.compare(password,player.password);
    if (!player || !match) {
      return res.status(400).json({ success: false, message: 'Invalid username or password.' });
    }

    const token = jwt.sign({ userId: player._id }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ success: true, token });
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).json({ success: false, message: 'Server error. Please try again later.' });
  }
});

//Signup (POST request)
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    const existing = await Player.findOne({ username });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Username already exists.' });
    }
    const salts=10;
    const hashPasswd= await bcrypt.hash(password,salts);
    const newPlayer = new Player({ username, password:hashPasswd });
    await newPlayer.save();

    const token = jwt.sign({ userId: newPlayer._id }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ success: true, token });
  } catch (err) {
    console.error('Error during signup:', err);
    res.status(500).json({ success: false, message: 'Server error. Please try again later.' });
  }
});



//guest login (POST request)
app.post('/api/guest-login', (req, res) => {
  // Generate a guest user ID based on the current date and time
  const guestId = JSON.stringify(new Date());  
  
  // Generate JWT token for the guest user
  const token = jwt.sign({ guestId }, JWT_SECRET, { expiresIn: '1h' });

  res.json({ success: true, token });  // Send guest user token to the frontend
});




