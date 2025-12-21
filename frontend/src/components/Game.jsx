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
        this.playerState = "idle"; // idle, run, jump, power
        this.score = 0;
        this.distance = 0;
        this.level = 1;
        this.powerUnlocked = false;

        this.lastTap = 0;
        this.tapDelay = 250; // double tap window
      }

      preload() {}

      create() {
        const { width, height } = this.scale;

        this.cameras.main.setBackgroundColor("#87CEEB");

        // Ground
        this.ground = this.add.rectangle(width / 2, height - 60, width, 60, 0x8B4513);
        this.physics.add.existing(this.ground, true);

        // Player (rectangle)
        this.player = this.add.rectangle(120, height - 120, 40, 60, 0x000000);
        this.physics.add.existing(this.player);
        this.player.body.setGravityY(900);
        this.player.body.setCollideWorldBounds(true);
        this.physics.add.collider(this.player, this.ground);

        // Groups
        this.obstacles = this.physics.add.group();
        this.coins = this.physics.add.group();

        // UI
        this.scoreText = this.add.text(20, 20, "Score: 0", { fontSize: "20px", color: "#000" });
        this.distanceText = this.add.text(20, 50, "Distance: 0m", { fontSize: "20px", color: "#000" });
        this.levelText = this.add.text(20, 80, "Level: 1", { fontSize: "20px", color: "#000" });

        // Input
        this.input.on("pointerdown", this.handleTap, this);
        this.input.keyboard.on("keydown-SPACE", this.jump, this);

        // Start running immediately
        this.startRun();

        // Spawn loops
        this.time.addEvent({
          delay: 1400,
          callback: this.spawnObstacle,
          callbackScope: this,
          loop: true,
        });

        this.time.addEvent({
          delay: 900,
          callback: this.spawnCoin,
          callbackScope: this,
          loop: true,
        });

        // Distance counter
        this.time.addEvent({
          delay: 200,
          callback: () => {
            if (!this.gameOver) {
              this.distance += 1;
              this.distanceText.setText(`Distance: ${this.distance}m`);
              this.updateDifficulty();
            }
          },
          loop: true,
        });
      }

      // -------------------------
      // ANIMATION STATE MACHINE
      // -------------------------

      startRun() {
        this.playerState = "run";
        this.player.setFillStyle(0x000000);
      }

      idle() {
        this.playerState = "idle";
        this.player.setFillStyle(0x444444);
      }

      jump() {
        if (this.playerState === "jump" || this.gameOver) return;

        if (this.player.body.blocked.down) {
          this.playerState = "jump";
          this.player.body.setVelocityY(-520);
          this.player.setFillStyle(0x2222ff);
        }
      }

      activatePower() {
        if (!this.powerUnlocked) return;

        this.playerState = "power";
        this.player.setFillStyle(0xff0000);

        // Temporary invincibility
        this.time.delayedCall(1500, () => {
          this.startRun();
        });
      }

      // -------------------------
      // INPUT HANDLING
      // -------------------------

      handleTap() {
        const now = Date.now();

        // Double tap = power
        if (now - this.lastTap < this.tapDelay) {
          this.activatePower();
        } else {
          this.jump();
        }

        this.lastTap = now;
      }

      // -------------------------
      // SPAWNING
      // -------------------------

      spawnObstacle() {
        if (this.gameOver) return;

        const { width, height } = this.scale;

        const hardness = Math.min(1 + this.distance / 50, 4); // increases every 10m

        const obs = this.add.rectangle(
          width + 40,
          height - 100,
          40 * hardness,
          60,
          0xff0000
        );

        this.physics.add.existing(obs);
        obs.body.setVelocityX(-200 - this.distance * 1.2);
        obs.body.allowGravity = false;
        obs.body.setImmovable(true);

        this.obstacles.add(obs);

        this.physics.add.collider(this.player, obs, () => this.hitObstacle());
      }

      spawnCoin() {
        if (this.gameOver) return;

        const { width } = this.scale;

        const y = Phaser.Math.Between(150, 350);

        const coin = this.add.circle(width + 40, y, 12, 0xFFD700);
        this.physics.add.existing(coin);
        coin.body.setVelocityX(-250 - this.distance);
        coin.body.allowGravity = false;

        this.coins.add(coin);

        this.physics.add.overlap(this.player, coin, () => {
          coin.destroy();
          this.score += 10;
          this.scoreText.setText(`Score: ${this.score}`);
        });
      }

      // -------------------------
      // DIFFICULTY + LEVELS
      // -------------------------

      updateDifficulty() {
        if (this.distance >= 100 && !this.powerUnlocked) {
          this.powerUnlocked = true;
          this.level = 2;
          this.levelText.setText("Level: 2 (Power Unlocked)");
        }

        if (this.distance % 10 === 0) {
          // Harder obstacles every 10m
        }
      }

      // -------------------------
      // GAME OVER
      // -------------------------

      hitObstacle() {
        if (this.playerState === "power") return; // invincible

        this.gameOver = true;
        this.physics.pause();

        this.add.text(this.scale.width / 2, this.scale.height / 2 - 40, "Game Over", {
          fontSize: "48px",
          color: "#000",
        }).setOrigin(0.5);

        const retry = this.add.rectangle(this.scale.width / 2, this.scale.height / 2 + 20, 200, 60, 0xffffff)
          .setInteractive();
        this.add.text(this.scale.width / 2, this.scale.height / 2 + 20, "Retry", {
          fontSize: "24px",
          color: "#000",
        }).setOrigin(0.5);

        retry.on("pointerdown", () => this.scene.restart());
      }

      update() {
        if (this.gameOver) return;

        // Remove off-screen objects
        this.obstacles.children.iterate((o) => {
          if (o && o.x < -50) o.destroy();
        });

        this.coins.children.iterate((c) => {
          if (c && c.x < -50) c.destroy();
        });

        // Reset animation when landing
        if (this.playerState === "jump" && this.player.body.blocked.down) {
          this.startRun();
        }
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
