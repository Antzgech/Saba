import React, { useEffect, useRef } from "react";
import Phaser from "phaser";

// Import assets from src/assets
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
      }

      preload() {
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

        this.cameras.main.fadeIn(600);

        this.bg1 = this.add.tileSprite(0, 0, width, height, "bg1").setOrigin(0);

        this.ground = this.physics.add.staticGroup();
        this.ground.create(0, height - 40, "bg1")
          .setOrigin(0, 0)
          .setDisplaySize(width, 40)
          .refreshBody();

        this.player = this.physics.add.sprite(120, height - 120, "player");
        this.player.setCollideWorldBounds(true);
        this.player.body.allowGravity = false; // prevent falling before start
        this.physics.add.collider(this.player, this.ground);

        this.add.image(width / 2, 50, "banner").setScale(0.6);
        this.scoreText = this.add.text(width / 2, 50, "0", {
          fontSize: "28px",
          color: "#FFD700",
          fontFamily: "serif",
        }).setOrigin(0.5);

        this.obstacles = this.physics.add.group();
        this.coins = this.physics.add.group();

        this.physics.add.overlap(this.player, this.coins, this.collectCoin, null, this);
        this.physics.add.overlap(this.player, this.obstacles, this.hitObstacle, null, this);

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

        this.introText.destroy();
        this.startButton.destroy();
        this.startLabel.destroy();

        this.player.body.allowGravity = true;
        this.player.setGravityY(900);

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

      spawnObstacle() {
        if (!this.started || this.gameOver) return;
        const { width, height } = this.scale;
        const obs = this.obstacles.create(width + 50, height - 80, "obstacle");
        obs.setVelocityX(-260);
        obs.setImmovable(true);
      }

      spawnCoin() {
        if (!this.started || this.gameOver) return;
        const { width } = this.scale;
        const y = Phaser.Math.Between(150, 350);
        const coin = this.coins.create(width + 50, y, "coin");
        coin.setVelocityX(-220);
      }

      collectCoin(player, coin) {
        coin.destroy();
        this.score += 10;
        this.scoreText.setText(this.score);
      }

      hitObstacle() {
        if (this.gameOver) return;
        this.gameOver = true;
        this.physics.pause();
        this.player.setTint(0xff0000);
        this.showGameOver();
      }

      showGameOver() {
        this.cameras.main.fadeOut(800);
        this.time.delayedCall(900, () => {
          window.location.href = "/dashboard";
        });
      }

      update() {
        if (!this.started || this.gameOver) return;
        this.bg1.tilePositionX += 1.2;

        this.obstacles.children.iterate((o) => {
          if (o && o.x < -50) o.destroy();
        });
        this.coins.children.iterate((c) => {
          if (c && c.x < -50) c.destroy();
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
  }, []);

  return <div id="phaser-container" className="w-full h-full"></div>;
};

export default Game;
