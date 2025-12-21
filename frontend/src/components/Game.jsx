import React, { useEffect, useRef } from "react";
import Phaser from "phaser";

const Game = () => {
  const gameRef = useRef(null);

  useEffect(() => {
    if (gameRef.current) return;

    class DinoScene extends Phaser.Scene {
      constructor() {
        super("DinoScene");

        // Player & game state
        this.playerBody = null;
        this.playerEmoji = null;
        this.obstacles = null;

        this.isGameOver = false;
        this.isRunning = false; // running while user holds pointer
        this.baseSpeed = 300;
        this.speed = this.baseSpeed;

        // Tap/double-tap detection
        this.lastTap = 0;
        this.doubleTapWindow = 250; // ms

        // Retry / chance timing
        this.gameOverTime = null;
        this.lastRetryUsedAt = null; // timestamp when retry was used
      }

      preload() {}

      create() {
        const { width, height } = this.scale;

        // Background
        this.cameras.main.setBackgroundColor("#F5F5F5");

        // Ground (raised so visible)
        this.groundY = height - 120;
        const ground = this.add.rectangle(width / 2, this.groundY + 20, width, 40, 0x8b8b8b);
        this.physics.add.existing(ground, true);

        // Player physics body (invisible rectangle) - made proportionally larger
        const playerW = 80;
        const playerH = 100;
        this.playerBody = this.add.rectangle(140, this.groundY - playerH / 2, playerW, playerH, 0x000000, 0);
        this.physics.add.existing(this.playerBody);
        this.playerBody.body.setGravityY(1400);
        this.playerBody.body.setCollideWorldBounds(true);
        this.physics.add.collider(this.playerBody, ground);

        // Player emoji visual (stand/run/jump)
        this.playerEmoji = this.add.text(this.playerBody.x, this.playerBody.y - 10, "🧍‍♂️", {
          fontSize: "64px",
        }).setOrigin(0.5);

        // Top UI: show level, time, and retry availability (no score)
        const uiWidth = width * 0.96;
        this.add.rectangle(width / 2, 36, uiWidth, 64, 0xffffff, 0.25).setStrokeStyle(2, 0xffffff, 0.4);

        this.levelText = this.add.text(18, 18, `Level: 1`, { fontSize: "16px", color: "#000" });
        this.timeText = this.add.text(18, 40, `Time: 0s`, { fontSize: "14px", color: "#000" });
        this.retryInfoText = this.add.text(width - 260, 28, `Retry: available`, { fontSize: "14px", color: "#000" });

        // Groups
        this.obstacles = this.physics.add.group();

        // Input: pointerdown/ up for hold-to-run; double-tap to jump
        this.input.on("pointerdown", this.onPointerDown, this);
        this.input.on("pointerup", this.onPointerUp, this);
        this.input.keyboard.on("keydown-SPACE", this.onSpace, this);

        // Collisions
        this.physics.add.collider(this.playerBody, this.obstacles, this.onHit, null, this);

        // Spawn obstacles periodically (they only move when isRunning is true)
        this.time.addEvent({
          delay: 1200,
          callback: this.spawnObstacle,
          callbackScope: this,
          loop: true,
        });

        // Time tracker and level logic
        this.startTime = Date.now();
        this.elapsedSeconds = 0;
        this.level = 1;
        this.time.addEvent({
          delay: 1000,
          callback: () => {
            if (this.isGameOver) return;
            this.elapsedSeconds = Math.floor((Date.now() - this.startTime) / 1000);
            this.timeText.setText(`Time: ${this.elapsedSeconds}s`);
            this.updateLevel();
          },
          loop: true,
        });
      }

      // Input handlers
      onPointerDown(pointer) {
        if (this.isGameOver) return;

        const now = Date.now();
        if (now - this.lastTap <= this.doubleTapWindow) {
          // double tap detected -> jump
          this.jump();
        } else {
          // start running while pointer is held
          this.startRunning();
        }
        this.lastTap = now;
      }

      onPointerUp() {
        if (this.isGameOver) return;
        // stop running when pointer released
        this.stopRunning();
      }

      onSpace() {
        // space acts as double-tap jump
        if (this.isGameOver) return;
        this.jump();
      }

      startRunning() {
        if (this.isRunning || this.isGameOver) return;
        this.isRunning = true;
        this.playerEmoji.setText("🚶‍♂️"); // run emoji per user request (they asked run=🚶‍♂️)
        // set obstacles moving
        this.obstacles.children.iterate((o) => {
          if (o && o.body) o.body.setVelocityX(-this.speed);
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
      }

      jump() {
        if (this.isGameOver) return;
        // only allow jump if on ground
        if (!this.playerBody.body.blocked.down) return;
        this.playerBody.body.setVelocityY(-700);
        this.playerEmoji.setText("🏃‍♂️"); // jump emoji per user request
        // after short delay, if still on ground, revert to appropriate emoji
        this.time.delayedCall(400, () => {
          if (!this.isGameOver) {
            if (this.isRunning) this.playerEmoji.setText("🚶‍♂️");
            else this.playerEmoji.setText("🧍‍♂️");
          }
        });
      }

      spawnObstacle() {
        if (this.isGameOver) return;
        const { width } = this.scale;
        const groundY = this.groundY;

        // Stone obstacle body
        const obsW = Phaser.Math.Between(36, 56);
        const obsH = Phaser.Math.Between(36, 56);
        const obsBody = this.add.rectangle(width + 40, groundY - obsH / 2, obsW, obsH, 0x000000, 0);
        this.physics.add.existing(obsBody);
        obsBody.body.setImmovable(true);
        obsBody.body.allowGravity = false;
        // only move if running
        obsBody.body.setVelocityX(this.isRunning ? -this.speed : 0);

        // emoji visual (stone)
        const obsEmoji = this.add.text(obsBody.x, obsBody.y - 6, "🪨", { fontSize: Math.min(obsW, 40) + "px" }).setOrigin(0.5);
        obsBody.emoji = obsEmoji;

        this.obstacles.add(obsBody);
      }

      onHit() {
        if (this.isGameOver) return;
        this.isGameOver = true;
        this.physics.pause();
        this.playerEmoji.setText("💥");

        // record game over time
        this.gameOverTime = Date.now();

        // show Game Over and retry UI
        const { width, height } = this.scale;
        this.add.text(width / 2, height / 2 - 60, "GAME OVER", {
          fontSize: "40px",
          color: "#333",
        }).setOrigin(0.5);

        // Retry button area
        this.retryRect = this.add.rectangle(width / 2, height / 2 + 20, 220, 60, 0xffffff)
          .setStrokeStyle(2, 0x333333)
          .setInteractive();

        this.retryLabel = this.add.text(width / 2, height / 2 + 20, "Retry", {
          fontSize: "22px",
          color: "#333",
        }).setOrigin(0.5);

        // Determine if retry is currently allowed (per rules):
        // - Immediately after game over, retry is available for 20s.
        // - If retry used, next retry allowed only after 60s from that use.
        // - If not used within 20s, retry disabled until 60s after gameOverTime.
        this.updateRetryAvailability();

        // Retry click handler
        this.retryRect.on("pointerdown", () => {
          if (this.canRetryNow()) {
            // mark retry used
            this.lastRetryUsedAt = Date.now();
            // restart scene
            this.scene.restart();
          } else {
            // do nothing if retry not allowed
          }
        });

        // Start a timer to update retry availability text every second
        this.retryTimer = this.time.addEvent({
          delay: 1000,
          callback: this.updateRetryAvailability,
          callbackScope: this,
          loop: true,
        });
      }

      // Determine if retry is allowed now
      canRetryNow() {
        const now = Date.now();
        if (!this.gameOverTime) return false;

        // If lastRetryUsedAt is null (no retry used yet)
        if (!this.lastRetryUsedAt) {
          // allow retry only within first 20s after gameOverTime
          return now - this.gameOverTime <= 20_000;
        }

        // If retry was used previously, allow next retry only after 60s from lastRetryUsedAt
        return now - this.lastRetryUsedAt >= 60_000;
      }

      updateRetryAvailability() {
        const now = Date.now();
        if (!this.gameOverTime) {
          this.retryInfoText.setText("Retry: available");
          return;
        }

        if (!this.lastRetryUsedAt) {
          // first retry window: available for 20s after game over
          const elapsed = now - this.gameOverTime;
          if (elapsed <= 20_000) {
            const remain = Math.ceil((20_000 - elapsed) / 1000);
            this.retryInfoText.setText(`Retry: available (${remain}s)`);
            // enable visual
            if (this.retryRect) this.retryRect.setFillStyle(0xffffff, 1);
            if (this.retryLabel) this.retryLabel.setColor("#333");
          } else {
            // disabled until 60s after gameOverTime
            const until = Math.ceil((60_000 - elapsed) / 1000);
            if (until > 0) {
              this.retryInfoText.setText(`Retry: locked (${until}s)`);
              if (this.retryRect) this.retryRect.setFillStyle(0xdddddd, 1);
              if (this.retryLabel) this.retryLabel.setColor("#999");
            } else {
              // after 60s from gameOverTime, allow retry again
              this.retryInfoText.setText("Retry: available");
              if (this.retryRect) this.retryRect.setFillStyle(0xffffff, 1);
              if (this.retryLabel) this.retryLabel.setColor("#333");
            }
          }
        } else {
          // retry was used before; next retry allowed after 60s from lastRetryUsedAt
          const elapsedSinceUse = now - this.lastRetryUsedAt;
          if (elapsedSinceUse >= 60_000) {
            this.retryInfoText.setText("Retry: available");
            if (this.retryRect) this.retryRect.setFillStyle(0xffffff, 1);
            if (this.retryLabel) this.retryLabel.setColor("#333");
          } else {
            const remain = Math.ceil((60_000 - elapsedSinceUse) / 1000);
            this.retryInfoText.setText(`Retry: locked (${remain}s)`);
            if (this.retryRect) this.retryRect.setFillStyle(0xdddddd, 1);
            if (this.retryLabel) this.retryLabel.setColor("#999");
          }
        }
      }

      updateLevel() {
        // Level increases every 30 seconds for a visible progression
        const newLevel = Math.floor(this.elapsedSeconds / 30) + 1;
        if (newLevel !== this.level) {
          this.level = newLevel;
          this.levelText.setText(`Level: ${this.level}`);
          // increase base speed slightly on level up
          this.baseSpeed += 40;
        }
        // speed depends on baseSpeed and level
        this.speed = this.baseSpeed + (this.level - 1) * 20;
        // if running, ensure obstacles move at new speed
        if (this.isRunning) {
          this.obstacles.children.iterate((o) => {
            if (o && o.body) o.body.setVelocityX(-this.speed);
          });
        }
      }

      update() {
        // Sync player emoji to physics body
        if (this.playerBody && this.playerEmoji) {
          this.playerEmoji.setPosition(this.playerBody.x, this.playerBody.y - 10);
        }

        // Move obstacle emojis and cleanup
        this.obstacles.children.iterate((o) => {
          if (!o) return;
          if (o.emoji) o.emoji.setPosition(o.x, o.y - 6);
          if (o.x < -200) {
            if (o.emoji) o.emoji.destroy();
            o.destroy();
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
