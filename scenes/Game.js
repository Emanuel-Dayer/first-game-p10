// URL to explain PHASER scene: https://rexrainbow.github.io/phaser3-rex-notes/docs/site/scene/

export default class Game extends Phaser.Scene {
  constructor() {
    // key of the scene
    // the key will be used to start the scene by other scenes
    super("game");
  }

  init() {
    // this is called before the scene is created
    // init variables
    // take data passed from other scenes
    // data object param {}
  }

  preload() {
    // load assets
    this.load.image("sky", "./public/assets/crowlspace.png");
    this.load.image("ground", "./public/assets/platform_2.png");
    this.load.image("star", "./public/assets/moneda.png");
    this.load.image("bomb", "./public/assets/bomb_2.png");
    this.load.image("rkey", "./public/assets/rkey.png");
    this.load.spritesheet("dude", "./public/assets/dude_2.png", {
      frameWidth: 32,
      frameHeight: 48,
    });
  }

  create() {
    // create game objects
    this.add.image(400, 300, "sky");

    this.platforms = this.physics.add.staticGroup();

    this.platforms.create(400, 568, "ground").setScale(2).refreshBody();

    this.platforms.create(600, 400, "ground");
    this.platforms.create(50, 250, "ground");
    this.platforms.create(750, 220, "ground");

    this.player = this.physics.add.sprite(100, 450, "dude");

    this.player.setBounce(0.2);
    this.player.setCollideWorldBounds(true);

    this.anims.create({
      key: "left",
      frames: this.anims.generateFrameNumbers("dude", { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1,
    });

    this.anims.create({
      key: "turn",
      frames: [{ key: "dude", frame: 4 }],
      frameRate: 20,
    });

    this.anims.create({
      key: "right",
      frames: this.anims.generateFrameNumbers("dude", { start: 5, end: 8 }),
      frameRate: 10,
      repeat: -1,
    });

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W); 
    this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A); 
    /* tal vez la use para algo para caer mas rapido
    this.keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    */
    this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);

    //para reiniciar
    this.keyR = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);

    this.stars = this.physics.add.group({
      key: "star",
      repeat: 11,
      setXY: { x: 12, y: 0, stepX: 70 },
    });

    this.stars.children.iterate(function (child) {
      child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
    });

    this.bombs = this.physics.add.group();

    this.score = 0;
    this.gameOver = false;

    this.scoreText = this.add.text(16, 16, `Score: ${this.score}`, {
      fontSize: "32px",
      fill: "#fff",
      stroke: "#000",
      strokeThickness: 8,
    });
    this.Reiniciar = this.add.text(350, 560, `Presiona la tecla "R" para reiniciar`, {
      fontSize: "20px",
      fill: "#fff",
      stroke: "#000",
      strokeThickness: 8,
    });

    this.physics.add.collider(this.player, this.platforms);

    this.physics.add.collider(this.stars, this.platforms);

    this.physics.add.overlap(
      this.player,
      this.stars,
      this.collectStar,
      null,
      this
    );

    this.physics.add.collider(
      this.player,
      this.bombs,
      this.hitBomb,
      null,
      this
    );

    //Agregando que se pueda desactivar el debug con la P, porque me molesta verlo asi mientras juego
    this.physics.world.drawDebug = false;
    this.ModoDebug = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);

    // Crear la imagen de rkey y ocultarla inicialmente
    this.rkeyImage = this.add.image(400, 300, "rkey").setScale(1).setAlpha(0);
    this.rkeyImage.setDepth(10); //por encima de otros elementos
    this.textures.get("rkey").setFilter(Phaser.Textures.FilterMode.NEAREST); //para que no se vea borroso

    //para que no nos movamos mientras se reinicia el juego o perdemos
    this.playerCanMove = true; 
  }


  update() {
    // Movimiento del jugador solo si está permitido
    if (this.playerCanMove) {
      if (this.cursors.left.isDown || this.keyA.isDown) {
        this.player.setVelocityX(-160);
        this.player.anims.play("left", true);
      } else if (this.cursors.right.isDown || this.keyD.isDown) {
        this.player.setVelocityX(160);
        this.player.anims.play("right", true);
      } else {
        this.player.setVelocityX(0);
        this.player.anims.play("turn");
      }

      if ((this.cursors.up.isDown || this.keyW.isDown) && this.player.body.touching.down) {
        this.player.setVelocityY(330 * -1);
      }
    } else {
      // Si el jugador no puede moverse, pausa las animaciones
      this.player.anims.pause();
    }

    // Activar/desactivar el debug con la tecla P
    if (Phaser.Input.Keyboard.JustDown(this.ModoDebug)) {
      if (this.physics.world.drawDebug) {
        this.physics.world.drawDebug = false;
        this.physics.world.debugGraphic.clear();
      } else {
        this.physics.world.drawDebug = true;
      }
    }

    // Reiniciar el juego si se presiona la tecla R
    if (Phaser.Input.Keyboard.JustDown(this.keyR)) {
      this.ReinicConR();
    }
  }
  
  collectStar(player, star) {
    star.disableBody(true, true);

    this.score += 25;
    this.scoreText.setText(`Score: ${this.score}`); 

    if (this.stars.countActive(true) === 0) {
      //  A new batch of stars to collect
      this.stars.children.iterate(function (child) {
        child.enableBody(true, child.x, 0, true, true);
      });

      var x =
        this.player.x < 400
          ? Phaser.Math.Between(400, 800)
          : Phaser.Math.Between(0, 400);

      var bomb = this.bombs.create(x, 16, "bomb");
      bomb.setBounce(1);
      bomb.setCollideWorldBounds(true);
      bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
      bomb.allowGravity = false;
    }
  }

  hitBomb(player, bomb) {
    //sacar las teclas para que no podamos presionarlas
    this.input.keyboard.removeAllKeys();
    //volver a poner la R para reiniciar
    this.keyR = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);

    this.player.anims.pause();
    this.playerCanMove = false;
    this.physics.pause();

    this.player.setTint(0xff0000);

    this.player.anims.play("turn");

    this.gameOver = true;

    if (this.gameOver === true) 
    {
      this.scoreText.setOrigin(0.5).setPosition(400, 300);  //setposition cambia la posicion del texto
  
      this.Perdiste = this.add.text(400, 250, `GAME OVER`, {
        fontSize: "32px",
        fill: "#fff",
        stroke: "#000",
        strokeThickness: 8,
      }).setOrigin(0.5); //el set origin cambia el punto de referencia desde donde se mueve la imagen
    }
  }

  ReinicConR() {
    // Desactivar el movimiento del jugador, pausar el juego y detener animaciones
    this.input.keyboard.enabled = false;
    this.player.anims.pause(); // Pausar las animaciones del jugador
    this.player.anims.play("turn"); // Reiniciar la animación al estado neutral solo si puede moverse
    this.playerCanMove = false;
    this.physics.pause();

    // Mostrar la imagen de rkey y aplicar un efecto de shake muy reducido
    this.rkeyImage.setAlpha(1).setScale(8); // Tamaño inicial aumentado
    this.tweens.add({ //tweens para hacer animaciones
      targets: this.rkeyImage, //target nos dice a que le aplicamos la animacion
      x: { value: 400 + 3, duration: 20, yoyo: true, repeat: 5 }, // Shake horizontal || yoyo hace que vuelva a la posicion original despues de moverse, basicamente hace lo mismo pero en reversa asta llegar a la posicion original
      y: { value: 300 + 3, duration: 20, yoyo: true, repeat: 5 }, // Shake vertical
      onComplete: () => { //cuando termina la animacion
        // Animar el crecimiento rápido y la disminución de opacidad
        this.tweens.add({ 
          targets: this.rkeyImage, 
          scale: { from: 8, to: 80 }, //Crecimiento
          alpha: { from: 1, to: 0 }, //opacidad
          duration: 500,
          onComplete: () => { 
            // Restaurar las físicas, animaciones y para presionar teclas antes de reiniciar
            this.physics.resume();
            this.player.anims.resume();
            this.input.keyboard.enabled = true;

            // Reiniciar la escena
            this.scene.restart();
          },
        });
      },
    });
  }
}
