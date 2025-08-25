// Ludo Lite (2 players, 1 token each) – outer ring track (6x6 grid => 20 cells)
const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');

const turnText = document.getElementById('turnText');
const rollBtn = document.getElementById('rollBtn');
const diceValueEl = document.getElementById('diceValue');
const msgEl = document.getElementById('msg');

// Grid settings
const N = 6;              // 6x6 grid
const cell = 60;          // 60px each => 360px board + margins
const offset = 30;        // margin around grid

// Build outer-ring path indices => 20 cells
const path = [];
for (let x = 0; x < N; x++) path.push([x, 0]);               // top row (left->right)
for (let y = 1; y < N; y++) path.push([N - 1, y]);           // right col (top->bottom)
for (let x = N - 2; x >= 0; x--) path.push([x, N - 1]);      // bottom row (right->left)
for (let y = N - 2; y >= 1; y--) path.push([0, y]);          // left col (bottom->top)
// Remove duplicates at corners -> result length 20
// (Works because we didn't repeat inner corners)

// Helpers
function cellCenter(px, py) {
  return [offset + px * cell + cell / 2, offset + py * cell + cell / 2];
}
function drawBoard() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw grid outer ring cells
  ctx.lineWidth = 2;
  for (let i = 0; i < path.length; i++) {
    const [gx, gy] = path[i];
    const x = offset + gx * cell;
    const y = offset + gy * cell;
    ctx.fillStyle = i % 2 ? '#dff5e8' : '#c8ecd9';
    ctx.fillRect(x, y, cell, cell);
    ctx.strokeStyle = '#7fbf9d';
    ctx.strokeRect(x, y, cell, cell);
  }

  // Start cells highlight
  highlightCell(players[0].startIndex, '#ffb3b3');
  highlightCell(players[1].startIndex, '#b3c7ff');

  // Indices (small)
  ctx.fillStyle = '#2c5a45';
  ctx.font = '10px monospace';
  for (let i = 0; i < path.length; i++) {
    const [gx, gy] = path[i];
    ctx.fillText(i.toString(), offset + gx * cell + 4, offset + gy * cell + 12);
  }

  // Draw tokens
  players.forEach(p => drawToken(p));
}
function highlightCell(idx, color) {
  const [gx, gy] = path[idx];
  const x = offset + gx * cell, y = offset + gy * cell;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.strokeRect(x + 3, y + 3, cell - 6, cell - 6);
  ctx.restore();
}

function drawToken(p) {
  const { color, pos, home, startIndex } = p;
  let cx, cy;
  if (home) {
    // home position (off-board corner)
    cx = color === 'red' ? offset - 18 : canvas.width - offset + 18;
    cy = color === 'red' ? offset - 18 : canvas.height - offset + 18;
  } else {
    const [gx, gy] = path[pos];
    [cx, cy] = cellCenter(gx, gy);
  }
  ctx.beginPath();
  ctx.arc(cx, cy, 16, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#163d2f';
  ctx.stroke();
  // start marker ring if on start
  if (!home && pos === startIndex) {
    ctx.beginPath();
    ctx.arc(cx, cy, 20, 0, Math.PI * 2);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

// Players state
const players = [
  { name: 'লাল', color: 'red', home: true, pos: -1, steps: 0, startIndex: 0 },
  { name: 'নীল', color: 'blue', home: true, pos: -1, steps: 0, startIndex: 10 }
];
let current = 0; // 0 -> red, 1 -> blue
updateTurnText();

// Dice roll logic
rollBtn.addEventListener('click', () => {
  const roll = 1 + Math.floor(Math.random() * 6);
  diceValueEl.textContent = roll;
  msgEl.textContent = '';

  const me = players[current];
  const other = players[1 - current];

  if (me.home) {
    if (roll === 6) {
      me.home = false;
      me.steps = 0;
      me.pos = me.startIndex;
      msgEl.textContent = `${me.name} বের হয়েছে! ৬ পেয়েছে, আবার টার্ন।`;
      drawBoard();
      return; // extra turn on 6 (stay same player)
    } else {
      msgEl.textContent = `${me.name} বের হতে ৬ লাগবে।`;
      switchTurn();
      return;
    }
  }

  // Move along ring
  const RING = path.length; // 20
  const newSteps = me.steps + roll;
  const newPos = (me.startIndex + newSteps) % RING;

  // Win condition: completed a full lap and landed back on start index
  const willWin = (newSteps >= RING) && (newPos === me.startIndex);

  me.steps = newSteps;
  me.pos = newPos;

  // Cut opponent if landed same cell
  if (!other.home && other.pos === me.pos) {
    other.home = true;
    other.pos = -1;
    other.steps = 0;
    msgEl.textContent = `${me.name} প্রতিপক্ষকে কাটল!`;
  }

  if (willWin) {
    drawBoard();
    msgEl.textContent = `${me.name} জিতে গেছে! 🎉`;
    rollBtn.disabled = true;
    turnText.textContent = `${me.name} (WIN)`;
    return;
  }

  drawBoard();

  if (roll === 6) {
    msgEl.textContent = `${me.name} ৬ পেয়েছে, আবার টার্ন!`;
    // stay on same player
  } else {
    switchTurn();
  }
});

function switchTurn() {
  current = 1 - current;
  updateTurnText();
}

function updateTurnText() {
  turnText.textContent = current === 0 ? 'লাল' : 'নীল';
}

// Initial draw
drawBoard();
