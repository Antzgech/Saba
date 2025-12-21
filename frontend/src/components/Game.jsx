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
        this.score = 0;
        this.scoreText = null;
        this.gameOver = false;
        this.started = false;
      }

      preload() {}

      create() {
        const { width, height } = this.scale;

        // Sky background
        this.cameras.main.setBackgroundColor("#87CEEB");

        // Ground
        this.ground = this.add.rectangle(width / 2, height - 60, width, 60, 0x8B4513);
        this.physics.add.existing(this.ground, true);

        // Player (runner)
        this.player = this.add.rectangle(120, height - 120, 40, 60, 0x000000);
        this.physics.add.existing(this.player);
        this.player.body.setCollideWorldBounds(true);
        this.player.body.setGravityY(900);

        this.physics.add.collider(this.player, this.ground);

        // Score
        this.scoreText = this.add.text(20, 20, "Score: 0", {
          fontSize: "24px",
          color: "#000",
        });

        // Groups
        this.obstacles = this.physics.add.group();
        this.coins = this.physics.add.group();

        // Collisions
        this.physics.add.overlap(this.player, this.coins, this.collectCoin, null, this);
        this.physics.add.collider(this.player, this.obstacles, this.hitObstacle, null, this);

        // Input
        this.input.on("pointerdown", this.jump, this);
        this.input.keyboard.on("keydown-SPACE", this.jump, this);

        // Intro screen
        this.showIntro();
      }

      showIntro() {
        const { width, height } = this.scale;

        this.introText = this.add.text(width / 2, height / 2 - 60, "Simple Run", {
          fontSize: "48px",
          color: "#000",
        }).setOrigin(0.5);

        this.startButton = this.add.rectangle(width / 2, height / 2 + 20, 200, 60, 0xffffff)
          .setInteractive();

        this.startLabel = this.add.text(width / 2, height / 2 + 20, "Start", {
          fontSize: "24px",
          color: "#000",
        }).setOrigin(0.5);

        this.startButton.on("pointerdown", () => this.startGame());
      }

      startGame() {
        this.started = true;

        this.introText.destroy();
        this.startButton.destroy();
        this.startLabel.destroy();

        // Spawn loops
        this.obstacleTimer = this.time.addEvent({
          delay: 1400,
          callback: this.spawnObstacle,
          callbackScope: this,
          loop: true,
        });

        this.coinTimer = this.time.addEvent({
          delay: 1000,
          callback: this.spawnCoin,
          callbackScope: this,
          loop: true,
        });
      }

      jump() {
        if (!this.started || this.gameOver) return;
        if (this.player.body.blocked.down) {
          this.player.body.setVelocityY(-500);
        }
      }

      spawnObstacle() {
        if (!this.started || this.gameOver) return;

        const { width, height } = this.scale;

        const obs = this.add.rectangle(width + 40, height - 100, 40, 60, 0xff0000);
        this.physics.add.existing(obs);
        obs.body.setVelocityX(-300);
        obs.body.setImmovable(true);
        obs.body.allowGravity = false;

        this.obstacles.add(obs);
      }

      spawnCoin() {
        if (!this.started || this.gameOver) return;

        const { width } = this.scale;

        const y = Phaser.Math.Between(150, 350);
        const coin = this.add.circle(width + 40, y, 12, 0xFFD700);
        this.physics.add.existing(coin);
        coin.body.setVelocityX(-250);
        coin.body.allowGravity = false;

        this.coins.add(coin);
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

        this.showGameOver();
      }

      showGameOver() {
        const { width, height } = this.scale;

        this.gameOverText = this.add.text(width / 2, height / 2 - 80, "Game Over", {
          fontSize: "48px",
          color: "#000",
        }).setOrigin(0.5);

        // Retry button
        this.retryButton = this.add.rectangle(width / 2, height / 2, 200, 60, 0xffffff)
          .setInteractive();
        this.retryLabel = this.add.text(width / 2, height / 2, "Retry", {
          fontSize: "24px",
          color: "#000",
        }).setOrigin(0.5);

        this.retryButton.on("pointerdown", () => this.scene.restart());

        // Dashboard button
        this.dashboardButton = this.add.rectangle(width / 2, height / 2 + 80, 200, 60, 0xffffff)
          .setInteractive();
        this.dashboardLabel = this.add.text(width / 2, height / 2 + 80, "Dashboard", {
          fontSize: "24px",
          color: "#000",
        }).setOrigin(0.5);

        this.dashboardButton.on("pointerdown", () => {
          window.location.href = "/dashboard";
        });
      }

      update() {
        if (!this.started || this.gameOver) return;

        // Remove off-screen objects
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
