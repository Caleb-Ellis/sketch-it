// Start socket connection
const socket = io.connect('http://localhost:3000');

// Init variables
let mouse = {
  click: false,
  move: false,
  pos: { x: 0, y: 0 },
  pos_prev: false,
};

let canvas = document.getElementById('sketch-area');
let context = canvas.getContext('2d');
let username, currentWord;

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

function startGame() {
  socket.emit('choose-word');
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
    let message = document.getElementById('message').value.toLowerCase();
    socket.emit('chat-message', {
      message: message,
    });
    if (message === currentWord) {
      $('.current-word').html(currentWord);
      socket.emit('guessed-correctly', {
        username: username,
        currentWord: currentWord,
      });
      clearCanvas();
      startGame();
    }
  });

  $('#message').keypress((key) => {
    if (key.which === 13) {
      $('#send-btn').click();
    }
  });

  /* --- RUN APP ---*/

  drawCanvas();
  mainLoop();

});

/* --- SOCKET FUNCTIONS ---*/

// On connection to server, ask for user's name
socket.on('connect', () => {
  socket.emit('add-user', username = prompt('Please enter a username'));
  console.log(username + ' connected');
});

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

// Redraw canvas received from server
socket.on('redraw-canvas', () => {
  socket.emit('redraw-canvas');
});

// Clear function received from server
socket.on('clear-canvas', () => {
  context.fillRect(0, 0, canvas.width, canvas.height);
});

// Display chat message received from server
socket.on('display-message', data => {
  if (data.username && data.message) {
    $('#output').append('<p><strong>' + data.username + ': </strong>' + data.message + '</p>');
  }
  $('#message').val('');
});

// Display connection message received from server
socket.on('connection-message', data => {
  $('#output').append('<p><em>' + data.username + ' has ' + data.connection + '</em></p>');
});

// Update user list
socket.on('update-users', data => {
  $('#users').empty();
  $.each(data, (key, value) => {
    if (key !== null) {
      $('#users').append('<li>' + key + '</li>');
    }
  });
});

// Select new word
socket.on('new-word', data => {
  currentWord = data.currentWord;
  let currentPlayer = data.currentPlayer;
  let guessWord = currentWord.replace(/./g, '_');

  if (socket.id === currentPlayer) {
    $('.current-word').html(currentWord);
  } else {
    $('.current-word').html(guessWord);
  }
});

// Display message to all sockets when someone guesses correctly
socket.on('correct-guess-message', data => {
  $('#output').append('<p><strong>' + data.username + ' correctly guessed ' + data.currentWord + '</strong></p>');
});
