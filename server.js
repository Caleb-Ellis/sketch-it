// Set up dependencies
var express = require('express');
var http = require('http');
var socketIo = require('socket.io');

// Define port
var PORT = process.env.PORT || 3000;

// Configure server
var app = express();
var server = http.createServer(app);
var io = socketIo.listen(server);
app.use(express.static(__dirname + '/public'));

// Start server
server.listen(PORT, function () {
  console.log('App is running on port ' + PORT);
});

/* --- SOCKET FUNCTIONS --- */

// Array of all lines drawn
var lineHistory = [];

// Handler for when new connection is made
io.on('connection', function (socket) {

  // First, send history to client
  for (var i in lineHistory) {
    socket.emit('draw-line', { line: lineHistory[i] });
  }

  // Handler for when draw_line event received
  socket.on('draw-line', function (data) {

    // Add line to history
    lineHistory.push(data.line);

    // Send to all clients
    io.emit('draw-line', { line: data.line });
  });

  // Handler for clearing canvas
  socket.on('clear-canvas', function () {
    lineHistory = [];
    io.emit('clear-canvas', true);
  });

  // Handler for redrawing canvas
  socket.on('redraw-canvas', function () {
    for (var i in lineHistory) {
      io.emit('draw-line', { line: lineHistory[i] });
    }
  });
});
