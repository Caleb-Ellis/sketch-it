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

// Array of all lines drawn
let lineHistory = [];

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

    // Send to all clients
    io.emit('draw-line', {
      line: data.line,
      size: data.size,
      colour: data.colour,
    });
  });

  // Handler for clearing canvas
  socket.on('clear-canvas', () => {
    lineHistory = [];
    io.emit('clear-canvas', true);
  });

  // Handler for redrawing canvas
  socket.on('redraw-canvas', () => {
    for (let i in lineHistory) {
      io.emit('draw-line', {
        line: lineHistory[i].line,
        size: lineHistory[i].size,
        colour: lineHistory[i].colour,
      });
    }
  });

  socket.on('chat-message', data => {
    io.emit('display-message', data);
  });
});
