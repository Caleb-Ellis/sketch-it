// Set up dependencies
var express = require('express');
var http = require('http');
var io = require('socket.io');

// Define port
var PORT = process.env.PORT || 3000;

// Configure server
var app = express();
app.use(express.static(__dirname + '/public'));

// Start server
app.listen(PORT, function() {
  console.log('App is running on port ' + PORT);
});


/* --- SOCKET FUNCTIONS --- */

// Array of all lines drawn
var line_history = [];

// Handler for when new connection is made
io.on('connection', function(socket) {

  // First, send history to client
  for (var i in line_history) {
    socket.emit('draw_line', { line: line_history[i] });
  }

  // Handler for when draw_line event received
  socket.on('draw_line', function(data) {
    // Add line to history
    line_history.push(data.line);
    // Send to all clients
    io.emit('draw_line', { line: data.line });
  });
};
