import React, { useEffect, useRef } from "react";
import Phaser from "phaser";

// Assets (relative to this file: src/components/Game.jsx)
import bgShebaTemple from "../assets/bg-sheba-temple.png";
import playerGuardian from "../assets/player-guardian.png";
import coinGold from "../assets/coin-gold.png";
import obstaclePillar from "../assets/obstacle-pillar.png";
import uiFrame from "../assets/ui-frame.png";
import uiButton from "../assets/ui-button.png";
import uiBanner from "../assets/ui-banner.png";

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
        this.obstacles = null;
        this.coins = null;
        this.dustEmitter = null;
        this.retryButton = null;
        this.dashboardButton = null;
      }

      preload() {
        // load images imported above
        this.load.image("bg1", bgShebaTemple);
        this.load.image("player", playerGuardian);
        this.load.image("coin", coinGold);
        this.load.image("obstacle", obstaclePillar);
        this.load.image("frame", uiFrame);
        this.load.image("button", uiButton);
        this.load.image("banner", uiBanner);
      }

      create() {
        const { width, height } = this.scale;

        // Set a pleasant sky-blue background color behind everything
        this.cameras.main.setBackgroundColor("#87CEEB");

        // Create a small circular dust texture at runtime (12x12)
        const g = this.add.graphics();
        g.fillStyle(0xC2A16B, 1);
        g.fillCircle(6, 6, 5);
        g.generateTexture("dust", 12, 12);
        g.destroy();

        // Fade in
        this.cameras.main.fadeIn(600);

        // Background tile (parallax-ready)
        this.bg1 = this.add.tileSprite(0, 0, width, height, "bg1").setOrigin(0);

        // Visible ground (simple rectangle) with static physics body
        // Move ground up so it's clearly visible above any navbar
        const groundHeight = 64;
        const groundY = height - 80; // raised so player and ground are visible
        this.ground = this.add.rectangle(width / 2, groundY, width, groundHeight, 0x8b5a2b);
        this.physics.add.existing(this.ground, true); // static body

        // Player (scaled, gravity disabled until start)
        const playerScale = 0.45;
        // Place player slightly above ground so it's visible and not overlapped by navbar
        this.player = this.physics.add.sprite(120, groundY - 48, "player").setScale(playerScale);
        this.player.setCollideWorldBounds(true);
        this.player.body.allowGravity = false; // prevent falling before start
        this.physics.add.collider(this.player, this.ground);

        // Dust trail (particle emitter, initially inactive)
        this.dust = this.add.particles("dust");
        this.dustEmitter = this.dust.createEmitter({
          x: this.player.x - 20,
          y: this.player.y + 20,
          speedX: { min: -50, max: -150 },
          speedY: { min: -10, max: 10 },
          scale: { start: 0.4, end: 0 },
          lifespan: 300,
          quantity: 0,
        });

        // Score UI (frame + banner + text)
        const frameX = width - 140;
        const frameY = 48;
        this.add.image(frameX, frameY, "frame").setScale(0.6);
        this.add.image(frameX, frameY, "banner").setScale(0.45);
        this.scoreText = this.add.text(frameX, frameY, "0", {
          fontSize: "22px",
          color: "#FFD700",
          fontFamily: "serif",
          fontStyle: "bold",
        }).setOrigin(0.5);

        // Groups
        this.obstacles = this.physics.add.group();
        this.coins = this.physics.add.group();

        // Overlaps and collisions
        this.physics.add.overlap(this.player, this.coins, this.collectCoin, null, this);
        this.physics.add.collider(this.player, this.obstacles, this.hitObstacle, null, this);

        // Input: pointer + spacebar for jump
        this.input.on("pointerdown", this.tryJump, this);
        this.input.keyboard.on("keydown-SPACE", this.tryJump, this);

        // Intro screen with a clear Play button
        this.showIntro();
      }

      showIntro() {
        const { width, height } = this.scale;

        // Semi-transparent overlay to focus the player
        this.overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.35);

        this.introText = this.add.text(width / 2, height / 2 - 80, "Trial of the Queen", {
          fontSize: "48px",
          color: "#FFD700",
          fontFamily: "serif",
          fontStyle: "bold",
          stroke: "#000000",
          strokeThickness: 6,
        }).setOrigin(0.5);

        // Prominent Play button
        this.playButton = this.add.image(width / 2, height / 2 + 10, "button")
          .setInteractive()
          .setScale(1.0)
          .setDepth(10);

        this.playLabel = this.add.text(width / 2, height / 2 + 10, "Play", {
          fontSize: "26px",
          color: "#000",
          fontFamily: "serif",
          fontStyle: "bold",
        }).setOrigin(0.5).setDepth(11);

        // Small hint text
        this.hintText = this.add.text(width / 2, height / 2 + 70, "Tap or press SPACE to jump", {
          fontSize: "16px",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }).setOrigin(0.5).setDepth(11);

        this.playButton.on("pointerdown", () => {
          this.startTrial();
        });
      }

      startTrial() {
        this.started = true;

        // Remove intro UI
        if (this.overlay) this.overlay.destroy();
        if (this.introText) this.introText.destroy();
        if (this.playButton) this.playButton.destroy();
        if (this.playLabel) this.playLabel.destroy();
        if (this.hintText) this.hintText.destroy();

        // Enable gravity for player
        this.player.body.allowGravity = true;
        this.player.setGravityY(900);

        // Activate dust emitter quantity for running effect
        this.dustEmitter.setQuantity(2);

        // Spawn loops
        this.time.addEvent({
          delay: 1400,
          callback: this.spawnObstacle,
          callbackScope: this,
          loop: true,
        });

        this.time.addEvent({
          delay: 1100,
          callback: this.spawnCoin,
          callbackScope: this,
          loop: true,
        });
      }

      tryJump() {
        if (!this.started || this.gameOver) return;
        // Only allow jump when touching ground
        if (this.player.body.blocked.down || this.player.body.touching.down) {
          this.player.setVelocityY(-520); // jump strength
          // small burst of dust on jump
          this.dustEmitter.explode(6, this.player.x - 20, this.player.y + 20);
        }
      }

      spawnObstacle() {
        if (!this.started || this.gameOver) return;
        const { width, height } = this.scale;
        const scale = Phaser.Math.FloatBetween(0.55, 0.95);
        // Randomize obstacle vertical offset slightly so player must time jumps
        const baseY = this.ground.y - (this.ground.height / 2);
        const yOffset = Phaser.Math.Between(-6, 6);
        const obs = this.obstacles.create(width + 80, baseY + yOffset, "obstacle").setScale(scale);
        obs.setVelocityX(-300);
        obs.setImmovable(true);
        obs.body.allowGravity = false;
      }

      spawnCoin() {
        if (!this.started || this.gameOver) return;
        const { width } = this.scale;
        const minY = 120;
        const maxY = this.ground.y - 120;
        const y = Phaser.Math.Between(minY, Math.max(minY + 10, maxY));
        const coin = this.coins.create(width + 50, y, "coin").setScale(0.28);
        coin.setVelocityX(-240);
        coin.body.allowGravity = false;
      }

      collectCoin(player, coin) {
        if (!coin || !coin.active) return;
        coin.destroy();
        this.score += 10;
        this.scoreText.setText(this.score);
      }

      hitObstacle(player, obstacle) {
        if (this.gameOver) return;
        this.gameOver = true;

        // Stop physics and show game over UI
        this.physics.pause();
        this.player.setTint(0xff0000);
        this.dustEmitter.setQuantity(0);

        this.showGameOverUI();
      }

      showGameOverUI() {
        const { width, height } = this.scale;

        // Semi-transparent overlay
        this.overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.45).setDepth(20);

        // Game Over text
        this.gameOverText = this.add.text(width / 2, height / 2 - 80, "Game Over", {
          fontSize: "44px",
          color: "#ffffff",
          fontFamily: "serif",
          stroke: "#000000",
          strokeThickness: 6,
        }).setOrigin(0.5).setDepth(21);

        // Retry button
        this.retryButton = this.add.image(width / 2, height / 2 - 10, "button")
          .setInteractive()
          .setScale(0.9)
          .setDepth(21);
        this.retryLabel = this.add.text(width / 2, height / 2 - 10, "Retry", {
          fontSize: "20px",
          color: "#000",
          fontFamily: "serif",
        }).setOrigin(0.5).setDepth(22);

        // Dashboard button
        this.dashboardButton = this.add.image(width / 2, height / 2 + 50, "button")
          .setInteractive()
          .setScale(0.9)
          .setDepth(21);
        this.dashboardLabel = this.add.text(width / 2, height / 2 + 50, "Dashboard", {
          fontSize: "20px",
          color: "#000",
          fontFamily: "serif",
        }).setOrigin(0.5).setDepth(22);

        // Button handlers
        this.retryButton.on("pointerdown", () => {
          this.scene.restart();
        });

        this.dashboardButton.on("pointerdown", () => {
          window.location.href = "/dashboard";
        });
      }

      update() {
        // If game hasn't started or is over, still allow parallax background to be visible
        if (!this.started && !this.gameOver) {
          this.bg1.tilePositionX += 0.4;
          return;
        }

        if (this.gameOver) {
          // keep background moving slowly for effect
          this.bg1.tilePositionX += 0.4;
          return;
        }

        // Parallax scroll
        this.bg1.tilePositionX += 1.6;

        // Dust emitter follows player
        this.dustEmitter.setPosition(this.player.x - 20, this.player.y + 20);

        // Clean up off-screen objects
        this.obstacles.children.iterate((o) => {
          if (o && o.x < -150) o.destroy();
        });

        this.coins.children.iterate((c) => {
          if (c && c.x < -150) c.destroy();
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
          gravity: { y: 0 }, // world gravity; player uses its own gravity when enabled
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

  // Add top padding so a navbar won't overlap the game canvas content
  // If your app's navbar height differs, adjust paddingTop accordingly.
  return (
    <div
      id="phaser-container"
      style={{
        width: "100%",
        height: "100vh",
        paddingTop: "64px", // reserve space for navbar
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    />
  );
};

export default Game;
