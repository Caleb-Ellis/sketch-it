// Start socket connection
var socket = io.connect();

// Clear canvas function
function clearCanvas() {
  socket.emit('clear-canvas', true);
}

// When DOM content loaded
$(document).ready(function () {

  // Init mouse variable
  var mouse = {
    click: false,
    move: false,
    pos: { x: 0, y: 0 },
    pos_prev: false,
  };

  // Get canvas element and create context
  var canvas = document.getElementById('sketch-area');
  var context = canvas.getContext('2d');
  var width = $('#sketch-area').width();
  var height = $('#sketch-area').height();

  // Set canvas to full browser width/height
  canvas.width = width;
  canvas.height = height;
  context.fillStyle = '#fff';
  context.fillRect(0, 0, width, height);

  // Reset canvas on window resize
  $(window).resize(function () {
    // Get canvas element and create context
    canvas = document.getElementById('sketch-area');
    context = canvas.getContext('2d');
    width = $('#sketch-area').width();
    height = $('#sketch-area').height();

    // Set canvas to full browser width/height
    canvas.width = width;
    canvas.height = height;
    context.fillStyle = '#fff';
    context.fillRect(0, 0, width, height);

    socket.emit('redraw-canvas');
  });

  // Register mouse event handlers
  canvas.onmousedown = function (e) {
    mouse.click = true;
  };

  canvas.onmouseup = function (e) {
    mouse.click = false;
  };

  canvas.onmousemove = function (e) {
    // Normalise mouse position to range 0.0 - 1.0
    mouse.pos.x = e.offsetX / width;
    mouse.pos.y = e.offsetY / height;
    mouse.move = true;
  };

  // Draw line received from server
  socket.on('draw-line', function (data) {
    var line = data.line;
    context.beginPath();
    context.moveTo(line[0].x * width, line[0].y * height);
    context.lineTo(line[1].x * width, line[1].y * height);
    context.stroke();
  });

  // Clear function received from server
  socket.on('clear-canvas', function () {
    context.fillRect(0, 0, width, height);
  });

  // Event loop, running every 25ms
  function mainLoop() {
    // Check if user is drawing
    if (mouse.click && mouse.move && mouse.pos_prev) {
      // Send line to server
      socket.emit('draw-line', { line: [mouse.pos, mouse.pos_prev] });
      mouse.move = false;
    }

    mouse.pos_prev = { x: mouse.pos.x, y: mouse.pos.y };
    setTimeout(mainLoop, 25);
  }

  // Run main loop
  mainLoop();

});
