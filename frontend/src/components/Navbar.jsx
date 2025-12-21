import React, { useEffect, useRef } from "react";
import Phaser from "phaser";

const Game = ({ username = "Player" }) => {
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
        this.startTime = 0;

        this.lastTap = 0;
        this.tapDelay = 250;
      }

      preload() {}

      create() {
        const { width, height } = this.scale;

        this.cameras.main.setBackgroundColor("#E3F2FD");

        // Ground
        this.ground = this.add.rectangle(width / 2, height - 60, width, 60, 0x8B4513);
        this.physics.add.existing(this.ground, true);

        // Human‑shaped player
        this.player = this.add.container(120, height - 140);

        const body = this.add.rectangle(0, 20, 30, 50, 0x000000, 0.9);
        const head = this.add.circle(0, -10, 15, 0x000000, 0.9);
        const leg1 = this.add.rectangle(-8, 55, 10, 30, 0x000000, 0.9);
        const leg2 = this.add.rectangle(8, 55, 10, 30, 0x000000, 0.9);

        this.player.add([body, head, leg1, leg2]);

        this.physics.add.existing(this.player);
        this.player.body.setGravityY(900);
        this.player.body.setCollideWorldBounds(true);
        this.physics.add.collider(this.player, this.ground);

        // UI (glassy)
        this.uiBox = this.add.rectangle(width / 2, 40, width * 0.9, 60, 0xffffff, 0.25)
          .setStrokeStyle(2, 0xffffff, 0.4)
          .setDepth(10);

        this.usernameText = this.add.text(40, 20, username, {
          fontSize: "20px",
          color: "#000",
          fontFamily: "sans-serif",
        }).setDepth(11);

        this.scoreText = this.add.text(width / 2 - 40, 20, "Score: 0", {
          fontSize: "20px",
          color: "#000",
        }).setDepth(11);

        this.levelText = this.add.text(width - 140, 20, "Level: 1", {
          fontSize: "20px",
          color: "#000",
        }).setDepth(11);

        this.timeText = this.add.text(width / 2 - 40, 45, "Time: 0s", {
          fontSize: "16px",
          color: "#000",
        }).setDepth(11);

        // Groups
        this.obstacles = this.physics.add.group();
        this.coins = this.physics.add.group();

        // Input
        this.input.on("pointerdown", this.handleTap, this);
        this.input.keyboard.on("keydown-SPACE", this.jump, this);

        // Start running
        this.startRun();

        // Timers
        this.startTime = Date.now();

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

        this.time.addEvent({
          delay: 200,
          callback: () => {
            this.distance += 1;
            this.updateDifficulty();
          },
          loop: true,
        });
      }

      // -------------------------
      // ANIMATION STATES
      // -------------------------

      startRun() {
        this.playerState = "run";
      }

      jump() {
        if (this.playerState === "jump") return;

        if (this.player.body.blocked.down) {
          this.playerState = "jump";
          this.player.body.setVelocityY(-520);
        }
      }

      activatePower() {
        if (!this.powerUnlocked) return;

        this.playerState = "power";

        this.time.delayedCall(1500, () => {
          this.startRun();
        });
      }

      // -------------------------
      // INPUT
      // -------------------------

      handleTap() {
        const now = Date.now();

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
        const { width, height } = this.scale;

        const type = Phaser.Math.Between(1, 2);

        let obs;

        if (type === 1) {
          // Rock
          obs = this.add.rectangle(width + 40, height - 100, 50, 40, 0x6D4C41, 0.9);
        } else {
          // Web (glassy)
          obs = this.add.circle(width + 40, height - 120, 30, 0xffffff, 0.3)
            .setStrokeStyle(2, 0xffffff, 0.8);
        }

        this.physics.add.existing(obs);
        obs.body.setVelocityX(-250 - this.distance);
        obs.body.allowGravity = false;
        obs.body.setImmovable(true);

        this.obstacles.add(obs);

        this.physics.add.collider(this.player, obs, () => this.hitObstacle());
      }

      spawnCoin() {
        const { width } = this.scale;

        const y = Phaser.Math.Between(150, 350);

        const coin = this.add.circle(width + 40, y, 12, 0xFFD700);
        this.physics.add.existing(coin);
        coin.body.setVelocityX(-200 - this.distance);
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
        this.timeText.setText(`Time: ${Math.floor((Date.now() - this.startTime) / 1000)}s`);

        if (this.distance >= 100 && !this.powerUnlocked) {
          this.powerUnlocked = true;
          this.level = 2;
          this.levelText.setText("Level: 2");
        }

        if (this.distance % 10 === 0) {
          // Harder obstacles every 10m
        }
      }

      // -------------------------
      // GAME OVER
      // -------------------------

      hitObstacle() {
        if (this.playerState === "power") return;

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
  }, [username]);

  return <div id="phaser-container" className="w-full h-full"></div>;
};

export default Game;
