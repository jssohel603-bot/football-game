const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let keys = {};

document.addEventListener("keydown", (e) => {
  keys[e.key] = true;
});
document.addEventListener("keyup", (e) => {
  keys[e.key] = false;
});

class Player {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.radius = 12;
    this.speed = 3;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.closePath();
  }

  move() {
    if (keys["ArrowUp"]) this.y -= this.speed;
    if (keys["ArrowDown"]) this.y += this.speed;
    if (keys["ArrowLeft"]) this.x -= this.speed;
    if (keys["ArrowRight"]) this.x += this.speed;
  }
}

class Ball {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 6;
    this.speedX = 0;
    this.speedY = 0;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = "white";
    ctx.fill();
    ctx.closePath();
  }

  update() {
    this.x += this.speedX;
    this.y += this.speedY;

    // ঘর্ষণ (বল ধীরে যাবে)
    this.speedX *= 0.98;
    this.speedY *= 0.98;
  }
}

function checkCollision(player, ball) {
  let dx = ball.x - player.x;
  let dy = ball.y - player.y;
  let distance = Math.sqrt(dx * dx + dy * dy);

  if (distance < player.radius + ball.radius) {
    ball.speedX = dx * 0.3;
    ball.speedY = dy * 0.3;
  }
}

function checkGoal(ball) {
  // বাম দিকের গোল
  if (ball.x < 20 && ball.y > 150 && ball.y < 250) {
    alert("Red Team Goal! 🔴");
    resetBall(ball);
  }
  // ডান দিকের গোল
  if (ball.x > 780 && ball.y > 150 && ball.y < 250) {
    alert("Blue Team Goal! 🔵");
    resetBall(ball);
  }
}

function resetBall(ball) {
  ball.x = 400;
  ball.y = 200;
  ball.speedX = 0;
  ball.speedY = 0;
}

let player = new Player(100, 200, "blue");
let ball = new Ball(400, 200);

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // মাঠ আঁকা
  ctx.strokeStyle = "white";
  ctx.strokeRect(50, 100, 700, 200); // মাঠ বক্স
  ctx.beginPath();
  ctx.arc(400, 200, 50, 0, Math.PI * 2);
  ctx.stroke();

  // প্লেয়ার মুভ
  player.move();
  player.draw();

  // বল মুভ
  ball.update();
  ball.draw();

  // কোলিশন চেক
  checkCollision(player, ball);

  // গোল চেক
  checkGoal(ball);

  requestAnimationFrame(gameLoop);
}

gameLoop();
