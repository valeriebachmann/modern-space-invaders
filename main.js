const KEY_RIGHT = 'ArrowRight';
const KEY_LEFT = 'ArrowLeft';
const KEY_SPACE = ' ';

const GAME_WIDTH = window.innerWidth;
const GAME_HEIGHT = window.innerHeight;

const playerWidth = GAME_WIDTH / (GAME_WIDTH > 1000 ? 20 : 10);
const playerHeight = playerWidth * 1.185;
const enemyWidth = playerWidth * 0.7;
const enemyHeight = enemyWidth;
const defaultEnemyCooldown = 300

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
    kills: 0,
    lifeScore: 3,
    heartSize: 35
  },
  enemies: [],
  enemyLasers: [],
  canEnemyShoot: true,
  enemyWidth,
  enemyHeight,
  maxEnemyRows: 6,
  numberOfEnemiesPerRow: 8,
  specialItemSize: 40,
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
container.appendChild(killCount);

const prevHighScore = window.localStorage.getItem('highscore');
const highScoreElement = document.createElement('p');
highScoreElement.className = "highScoreElement";
highScoreElement.innerText = "Highscore: " + (prevHighScore || 0);
container.appendChild(highScoreElement);

const lifeContainer = document.createElement('div');
lifeContainer.className = "lifeContainer";
document.body.appendChild(lifeContainer);

for (let i = 0; i < 3; i++) {
  const lifeCount = document.createElement('img');
  lifeCount.src = 'img/heart.png';
  lifeCount.width = STATE.player.heartSize;
  lifeCount.height = STATE.player.heartSize;
  lifeCount.className = "lifeCount";
  lifeContainer.appendChild(lifeCount);
}

const playButton = document.getElementById('play');
playButton.onclick = play;
const backgroundSound = new Audio('audio/backgroundSound.mp3');

function play() {
  playButton.blur();
  const playWrapperElement = document.querySelector('.play');
  playWrapperElement.style.opacity = 0;
  playWrapperElement.style.pointerEvents = 'none';

  backgroundSound.volume = 0.5;
  backgroundSound.play();
  backgroundSound.onended = function () {
    backgroundSound.currentTime = 0;
    backgroundSound.play();
  }
  // begin gameloop
  gameLoop();
}

function gameLoop() {
  killCount.innerText = STATE.player.kills;
  if (prevHighScore < STATE.player.kills) {
    highScoreElement.innerText = "Highscore: " + STATE.player.kills;
  }

  if (Math.random() < 0.002) {
    createSpecialItem();
  }
  if (Math.random() < 0.001) {
    createSpecialItem(type = 'rare');
  }

  // update all parts of game
  updatePlayer();
  updatePlayerLaser();
  updateEnemies();
  updateEnemyLaser();
  updateItems();

  // check if game is over
  if (STATE.gameOver) {
    if (prevHighScore < STATE.player.kills) {
      window.localStorage.setItem('highscore', STATE.player.kills);
    }

    const scoreTextElement = document.querySelector('.lose h1');
    scoreTextElement.innerText = "Score: " + STATE.player.kills;

    const lose = document.querySelector('.lose');
    lose.style.opacity = '100%';
    lose.style.pointerEvents = 'initial';


    window.cancelAnimationFrame(gameLoop);
    clearInterval(createEnemyIntervalId);

    //Audio
    backgroundSound.pause()

    const sound = new Audio('audio/losingSound.wav');
    sound.play();


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
  playerImgElement.src = 'img/starship_small.png';
  playerImgElement.width = STATE.player.width;
  playerElement.appendChild(playerImgElement);
  container.appendChild(playerElement);
  STATE.player.element = playerElement;
  setPosition(playerElement, STATE.player.x, STATE.player.y);
}

function createEnemy(x, y) {
  const enemyElement = document.createElement('img');
  enemyElement.src = 'img/alien_small.png';
  enemyElement.className = 'enemy';
  enemyElement.width = STATE.enemyWidth;
  container.appendChild(enemyElement);
  const enemyCooldown = Math.floor(Math.random() * defaultEnemyCooldown);
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
        enemies[i].y += enemyHeight * 1.2;
      }
    }
  }, time);
}
function updateEnemyIntervalSpeed(time = 3000) {
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
    createLaser(STATE.player.x + STATE.player.width / 2 - 4.625, STATE.player.y);
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

  for (const laser of lasers) {
    laser.y -= GAME_HEIGHT / 80;
    if (laser.y < 0) {
      deleteElement(lasers, laser, laser.element);
    }
    setPosition(laser.element, laser.x, laser.y)

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
  const dx = Math.sin(Date.now() / 1000) * 40 + 50;
  const dy = Math.cos(Date.now() / 1000) * 30;
  for (const enemy of STATE.enemies) {
    const newX = enemy.x + dx;
    const newY = enemy.y + dy;
    if (enemy.y > GAME_HEIGHT - STATE.enemyHeight * 2) {
      STATE.gameOver = true;
    }
    setPosition(enemy.element, newX, newY);
    if (enemy.enemyCooldown <= 0 && enemy.element) {
      if (STATE.canEnemyShoot) {
        createLaser(newX, newY + STATE.enemyHeight, true);
      }
      enemy.enemyCooldown = Math.floor(Math.random() * defaultEnemyCooldown);
    }
    enemy.enemyCooldown -= 0.5;
  }
}

function createSpecialItem(type = 'regular') {
  const x = Math.random() * GAME_WIDTH;
  const y = 0;
  const specialItemElement = document.createElement('img');
  specialItemElement.src = type === 'regular' ? 'img/specialItem.png' : 'img/rareItem.png';
  specialItemElement.width = STATE.specialItemSize;
  specialItemElement.height = STATE.specialItemSize;
  specialItemElement.className = 'specialItem';
  container.appendChild(specialItemElement);
  STATE.specialItems.push({ element: specialItemElement, x, y, type });
  setPosition(specialItemElement, x, y);
}

const specialItemSound = new Audio('audio/specialItem.wav');
const rareItemSound = new Audio('audio/rareItem.wav');


function updateItems() {
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
      // Laser reset
      container.querySelectorAll('.enemyLaser').forEach(element => container.removeChild(element))
      STATE.enemyLasers = [];
      STATE.canEnemyShoot = false;
      deleteElement(items, item, item.element)
      if (item.type === 'regular') {
        specialItemSound.play();
        container.style.backgroundImage = 'url("img/background_regularItem.jpg")';
        updateEnemyIntervalSpeed(7000);
        setTimeout(function () {
          container.style.backgroundImage = 'url("img/background.jpg")';
          STATE.canEnemyShoot = true;
          updateEnemyIntervalSpeed();
        }, 7000);
      } else {
        rareItemSound.play();
        container.style.backgroundImage = 'url("img/background_rareItem.jpg")';
        updateEnemyIntervalSpeed(3000);
        setTimeout(function () {
          container.style.backgroundImage = 'url("img/background.jpg")';
          STATE.canEnemyShoot = true;
          updateEnemyIntervalSpeed();
        }, 3000);
        STATE.player.kills += STATE.enemies.length;
        animateRemoveAllEnemies();
      }
    }
  }
}

function sleep(timeout) {
  return new Promise((resolve) => setTimeout(() => {
    resolve()
  }, timeout))
}

async function animateRemoveAllEnemies() {
  const savedEnemies = STATE.enemies;
  STATE.enemies = [];
  for (const enemy of savedEnemies) {
    enemy.element.width = 0;
    await sleep(50);
  }
}

//Audio
const laserSound = new Audio('audio/laserSound.mp3');
laserSound.volume = 0.1;

function createLaser(x, y, enemy = false) {
  const element = document.createElement('img');
  element.src = enemy ? 'img/enemy_laser_small.png' : 'img/starship_laser_small.png';
  element.className = enemy ? 'enemyLaser' : 'laser';
  container.appendChild(element);
  const laser = { x, y, element };
  if (enemy) {
    STATE.enemyLasers.push(laser);
  } else {
    STATE.player.lasers.push(laser);
    laserSound.currentTime = 0;
    laserSound.play();
  }
  setPosition(element, x, y);
}

//Audio
const damageSound = new Audio('audio/roblox.mp3');

let prevEnemyLaser;
function updateEnemyLaser() {
  const enemyLasers = STATE.enemyLasers;
  for (const enemyLaser of enemyLasers) {
    enemyLaser.y += GAME_HEIGHT / 200;
    if (enemyLaser.y > GAME_HEIGHT - 30) {
      deleteElement(enemyLasers, enemyLaser, enemyLaser.element);
    }
    const enemyLaserRect = enemyLaser.element.getBoundingClientRect();
    const playerRect = STATE.player.element.getBoundingClientRect();
    if (isColliding(playerRect, enemyLaserRect)) {
      deleteElement(enemyLasers, enemyLaser, enemyLaser.element);
      if (enemyLaser != prevEnemyLaser) {
        STATE.player.lifeScore -= 1;
        lifeContainer.removeChild(lifeContainer.firstElementChild);
        damageSound.currentTime = 0;
        damageSound.play();
      }
      if (STATE.player.lifeScore === 0) {
        STATE.gameOver = true;
      }
      prevEnemyLaser = enemyLaser;
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
const beep = new Audio('audio/replaySound.wav');
const stop = () => {
  beep.pause();
  beep.currentTime = 0;
};
const restartButton = document.getElementById('restart')
restartButton.onmouseenter = () => beep.play();
restartButton.onmouseleave = stop;
restartButton.onclick = () => window.location.reload();
