// Set up dependencies
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

// Define port
const PORT = process.env.PORT || 3000;

// Configure server
const app = express();
const server = http.createServer(app);
const io = socketIo.listen(server);
app.use(express.static(__dirname + '/public'));

// Start server
server.listen(PORT, function () {
  console.log('App is running on port ' + PORT);
});

/* --- SOCKET FUNCTIONS --- */

// Line arrays
let lineHistory = [];
let lineFuture = [];
let checkpoints = [];
let checkpointsFuture = [];

// Handler for when new connection is made
io.on('connection', socket => {

  // First, send history to client
  for (let i in lineHistory) {
    socket.emit('draw-line', {
      line: lineHistory[i].line,
      size: lineHistory[i].size,
      colour: lineHistory[i].colour,
    });
  }

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
    io.emit('display-message', data);
  });
});
