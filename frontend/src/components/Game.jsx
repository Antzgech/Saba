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
import dustImg from "../assets/dust.png"; // optional particle image

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
        this.dust = null;
        this.dustEmitter = null;
        this.retryButton = null;
        this.dashboardButton = null;
      }

      preload() {
        // Images loaded from imported modules
        this.load.image("bg1", bgShebaTemple);
        this.load.image("player", playerGuardian);
        this.load.image("coin", coinGold);
        this.load.image("obstacle", obstaclePillar);
        this.load.image("frame", uiFrame);
        this.load.image("button", uiButton);
        this.load.image("banner", uiBanner);
        this.load.image("dust", dustImg);
      }

      create() {
        const { width, height } = this.scale;

        // Fade in
        this.cameras.main.fadeIn(600);

        // Background (parallax-ready)
        this.bg1 = this.add.tileSprite(0, 0, width, height, "bg1").setOrigin(0);

        // Visible ground (simple rectangle) with static physics body
        const groundHeight = 48;
        const groundY = height - groundHeight / 2;
        this.ground = this.add.rectangle(width / 2, groundY, width, groundHeight, 0x8b5a2b);
        this.physics.add.existing(this.ground, true); // static body

        // Player (scaled, gravity disabled until start)
        const playerScale = 0.5;
        this.player = this.physics.add.sprite(120, height - 120, "player").setScale(playerScale);
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

        // Score UI
        this.add.image(width / 2, 50, "banner").setScale(0.6);
        this.scoreText = this.add.text(width / 2, 50, "0", {
          fontSize: "28px",
          color: "#FFD700",
          fontFamily: "serif",
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

        // Intro screen
        this.showIntro();
      }

      showIntro() {
        const { width, height } = this.scale;

        this.introText = this.add.text(width / 2, height / 2 - 40, "Trial of the Queen", {
          fontSize: "42px",
          color: "#FFD700",
          fontFamily: "serif",
        }).setOrigin(0.5);

        this.startButton = this.add.image(width / 2, height / 2 + 40, "button")
          .setInteractive()
          .setScale(0.7);

        this.startLabel = this.add.text(width / 2, height / 2 + 40, "Begin Trial", {
          fontSize: "22px",
          color: "#000",
          fontFamily: "serif",
        }).setOrigin(0.5);

        this.startButton.on("pointerdown", () => {
          this.startTrial();
        });
      }

      startTrial() {
        this.started = true;

        // Remove intro UI
        if (this.introText) this.introText.destroy();
        if (this.startButton) this.startButton.destroy();
        if (this.startLabel) this.startLabel.destroy();

        // Enable gravity for player
        this.player.body.allowGravity = true;
        this.player.setGravityY(900);

        // Activate dust emitter quantity for running effect
        this.dustEmitter.setQuantity(2);

        // Spawn loops
        this.time.addEvent({
          delay: 1500,
          callback: this.spawnObstacle,
          callbackScope: this,
          loop: true,
        });

        this.time.addEvent({
          delay: 1200,
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
        const scale = Phaser.Math.FloatBetween(0.5, 0.85);
        const obs = this.obstacles.create(width + 80, height - 80, "obstacle").setScale(scale);
        obs.setVelocityX(-260);
        obs.setImmovable(true);
        obs.body.allowGravity = false;
      }

      spawnCoin() {
        if (!this.started || this.gameOver) return;
        const { width } = this.scale;
        const y = Phaser.Math.Between(150, this.scale.height - 140);
        const coin = this.coins.create(width + 50, y, "coin").setScale(0.28);
        coin.setVelocityX(-220);
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

        // Game Over text
        this.gameOverText = this.add.text(width / 2, height / 2 - 60, "Game Over", {
          fontSize: "40px",
          color: "#ffffff",
          fontFamily: "serif",
        }).setOrigin(0.5);

        // Retry button
        this.retryButton = this.add.image(width / 2, height / 2 + 10, "button")
          .setInteractive()
          .setScale(0.7);
        this.retryLabel = this.add.text(width / 2, height / 2 + 10, "Retry", {
          fontSize: "20px",
          color: "#000",
          fontFamily: "serif",
        }).setOrigin(0.5);

        // Dashboard button
        this.dashboardButton = this.add.image(width / 2, height / 2 + 70, "button")
          .setInteractive()
          .setScale(0.7);
        this.dashboardLabel = this.add.text(width / 2, height / 2 + 70, "Dashboard", {
          fontSize: "20px",
          color: "#000",
          fontFamily: "serif",
        }).setOrigin(0.5);

        // Button handlers
        this.retryButton.on("pointerdown", () => {
          // restart scene cleanly
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
        this.bg1.tilePositionX += 1.2;

        // Dust emitter follows player
        this.dustEmitter.setPosition(this.player.x - 20, this.player.y + 20);

        // Clean up off-screen objects
        this.obstacles.children.iterate((o) => {
          if (o && o.x < -100) o.destroy();
        });

        this.coins.children.iterate((c) => {
          if (c && c.x < -100) c.destroy();
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

  return <div id="phaser-container" className="w-full h-full"></div>;
};

export default Game;
