// Canvas setup
const canvas = document.createElement("canvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
document.body.appendChild(canvas);

const ctx = canvas.getContext("2d");

// Ball properties
let ball = {
  x: 100,
  y: 100,
  radius: 15,
  color: "white",
  dx: 0,
  dy: 0,
  speed: 4
};

// Field (ground) draw
function drawField() {
  ctx.fillStyle = "green";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Football goal (just a box)
  ctx.strokeStyle = "white";
  ctx.lineWidth = 4;
  ctx.strokeRect(canvas.width / 2 - 100, canvas.height - 120, 200, 100);
}

// Ball draw
function drawBall() {
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fillStyle = ball.color;
  ctx.fill();
  ctx.closePath();
}

// Update ball position
function update() {
  ball.x += ball.dx;
  ball.y += ball.dy;

  // Border collision
  if (ball.x - ball.radius < 0 || ball.x + ball.radius > canvas.width) {
    ball.dx = -ball.dx;
  }
  if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height) {
    ball.dy = -ball.dy;
  }
}

// Main loop
function gameLoop() {
  drawField();
  drawBall();
  update();
  requestAnimationFrame(gameLoop);
}

gameLoop();

// Controls with arrow keys
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowUp") {
    ball.dy = -ball.speed;
  } else if (e.key === "ArrowDown") {
    ball.dy = ball.speed;
  } else if (e.key === "ArrowLeft") {
    ball.dx = -ball.speed;
  } else if (e.key === "ArrowRight") {
    ball.dx = ball.speed;
  }
});

document.addEventListener("keyup", (e) => {
  if (["ArrowUp", "ArrowDown"].includes(e.key)) {
    ball.dy = 0;
  }
  if (["ArrowLeft", "ArrowRight"].includes(e.key)) {
    ball.dx = 0;
  }
});
