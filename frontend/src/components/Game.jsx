import React, { useEffect, useRef } from "react";
import Phaser from "phaser";

const Game = () => {
  const gameRef = useRef(null);

  useEffect(() => {
    if (gameRef.current) return;

    class MainScene extends Phaser.Scene {
      constructor() {
        super("MainScene");
        this.player = null;
        this.ground = null;
        this.score = 0;
        this.scoreText = null;
        this.gameOver = false;
      }

      preload() {
        // Placeholder colors — ready for real assets
        this.load.image("bg", "https://dummyimage.com/600x400/0a1a2f/ffffff");
        this.load.image("player", "https://dummyimage.com/50x50/00ff00/000000");
        this.load.image("obstacle", "https://dummyimage.com/40x60/ff0000/000000");
        this.load.image("coin", "https://dummyimage.com/30x30/f4d03f/000000");
      }

      create() {
        const { width, height } = this.scale;

        // Background
        this.add.image(0, 0, "bg")
          .setOrigin(0, 0)
          .setDisplaySize(width, height);

        // Ground FIRST (fixes falling glitch)
        this.ground = this.physics.add.staticGroup();
        this.ground.create(0, height - 40, "bg")
          .setOrigin(0, 0)
          .setDisplaySize(width, 40)
          .refreshBody();

        // Player
        this.player = this.physics.add.sprite(100, height - 120, "player");
        this.player.setCollideWorldBounds(true);
        this.player.setGravityY(900);

        this.physics.add.collider(this.player, this.ground);

        // Score text
        this.scoreText = this.add.text(20, 20, "Score: 0", {
          fontSize: "24px",
          fill: "#FFD700",
        });

        // Input
        this.input.on("pointerdown", () => {
          if (!this.gameOver && this.player.body.touching.down) {
            this.player.setVelocityY(-450);
          }
        });

        // Groups
        this.obstacles = this.physics.add.group();
        this.coins = this.physics.add.group();

        // Collisions
        this.physics.add.collider(this.obstacles, this.ground);
        this.physics.add.overlap(this.player, this.coins, this.collectCoin, null, this);
        this.physics.add.overlap(this.player, this.obstacles, this.hitObstacle, null, this);

        // Timers
        this.time.addEvent({
          delay: 1500,
          callback: this.spawnObstacle,
          callbackScope: this,
          loop: true,
        });

        this.time.addEvent({
          delay: 1200,
          callback: this.spawnCoin,
          callbackScope: this,
          loop: true,
        });
      }

      spawnObstacle() {
        if (this.gameOver) return;

        const { width, height } = this.scale;
        const obstacle = this.obstacles.create(width + 50, height - 80, "obstacle");
        obstacle.setVelocityX(-250);
        obstacle.setImmovable(true);
      }

      spawnCoin() {
        if (this.gameOver) return;

        const { width } = this.scale;
        const y = Phaser.Math.Between(150, 350);
        const coin = this.coins.create(width + 50, y, "coin");
        coin.setVelocityX(-200);
      }

      collectCoin(player, coin) {
        coin.destroy();
        this.score += 10;
        this.scoreText.setText("Score: " + this.score);
      }

      hitObstacle() {
        if (this.gameOver) return;

        this.gameOver = true;
        this.physics.pause();
        this.player.setTint(0xff0000);

        this.time.delayedCall(1200, () => {
          window.location.href = "/dashboard";
        });
      }

      update() {
        // Remove off‑screen objects
        this.obstacles.children.iterate((o) => {
          if (o && o.x < -50) o.destroy();
        });

        this.coins.children.iterate((c) => {
          if (c && c.x < -50) c.destroy();
        });
      }
    }

    const config = {
      type: Phaser.AUTO,
      width: window.innerWidth,
      height: window.innerHeight,
      parent: "phaser-container",
      physics: {
        default: "arcade",
        arcade: {
          gravity: { y: 0 },
          debug: false,
        },
      },
      scene: MainScene,
    };

    gameRef.current = new Phaser.Game(config);

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  return <div id="phaser-container" className="w-full h-full"></div>;
};

export default Game;
