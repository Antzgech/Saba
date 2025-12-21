import React, { useEffect, useRef } from "react";
import Phaser from "phaser";

const Game = ({ username: propUsername = "Player" }) => {
  const gameRef = useRef(null);

  useEffect(() => {
    if (gameRef.current) return;

    class RunnerScene extends Phaser.Scene {
      constructor() {
        super("RunnerScene");

        // Player
        this.playerBody = null;
        this.playerEmoji = null;

        // Groups
        this.obstacles = null;
        this.coins = null;

        // UI state
        this.username = propUsername;
        this.coinCount = 0;
        this.level = 1;
        this.startTime = 0;
        this.elapsedSeconds = 0;

        // Gameplay state
        this.isRunning = false; // true while user holds pointer (or hold key)
        this.isGameOver = false;
        this.baseSpeed = 300;
        this.speed = this.baseSpeed;

        // Input / double-tap
        this.lastTap = 0;
        this.doubleTapWindow = 250; // ms

        // Retry timing rules
        // - After game over, player has a 20s window to retry once.
        // - If they use that retry, the next retry is allowed only after 60s from when they used it.
        // We'll persist lastRetryUsedAt in localStorage so it survives reloads.
        this.gameOverTime = null;
        this.retryKey = "runner_lastRetryUsedAt";
      }

      preload() {}

      create() {
        const { width, height } = this.scale;

        // Try to read Telegram WebApp username if available
        try {
          const tg = window.Telegram?.WebApp;
          const twaUser = tg?.initDataUnsafe?.user?.username || tg?.initDataUnsafe?.user?.first_name;
          if (twaUser) this.username = twaUser;
        } catch (e) {
          // ignore
        }

        // Background
        this.cameras.main.setBackgroundColor("#F5F5F5");

        // Ground (raised so visible)
        this.groundY = height - 120;
        const ground = this.add.rectangle(width / 2, this.groundY + 20, width, 40, 0x8b8b8b);
        this.physics.add.existing(ground, true);

        // Player physics body (larger, proportional)
        const playerW = 90;
        const playerH = 120;
        this.playerBody = this.add.rectangle(140, this.groundY - playerH / 2, playerW, playerH, 0x000000, 0);
        this.physics.add.existing(this.playerBody);
        this.playerBody.body.setGravityY(1400);
        this.playerBody.body.setCollideWorldBounds(true);
        this.physics.add.collider(this.playerBody, ground);

        // Player emoji visual (stand/run/jump)
        // stand = 🧍‍♂️, run = 🚶‍♂️, jump = 🏃‍♂️
        this.playerEmoji = this.add
          .text(this.playerBody.x, this.playerBody.y - 10, "🧍‍♂️", { fontSize: "96px" })
          .setOrigin(0.5);

        // Top UI (username, coins, level, time)
        const uiWidth = width * 0.96;
        this.add.rectangle(width / 2, 36, uiWidth, 64, 0xffffff, 0.25).setStrokeStyle(2, 0xffffff, 0.4);

        this.usernameText = this.add.text(18, 18, `User: ${this.username}`, {
          fontSize: "16px",
          color: "#000",
        });

        this.coinsText = this.add.text(width / 2 - 40, 18, `Coins: ${this.coinCount}`, {
          fontSize: "16px",
          color: "#000",
        });

        this.levelText = this.add.text(width - 140, 18, `Level: ${this.level}`, {
          fontSize: "16px",
          color: "#000",
        });

        this.timeText = this.add.text(18, 40, `Time: 0s`, {
          fontSize: "14px",
          color: "#000",
        });

        this.retryInfoText = this.add.text(width - 260, 40, `Retry: available`, {
          fontSize: "14px",
          color: "#000",
        });

        // Groups
        this.obstacles = this.physics.add.group();
        this.coins = this.physics.add.group();

        // Input: pointer hold to run, double-tap to jump
        this.input.on("pointerdown", this.onPointerDown, this);
        this.input.on("pointerup", this.onPointerUp, this);

        // Keyboard support:
        // - Space = jump
        // - ArrowRight (hold) = run
        this.keys = this.input.keyboard.addKeys({
          space: Phaser.Input.Keyboard.KeyCodes.SPACE,
          right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
        });

        this.keys.space.on("down", () => {
          // treat space as immediate jump
          this.jump();
        });

        this.keys.right.on("down", () => {
          this.startRunning();
        });
        this.keys.right.on("up", () => {
          this.stopRunning();
        });

        // Collisions
        this.physics.add.collider(this.playerBody, this.obstacles, this.onHit, null, this);
        this.physics.add.overlap(this.playerBody, this.coins, this.collectCoin, null, this);

        // Spawn timers
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

        // Start time and periodic updates
        this.startTime = Date.now();
        this.time.addEvent({
          delay: 1000,
          callback: () => {
            if (this.isGameOver) return;
            this.elapsedSeconds = Math.floor((Date.now() - this.startTime) / 1000);
            this.timeText.setText(`Time: ${this.elapsedSeconds}s`);
            this.updateLevelAndSpeed();
          },
          loop: true,
        });

        // Ensure retry state text is correct at start
        this.updateRetryText();
      }

      // Pointer handlers: hold to run, double-tap to jump
      onPointerDown() {
        if (this.isGameOver) {
          // If game over, clicking retry area handled separately; pointerdown here should not start running
          return;
        }

        const now = Date.now();
        if (now - this.lastTap <= this.doubleTapWindow) {
          // double-tap -> jump
          this.jump();
        } else {
          // start running while pointer held
          this.startRunning();
        }
        this.lastTap = now;
      }

      onPointerUp() {
        if (this.isGameOver) return;
        this.stopRunning();
      }

      // Start/stop running: obstacles move only while running
      startRunning() {
        if (this.isRunning || this.isGameOver) return;
        this.isRunning = true;
        this.playerEmoji.setText("🚶‍♂️"); // run emoji per user request
        // set obstacle velocities
        this.obstacles.children.iterate((o) => {
          if (o && o.body) o.body.setVelocityX(-this.speed);
        });
        this.coins.children.iterate((c) => {
          if (c && c.body) c.body.setVelocityX(-this.speed);
        });
      }

      stopRunning() {
        if (!this.isRunning || this.isGameOver) return;
        this.isRunning = false;
        this.playerEmoji.setText("🧍‍♂️"); // stand
        // stop obstacles
        this.obstacles.children.iterate((o) => {
          if (o && o.body) o.body.setVelocityX(0);
        });
        this.coins.children.iterate((c) => {
          if (c && c.body) c.body.setVelocityX(0);
        });
      }

      // Jump (double-tap or space)
      jump() {
        if (this.isGameOver) return;
        if (!this.playerBody.body.blocked.down) return;
        this.playerBody.body.setVelocityY(-700);
        this.playerEmoji.setText("🏃‍♂️"); // jump emoji
        // revert after short delay if on ground
        this.time.delayedCall(400, () => {
          if (!this.isGameOver) {
            this.playerEmoji.setText(this.isRunning ? "🚶‍♂️" : "🧍‍♂️");
          }
        });
      }

      // Spawn stone obstacle (emoji + invisible physics body)
      spawnObstacle() {
        if (this.isGameOver) return;
        const { width } = this.scale;
        const groundY = this.groundY;

        const obsW = Phaser.Math.Between(36, 56);
        const obsH = Phaser.Math.Between(36, 56);
        const obsBody = this.add.rectangle(width + 40, groundY - obsH / 2, obsW, obsH, 0x000000, 0);
        this.physics.add.existing(obsBody);
        obsBody.body.setImmovable(true);
        obsBody.body.allowGravity = false;
        obsBody.body.setVelocityX(this.isRunning ? -this.speed : 0);

        // emoji visual (stone)
        const fontSize = Math.min(Math.max(obsW, 28), 48);
        const obsEmoji = this.add.text(obsBody.x, obsBody.y - 6, "🪨", { fontSize: `${fontSize}px` }).setOrigin(0.5);
        obsBody.emoji = obsEmoji;

        this.obstacles.add(obsBody);
      }

      // Spawn coin (emoji + invisible physics body)
      spawnCoin() {
        if (this.isGameOver) return;
        const { width } = this.scale;
        const y = Phaser.Math.Between(180, this.groundY - 80);

        const coinBody = this.add.rectangle(width + 40, y, 20, 20, 0x000000, 0);
        this.physics.add.existing(coinBody);
        coinBody.body.allowGravity = false;
        coinBody.body.setVelocityX(this.isRunning ? -this.speed : 0);

        const coinEmoji = this.add.text(coinBody.x, coinBody.y - 6, "🪙", { fontSize: "28px" }).setOrigin(0.5);
        coinBody.emoji = coinEmoji;

        this.coins.add(coinBody);
      }

      // Collect coin handler
      collectCoin(playerBody, coinBody) {
        if (!coinBody) return;
        if (coinBody.emoji) coinBody.emoji.destroy();
        coinBody.destroy();
        this.coinCount += 1;
        this.coinsText.setText(`Coins: ${this.coinCount}`);
      }

      // Hit obstacle -> game over and show retry UI
      onHit() {
        if (this.isGameOver) return;
        this.isGameOver = true;
        this.physics.pause();
        this.playerEmoji.setText("💥");

        // record game over time
        this.gameOverTime = Date.now();

        const { width, height } = this.scale;
        this.add.text(width / 2, height / 2 - 60, "GAME OVER", {
          fontSize: "40px",
          color: "#333",
        }).setOrigin(0.5);

        // Retry button
        this.retryRect = this.add
          .rectangle(width / 2, height / 2 + 20, 220, 60, 0xffffff)
          .setStrokeStyle(2, 0x333333)
          .setInteractive({ useHandCursor: true });

        this.retryLabel = this.add
          .text(width / 2, height / 2 + 20, "Retry", { fontSize: "22px", color: "#333" })
          .setOrigin(0.5);

        // Update retry text immediately
        this.updateRetryText();

        // Retry click handler
        this.retryRect.on("pointerdown", () => {
          if (this.canRetryNow()) {
            // mark retry used (persist)
            const now = Date.now();
            try {
              localStorage.setItem(this.retryKey, String(now));
            } catch (e) {
              // ignore storage errors
            }
            // restart scene
            this.scene.restart();
          } else {
            // flash the retry info to indicate locked
            this.tweens.add({
              targets: this.retryLabel,
              alpha: 0.3,
              duration: 120,
              yoyo: true,
              repeat: 2,
            });
          }
        });

        // Start a timer to update retry availability text every second
        this.retryTimer = this.time.addEvent({
          delay: 1000,
          callback: this.updateRetryText,
          callbackScope: this,
          loop: true,
        });
      }

      // Determine if retry is allowed now
      canRetryNow() {
        const now = Date.now();
        const lastRetryUsedAt = Number(localStorage.getItem(this.retryKey) || 0);

        // If no retry used before:
        if (!lastRetryUsedAt) {
          // allow retry only within first 20s after gameOverTime
          if (!this.gameOverTime) return false;
          return now - this.gameOverTime <= 20_000;
        }

        // If retry was used previously, allow next retry only after 60s from lastRetryUsedAt
        return now - lastRetryUsedAt >= 60_000;
      }

      // Update the retry info text shown in the top-right
      updateRetryText() {
        const now = Date.now();
        const lastRetryUsedAt = Number(localStorage.getItem(this.retryKey) || 0);

        // If game not over yet, show availability based on lastRetryUsedAt only
        if (!this.gameOverTime) {
          if (!lastRetryUsedAt) {
            this.retryInfoText.setText("Retry: available");
          } else {
            const elapsedSinceUse = now - lastRetryUsedAt;
            if (elapsedSinceUse >= 60_000) {
              this.retryInfoText.setText("Retry: available");
            } else {
              const remain = Math.ceil((60_000 - elapsedSinceUse) / 1000);
              this.retryInfoText.setText(`Retry: locked (${remain}s)`);
            }
          }
          return;
        }

        // If game over and no retry used yet
        if (!lastRetryUsedAt) {
          const elapsed = now - this.gameOverTime;
          if (elapsed <= 20_000) {
            const remain = Math.ceil((20_000 - elapsed) / 1000);
            this.retryInfoText.setText(`Retry: available (${remain}s)`);
            if (this.retryRect) {
              this.retryRect.setFillStyle(0xffffff, 1);
              this.retryLabel.setColor("#333");
            }
          } else {
            // locked until 60s after gameOverTime
            const until = Math.ceil((60_000 - elapsed) / 1000);
            if (until > 0) {
              this.retryInfoText.setText(`Retry: locked (${until}s)`);
              if (this.retryRect) {
                this.retryRect.setFillStyle(0xdddddd, 1);
                this.retryLabel.setColor("#999");
              }
            } else {
              // after 60s from gameOverTime, allow retry again
              this.retryInfoText.setText("Retry: available");
              if (this.retryRect) {
                this.retryRect.setFillStyle(0xffffff, 1);
                this.retryLabel.setColor("#333");
              }
            }
          }
          return;
        }

        // If retry was used previously
        const elapsedSinceUse = now - lastRetryUsedAt;
        if (elapsedSinceUse >= 60_000) {
          this.retryInfoText.setText("Retry: available");
          if (this.retryRect) {
            this.retryRect.setFillStyle(0xffffff, 1);
            this.retryLabel.setColor("#333");
          }
        } else {
          const remain = Math.ceil((60_000 - elapsedSinceUse) / 1000);
          this.retryInfoText.setText(`Retry: locked (${remain}s)`);
          if (this.retryRect) {
            this.retryRect.setFillStyle(0xdddddd, 1);
            this.retryLabel.setColor("#999");
          }
        }
      }

      updateLevelAndSpeed() {
        // Level increases every 30 seconds
        const newLevel = Math.floor(this.elapsedSeconds / 30) + 1;
        if (newLevel !== this.level) {
          this.level = newLevel;
          this.levelText.setText(`Level: ${this.level}`);
          // bump base speed on level up
          this.baseSpeed += 40;
        }
        this.speed = this.baseSpeed + (this.level - 1) * 20;
        // if running, update obstacle velocities
        if (this.isRunning) {
          this.obstacles.children.iterate((o) => {
            if (o && o.body) o.body.setVelocityX(-this.speed);
          });
          this.coins.children.iterate((c) => {
            if (c && c.body) c.body.setVelocityX(-this.speed);
          });
        }
      }

      update() {
        // Sync player emoji to physics body
        if (this.playerBody && this.playerEmoji) {
          this.playerEmoji.setPosition(this.playerBody.x, this.playerBody.y - 10);
        }

        // Sync obstacle/coin emojis and cleanup off-screen
        this.obstacles.children.iterate((o) => {
          if (!o) return;
          if (o.emoji) o.emoji.setPosition(o.x, o.y - 6);
          if (o.x < -200) {
            if (o.emoji) o.emoji.destroy();
            o.destroy();
          }
        });

        this.coins.children.iterate((c) => {
          if (!c) return;
          if (c.emoji) c.emoji.setPosition(c.x, c.y - 6);
          if (c.x < -200) {
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
      scene: RunnerScene,
    };

    gameRef.current = new Phaser.Game(config);

    // Ensure keyboard focus so space/arrow keys work
    window.focus();
    try {
      document.body.tabIndex = -1;
      document.body.focus();
    } catch (e) {
      // ignore
    }

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
        zIndex: 9999,
      }}
    />
  );
};

export default Game;
