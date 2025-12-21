import React, { useEffect, useRef } from "react";
import Phaser from "phaser";

const Game = ({ username = "Traveler" }) => {
  const gameRef = useRef(null);

  useEffect(() => {
    if (gameRef.current) return;

    class MainScene extends Phaser.Scene {
      constructor() {
        super("MainScene");

        this.playerBody = null;      // physics body
        this.playerEmoji = null;     // visual emoji
        this.playerState = "idle";   // idle | run | jump | power

        this.score = 0;
        this.distance = 0;
        this.level = 1;
        this.powerUnlocked = false;
        this.isGameOver = false;

        this.startTime = 0;
        this.lastTap = 0;
        this.doubleTapWindow = 250; // ms

        this.obstacles = null;
        this.coins = null;
      }

      preload() {}

      create() {
        const { width, height } = this.scale;

        // Sky background
        this.cameras.main.setBackgroundColor("#E3F2FD");

        // Ground (like Chrome Dino)
        this.ground = this.add.rectangle(width / 2, height - 60, width, 40, 0x8b5a2b);
        this.physics.add.existing(this.ground, true);

        // Player physics body (invisible rectangle)
        this.playerBody = this.add.rectangle(120, height - 120, 40, 60, 0x000000, 0);
        this.physics.add.existing(this.playerBody);
        this.playerBody.body.setGravityY(900);
        this.playerBody.body.setCollideWorldBounds(true);
        this.physics.add.collider(this.playerBody, this.ground);

        // Player visual emoji
        this.playerEmoji = this.add.text(this.playerBody.x, this.playerBody.y - 10, "🧍‍♂️", {
          fontSize: "40px",
        }).setOrigin(0.5);

        // UI bar (glassy feel)
        const uiWidth = width * 0.94;
        this.add.rectangle(width / 2, 40, uiWidth, 56, 0xffffff, 0.25)
          .setStrokeStyle(2, 0xffffff, 0.4);

        this.usernameText = this.add.text(24, 20, username, {
          fontSize: "18px",
          color: "#000",
          fontFamily: "system-ui, sans-serif",
        });

        this.scoreText = this.add.text(width / 2 - 60, 20, "Score: 0", {
          fontSize: "18px",
          color: "#000",
        });

        this.levelText = this.add.text(width - 140, 20, "Level: 1", {
          fontSize: "18px",
          color: "#000",
        });

        this.timeText = this.add.text(width / 2 - 60, 42, "Time: 0s", {
          fontSize: "14px",
          color: "#000",
        });

        // Groups
        this.obstacles = this.physics.add.group();
        this.coins = this.physics.add.group();

        // Input
        this.input.on("pointerdown", this.handleTap, this);
        this.input.keyboard.on("keydown-SPACE", this.jump, this);

        // Collisions
        this.physics.add.overlap(this.playerBody, this.coins, this.collectCoin, null, this);
        this.physics.add.collider(this.playerBody, this.obstacles, this.hitObstacle, null, this);

        // Start
        this.startTime = Date.now();
        this.startRun();
        this.setupTimers();
      }

      setupTimers() {
        // Spawn obstacles
        this.time.addEvent({
          delay: 1200,
          callback: this.spawnObstacle,
          callbackScope: this,
          loop: true,
        });

        // Spawn coins
        this.time.addEvent({
          delay: 900,
          callback: this.spawnCoin,
          callbackScope: this,
          loop: true,
        });

        // Distance + time updater
        this.time.addEvent({
          delay: 200,
          callback: () => {
            if (this.isGameOver) return;
            this.distance += 1;
            const elapsedSec = Math.floor((Date.now() - this.startTime) / 1000);
            this.timeText.setText(`Time: ${elapsedSec}s`);
            this.updateDifficulty();
          },
          loop: true,
        });
      }

      // --------------------
      // STATE / ANIMATIONS
      // --------------------

      startRun() {
        this.playerState = "run";
        this.playerEmoji.setText("🏃‍♂️");
      }

      jump() {
        if (this.isGameOver) return;
        if (!this.playerBody.body.blocked.down) return;

        this.playerState = "jump";
        this.playerBody.body.setVelocityY(-520);
        this.playerEmoji.setText("🤸‍♂️");
      }

      activatePower() {
        if (!this.powerUnlocked || this.isGameOver) return;

        this.playerState = "power";
        this.playerEmoji.setText("🦸‍♂️");

        // Temporary invincibility
        this.time.delayedCall(1500, () => {
          if (!this.isGameOver) this.startRun();
        });
      }

      // --------------------
      // INPUT
      // --------------------

      handleTap() {
        const now = Date.now();

        // double tap = power
        if (now - this.lastTap <= this.doubleTapWindow) {
          this.activatePower();
        } else {
          this.jump();
        }

        this.lastTap = now;
      }

      // --------------------
      // SPAWN LOGIC
      // --------------------

      spawnObstacle() {
        if (this.isGameOver) return;
        const { width, height } = this.scale;

        // 1 = rock, 2 = web
        const type = Phaser.Math.Between(1, 2);

        let obsBody;
        let emoji;

        if (type === 1) {
          // Rock
          obsBody = this.add.rectangle(width + 40, height - 100, 50, 40, 0x000000, 0);
          emoji = this.add.text(obsBody.x, obsBody.y - 5, "🪨", {
            fontSize: "32px",
          }).setOrigin(0.5);
        } else {
          // Web
          obsBody = this.add.rectangle(width + 40, height - 120, 50, 50, 0x000000, 0);
          emoji = this.add.text(obsBody.x, obsBody.y - 5, "🕸️", {
            fontSize: "32px",
          }).setOrigin(0.5);
        }

        this.physics.add.existing(obsBody);
        obsBody.body.setImmovable(true);
        obsBody.body.allowGravity = false;
        obsBody.body.setVelocityX(-250 - this.distance); // faster with distance

        obsBody.emoji = emoji; // link for cleanup
        this.obstacles.add(obsBody);
      }

      spawnCoin() {
        if (this.isGameOver) return;
        const { width } = this.scale;

        const y = Phaser.Math.Between(180, this.scale.height - 160);

        const coinBody = this.add.rectangle(width + 40, y, 20, 20, 0x000000, 0);
        const emoji = this.add.text(coinBody.x, coinBody.y - 5, "🪙", {
          fontSize: "24px",
        }).setOrigin(0.5);

        this.physics.add.existing(coinBody);
        coinBody.body.allowGravity = false;
        coinBody.body.setVelocityX(-220 - this.distance);

        coinBody.emoji = emoji;
        this.coins.add(coinBody);
      }

      // --------------------
      // DIFFICULTY / LEVEL
      // --------------------

      updateDifficulty() {
        // Level up at 100m (unlock power)
        if (this.distance >= 100 && !this.powerUnlocked) {
          this.powerUnlocked = true;
          this.level = 2;
          this.levelText.setText("Level: 2");
        }

        // Every 10m: slightly ramp difficulty (already baked into speeds)
        if (this.distance % 10 === 0) {
          // you can add extra tweaks here if you want
        }
      }

      // --------------------
      // COLLISIONS
      // --------------------

      collectCoin(playerBody, coinBody) {
        if (coinBody.emoji) coinBody.emoji.destroy();
        coinBody.destroy();

        this.score += 10;
        this.scoreText.setText(`Score: ${this.score}`);
      }

      hitObstacle(playerBody, obsBody) {
        if (this.isGameOver) return;
        if (this.playerState === "power") return; // invincible in power mode

        this.isGameOver = true;
        this.physics.pause();

        // Clean up obstacle emojis
        this.obstacles.children.iterate((o) => {
          if (o && o.emoji) o.emoji.setAlpha(0.3);
        });

        const { width, height } = this.scale;

        this.add.text(width / 2, height / 2 - 60, "Game Over", {
          fontSize: "42px",
          color: "#000",
        }).setOrigin(0.5);

        // Retry
        const retryRect = this.add.rectangle(width / 2, height / 2 + 10, 180, 50, 0xffffff, 0.9)
          .setInteractive();
        this.add.text(width / 2, height / 2 + 10, "Retry", {
          fontSize: "22px",
          color: "#000",
        }).setOrigin(0.5);

        retryRect.on("pointerdown", () => {
          this.scene.restart({ username: this.usernameFromProps });
        });
      }

      // --------------------
      // UPDATE LOOP
      // --------------------

      update() {
        if (this.isGameOver) return;

        // Keep player emoji following physics body
        this.playerEmoji.setPosition(this.playerBody.x, this.playerBody.y - 10);

        // If finished jump, go back to run
        if (this.playerState === "jump" && this.playerBody.body.blocked.down) {
          this.startRun();
        }

        // Remove off-screen obstacles and coins
        this.obstacles.children.iterate((o) => {
          if (o && o.x < -80) {
            if (o.emoji) o.emoji.destroy();
            o.destroy();
          }
        });

        this.coins.children.iterate((c) => {
          if (c && c.x < -80) {
            if (c.emoji) c.emoji.destroy();
            c.destroy();
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
      scene: MainScene,
    };

    gameRef.current = new Phaser.Game(config);

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [username]);

  return (
    <div
      id="phaser-container"
      style={{
        width: "100%",
        height: "100vh",
        overflow: "hidden",
      }}
    />
  );
};

export default Game;
