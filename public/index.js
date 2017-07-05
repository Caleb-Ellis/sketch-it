// Start socket connection
var socket = io.connect();

// Clear canvas function
function clearCanvas() {
  socket.emit('clear-canvas', true);
}

// When DOM content loaded
document.addEventListener('DOMContentLoaded', function() {
  // Init mouse variable
  var mouse = {
    click: false,
    move: false,
    pos: {x:0, y:0},
    pos_prev: false
  };

  // Init canvas size
  var canvasSize = 0.8;

  // Get canvas element and create context
  var canvas = document.getElementById('sketch');
  var context = canvas.getContext('2d');
  var width = window.innerWidth * canvasSize;
  var height = window.innerHeight * canvasSize;

  // Set canvas to full browser width/height
  canvas.width = width;
  canvas.height = height;
  context.fillStyle = '#fff';
  context.fillRect(0,0,width,height);

  // Register mouse event handlers
  canvas.onmousedown = function(e){
    e.preventDefault();
    mouse.click = true;
  };
  canvas.onmouseup = function(e){ mouse.click = false; };
  canvas.onmousemove = function(e) {
    // Normalise mouse position to range 0.0 - 1.0
    mouse.pos.x = (e.clientX / width) - ((1 - canvasSize)/2);
    mouse.pos.y = (e.clientY / height) - ((1 - canvasSize)/2);
    mouse.move = true;
    console.log(e.clientX + ' ' + mouse.pos.x);
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
  socket.on('clear-canvas', function() {
    context.fillRect(0,0,width,height);
  });

  // Event loop, running every 25ms
  function mainLoop() {
    // Check if user is drawing
    if (mouse.click && mouse.move && mouse.pos_prev) {
      // Send line to server
      socket.emit('draw-line', { line: [ mouse.pos, mouse.pos_prev] });
      mouse.move = false;
    }
    mouse.pos_prev = {x: mouse.pos.x, y: mouse.pos.y};
    setTimeout(mainLoop, 25);
  }

  // Run main loop
  mainLoop();

});
