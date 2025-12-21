import React, { useEffect, useRef } from "react";
import Phaser from "phaser";

const Game = ({ username: propUsername = "Player" }) => {
  const gameRef = useRef(null);

  useEffect(() => {
    if (gameRef.current) return;

    class DinoScene extends Phaser.Scene {
      constructor() {
        super("DinoScene");
        this.playerBody = null;
        this.playerEmoji = null;
        this.obstacles = null;
        this.coins = null;

        this.score = 0;
        this.coinCount = 0;
        this.distance = 0;
        this.level = 1;
        this.isGameOver = false;

        this.baseSpeed = 300;
        this.speed = this.baseSpeed;

        this.lastTap = 0;
        this.doubleTapWindow = 250;
      }

      preload() {}

      create() {
        const { width, height } = this.scale;

        // Try to get username from Telegram WebApp (TWA) if available
        const tg = window.Telegram?.WebApp;
        const twaUser = tg?.initDataUnsafe?.user?.username || tg?.initDataUnsafe?.user?.first_name;
        this.username = twaUser || propUsername || "Player";

        // Background
        this.cameras.main.setBackgroundColor("#F5F5F5");

        // Ground (raised so visible)
        this.groundY = height - 120;
        const ground = this.add.rectangle(width / 2, this.groundY + 20, width, 40, 0x8b8b8b);
        this.physics.add.existing(ground, true);

        // Player physics body (invisible rectangle)
        this.playerBody = this.add.rectangle(120, this.groundY - 20, 40, 48, 0x000000, 0);
        this.physics.add.existing(this.playerBody);
        this.playerBody.body.setGravityY(900);
        this.playerBody.body.setCollideWorldBounds(true);
        this.physics.add.collider(this.playerBody, ground);

        // Player emoji visual (soldier)
        this.playerEmoji = this.add.text(this.playerBody.x, this.playerBody.y - 10, "🪖", {
          fontSize: "40px",
        }).setOrigin(0.5);

        // UI bar (top)
        const uiWidth = width * 0.96;
        this.add.rectangle(width / 2, 36, uiWidth, 64, 0xffffff, 0.25).setStrokeStyle(2, 0xffffff, 0.4);

        this.usernameText = this.add.text(18, 18, `User: ${this.username}`, {
          fontSize: "16px",
          color: "#000",
          fontFamily: "system-ui, sans-serif",
        });

        this.scoreText = this.add.text(width / 2 - 80, 18, `Score: ${this.score}`, {
          fontSize: "16px",
          color: "#000",
        });

        this.coinsText = this.add.text(width / 2 + 40, 18, `Coins: ${this.coinCount}`, {
          fontSize: "16px",
          color: "#000",
        });

        this.levelText = this.add.text(width - 140, 18, `Level: ${this.level}`, {
          fontSize: "16px",
          color: "#000",
        });

        this.timeText = this.add.text(width / 2 - 80, 40, `Time: 0s`, {
          fontSize: "12px",
          color: "#000",
        });

        // Groups
        this.obstacles = this.physics.add.group();
        this.coins = this.physics.add.group();

        // Input
        this.input.keyboard.on("keydown-SPACE", this.handleJump, this);
        this.input.on("pointerdown", this.handleTap, this);

        // Collisions
        this.physics.add.collider(this.playerBody, this.obstacles, this.handleHit, null, this);
        this.physics.add.overlap(this.playerBody, this.coins, this.collectCoin, null, this);

        // Timers: spawn obstacles and coins, update score/distance/time
        this.time.addEvent({
          delay: 1200,
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

        this.startTime = Date.now();
        this.time.addEvent({
          delay: 200,
          callback: () => {
            if (this.isGameOver) return;
            this.distance += 1;
            this.score += 1;
            this.scoreText.setText(`Score: ${this.score}`);
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            this.timeText.setText(`Time: ${elapsed}s`);
            this.updateLevelAndSpeed();
          },
          loop: true,
        });
      }

      // Input handlers
      handleTap() {
        const now = Date.now();
        if (now - this.lastTap <= this.doubleTapWindow) {
          // double tap: no special power here, but could be extended
          // keep as jump for now
          this.handleJump();
        } else {
          this.handleJump();
        }
        this.lastTap = now;
      }

      handleJump() {
        if (this.isGameOver) return;
        if (!this.playerBody.body.blocked.down) return;
        this.playerBody.body.setVelocityY(-520);
        // change emoji briefly to jumping pose
        this.playerEmoji.setText("🤸‍♂️");
        this.time.delayedCall(300, () => {
          if (!this.isGameOver && this.playerBody.body.blocked.down) {
            this.playerEmoji.setText("🪖");
          }
        });
      }

      // Spawn obstacle (stone) with emoji
      spawnObstacle() {
        if (this.isGameOver) return;
        const { width } = this.scale;
        const groundY = this.groundY;

        // obstacle body
        const obsBody = this.add.rectangle(width + 40, groundY - 12, 36, 36, 0x000000, 0);
        this.physics.add.existing(obsBody);
        obsBody.body.setImmovable(true);
        obsBody.body.allowGravity = false;
        obsBody.body.setVelocityX(-this.speed);

        // emoji visual (stone)
        const obsEmoji = this.add.text(obsBody.x, obsBody.y - 6, "🪨", { fontSize: "28px" }).setOrigin(0.5);
        obsBody.emoji = obsEmoji;

        this.obstacles.add(obsBody);
      }

      // Spawn coin with emoji
      spawnCoin() {
        if (this.isGameOver) return;
        const { width } = this.scale;
        const y = Phaser.Math.Between(180, this.groundY - 80);

        const coinBody = this.add.rectangle(width + 40, y, 20, 20, 0x000000, 0);
        this.physics.add.existing(coinBody);
        coinBody.body.allowGravity = false;
        coinBody.body.setVelocityX(-this.speed);

        const coinEmoji = this.add.text(coinBody.x, coinBody.y - 6, "🪙", { fontSize: "22px" }).setOrigin(0.5);
        coinBody.emoji = coinEmoji;

        this.coins.add(coinBody);
      }

      // Collect coin
      collectCoin(playerBody, coinBody) {
        if (!coinBody) return;
        if (coinBody.emoji) coinBody.emoji.destroy();
        coinBody.destroy();
        this.coinCount += 1;
        this.coinsText.setText(`Coins: ${this.coinCount}`);
        // small score bonus
        this.score += 5;
        this.scoreText.setText(`Score: ${this.score}`);
      }

      // Hit obstacle
      handleHit() {
        if (this.isGameOver) return;
        this.isGameOver = true;
        this.physics.pause();
        this.playerEmoji.setText("💥");

        const { width, height } = this.scale;
        this.add.text(width / 2, height / 2 - 60, "GAME OVER", {
          fontSize: "40px",
          color: "#333",
        }).setOrigin(0.5);

        const retryRect = this.add.rectangle(width / 2, height / 2 + 10, 200, 56, 0xffffff)
          .setStrokeStyle(2, 0x333333)
          .setInteractive();

        this.add.text(width / 2, height / 2 + 10, "Retry", {
          fontSize: "22px",
          color: "#333",
        }).setOrigin(0.5);

        retryRect.on("pointerdown", () => {
          this.scene.restart();
        });
      }

      updateLevelAndSpeed() {
        // Level increases every 100 distance units
        const newLevel = Math.floor(this.distance / 100) + 1;
        if (newLevel !== this.level) {
          this.level = newLevel;
          this.levelText.setText(`Level: ${this.level}`);
        }
        // speed scales with score/distance
        this.speed = this.baseSpeed + this.distance * 0.6;
      }

      update() {
        if (this.isGameOver) return;

        // Sync visuals to physics bodies
        if (this.playerBody && this.playerEmoji) {
          this.playerEmoji.setPosition(this.playerBody.x, this.playerBody.y - 10);
          // if on ground and not jumping, ensure soldier emoji
          if (this.playerBody.body.blocked.down && this.playerEmoji.text !== "🪖") {
            this.playerEmoji.setText("🪖");
          }
        }

        // Move obstacle and coin emojis with their bodies and cleanup off-screen
        this.obstacles.children.iterate((o) => {
          if (!o) return;
          if (o.emoji) o.emoji.setPosition(o.x, o.y - 6);
          if (o.x < -100) {
            if (o.emoji) o.emoji.destroy();
            o.destroy();
          } else if (o.body) {
            o.body.setVelocityX(-this.speed);
          }
        });

        this.coins.children.iterate((c) => {
          if (!c) return;
          if (c.emoji) c.emoji.setPosition(c.x, c.y - 6);
          if (c.x < -100) {
            if (c.emoji) c.emoji.destroy();
            c.destroy();
          } else if (c.body) {
            c.body.setVelocityX(-this.speed);
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
  }, [propUsername]);

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
      }}
    />
  );
};

export default Game;
