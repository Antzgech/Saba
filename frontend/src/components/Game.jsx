import React, { useEffect, useRef } from "react";
import Phaser from "phaser";

const Game = () => {
  const gameRef = useRef(null);

  useEffect(() => {
    if (gameRef.current) return;

    class DinoScene extends Phaser.Scene {
      constructor() {
        super("DinoScene");
        this.dino = null;
        this.ground = null;
        this.obstacles = null;
        this.score = 0;
        this.scoreText = null;
        this.isGameOver = false;
        this.gameSpeed = 300; // base speed
      }

      preload() {}

      create() {
        const { width, height } = this.scale;

        // Sky background
        this.cameras.main.setBackgroundColor("#EDEFF1");

        // Ground line
        const groundY = height - 80;
        this.ground = this.add.rectangle(width / 2, groundY + 20, width, 40, 0x8b8b8b);
        this.physics.add.existing(this.ground, true);

        // Dino (rectangle)
        this.dino = this.add.rectangle(120, groundY - 20, 40, 40, 0x333333);
        this.physics.add.existing(this.dino);
        this.dino.body.setGravityY(900);
        this.dino.body.setCollideWorldBounds(true);
        this.physics.add.collider(this.dino, this.ground);

        // Obstacles group
        this.obstacles = this.physics.add.group();

        // Score
        this.score = 0;
        this.scoreText = this.add.text(width - 150, 40, "Score: 0", {
          fontSize: "20px",
          color: "#333333",
        });

        // Collisions
        this.physics.add.collider(this.dino, this.obstacles, this.handleGameOver, null, this);

        // Input: space or tap = jump
        this.input.keyboard.on("keydown-SPACE", this.jump, this);
        this.input.on("pointerdown", this.jump, this);

        // Spawn obstacles
        this.time.addEvent({
          delay: 1400,
          callback: this.spawnObstacle,
          callbackScope: this,
          loop: true,
        });

        // Increase score over time
        this.time.addEvent({
          delay: 100,
          callback: () => {
            if (this.isGameOver) return;
            this.score += 1;
            this.scoreText.setText("Score: " + this.score);
            // slightly increase speed as score increases
            this.gameSpeed = 300 + this.score * 0.5;
          },
          loop: true,
        });
      }

      jump() {
        if (this.isGameOver) return;
        if (!this.dino.body.blocked.down) return;
        this.dino.body.setVelocityY(-480);
      }

      spawnObstacle() {
        if (this.isGameOver) return;

        const { width, height } = this.scale;
        const groundY = height - 80;

        // Simple cactus (just a thin rectangle)
        const obstacle = this.add.rectangle(width + 20, groundY - 10, 20, 40, 0x006400);
        this.physics.add.existing(obstacle);
        obstacle.body.setImmovable(true);
        obstacle.body.allowGravity = false;
        obstacle.body.setVelocityX(-this.gameSpeed);

        this.obstacles.add(obstacle);
      }

      handleGameOver() {
        if (this.isGameOver) return;
        this.isGameOver = true;
        this.physics.pause();
        this.dino.setFillStyle(0xaa0000);

        const { width, height } = this.scale;

        this.add.text(width / 2, height / 2 - 30, "GAME OVER", {
          fontSize: "36px",
          color: "#333333",
        }).setOrigin(0.5);

        const retryButton = this.add.rectangle(width / 2, height / 2 + 30, 180, 50, 0xffffff)
          .setStrokeStyle(2, 0x333333)
          .setInteractive();

        this.add.text(width / 2, height / 2 + 30, "Retry", {
          fontSize: "20px",
          color: "#333333",
        }).setOrigin(0.5);

        retryButton.on("pointerdown", () => {
          this.scene.restart();
        });
      }

      update() {
        if (this.isGameOver) return;

        // Remove off-screen obstacles
        this.obstacles.children.iterate((obs) => {
          if (obs && obs.x < -50) {
            obs.destroy();
          }
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
      scene: DinoScene,
    };

    gameRef.current = new Phaser.Game(config);

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  return (
    <div
      id="phaser-container"
      style={{ width: "100%", height: "100vh", overflow: "hidden" }}
    />
  );
};

export default Game;
