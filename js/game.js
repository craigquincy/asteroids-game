const gameProperties = {
  screenWidth: 640,
  screenHeight: 480,

  delayToStartLevel: 3
};

const states = {
  game: "game"
};

const graphicAssets = {
  ship: {
    URL: 'assets/ship.png',
    name: 'ship'
  },
  bullet: {
    URL: 'assets/bullet.png',
    name: 'bullet'
  },

  asteroidLarge: {
    URL: 'assets/asteroidLarge.png',
    name: 'asteroidLarge'
  },
  asteroidMedium: {
    URL: 'assets/asteroidMedium.png',
    name: 'asteroidMedium'
  },
  asteroidSmall: {
    URL: 'assets/asteroidSmall.png',
    name: 'asteroidSmall'
  }
};

const soundAssets = {
  fire: {
    URL: [
      'assets/fire.m4a', 'assets/fire.ogg'
    ],
    name: 'fire'
  },
  destroyed: {
    URL: [
      'assets/destroyed.m4a', 'assets/destroyed.ogg'
    ],
    name: 'destroyed'
  }
};

const shipProperties = {
  startX: gameProperties.screenWidth * 0.5,
  startY: gameProperties.screenHeight * 0.5,
  acceleration: 300,
  drag: 100,
  maxVelocity: 300,
  angularVelocity: 200,
  startingLives: 3,
  timeToReset: 3,
  blinkDelay: 0.2
};

const bulletProperties = {
  speed: 400,
  interval: 250,
  lifespan: 2000,
  maxCount: 30
}

const asteroidProperties = {
  startingAsteroids: 4,
  maxAsteroids: 20,
  incrementAsteroids: 2,

  asteroidLarge: {
    minVelocity: 50,
    maxVelocity: 150,
    minAngularVelocity: 0,
    maxAngularVelocity: 200,
    score: 20,
    nextSize: graphicAssets.asteroidMedium.name,
    pieces: 2
  },
  asteroidMedium: {
    minVelocity: 50,
    maxVelocity: 200,
    minAngularVelocity: 0,
    maxAngularVelocity: 200,
    score: 50,
    nextSize: graphicAssets.asteroidSmall.name,
    pieces: 2
  },
  asteroidSmall: {
    minVelocity: 50,
    maxVelocity: 300,
    minAngularVelocity: 0,
    maxAngularVelocity: 200,
    score: 100
  }
};

const fontAssets = {
  counterFontStyle: {
    font: '20px Arial',
    fill: '#FFFFFF',
    align: 'center'
  }
};

class GameState {
  constructor() {
    this.shipSprite;

    this.key_left;
    this.key_right;
    this.key_thrust;
    this.key_fire;

    this.bulletGroup;
    this.bulletInterval = 0;

    this.asteroidGroup;
    this.asteroidsCount = asteroidProperties.startingAsteroids;

    this.shipLives = shipProperties.startingLives;
    this.tf_lives;

    this.score = 0;
    this.tf_score;

    this.sndDestroyed;
    this.sndFire;

    this.shipIsInvulnerable;
  }

  preload() {
    game.load.image(graphicAssets.asteroidLarge.name, graphicAssets.asteroidLarge.URL);
    game.load.image(graphicAssets.asteroidMedium.name, graphicAssets.asteroidMedium.URL);
    game.load.image(graphicAssets.asteroidSmall.name, graphicAssets.asteroidSmall.URL);

    game.load.image(graphicAssets.bullet.name, graphicAssets.bullet.URL);
    game.load.image(graphicAssets.ship.name, graphicAssets.ship.URL);

    game.load.audio(soundAssets.destroyed.name, soundAssets.destroyed.URL);
    game.load.audio(soundAssets.fire.name, soundAssets.fire.URL);
  }

  create() {
    this.initGraphics()
    this.initSounds()
    this.initPhysics()
    this.initKeyboard()
    this.resetAsteroids();
  }

  update() {
    this.checkPlayerInput()
    this.checkBoundaries(this.shipSprite);
    this.bulletGroup.forEachExists(this.checkBoundaries, this);
    this.asteroidGroup.forEachExists(this.checkBoundaries, this);
    game.physics.arcade.overlap(this.bulletGroup, this.asteroidGroup, this.asteroidCollision, null, this);
    game.physics.arcade.overlap(this.shipSprite, this.asteroidGroup, this.asteroidCollision, null, this);

    if (!this.shipIsInvulnerable) {
      game.physics.arcade.overlap(this.shipSprite, this.asteroidGroup, this.asteroidCollision, null, this);
    }
  }

  initGraphics() {
    this.shipSprite = game.add.sprite(shipProperties.startX, shipProperties.startY, graphicAssets.ship.name);
    this.shipSprite.angle = -90;
    this.shipSprite.anchor.set(0.5, 0.5);
    this.bulletGroup = game.add.group();
    this.asteroidGroup = game.add.group();

    this.tf_lives = game.add.text(20, 10, shipProperties.startingLives, fontAssets.counterFontStyle);

    this.tf_score = game.add.text(gameProperties.screenWidth - 20, 10, "0", fontAssets.counterFontStyle);
    this.tf_score.align = 'right';
    this.tf_score.anchor.set(1, 0);
  }

  initSounds() {
    this.sndDestroyed = game.add.audio(soundAssets.destroyed.name);
    this.sndFire = game.add.audio(soundAssets.fire.name);
  }

  initPhysics() {
    game.physics.startSystem(Phaser.Physics.ARCADE);

    game.physics.enable(this.shipSprite, Phaser.Physics.ARCADE);
    this.shipSprite.body.drag.set(shipProperties.drag);
    this.shipSprite.body.maxVelocity.set(shipProperties.maxVelocity);

    this.bulletGroup.enableBody = true;
    this.bulletGroup.physicsBodyType = Phaser.Physics.ARCADE;
    this.bulletGroup.createMultiple(bulletProperties.maxCount, graphicAssets.bullet.name);
    this.bulletGroup.setAll('anchor.x', 0.5);
    this.bulletGroup.setAll('anchor.y', 0.5);
    this.bulletGroup.setAll('lifespan', bulletProperties.lifespan);

    this.asteroidGroup.enableBody = true;
    this.asteroidGroup.physicsBodyType = Phaser.Physics.ARCADE;
  }

  initKeyboard() {
    this.key_left = game.input.keyboard.addKey(Phaser.Keyboard.LEFT);
    this.key_right = game.input.keyboard.addKey(Phaser.Keyboard.RIGHT);
    this.key_thrust = game.input.keyboard.addKey(Phaser.Keyboard.UP);
    this.key_fire = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
  }

  checkPlayerInput() {
    // rotate
    if (this.key_left.isDown) {
      this.shipSprite.body.angularVelocity = -shipProperties.angularVelocity;
    } else if (this.key_right.isDown) {
      this.shipSprite.body.angularVelocity = shipProperties.angularVelocity;
    } else {
      this.shipSprite.body.angularVelocity = 0;
    }

    // thrust
    if (this.key_thrust.isDown) {
      game.physics.arcade.accelerationFromRotation(this.shipSprite.rotation, shipProperties.acceleration, this.shipSprite.body.acceleration);
    } else {
      this.shipSprite.body.acceleration.set(0);
    }

    // bullet
    if (this.key_fire.isDown) {
      this.fire();
    }
  }

  checkBoundaries(sprite) {
    if (sprite.x < 0) {
      sprite.x = game.width;
    } else if (sprite.x > game.width) {
      sprite.x = 0;
    }

    if (sprite.y < 0) {
      sprite.y = game.height;
    } else if (sprite.y > game.height) {
      sprite.y = 0;
    }
  }

  fire() {
    if (game.time.now > this.bulletInterval) {
      this.sndFire.play();
      let bullet = this.bulletGroup.getFirstExists(false);

      if (bullet) {
        let length = this.shipSprite.width * 0.5;
        let x = this.shipSprite.x + (Math.cos(this.shipSprite.rotation) * length);
        let y = this.shipSprite.y + (Math.sin(this.shipSprite.rotation) * length);

        bullet.reset(x, y);
        bullet.lifespan = bulletProperties.lifespan;
        bullet.rotation = this.shipSprite.rotation;

        game.physics.arcade.velocityFromRotation(this.shipSprite.rotation, bulletProperties.speed, bullet.body.velocity);
        this.bulletInterval = game.time.now + bulletProperties.interval;
      }
    }
  }

  createAsteroid(x, y, size, pieces) {
    if (pieces === undefined) {
      pieces = 1;
    }

    for (let i = 0; i < pieces; i++) {
      let asteroid = this.asteroidGroup.create(x, y, size);
      asteroid.anchor.set(0.5, 0.5);
      asteroid.body.angularVelocity = game.rnd.integerInRange(asteroidProperties[size].minAngularVelocity, asteroidProperties[size].maxAngularVelocity);

      let randomAngle = game.math.degToRad(game.rnd.angle());
      let randomVelocity = game.rnd.integerInRange(asteroidProperties[size].minVelocity, asteroidProperties[size].maxVelocity);

      game.physics.arcade.velocityFromRotation(randomAngle, randomVelocity, asteroid.body.velocity);
    }
  }

  resetAsteroids() {
    for (let i = 0; i < this.asteroidsCount; i++) {
      let side = Math.round(Math.random());
      let x;
      let y;

      if (side) {
        x = Math.round(Math.random()) * gameProperties.screenWidth;
        y = Math.random() * gameProperties.screenHeight;
      } else {
        x = Math.random() * gameProperties.screenWidth;
        y = Math.round(Math.random()) * gameProperties.screenHeight;
      }

      this.createAsteroid(x, y, graphicAssets.asteroidLarge.name);
    }
  }

  asteroidCollision(target, asteroid) {
    this.sndDestroyed.play();

    target.kill();
    asteroid.kill();

    if (target.key === graphicAssets.ship.name) {
      this.destroyShip();
    }

    this.splitAsteroid(asteroid);
    this.updateScore(asteroidProperties[asteroid.key].score);

    if (!this.asteroidGroup.countLiving()) {
      game.time.events.add(Phaser.Timer.SECOND * gameProperties.delayToStartLevel, this.nextLevel, this);
    }
  }

  destroyShip() {
    this.shipLives--;
    this.tf_lives.text = this.shipLives;

    if (this.shipLives) {
      game.time.events.add(Phaser.Timer.SECOND * shipProperties.timeToReset, this.resetShip, this);
    }
  }

  resetShip() {
    this.shipIsInvulnerable = true;

    this.shipSprite.reset(shipProperties.startX, shipProperties.startY);
    this.shipSprite.angle = -90;

    game.time.events.add(Phaser.Timer.SECOND * shipProperties.timeToReset, this.shipReady, this);

    game.time.events.repeat(Phaser.Timer.SECOND * shipProperties.blinkDelay, shipProperties.timeToReset / shipProperties.blinkDelay, this.shipBlink, this);
  }

  shipReady() {
    this.shipIsInvulnerable = false;
    this.shipSprite.visible = true;
  }

  shipBlink() {
    this.shipSprite.visible = !this.shipSprite.visible;
  }

  splitAsteroid(asteroid) {
    if (asteroidProperties[asteroid.key].nextSize) {
      this.createAsteroid(asteroid.x, asteroid.y, asteroidProperties[asteroid.key].nextSize, asteroidProperties[asteroid.key].pieces);
    }
  }

  updateScore(score) {
    this.score += score;
    this.tf_score.text = this.score;
  }

  nextLevel() {
    this.asteroidGroup.removeAll(true);

    if (this.asteroidsCount < asteroidProperties.maxAsteroids) {
      this.asteroidsCount += asteroidProperties.incrementAsteroids;
    }

    this.resetAsteroids();
  }
}

let game = new Phaser.Game(gameProperties.screenWidth, gameProperties.screenHeight, Phaser.AUTO, 'gameDiv');
game.state.add(states.game, new GameState());
game.state.start(states.game);
