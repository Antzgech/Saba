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
        this.obstacles = null;
        this.score = 0;
        this.scoreText = null;
        this.isGameOver = false;
        this.speed = 300;
      }

      create() {
        const { width, height } = this.scale;

        this.cameras.main.setBackgroundColor("#F5F5F5");

        // Ground (raised so it's visible)
        const groundY = height - 120;
        const ground = this.add.rectangle(width / 2, groundY + 20, width, 40, 0x888888);
        this.physics.add.existing(ground, true);

        // Dino
        this.dino = this.add.rectangle(120, groundY - 20, 40, 40, 0x333333);
        this.physics.add.existing(this.dino);
        this.dino.body.setGravityY(900);
        this.dino.body.setCollideWorldBounds(true);
        this.physics.add.collider(this.dino, ground);

        // Obstacles
        this.obstacles = this.physics.add.group();

        // Score
        this.scoreText = this.add.text(width - 150, 40, "Score: 0", {
          fontSize: "22px",
          color: "#333",
        });

        // Input
        this.input.keyboard.on("keydown-SPACE", this.jump, this);
        this.input.on("pointerdown", this.jump, this);

        // Spawn obstacles
        this.time.addEvent({
          delay: 1200,
          callback: this.spawnObstacle,
          callbackScope: this,
          loop: true,
        });

        // Score loop
        this.time.addEvent({
          delay: 100,
          callback: () => {
            if (this.isGameOver) return;
            this.score += 1;
            this.scoreText.setText("Score: " + this.score);
            this.speed = 300 + this.score * 0.5;
          },
          loop: true,
        });

        // Collision
        this.physics.add.collider(this.dino, this.obstacles, this.gameOver, null, this);
      }

      jump() {
        if (this.isGameOver) return;
        if (!this.dino.body.blocked.down) return;
        this.dino.body.setVelocityY(-500);
      }

      spawnObstacle() {
        if (this.isGameOver) return;

        const { width, height } = this.scale;
        const groundY = height - 120;

        const obs = this.add.rectangle(width + 20, groundY - 10, 20, 40, 0x006400);
        this.physics.add.existing(obs);
        obs.body.setVelocityX(-this.speed);
        obs.body.setImmovable(true);
        obs.body.allowGravity = false;

        this.obstacles.add(obs);
      }

      gameOver() {
        if (this.isGameOver) return;
        this.isGameOver = true;

        this.physics.pause();
        this.dino.setFillStyle(0xaa0000);

        const { width, height } = this.scale;

        this.add.text(width / 2, height / 2 - 40, "GAME OVER", {
          fontSize: "40px",
          color: "#333",
        }).setOrigin(0.5);

        const retryBtn = this.add.rectangle(width / 2, height / 2 + 20, 180, 50, 0xffffff)
          .setStrokeStyle(2, 0x333)
          .setInteractive();

        this.add.text(width / 2, height / 2 + 20, "Retry", {
          fontSize: "22px",
          color: "#333",
        }).setOrigin(0.5);

        retryBtn.on("pointerdown", () => {
          this.scene.restart();
        });
      }

      update() {
        if (this.isGameOver) return;

        this.obstacles.children.iterate((obs) => {
          if (obs && obs.x < -50) obs.destroy();
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
        arcade: { gravity: { y: 0 }, debug: false },
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
      style={{
        width: "100vw",
        height: "100vh",
        position: "fixed",
        top: 0,
        left: 0,
        overflow: "hidden",
        background: "#F5F5F5",
      }}
    />
  );
};

export default Game;
