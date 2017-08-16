// Set up dependencies
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');

// Define port
const PORT = process.env.PORT || 3000;

// Configure server
const app = express();
const server = http.createServer(app);
const io = socketIo.listen(server);
app.use(express.static(__dirname + '/public'));

// Start server
server.listen(PORT, () => {
  console.log('App is running on port ' + PORT);
});

/* --- APP LOGIC --- */

let usernames = {};
let dictionary, currentWord, currentPlayer;

// Line arrays
let lineHistory = [];
let lineFuture = [];
let checkpoints = [];
let checkpointsFuture = [];

// Load dictionary into memory
fs.readFile(__dirname + '/dictionary.txt', (err, data) => {
  dictionary = data.toString('utf-8').split('\n');
});

/* --- SOCKET FUNCTIONS --- */

// Handler for when new connection is made
io.sockets.on('connection', socket => {

  // First, send history to client
  for (let i in lineHistory) {
    socket.emit('draw-line', {
      line: lineHistory[i].line,
      size: lineHistory[i].size,
      colour: lineHistory[i].colour,
    });
  }

  io.emit('update-users', usernames);

  // Handler for when the client enters username
  socket.on('add-user', username => {
    if (username) {
      socket.username = username;
      usernames[username] = username;
      let data = {
        username: username,
        connection: 'connected',
      };
      io.emit('update-users', usernames);
      io.emit('connection-message', data);
    }
  });

  // Handler for when user disconnects
  socket.on('disconnect', () => {
    delete usernames[socket.username];
    let data = {
      username: socket.username,
      connection: 'disconnected',
    };
    io.emit('update-users', usernames);
    io.emit('connection-message', data);
  });

  // Handler for when draw_line event received
  socket.on('draw-line', data => {

    // Add line to history
    lineHistory.push(data);

    // Start new future
    lineFuture = [];
    checkpointsFuture = [];

    // Send to all clients
    io.emit('draw-line', {
      line: data.line,
      size: data.size,
      colour: data.colour,
    });
  });

  // Handler for clearing history
  socket.on('clear-history', () => {
    lineHistory = [];
    lineFuture = [];
    checkpoints = [];
    checkpointsFuture = [];
    io.emit('clear-canvas');
  });

  // Handler for clearing canvas
  socket.on('clear-canvas', () => {
    io.emit('clear-canvas');
  });

  // Handler for adding checkpoints for undo/redo
  socket.on('add-checkpoint', () => {
    let checkpoint = lineHistory.length;
    if (!checkpoints.includes(checkpoint)) {
      checkpoints.push(checkpoint);
    }
  });

  // Handler for undoing previous stroke
  socket.on('undo-move', () => {
    if (lineHistory.length > 0) {
      // Determine indices for the endpoints of lineHistory and lineFuture
      let historyEnd = checkpoints[checkpoints.length - 2];
      let futureEnd = checkpoints[checkpoints.length - 1];

      // Store history in future array before slicing
      for (let i = historyEnd; i < futureEnd; i++) {
        lineFuture.unshift(lineHistory[i]);
      }

      lineHistory = lineHistory.slice(0, historyEnd);

      // Organise checkpoints
      checkpointsFuture.unshift(checkpoints.pop());

      io.emit('redraw-canvas');
    }
  });

  // Handler for redoing previously undone stroke
  socket.on('redo-move', () => {
    if (lineFuture.length > 0) {
      // Determine indices of lines to redraw
      let length = checkpointsFuture[0] - checkpoints[checkpoints.length - 1];

      // Pull future lines back in to lineHistory
      for (let i = 0; i < length; i++) {
        lineHistory.push(lineFuture.shift());
      }

      // Organise checkpoints
      checkpoints.push(checkpointsFuture.shift());

      io.emit('redraw-canvas');
    }
  });

  // Handler for redrawing canvas
  socket.on('redraw-canvas', () => {
    io.emit('clear-canvas');
    for (let i in lineHistory) {
      io.emit('draw-line', {
        line: lineHistory[i].line,
        size: lineHistory[i].size,
        colour: lineHistory[i].colour,
      });
    }
  });

  // Handler for sending chat message
  socket.on('chat-message', data => {
    data.username = socket.username;
    io.emit('display-message', data);
  });

  // Handler for sending connection message
  socket.on('connection-msg', data => {
    io.emit('connection-message', data);
  });

  // Handler for choosing new word
  socket.on('choose-word', () => {

    let randomLine = Math.floor(Math.random() * dictionary.length),
              line = dictionary[randomLine],
              word = line.split(',');
    let data = {
      currentPlayer: socket.id,
      currentWord: word[0]
    }
    io.emit('new-word', data);
  });

  // Handler for when a user guesses the word correctly
  socket.on('guessed-correctly', data => {
    io.emit('correct-guess-message', data);
  });
});
