// Start socket connection
const socket = io.connect();

// Init variables
let mouse = {
  click: false,
  move: false,
  pos: { x: 0, y: 0 },
  pos_prev: false,
};

let canvas = document.getElementById('sketch-area');
let context = canvas.getContext('2d');

/* --- REGULAR FUNCTIONS ---*/

// Event loop, running at 60Hz
function mainLoop() {
  // Check if user is drawing
  if (mouse.click && mouse.move && mouse.pos_prev) {
    // Send line to server
    socket.emit('draw-line', {
      line: [mouse.pos, mouse.pos_prev],
      size: context.lineWidth,
      colour: context.strokeStyle, });
    mouse.move = false;
  }

  mouse.pos_prev = { x: mouse.pos.x, y: mouse.pos.y };
  setTimeout(mainLoop, 1000 / 60);
}

function drawCanvas() {
  // Set canvas to full browser width/height
  canvas.width = $('#sketch-area').width();
  canvas.height = $('#sketch-area').height();
  context.fillStyle = '#fff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  return (canvas, context);
}

function undoMove() {
  socket.emit('undo-move');
}

function redoMove() {
  socket.emit('redo-move');
}

function clearCanvas() {
  socket.emit('clear-history');
}

function changePenSize(size) {
  context.lineWidth = size;
}

function changePenColour(colour) {
  context.strokeStyle = colour;
}

// When DOM content loaded
$(document).ready(() => {

  /* --- EVENT LISTENERS ---*/

  // Reset canvas on window resize
  $(window).resize(() => {
    drawCanvas();
    socket.emit('redraw-canvas');
  });

  // Register mouse event handlers
  canvas.onmousedown = e => {
    mouse.click = true;
    socket.emit('add-checkpoint');
  };

  $(window).mouseup(e => {
    mouse.click = false;
    socket.emit('add-checkpoint');
  });

  canvas.onmousemove = e => {
    // Normalise mouse position to range 0.0 - 1.0
    mouse.pos.x = e.offsetX / canvas.width;
    mouse.pos.y = e.offsetY / canvas.height;
    mouse.move = true;
  };

  $('#send-btn').click(() => {
    socket.emit('chat-message', {
      message: document.getElementById('message').value,
      handle: document.getElementById('handle').value,
    });
  });

  $('#message').keypress((key) => {
    if (key.which === 13) {
      $('#send-btn').click();
    }
  });

  /* --- SOCKET FUNCTIONS ---*/

  // Draw line received from server
  socket.on('draw-line', data => {
    let line = data.line;
    let size = data.size;
    let colour = data.colour;
    changePenSize(size);
    changePenColour(colour);
    context.beginPath();
    context.moveTo(line[0].x * canvas.width, line[0].y * canvas.height);
    context.lineTo(line[1].x * canvas.width, line[1].y * canvas.height);
    context.stroke();
  });

  // Clear function received from server
  socket.on('clear-canvas', () => {
    context.fillRect(0, 0, canvas.width, canvas.height);
  });

  // Display message received from server
  socket.on('display-message', data => {
    $('#output').append('<p><strong>' + data.handle + ': </strong>' + data.message + '</p>');
    $('#message').val('');
  });

  /* --- RUN APP ---*/

  drawCanvas();
  mainLoop();

});
