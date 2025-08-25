// DLS-style Mini Football (11v11) - Vanilla JS + Canvas
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const W = canvas.width, H = canvas.height;

const FIELD = { left: 60, right: W - 60, top: 40, bottom: H - 40 };
const CENTER = { x: W / 2, y: H / 2 };
const GOAL = { w: 12, h: 180 };

const PLAYER_R = 10;
const PLAYER_SPEED = 2.6;
const AI_SPEED = 2.1;

const BALL_R = 7;
let ball = { x: CENTER.x, y: CENTER.y, vx: 0, vy: 0 };

let score = { blue: 0, red: 0 };

const keys = {};
document.addEventListener("keydown", (e) => (keys[e.key] = true));
document.addEventListener("keyup", (e) => (keys[e.key] = false));

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function dist(ax, ay, bx, by) { return Math.hypot(ax - bx, ay - by); }

function drawField() {
  // grass
  ctx.fillStyle = "#2e7d32";
  ctx.fillRect(FIELD.left, FIELD.top, FIELD.right - FIELD.left, FIELD.bottom - FIELD.top);

  // lines
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  ctx.strokeRect(FIELD.left, FIELD.top, FIELD.right - FIELD.left, FIELD.bottom - FIELD.top);

  // mid line + center circle
  ctx.beginPath();
  ctx.moveTo(CENTER.x, FIELD.top);
  ctx.lineTo(CENTER.x, FIELD.bottom);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(CENTER.x, CENTER.y, 60, 0, Math.PI * 2);
  ctx.stroke();

  // penalty/goal boxes (simple)
  const pbW = 120, pbH = 260, gbW = 40, gbH = 120;
  // left
  ctx.strokeRect(FIELD.left, H/2 - pbH/2, pbW, pbH);
  ctx.strokeRect(FIELD.left, H/2 - gbH/2, gbW, gbH);
  // right
  ctx.strokeRect(FIELD.right - pbW, H/2 - pbH/2, pbW, pbH);
  ctx.strokeRect(FIELD.right - gbW, H/2 - gbH/2, gbW, gbH);

  // goals
  ctx.lineWidth = 4;
  ctx.strokeRect(FIELD.left - GOAL.w, H/2 - GOAL.h/2, GOAL.w, GOAL.h);
  ctx.strokeRect(FIELD.right,        H/2 - GOAL.h/2, GOAL.w, GOAL.h);
  ctx.lineWidth = 2;
}

// --- Team setup (11 per side: 1 GK + 10 outfield) ---
function createTeam(isLeft) {
  const color = isLeft ? "#64b5f6" : "#ef5350";
  const xBase = isLeft ? FIELD.left + 90 : FIELD.right - 90;
  const side = isLeft ? 1 : -1;

  // GK
  const gk = {
    x: isLeft ? FIELD.left + 22 : FIELD.right - 22,
    y: H / 2,
    color: "#ffeb3b",
    team: isLeft ? "blue" : "red",
    gk: true,
    homeX: undefined,
    homeY: undefined
  };

  // Outfield 10 (4-4-2 shape approx)
  const rows = [FIELD.top + 70, H/2 - 40, H/2 + 40, FIELD.bottom - 70];
  const outfield = [];
  // 8 mids/defs in 4 rows x 2 columns
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 2; c++) {
      const px = xBase + (100 + c*80) * side;
      const py = rows[r];
      outfield.push({
        x: px, y: py, color,
        team: isLeft ? "blue" : "red",
        gk: false,
        homeX: px, homeY: py
      });
    }
  }
  // 2 strikers
  for (let i = 0; i < 2; i++) {
    const px = isLeft ? CENTER.x - 80 + i*30 : CENTER.x + 80 - i*30;
    const py = H/2 + (i === 0 ? -40 : 40);
    outfield.push({
      x: px, y: py, color,
      team: isLeft ? "blue" : "red",
      gk: false,
      homeX: px, homeY: py
    });
  }

  const all = [gk, ...outfield];
  return { gk, outfield, all, isLeft };
}

const teamBlue = createTeam(true);
const teamRed  = createTeam(false);

// controlled player starts: left striker
let controlled = nearestToPoint(teamBlue.outfield, CENTER);

// --- Helpers ---
function nearestToPoint(list, pt) {
  return list.reduce((best, p) => {
    const d = dist(p.x, p.y, pt.x || pt[0], pt.y || pt[1]);
    return !best || d < best.d ? {player: p, d} : best;
  }, null)?.player;
}
function nearestToBall(list) {
  return nearestToPoint(list, { x: ball.x, y: ball.y });
}

// --- Input actions ---
document.addEventListener("keydown", (e) => {
  if (e.key === "e" || e.key === "E") {
    // switch to nearest ANY team to ball
    const any = nearestToBall([...teamBlue.all, ...teamRed.all]);
    if (any) controlled = any;
  }
  if (e.key === "r" || e.key === "R") kickoff();
  if (e.key === "a" || e.key === "A") tryPass();
  if (e.key === " ") tryShoot();
});

function tryPass() {
  // need to be close to ball
  if (dist(controlled.x, controlled.y, ball.x, ball.y) > 24) return;
  const mates = controlled.team === "blue" ? teamBlue.outfield : teamRed.outfield;
  const mate = nearestToPoint(mates.filter(m => m !== controlled), { x: controlled.x, y: controlled.y });
  if (!mate) return;
  const dx = mate.x - controlled.x;
  const dy = mate.y - controlled.y;
  const len = Math.hypot(dx, dy) || 1;
  ball.vx = (dx / len) * 6.5;  // pass speed
  ball.vy = (dy / len) * 6.5;
}

function tryShoot() {
  if (dist(controlled.x, controlled.y, ball.x, ball.y) > 24) return;
  // shoot toward opponent goal center
  const gx = controlled.team === "blue" ? FIELD.right - 4 : FIELD.left + 4;
  const gy = H / 2 + (Math.random() * 80 - 40);
  const dx = gx - controlled.x;
  const dy = gy - controlled.y;
  const len = Math.hypot(dx, dy) || 1;
  ball.vx = (dx / len) * 9.5;  // shot speed
  ball.vy = (dy / len) * 9.5;
}

// --- Kickoff / reset ---
function kickoff() {
  ball.x = CENTER.x; ball.y = CENTER.y; ball.vx = 0; ball.vy = 0;
  // reset players to home
  [...teamBlue.outfield, ...teamRed.outfield].forEach(p => { p.x = p.homeX; p.y = p.homeY; });
  teamBlue.gk.x = FIELD.left + 22; teamBlue.gk.y = H / 2;
  teamRed.gk.x  = FIELD.right - 22; teamRed.gk.y  = H / 2;
  controlled = nearestToPoint(teamBlue.outfield, CENTER);
}

// --- Update loop ---
function update() {
  // move controlled player by arrows
  const sp = PLAYER_SPEED;
  if (keys["ArrowLeft"])  controlled.x -= sp;
  if (keys["ArrowRight"]) controlled.x += sp;
  if (keys["ArrowUp"])    controlled.y -= sp;
  if (keys["ArrowDown"])  controlled.y += sp;

  // simple AI: nearest 3 from each side chase ball slightly, others go to home
  chaseAI(teamBlue, true);
  chaseAI(teamRed,  false);

  // keep players in field
  [...teamBlue.all, ...teamRed.all].forEach(p => {
    p.x = clamp(p.x, FIELD.left + PLAYER_R, FIELD.right - PLAYER_R);
    p.y = clamp(p.y, FIELD.top  + PLAYER_R, FIELD.bottom - PLAYER_R);
  });

  // player-ball collision (kick/deflect)
  [...teamBlue.all, ...teamRed.all].forEach(p => {
    const d = dist(p.x, p.y, ball.x, ball.y);
    const minD = PLAYER_R + BALL_R;
    if (d < minD) {
      const nx = (ball.x - p.x) / (d || 1);
      const ny = (ball.y - p.y) / (d || 1);
      // push ball away
      ball.x = p.x + nx * minD;
      ball.y = p.y + ny * minD;
      ball.vx += nx * 2;
      ball.vy += ny * 2;
    }
  });

  // ball physics (friction + walls)
  ball.x += ball.vx;
  ball.y += ball.vy;
  ball.vx *= 0.985;
  ball.vy *= 0.985;

  // bounce with field border
  if (ball.x - BALL_R < FIELD.left)  { ball.x = FIELD.left + BALL_R;  ball.vx *= -0.9; }
  if (ball.x + BALL_R > FIELD.right) { ball.x = FIELD.right - BALL_R; ball.vx *= -0.9; }
  if (ball.y - BALL_R < FIELD.top)   { ball.y = FIELD.top + BALL_R;   ball.vy *= -0.9; }
  if (ball.y + BALL_R > FIELD.bottom){ ball.y = FIELD.bottom - BALL_R;ball.vy *= -0.9; }

  // GK follow ball on Y within small band
  const gkFollow = (gk, leftSide) => {
    const targetY = clamp(ball.y, H/2 - 70, H/2 + 70);
    gk.y += Math.sign(targetY - gk.y) * 1.4;
    gk.x = leftSide ? FIELD.left + 22 : FIELD.right - 22;
  };
  gkFollow(teamBlue.gk, true);
  gkFollow(teamRed.gk,  false);

  // goals detect (inside goal rectangles beyond line)
  const inLeftGoal  = (ball.x - BALL_R) < (FIELD.left) && Math.abs(ball.y - H/2) < GOAL.h/2;
  const inRightGoal = (ball.x + BALL_R) > (FIELD.right) && Math.abs(ball.y - H/2) < GOAL.h/2;
  if (inLeftGoal)  { score.red++;  updateScore(); kickoff(); }
  if (inRightGoal) { score.blue++; updateScore(); kickoff(); }

  // draw
  draw();
  requestAnimationFrame(update);
}

function chaseAI(team, isLeft) {
  // choose nearest 3 to chase ball
  const chasers = [...team.outfield].sort((a,b) => dist(a.x,a.y,ball.x,ball.y) - dist(b.x,b.y,ball.x,ball.y)).slice(0,3);
  team.outfield.forEach(p => {
    if (chasers.includes(p)) {
      const dx = ball.x - p.x, dy = ball.y - p.y;
      const d = Math.hypot(dx, dy) || 1;
      p.x += (dx / d) * AI_SPEED;
      p.y += (dy / d) * AI_SPEED;
    } else {
      // return to home
      const dx = p.homeX - p.x, dy = p.homeY - p.y;
      const d = Math.hypot(dx, dy) || 1;
      if (d > 2) { p.x += (dx / d) * 1.4; p.y += (dy / d) * 1.4; }
    }
  });
}

function drawPlayers(team) {
  team.all.forEach(p => {
    ctx.beginPath();
    ctx.fillStyle = p.gk ? "#ffeb3b" : p.color;
    ctx.arc(p.x, p.y, PLAYER_R, 0, Math.PI * 2);
    ctx.fill();
    // controlled highlight
    if (p === controlled) {
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  });
}

function drawBall() {
  ctx.beginPath();
  ctx.fillStyle = "#ffffff";
  ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2);
  ctx.fill();
}

function draw() {
  ctx.clearRect(0,0,W,H);
  drawField();
  drawPlayers(teamBlue);
  drawPlayers(teamRed);
  drawBall();
}

function updateScore() {
  document.getElementById("score").textContent = `Blue ${score.blue} - ${score.red} Red`;
}

// start
updateScore();
kickoff();
update();
