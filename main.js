const KEY_RIGHT = 'ArrowRight';
const KEY_LEFT = 'ArrowLeft';
const KEY_SPACE = ' ';

const GAME_WIDTH = window.innerWidth;
const GAME_HEIGHT = window.innerHeight;

const playerWidth = GAME_WIDTH / (GAME_WIDTH > 1000 ? 20 : 10);
const playerHeight = playerWidth * 1.1;
const enemyWidth = playerWidth;
const enemyHeight = enemyWidth;

let createEnemyIntervalId;

const STATE = {
  player: {
    x: GAME_WIDTH / 2,
    y: GAME_HEIGHT - playerHeight,
    speed: GAME_WIDTH / 200,
    element: null,
    width: playerWidth,
    height: playerHeight,
    cooldown: 0,
    lasers: [],
    isShooting: false,
    isMovingLeft: false,
    isMovingRight: false,
    kills: 0
  },
  enemies: [],
  enemyLasers: [],
  enemyWidth,
  enemyHeight,
  maxEnemyRows: 6,
  numberOfEnemiesPerRow: 8,
  specialItemSize: 50,
  specialItems: [],
  gameOver: false,
};

// init event listeners
window.addEventListener('keydown', keyPress);
window.addEventListener('keyup', keyRelease);

// init game
const container = document.querySelector('.main');
createPlayer();
createEnemies();

const killCount = document.createElement('p');
killCount.className = "killCount";
const highScoreElement = document.createElement('p');
highScoreElement.className = "highScoreElement";
highScoreElement.innerText = "Highscore: " + (window.localStorage.getItem('highscore') || 0);
container.appendChild(killCount);
container.appendChild(highScoreElement);

// begin gameloop
gameLoop();
function gameLoop() {
  killCount.innerText = STATE.player.kills;

  // randomly spawn special items
  if (Math.random() < 0.001) {
    createSpecialItem();
  }

  // update all parts of game
  updatePlayer();
  updatePlayerLaser();
  updateEnemies();
  updateEnemyLaser();
  updateItems();

  // check if game is over
  if (STATE.gameOver) {
    const lose = document.querySelector('.lose');
    lose.style.opacity = '100%';
    lose.style.pointerEvents = 'initial';
    window.cancelAnimationFrame(gameLoop);
    clearInterval(createEnemyIntervalId);
  } else if (STATE.enemies.length === 0) {
    const win = document.querySelector('.win');
    win.style.opacity = '100%';
    win.style.pointerEvents = 'initial';
    window.cancelAnimationFrame(gameLoop);
    clearInterval(createEnemyIntervalId);
  } else {
    window.requestAnimationFrame(gameLoop);
  }
}

// helper functions
function setPosition(element, x, y) {
  element.style.transform = `translate(${x}px, ${y}px)`;
}

function bound(x) {
  if (x >= GAME_WIDTH - STATE.player.width) {
    STATE.player.x = GAME_WIDTH - STATE.player.width;
    return STATE.player.x;
  }
  if (x <= 0) {
    STATE.player.x = 0;
    return STATE.player.x;
  } else {
    return x;
  }
}

function deleteElement(array, item, element) {
  const index = array.indexOf(item);
  array.splice(index, 1);
  container.removeChild(element);
}
//comments
function isColliding(rect1, rect2) {
  return !(
    rect2.left > rect1.right ||
    rect2.right < rect1.left ||
    rect2.top > rect1.bottom ||
    rect2.bottom < rect1.top
  );
}

function createPlayer() {
  const playerElement = document.createElement('div');
  playerElement.className = "player";
  const playerImgElement = document.createElement('img');
  playerImgElement.src = 'img/starship.png';
  playerImgElement.width = STATE.player.width;
  playerElement.appendChild(playerImgElement);
  container.appendChild(playerElement);
  STATE.player.element = playerElement;
  setPosition(playerElement, STATE.player.x, STATE.player.y);
}

function createEnemy(x, y) {
  const enemyElement = document.createElement('img');
  enemyElement.src = 'img/alien.png';
  enemyElement.className = 'enemy';
  enemyElement.width = STATE.enemyWidth;
  container.appendChild(enemyElement);
  const enemyCooldown = Math.floor(Math.random() * 100);
  const enemy = { x, y, element: enemyElement, enemyCooldown };
  STATE.enemies.push(enemy);
  setPosition(enemyElement, x, y);
}
function createEnemies() {
  createEnemyRow();
  createEnemyInterval();
}
function createEnemyRow() {
  const numberOfEnemiesPerRow = STATE.numberOfEnemiesPerRow;
  for (let i = 0; i < numberOfEnemiesPerRow; i++) {
    createEnemy(i * (GAME_WIDTH / numberOfEnemiesPerRow), 100);
  }
}
function createEnemyInterval(time = 3000) {
  createEnemyIntervalId = setInterval(function () {
    const { numberOfEnemiesPerRow, enemies, maxEnemyRows } = STATE;
    const amountOfRows = enemies.length / numberOfEnemiesPerRow;
    const canCreateNewRow = amountOfRows < maxEnemyRows;
    if (canCreateNewRow) {
      createEnemyRow();
      for (let i = 0; i < enemies.length - numberOfEnemiesPerRow; i++) {
        enemies[i].y += 70;
      }
    }
  }, time);
}
function updateEnemyIntervalSpeed(time) {
  clearInterval(createEnemyIntervalId);
  createEnemyInterval(time);
}

function updatePlayer() {
  if (STATE.player.isMovingLeft) {
    STATE.player.x -= STATE.player.speed;
  }
  if (STATE.player.isMovingRight) {
    STATE.player.x += STATE.player.speed;
  }
  if (STATE.player.isShooting && STATE.player.cooldown === 0) {
    createLaser(STATE.player.x - STATE.player.width / 2, STATE.player.y);
    STATE.player.cooldown = 6;
  }
  setPosition(STATE.player.element, bound(STATE.player.x), STATE.player.y);
  if (STATE.player.cooldown > 0) {
    STATE.player.cooldown -= 0.5;
  }
}

function updatePlayerLaser() {
  const enemies = STATE.enemies;
  const lasers = STATE.player.lasers;

  // das wird durch for of loop ersetzt
  //   for (let i = 0; i < lasers.length; i++) {
  //     const laser = lasers[i];
  for (const laser of lasers) {
    laser.y -= GAME_HEIGHT / 80;
    if (laser.y < 0) {
      deleteElement(lasers, laser, laser.element);
    }
    setPosition(laser.element, laser.x, laser.y);

    const laserRect = laser.element.getBoundingClientRect();
    for (const enemy of enemies) {
      const enemyRect = enemy.element.getBoundingClientRect();
      if (isColliding(enemyRect, laserRect)) {
        STATE.player.kills++
        // animate enemy & laser width to 0 (with css)
        enemy.element.width = 0;
        enemy.element = null;
        const indexOfLaser = lasers.indexOf(laser);
        lasers.splice(indexOfLaser, 1);
        if (container.contains(laser.element)) {
          container.removeChild(laser.element);
        }
        const indexOfEnemy = enemies.indexOf(enemy);
        enemies.splice(indexOfEnemy, 1);
      }
    }
  }
}

function updateEnemies() {
  const dx = Math.sin(Date.now() / 1000) * 40;
  const dy = Math.cos(Date.now() / 1000) * 30;
  for (const enemy of STATE.enemies) {
    const newX = enemy.x + dx;
    const newY = enemy.y + dy;
    if (enemy.y > GAME_HEIGHT - STATE.enemyHeight * 2) {
      STATE.gameOver = true;
    }
    setPosition(enemy.element, newX, newY);
    if (enemy.enemyCooldown === 0 && enemy.element) {
      createLaser(newX, newY + STATE.enemyHeight, true);
      enemy.enemyCooldown = Math.floor(Math.random() / 2);
    }
    enemy.enemyCooldown -= 0.5;
  }
}

function createSpecialItem() {
  const x = Math.random() * GAME_WIDTH;
  const y = 0;
  const specialItemElement = document.createElement('img');
  specialItemElement.src = 'img/flower.png';
  specialItemElement.width = STATE.specialItemSize;
  specialItemElement.height = STATE.specialItemSize;
  specialItemElement.className = 'specialItem';
  container.appendChild(specialItemElement);
  STATE.specialItems.push({ element: specialItemElement, x, y });
  setPosition(specialItemElement, x, y);
}

function updateItems() {
  // const { specialItems: items } = STATE;
  const items = STATE.specialItems;
  for (const item of items) {
    item.y += 3;
    if (item.y > GAME_HEIGHT - STATE.specialItemSize) {
      deleteElement(items, item, item.element);
    }
    setPosition(item.element, item.x, item.y);

    const specialItemRect = item.element.getBoundingClientRect();
    const playerRect = STATE.player.element.getBoundingClientRect();
    if (isColliding(playerRect, specialItemRect)) {
      item.element.width = 0;
      const indexOfItem = items.indexOf(item);
      items.splice(indexOfItem, 1);
      container.style.backgroundImage = 'linear-gradient(#150116, #6f0464)';
      updateEnemyIntervalSpeed(7000);
      setInterval(function () {
        container.style.backgroundImage = 'linear-gradient(#010216, #03074b)';
      }, 7000);
    }
  }
}

function createLaser(x, y, enemy = false) {
  const element = document.createElement('img');
  element.src = enemy ? 'img/enemy_laser.png' : 'img/starship_laser.png';
  element.className = enemy ? 'enemyLaser' : 'laser';
  container.appendChild(element);
  const laser = { x, y, element };
  if (enemy) {
    STATE.enemyLasers.push(laser);
  } else {
    STATE.player.lasers.push(laser);
  }
  setPosition(element, x, y);
}

function updateEnemyLaser() {
  // const { enemyLasers } = STATE;
  const enemyLasers = STATE.enemyLasers;
  for (const enemyLaser of enemyLasers) {
    enemyLaser.y += GAME_HEIGHT / 200;
    if (enemyLaser.y > GAME_HEIGHT - 30) {
      deleteElement(enemyLasers, enemyLaser, enemyLaser.element);
    }
    const enemyLaserRect = enemyLaser.element.getBoundingClientRect();
    const playerRect = STATE.player.element.getBoundingClientRect();
    if (isColliding(playerRect, enemyLaserRect)) {
      const prevHighScore = window.localStorage.getItem('highscore');
      if (prevHighScore < STATE.player.kills) {
        window.localStorage.setItem('highscore', STATE.player.kills)
      }
      //STATE.gameOver = true;
    }
    setPosition(
      enemyLaser.element,
      enemyLaser.x + STATE.enemyWidth / 2,
      enemyLaser.y + 15
    );
  }
}

// event listener functions
function keyPress(event) {
  if (event.key === KEY_RIGHT) {
    STATE.player.isMovingRight = true;
    STATE.player.element.classList.add("isMovingRight");
    STATE.player.element.classList.remove("isMovingLeft");
  } else if (event.key === KEY_LEFT) {
    STATE.player.isMovingLeft = true;
    STATE.player.element.classList.add("isMovingLeft");
    STATE.player.element.classList.remove("isMovingRight");
  } else if (event.key === KEY_SPACE) {
    STATE.player.isShooting = true;
  }
}

function keyRelease(event) {
  if (event.key === KEY_RIGHT) {
    STATE.player.isMovingRight = false;
    STATE.player.element.classList.remove("isMovingRight");
  } else if (event.key === KEY_LEFT) {
    STATE.player.isMovingLeft = false;
    STATE.player.element.classList.remove("isMovingLeft");
  } else if (event.key === KEY_SPACE) {
    STATE.player.isShooting = false;
  }
}

// Audio Button
const beep = new Audio('audio/beep.wav');
const play = () => beep.play();
const stop = () => {
  beep.pause();
  beep.currentTime = 0;
};
const restartButtons = [
  document.getElementById('restartWin'),
  document.getElementById('restartLose'),
];
for (const button of restartButtons) {
  button.onmouseenter = play;
  button.onmouseleave = stop;
  button.onclick = () => window.location.reload();
}
