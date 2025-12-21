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
        this.baseSpeed = 300;
        this.speed = this.baseSpeed;
      }

      preload() {}

      create() {
        const { width, height } = this.scale;

        // Ensure canvas fills the screen and is visible
        this.cameras.main.setBackgroundColor("#F5F5F5");

        // Ground (raised so it's visible on most screens)
        this.groundY = height - 120;
        const ground = this.add.rectangle(width / 2, this.groundY + 20, width, 40, 0x8b8b8b);
        this.physics.add.existing(ground, true); // static body

        // Dino (player) - rectangle with physics body
        this.dino = this.add.rectangle(120, this.groundY - 20, 40, 40, 0x333333);
        this.physics.add.existing(this.dino);
        this.dino.body.setGravityY(900);
        this.dino.body.setCollideWorldBounds(true);
        this.physics.add.collider(this.dino, ground);

        // Obstacles group
        this.obstacles = this.physics.add.group();

        // Score UI
        this.score = 0;
        this.scoreText = this.add.text(width - 160, 28, "Score: 0", {
          fontSize: "20px",
          color: "#333333",
        });

        // Input: space or tap to jump
        this.input.keyboard.on("keydown-SPACE", this.jump, this);
        this.input.on("pointerdown", this.jump, this);

        // Spawn obstacles periodically
        this.time.addEvent({
          delay: 1400,
          callback: this.spawnObstacle,
          callbackScope: this,
          loop: true,
        });

        // Score and speed updater
        this.time.addEvent({
          delay: 100,
          callback: () => {
            if (this.isGameOver) return;
            this.score += 1;
            this.scoreText.setText("Score: " + this.score);
            // speed scales gently with score
            this.speed = this.baseSpeed + this.score * 0.5;
          },
          loop: true,
        });

        // Collision detection between dino and obstacles
        this.physics.add.collider(this.dino, this.obstacles, this.handleGameOver, null, this);
      }

      jump() {
        if (this.isGameOver) return;
        // only jump if on ground
        if (!this.dino.body.blocked.down) return;
        this.dino.body.setVelocityY(-500);
      }

      spawnObstacle() {
        if (this.isGameOver) return;

        const { width } = this.scale;

        // Randomize obstacle type and size
        const type = Phaser.Math.Between(1, 3); // 1: small cactus, 2: tall cactus, 3: double cactus
        let w = 20;
        let h = 40;
        if (type === 2) {
          w = 24;
          h = 56;
        } else if (type === 3) {
          w = 36;
          h = 48;
        }

        // Create rectangle and enable physics
        const obs = this.add.rectangle(width + 40, this.groundY - (h / 2), w, h, 0x006400);
        this.physics.add.existing(obs);
        obs.body.setImmovable(true);
        obs.body.allowGravity = false;
        obs.body.setVelocityX(-this.speed);

        // Add to group so collider and cleanup work
        this.obstacles.add(obs);
      }

      handleGameOver() {
        if (this.isGameOver) return;
        this.isGameOver = true;

        // Pause physics and show game over UI
        this.physics.pause();
        this.dino.setFillStyle(0xaa0000);

        const { width, height } = this.scale;

        this.add.text(width / 2, height / 2 - 60, "GAME OVER", {
          fontSize: "40px",
          color: "#333333",
        }).setOrigin(0.5);

        const retryRect = this.add.rectangle(width / 2, height / 2 + 10, 200, 56, 0xffffff)
          .setStrokeStyle(2, 0x333333)
          .setInteractive();

        this.add.text(width / 2, height / 2 + 10, "Retry", {
          fontSize: "22px",
          color: "#333333",
        }).setOrigin(0.5);

        retryRect.on("pointerdown", () => {
          this.scene.restart();
        });
      }

      update() {
        if (this.isGameOver) return;

        // Remove off-screen obstacles
        this.obstacles.children.iterate((obs) => {
          if (obs && obs.x < -100) {
            obs.destroy();
          } else if (obs && obs.body) {
            // keep obstacle velocity synced with current speed (in case speed changed)
            obs.body.setVelocityX(-this.speed);
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

  // Ensure the container fills the viewport and isn't covered by other layout elements
  return (
    <div
      id="phaser-container"
      style={{
        width: "100vw",
        height: "100vh",
        position: "fixed",
        top: 0,
        left: 0,
        margin: 0,
        padding: 0,
        overflow: "hidden",
        background: "#F5F5F5",
        zIndex: 9999,
      }}
    />
  );
};

export default Game;
