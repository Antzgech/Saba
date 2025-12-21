import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { gameAPI } from '../services/api';

const Game = () => {
  const gameRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (gameRef.current) return; // prevent multiple inits

    const width = window.innerWidth;
    const height = window.innerHeight;

    class MainScene extends Phaser.Scene {
      constructor() {
        super('MainScene');
        this.score = 0;
        this.scoreText = null;
        this.player = null;
        this.platforms = null;
        this.coins = null;
        this.isGameOver = false;
      }

      preload() {
        // Simple shapes; could be replaced by sprites later
      }

      create() {
        // Background color
        this.cameras.main.setBackgroundColor('#0A1A2F');

        // Ground/platform group
        this.platforms = this.physics.add.staticGroup();
        this.platforms.create(width / 2, height - 40, 'ground')
          .setScale(2)
          .refreshBody()
          .setSize(width, 40)
          .setOffset(0, 0);

        // Player
        this.player = this.physics.add.sprite(80, height - 100, 'player');
        this.player.setDisplaySize(32, 32);
        this.player.setCollideWorldBounds(true);
        this.player.body.setGravityY(600);

        // Auto‑run
        this.player.body.setVelocityX(180);

        // Score text
        this.scoreText = this.add.text(16, 16, 'Score: 0', {
          fontSize: '18px',
          fontFamily: 'system-ui, sans-serif',
          color: '#F5D27C'
        });

        // Coins group
        this.coins = this.physics.add.group();

        // Collisions
        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.overlap(this.player, this.coins, this.collectCoin, null, this);

        // Spawn coins periodically
        this.time.addEvent({
          delay: 800,
          callback: this.spawnCoin,
          callbackScope: this,
          loop: true
        });

        // Spawn obstacles
        this.obstacles = this.physics.add.group();
        this.physics.add.collider(this.player, this.obstacles, this.hitObstacle, null, this);

        this.time.addEvent({
          delay: 1400,
          callback: this.spawnObstacle,
          callbackScope: this,
          loop: true
        });

        // Jump on tap/click
        this.input.on('pointerdown', () => {
          if (this.isGameOver) return;
          if (this.player.body.touching.down) {
            this.player.setVelocityY(-420);
          }
        });
      }

      spawnCoin() {
        if (this.isGameOver) return;
        const y = Phaser.Math.Between(height - 200, height - 120);
        const coin = this.coins.create(width + 20, y, 'coin');
        coin.setDisplaySize(18, 18);
        coin.body.setAllowGravity(false);
        coin.setVelocityX(-200);
        coin.checkWorldBounds = true;
        coin.outOfBoundsKill = true;
      }

      spawnObstacle() {
        if (this.isGameOver) return;
        const obstacle = this.obstacles.create(width + 20, height - 70, 'obstacle');
        obstacle.setDisplaySize(24, 40);
        obstacle.body.setAllowGravity(false);
        obstacle.setVelocityX(-200);
        obstacle.checkWorldBounds = true;
        obstacle.outOfBoundsKill = true;
      }

      collectCoin(player, coin) {
        coin.destroy();
        this.score += 1;
        this.scoreText.setText('Score: ' + this.score);
      }

      async hitObstacle() {
        if (this.isGameOver) return;
        this.isGameOver = true;

        this.physics.pause();
        this.player.setTint(0xff0000);

        // Show game over text
        this.add.text(width / 2, height / 2 - 20, 'Trial Complete', {
          fontSize: '24px',
          fontFamily: 'system-ui, sans-serif',
          color: '#F5D27C'
        }).setOrigin(0.5);

        this.add.text(width / 2, height / 2 + 20, `Score: ${this.score}`, {
          fontSize: '18px',
          fontFamily: 'system-ui, sans-serif',
          color: '#FFFFFF'
        }).setOrigin(0.5);

        // Send score to backend
        try {
          await gameAPI.submitScore({ score: this.score });
        } catch (e) {
          console.error('Failed to submit score', e);
        }

        // Optionally: return to dashboard after delay
        this.time.delayedCall(2000, () => {
          window.history.back();
        });
      }

      update() {
        if (this.isGameOver) return;

        // Keep player roughly at same x, world scrolls via objects
        if (this.player.x < 80) {
          this.player.x = 80;
        }
      }
    }

    const config = {
      type: Phaser.AUTO,
      width,
      height,
      parent: containerRef.current,
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 0 },
          debug: false
        }
      },
      scene: [MainScene]
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
    <div className="w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
};

export default Game;
