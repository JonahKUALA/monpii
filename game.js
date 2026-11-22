const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreElement = document.getElementById("score");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlayTitle");
const overlayMessage = document.getElementById("overlayMessage");
const overlayEyebrow = document.getElementById("overlayEyebrow");
const startButton = document.getElementById("startButton");

const leftButton = document.getElementById("leftButton");
const rightButton = document.getElementById("rightButton");

const W = canvas.width;
const H = canvas.height;

const road = { x: 54, width: 312 };
const laneWidth = road.width / 3;

const car = {
  lane: 1,
  y: H - 112,
  width: 42,
  height: 76
};

const colors = [
  "#f4b942",
  "#4fc3f7",
  "#b39ddb",
  "#f06b6b",
  "#eeeeee"
];

let traffic = [];
let score = 0;
let speed = 250;
let roadOffset = 0;
let spawnTimer = 0;
let running = false;
let lastTime = 0;
let animationId = null;

function laneCenter(lane) {
  return road.x + laneWidth * lane + laneWidth / 2;
}

function roundedRect(x, y, w, h, radius) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
}

function drawCar(x, y, color, player = false) {
  const w = car.width;
  const h = car.height;

  // Wheels
  ctx.fillStyle = "#11151b";

  ctx.fillRect(x - w / 2 - 4, y + 13, 7, 18);
  ctx.fillRect(x + w / 2 - 3, y + 13, 7, 18);
  ctx.fillRect(x - w / 2 - 4, y + h - 31, 7, 18);
  ctx.fillRect(x + w / 2 - 3, y + h - 31, 7, 18);

  // Car body
  ctx.fillStyle = color;
  roundedRect(x - w / 2, y, w, h, 10);
  ctx.fill();

  // Windows
  ctx.fillStyle = "#b9edff";
  roundedRect(x - w / 2 + 7, y + 13, w - 14, 19, 5);
  ctx.fill();

  ctx.fillStyle = "#24364a";
  roundedRect(x - w / 2 + 7, y + 43, w - 14, 17, 5);
  ctx.fill();

  // Headlights
  ctx.fillStyle = "#fff5c4";
  ctx.fillRect(x - w / 2 + 4, y + 3, 9, 4);
  ctx.fillRect(x + w / 2 - 13, y + 3, 9, 4);

  // Rear lights
  ctx.fillStyle = "#ff4c57";
  ctx.fillRect(x - w / 2 + 4, y + h - 5, 9, 3);
  ctx.fillRect(x + w / 2 - 13, y + h - 5, 9, 3);

  if (player) {
    ctx.fillStyle = "white";
    ctx.fillRect(x - 2, y + 34, 4, 8);
  }
}

function drawRoad(dt) {
  // Grass
  ctx.fillStyle = "#267b4a";
  ctx.fillRect(0, 0, W, H);

  // Asphalt
  ctx.fillStyle = "#353b45";
  ctx.fillRect(road.x, 0, road.width, H);

  // Road edges
  ctx.fillStyle = "white";
  ctx.fillRect(road.x + 5, 0, 4, H);
  ctx.fillRect(road.x + road.width - 9, 0, 4, H);

  // Moving lane markings
  roadOffset = (roadOffset + speed * dt) % 72;
  ctx.fillStyle = "#d9dee5";

  for (let lane = 1; lane <= 2; lane++) {
    const x = road.x + laneWidth * lane - 2;

    for (let y = -72 + roadOffset; y < H; y += 72) {
      ctx.fillRect(x, y, 4, 38);
    }
  }

  // Yellow roadside markers
  ctx.fillStyle = "#f4d35e";

  for (let y = -50 + roadOffset % 50; y < H; y += 50) {
    ctx.fillRect(road.x - 13, y, 5, 24);
    ctx.fillRect(road.x + road.width + 8, y, 5, 24);
  }
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  drawRoad(0);

  for (const enemy of traffic) {
    drawCar(laneCenter(enemy.lane), enemy.y, enemy.color);
  }

  drawCar(laneCenter(car.lane), car.y, "#ef4444", true);
}

function spawnTraffic() {
  const lanes = [0, 1, 2].filter(lane =>
    !traffic.some(enemy =>
      enemy.lane === lane && enemy.y < 150
    )
  );

  if (lanes.length === 0) return;

  const lane = lanes[Math.floor(Math.random() * lanes.length)];
  const color = colors[Math.floor(Math.random() * colors.length)];

  traffic.push({
    lane,
    y: -90,
    color
  });
}

function checkCollision(a, b) {
  const sameLane = a.lane === b.lane;

  const verticalHit =
    a.y < b.y + car.height - 10 &&
    a.y + car.height - 10 > b.y + 10;

  return sameLane && verticalHit;
}

function endGame() {
  running = false;

  overlay.classList.remove("hidden");
  overlayEyebrow.textContent = "RACE FINISHED";
  overlayTitle.textContent = "Game over!";
  overlayMessage.textContent =
    `You scored ${Math.floor(score)} points. Try again!`;

  startButton.textContent = "RACE AGAIN";
}

function update(dt) {
  // Increase difficulty as the score grows
  speed = Math.min(480, 250 + score * 0.55);
  score += dt * 10;

  scoreElement.textContent = Math.floor(score);

  // Spawn traffic
  spawnTimer += dt;

  const interval = Math.max(0.48, 1.15 - score / 900);

  if (spawnTimer >= interval) {
    spawnTraffic();
    spawnTimer = 0;
  }

  // Move enemy cars down the road
  for (const enemy of traffic) {
    enemy.y += speed * dt;

    if (checkCollision(car, enemy)) {
      endGame();
      return;
    }
  }

  // Remove cars that have passed the screen
  traffic = traffic.filter(enemy => enemy.y < H + 100);
}

function loop(timestamp) {
  if (!running) return;

  const dt = Math.min((timestamp - lastTime) / 1000 || 0, 0.04);
  lastTime = timestamp;

  update(dt);
  draw();

  if (running) {
    animationId = requestAnimationFrame(loop);
  }
}

function moveLeft() {
  if (running) {
    car.lane = Math.max(0, car.lane - 1);
  }
}

function moveRight() {
  if (running) {
    car.lane = Math.min(2, car.lane + 1);
  }
}

function startGame() {
  if (animationId !== null) {
    cancelAnimationFrame(animationId);
  }

  traffic = [];
  score = 0;
  speed = 250;
  roadOffset = 0;
  spawnTimer = 0;
  car.lane = 1;

  scoreElement.textContent = "0";
  overlay.classList.add("hidden");

  running = true;
  lastTime = performance.now();

  animationId = requestAnimationFrame(loop);
}

// Keyboard controls
document.addEventListener("keydown", event => {
  if (
    ["ArrowLeft", "ArrowRight", "a", "A", "d", "D"].includes(event.key)
  ) {
    event.preventDefault();
  }

  if (!running &&
      (event.key === "Enter" || event.key === " ")) {
    startGame();
    return;
  }

  if (event.repeat) return;

  if (event.key === "ArrowLeft" || event.key === "a" || event.key === "A") {
    moveLeft();
  }

  if (event.key === "ArrowRight" || event.key === "d" || event.key === "D") {
    moveRight();
  }
});

// Buttons
startButton.addEventListener("click", startGame);
leftButton.addEventListener("click", moveLeft);
rightButton.addEventListener("click", moveRight);

// Initial screen
draw();