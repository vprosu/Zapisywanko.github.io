const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.static(path.join(__dirname, '.')));

// In-memory storage (in a real app, you would use a database)
let categories = ['Ogólne', 'Praca', 'Rozrywka'];
let messages = [];
let users = {}; // Track connected users

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Handle user joining
  socket.on('user-join', (userData) => {
    users[socket.id] = {
      id: socket.id,
      nickname: userData.nickname,
      joinTime: new Date()
    };
    
    // Broadcast to all users that a new user has joined
    io.emit('user-joined', {
      userId: socket.id,
      nickname: userData.nickname,
      joinTime: new Date()
    });
    
    // Send current categories and messages to the new user
    socket.emit('initial-data', {
      categories: categories,
      messages: messages,
      users: Object.values(users)
    });
    
    // Broadcast updated user list
    io.emit('users-update', Object.values(users));
  });
  
  // Handle category creation
  socket.on('create-category', (categoryData) => {
    if (!categories.includes(categoryData.name)) {
      categories.push(categoryData.name);
      
      // Broadcast to all users
      io.emit('category-created', {
        name: categoryData.name,
        creator: categoryData.creator,
        timestamp: new Date()
      });
      
      // Send notification to all users
      io.emit('notification', {
        message: `Użytkownik ${categoryData.creator} utworzył kategorię: ${categoryData.name}`,
        type: 'info'
      });
    }
  });
  
  // Handle message sending
  socket.on('send-message', (messageData) => {
    const message = {
      id: Date.now() + Math.random(),
      user: messageData.user,
      text: messageData.text,
      timestamp: new Date(),
      category: messageData.category,
      files: messageData.files || [],
      read: false
    };
    
    messages.push(message);
    
    // Broadcast to all users
    io.emit('new-message', message);
    
    // Send notification to all users except sender
    socket.broadcast.emit('notification', {
      message: `Nowa wiadomość od ${messageData.user}`,
      type: 'info'
    });
  });
  
  // Handle user disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    if (users[socket.id]) {
      const disconnectedUser = users[socket.id];
      
      // Broadcast to all users that a user has left
      io.emit('user-left', {
        userId: socket.id,
        nickname: disconnectedUser.nickname
      });
      
      // Remove user from users list
      delete users[socket.id];
      
      // Broadcast updated user list
      io.emit('users-update', Object.values(users));
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});