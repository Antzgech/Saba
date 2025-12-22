import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Phaser from "phaser";
import { gameAPI } from "../services/api";
import { useAuthStore } from "../store";

const Game = () => {
  const gameRef = useRef(null);
  const sceneRef = useRef(null);
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();
  
  const [gameState, setGameState] = useState({
    isLoading: true,
    isPaused: false,
  });

  useEffect(() => {
    if (gameRef.current) return;

    class MainScene extends Phaser.Scene {
      constructor() {
        super({ key: "MainScene" });
        this.player = null;
        this.score = 0;
        this.coinsCollected = 0;
        this.distance = 0;
        this.gameTime = 0;
        this.level = 1;
        this.gameOver = false;
        this.started = false;
        this.isPaused = false;
        this.currentSpeed = 280;
        this.currentLane = 1;
        this.isMoving = false;
        this.username = user?.username || user?.firstName || "Player";
        this.startTime = 0;
      }

      preload() {
        this.createGraphics();
      }

      createGraphics() {
        const g = this.make.graphics({ add: false });
        
        // PLAYER CAR
        g.clear();
        g.fillStyle(0x00D9FF, 1);
        g.fillRoundedRect(5, 10, 50, 80, 12);
        g.fillStyle(0x0088AA, 0.8);
        g.fillRoundedRect(15, 20, 30, 25, 8);
        g.fillStyle(0x1a1a1a, 1);
        g.fillCircle(15, 15, 8);
        g.fillCircle(45, 15, 8);
        g.fillCircle(15, 75, 8);
        g.fillCircle(45, 75, 8);
        g.fillStyle(0xFFFFFF, 0.9);
        g.fillCircle(18, 85, 4);
        g.fillCircle(42, 85, 4);
        g.generateTexture('player', 60, 90);
        
        // OBSTACLE CAR
        g.clear();
        g.fillStyle(0xFF3366, 1);
        g.fillRoundedRect(5, 10, 50, 80, 12);
        g.fillStyle(0xAA0022, 0.8);
        g.fillRoundedRect(15, 20, 30, 25, 8);
        g.fillStyle(0x1a1a1a, 1);
        g.fillCircle(15, 15, 8);
        g.fillCircle(45, 15, 8);
        g.fillCircle(15, 75, 8);
        g.fillCircle(45, 75, 8);
        g.generateTexture('car', 60, 90);
        
        // ROCK
        g.clear();
        g.fillStyle(0x9D4EDD, 1);
        g.beginPath();
        g.moveTo(40, 10);
        g.lineTo(70, 40);
        g.lineTo(60, 70);
        g.lineTo(20, 70);
        g.lineTo(10, 40);
        g.closePath();
        g.fillPath();
        g.fillStyle(0xC77DFF, 0.6);
        g.fillCircle(40, 35, 15);
        g.generateTexture('rock', 80, 80);
        
        // COIN
        g.clear();
        g.fillStyle(0xFFD700, 1);
        g.fillCircle(25, 25, 18);
        g.fillStyle(0xFFF4A3, 0.8);
        g.fillCircle(25, 25, 12);
        g.fillStyle(0xFFFFFF, 0.6);
        g.fillCircle(20, 20, 6);
        g.generateTexture('coin', 50, 50);
        
        // GROUND
        g.clear();
        g.fillStyle(0x2D3142, 0.9);
        g.fillRect(0, 0, 100, 100);
        g.lineStyle(2, 0x00D9FF, 0.3);
        g.strokeRect(0, 0, 100, 100);
        g.generateTexture('ground', 100, 100);
        
        // PARTICLE
        g.clear();
        g.fillStyle(0xFFFFFF, 1);
        g.fillCircle(4, 4, 4);
        g.generateTexture('particle', 8, 8);
        
        g.destroy();
      }

      create() {
        const { width, height } = this.scale;
        
        // Background
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x667eea, 0x667eea, 0x764ba2, 0x764ba2, 1, 1, 1, 1);
        bg.fillRect(0, 0, width, height);
        
        this.laneWidth = width / 3;
        
        // Ground
        this.groundTiles = [];
        for (let i = 0; i < 8; i++) {
          const tile = this.add.tileSprite(width / 2, height - 200 + (i * 120), width * 0.8, 120, 'ground');
          tile.setAlpha(0.8);
          this.groundTiles.push(tile);
        }
        
        // Lane lines
        const leftLine = this.add.rectangle(this.laneWidth, 0, 6, height, 0x00D9FF, 0.5).setOrigin(0.5, 0);
        const rightLine = this.add.rectangle(this.laneWidth * 2, 0, 6, height, 0x00D9FF, 0.5).setOrigin(0.5, 0);
        
        this.tweens.add({
          targets: [leftLine, rightLine],
          alpha: 0.2,
          duration: 1000,
          yoyo: true,
          repeat: -1,
        });
        
        // Player
        this.player = this.add.sprite(this.getLaneX(1), height - 220, 'player');
        this.player.setScale(0.9);
        this.player.setDepth(100);
        
        this.tweens.add({
          targets: this.player,
          y: height - 222,
          duration: 100,
          yoyo: true,
          repeat: -1,
        });
        
        // UI
        this.createUI();
        
        // Groups
        this.obstaclesGroup = this.add.group();
        this.coinsGroup = this.add.group();
        
        // Particles
        this.particles = this.add.particles('particle');
        
        // Controls
        this.setupControls();
        
        this.showIntro();
      }

      createUI() {
        const { width, height } = this.scale;
        
        // Top panel
        const panel = this.add.graphics();
        panel.fillStyle(0x000000, 0.4);
        panel.fillRoundedRect(10, 10, width - 20, 150, 20);
        panel.lineStyle(2, 0xFFFFFF, 0.2);
        panel.strokeRoundedRect(10, 10, width - 20, 150, 20);
        panel.setDepth(900);
        
        // Username
        const userBadge = this.add.graphics();
        userBadge.fillStyle(0x00D9FF, 0.3);
        userBadge.fillRoundedRect(25, 25, 220, 45, 12);
        userBadge.lineStyle(2, 0x00D9FF, 0.6);
        userBadge.strokeRoundedRect(25, 25, 220, 45, 12);
        userBadge.setDepth(901);
        
        this.add.text(35, 47, `👤 ${this.username}`, {
          fontSize: '22px',
          color: '#FFFFFF',
          fontFamily: 'Arial',
          fontStyle: 'bold',
        }).setOrigin(0, 0.5).setDepth(902);
        
        // Stats
        const statsY = 95;
        const statsSpacing = (width - 80) / 3;
        
        this.add.text(40, statsY, 'SCORE', {
          fontSize: '14px',
          color: '#FFFFFF',
          fontFamily: 'Arial',
          alpha: 0.7,
        }).setDepth(901);
        
        this.scoreText = this.add.text(40, statsY + 25, '0', {
          fontSize: '36px',
          color: '#FFD700',
          fontFamily: 'Arial',
          fontStyle: 'bold',
        }).setDepth(901);
        
        this.add.text(40 + statsSpacing, statsY, 'TIME', {
          fontSize: '14px',
          color: '#FFFFFF',
          fontFamily: 'Arial',
          alpha: 0.7,
        }).setDepth(901);
        
        this.timeText = this.add.text(40 + statsSpacing, statsY + 25, '0:00', {
          fontSize: '36px',
          color: '#00D9FF',
          fontFamily: 'Arial',
          fontStyle: 'bold',
        }).setDepth(901);
        
        this.add.text(40 + statsSpacing * 2, statsY, 'LEVEL', {
          fontSize: '14px',
          color: '#FFFFFF',
          fontFamily: 'Arial',
          alpha: 0.7,
        }).setDepth(901);
        
        this.levelText = this.add.text(40 + statsSpacing * 2, statsY + 25, '1', {
          fontSize: '36px',
          color: '#9D4EDD',
          fontFamily: 'Arial',
          fontStyle: 'bold',
        }).setDepth(901);
        
        // Coins badge
        const coinBadge = this.add.graphics();
        coinBadge.fillStyle(0xFFD700, 0.3);
        coinBadge.fillRoundedRect(20, height - 80, 160, 60, 15);
        coinBadge.lineStyle(2, 0xFFD700, 0.6);
        coinBadge.strokeRoundedRect(20, height - 80, 160, 60, 15);
        coinBadge.setDepth(900);
        
        this.add.text(35, height - 50, '💰', {
          fontSize: '32px',
        }).setOrigin(0, 0.5).setDepth(901);
        
        this.coinText = this.add.text(80, height - 50, '0', {
          fontSize: '32px',
          color: '#FFD700',
          fontFamily: 'Arial',
          fontStyle: 'bold',
        }).setOrigin(0, 0.5).setDepth(901);
        
        // Distance badge
        const distBadge = this.add.graphics();
        distBadge.fillStyle(0x00D9FF, 0.3);
        distBadge.fillRoundedRect(width - 180, height - 80, 160, 60, 15);
        distBadge.lineStyle(2, 0x00D9FF, 0.6);
        distBadge.strokeRoundedRect(width - 180, height - 80, 160, 60, 15);
        distBadge.setDepth(900);
        
        this.add.text(width - 100, height - 65, 'DISTANCE', {
          fontSize: '12px',
          color: '#FFFFFF',
          fontFamily: 'Arial',
          alpha: 0.7,
        }).setOrigin(0.5).setDepth(901);
        
        this.distanceText = this.add.text(width - 100, height - 40, '0m', {
          fontSize: '28px',
          color: '#FFFFFF',
          fontFamily: 'Arial',
          fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(901);
      }

      setupControls() {
        this.input.on('pointerdown', (pointer) => {
          this.swipeStartX = pointer.x;
          this.swipeStartY = pointer.y;
        });
        
        this.input.on('pointerup', (pointer) => {
          if (!this.started || this.gameOver) return;
          
          const diffX = pointer.x - this.swipeStartX;
          const diffY = pointer.y - this.swipeStartY;
          
          if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
            if (diffX > 0) this.moveRight();
            else this.moveLeft();
          } else if (diffY < -50) {
            this.jump();
          }
        });
        
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keyA = this.input.keyboard.addKey('A');
        this.keyD = this.input.keyboard.addKey('D');
        this.keyW = this.input.keyboard.addKey('W');
      }

      getLaneX(lane) {
        return (lane * this.laneWidth) + (this.laneWidth / 2);
      }

      showIntro() {
        const { width, height } = this.scale;
        
        const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.85).setOrigin(0).setDepth(1000);
        
        const card = this.add.graphics();
        card.fillStyle(0xFFFFFF, 0.15);
        card.fillRoundedRect(width/2 - 300, height/2 - 250, 600, 500, 25);
        card.lineStyle(3, 0xFFFFFF, 0.3);
        card.strokeRoundedRect(width/2 - 300, height/2 - 250, 600, 500, 25);
        card.setDepth(1001);
        
        const title = this.add.text(width / 2, height / 2 - 150, '🏎️ GLASS RACER 🏎️', {
          fontSize: '56px',
          color: '#FFFFFF',
          fontFamily: 'Arial',
          fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(1002);
        
        this.tweens.add({
          targets: title,
          alpha: 0.7,
          duration: 1000,
          yoyo: true,
          repeat: -1,
        });
        
        const instructions = this.add.text(width / 2, height / 2 - 30,
          'CONTROLS:\n\n' +
          'SWIPE LEFT/RIGHT - Change Lanes\n' +
          'SWIPE UP - Jump over obstacles\n\n' +
          'KEYBOARD:\n' +
          'Arrow Keys: ← → ↑\n' +
          'WASD Keys: A D W\n\n' +
          'Avoid red cars & purple rocks!\n' +
          'Collect golden orbs for points!',
          {
            fontSize: '20px',
            color: '#FFFFFF',
            fontFamily: 'Arial',
            align: 'center',
            lineSpacing: 10,
          }
        ).setOrigin(0.5).setDepth(1002);
        
        const btn = this.add.graphics();
        btn.fillStyle(0x00D9FF, 0.6);
        btn.fillRoundedRect(width/2 - 120, height/2 + 180, 240, 70, 15);
        btn.lineStyle(3, 0x00D9FF, 0.9);
        btn.strokeRoundedRect(width/2 - 120, height/2 + 180, 240, 70, 15);
        btn.setDepth(1001);
        btn.setInteractive(
          new Phaser.Geom.Rectangle(width/2 - 120, height/2 + 180, 240, 70),
          Phaser.Geom.Rectangle.Contains
        );
        
        const btnText = this.add.text(width / 2, height / 2 + 215, '▶ START RACE', {
          fontSize: '28px',
          color: '#FFFFFF',
          fontFamily: 'Arial',
          fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(1002);
        
        btn.on('pointerover', () => {
          btn.clear();
          btn.fillStyle(0x00FFFF, 0.8);
          btn.fillRoundedRect(width/2 - 120, height/2 + 180, 240, 70, 15);
          btn.lineStyle(3, 0x00FFFF, 1);
          btn.strokeRoundedRect(width/2 - 120, height/2 + 180, 240, 70, 15);
        });
        
        btn.on('pointerout', () => {
          btn.clear();
          btn.fillStyle(0x00D9FF, 0.6);
          btn.fillRoundedRect(width/2 - 120, height/2 + 180, 240, 70, 15);
          btn.lineStyle(3, 0x00D9FF, 0.9);
          btn.strokeRoundedRect(width/2 - 120, height/2 + 180, 240, 70, 15);
        });
        
        btn.on('pointerdown', () => {
          overlay.destroy();
          card.destroy();
          title.destroy();
          instructions.destroy();
          btn.destroy();
          btnText.destroy();
          this.startGame();
        });
      }

      startGame() {
        console.log("🎮 Game started!");
        this.started = true;
        this.startTime = this.time.now;
        
        this.obstacleTimer = this.time.addEvent({
          delay: 2000,
          callback: this.spawnObstacle,
          callbackScope: this,
          loop: true,
        });
        
        this.coinTimer = this.time.addEvent({
          delay: 1800,
          callback: this.spawnCoin,
          callbackScope: this,
          loop: true,
        });
        
        this.levelTimer = this.time.addEvent({
          delay: 30000,
          callback: () => {
            this.level++;
            this.currentSpeed = Math.min(this.currentSpeed + 40, 550);
            this.levelText.setText(this.level);
            this.showLevelUp();
          },
          callbackScope: this,
          loop: true,
        });
      }

      showLevelUp() {
        const { width, height } = this.scale;
        
        const levelUpText = this.add.text(width / 2, height / 2, `LEVEL ${this.level}!`, {
          fontSize: '72px',
          color: '#FFD700',
          fontFamily: 'Arial',
          fontStyle: 'bold',
          stroke: '#000',
          strokeThickness: 8,
        }).setOrigin(0.5).setDepth(3000).setAlpha(0);
        
        this.tweens.add({
          targets: levelUpText,
          alpha: 1,
          scale: 1.3,
          duration: 400,
          yoyo: true,
          onComplete: () => levelUpText.destroy()
        });
      }

      moveLeft() {
        if (this.isMoving || this.currentLane <= 0) return;
        this.isMoving = true;
        this.currentLane--;
        
        this.tweens.add({
          targets: this.player,
          x: this.getLaneX(this.currentLane),
          duration: 150,
          ease: 'Quad.easeOut',
          onComplete: () => { this.isMoving = false; }
        });
      }

      moveRight() {
        if (this.isMoving || this.currentLane >= 2) return;
        this.isMoving = true;
        this.currentLane++;
        
        this.tweens.add({
          targets: this.player,
          x: this.getLaneX(this.currentLane),
          duration: 150,
          ease: 'Quad.easeOut',
          onComplete: () => { this.isMoving = false; }
        });
      }

      jump() {
        if (this.player.isJumping) return;
        this.player.isJumping = true;
        const startY = this.player.y;
        
        this.tweens.add({
          targets: this.player,
          y: startY - 120,
          duration: 350,
          ease: 'Quad.easeOut',
          yoyo: true,
          onComplete: () => { this.player.isJumping = false; }
        });
      }

      spawnObstacle() {
        if (!this.started || this.gameOver) return;
        
        const lane = Phaser.Math.Between(0, 2);
        const x = this.getLaneX(lane);
        const { height } = this.scale;
        
        const isCar = Math.random() > 0.4;
        const obs = this.add.sprite(x, -100, isCar ? 'car' : 'rock');
        obs.setData('lane', lane);
        obs.setScale(0.8);
        this.obstaclesGroup.add(obs);
        
        this.tweens.add({
          targets: obs,
          y: height + 100,
          duration: Math.max(1500, 2500 - (this.level * 80)),
          ease: 'Linear',
          onComplete: () => {
            if (obs.active) obs.destroy();
          }
        });
      }

      spawnCoin() {
        if (!this.started || this.gameOver) return;
        
        const lane = Phaser.Math.Between(0, 2);
        const x = this.getLaneX(lane);
        const { height } = this.scale;
        
        const coin = this.add.sprite(x, -100, 'coin');
        coin.setData('lane', lane);
        coin.setData('collected', false);
        coin.setScale(0.8);
        coin.setDepth(50);
        this.coinsGroup.add(coin);
        
        this.tweens.add({
          targets: coin,
          angle: 360,
          duration: 1500,
          repeat: -1,
        });
        
        this.tweens.add({
          targets: coin,
          scale: 0.9,
          duration: 800,
          yoyo: true,
          repeat: -1,
        });
        
        this.tweens.add({
          targets: coin,
          y: height + 100,
          duration: Math.max(1500, 2500 - (this.level * 80)),
          ease: 'Linear',
          onComplete: () => {
            if (coin.active && !coin.getData('collected')) {
              coin.destroy();
            }
          }
        });
      }

      checkCollisions() {
        // CRITICAL: Don't check if game is paused or over
        if (!this.started || this.gameOver || this.isPaused) return;
        
        const playerY = this.player.y;
        const playerLane = this.currentLane;
        
        // Check obstacles
        this.obstaclesGroup.children.entries.forEach((obs) => {
          if (!obs.active) return;
          
          const obsY = obs.y;
          const obsLane = obs.getData('lane');
          
          if (obsLane === playerLane && Math.abs(obsY - playerY) < 60) {
            if (!this.player.isJumping) {
              this.hitObstacle();
            }
          }
        });
        
        // Check coins - FIXED: No async, no pause, just instant collection
        const coinsToCollect = [];
        
        this.coinsGroup.children.entries.forEach((coin) => {
          if (!coin.active || coin.getData('collected')) return;
          
          const coinY = coin.y;
          const coinLane = coin.getData('lane');
          
          if (coinLane === playerLane && Math.abs(coinY - playerY) < 55) {
            coinsToCollect.push(coin);
          }
        });
        
        // Process all coin collections in one go
        coinsToCollect.forEach((coin) => {
          this.collectCoin(coin);
        });
      }

      collectCoin(coin) {
        // CRITICAL: Mark as collected FIRST to prevent re-collection
        coin.setData('collected', true);
        
        // Particle burst (non-blocking)
        const emitter = this.particles.createEmitter({
          x: coin.x,
          y: coin.y,
          speed: { min: 100, max: 300 },
          angle: { min: 0, max: 360 },
          scale: { start: 1.5, end: 0 },
          alpha: { start: 1, end: 0 },
          tint: 0xFFD700,
          lifespan: 600,
          blendMode: 'ADD',
          quantity: 20,
        });
        emitter.explode();
        
        // Floating +10 text (non-blocking)
        const plusText = this.add.text(coin.x, coin.y, '+10', {
          fontSize: '32px',
          color: '#FFD700',
          fontFamily: 'Arial',
          fontStyle: 'bold',
          stroke: '#000',
          strokeThickness: 4,
        }).setOrigin(0.5).setDepth(200);
        
        this.tweens.add({
          targets: plusText,
          y: coin.y - 80,
          alpha: 0,
          duration: 800,
          ease: 'Quad.easeOut',
          onComplete: () => plusText.destroy()
        });
        
        // Score pop (non-blocking)
        this.tweens.add({
          targets: this.scoreText,
          scale: 1.2,
          duration: 100,
          yoyo: true,
          ease: 'Quad.easeOut',
        });
        
        // Coin badge pulse (non-blocking)
        this.tweens.add({
          targets: this.coinText,
          scale: 1.3,
          duration: 100,
          yoyo: true,
          ease: 'Back.easeOut',
        });
        
        // Update score (INSTANT - no database)
        this.coinsCollected++;
        this.score += 10;
        
        // Update UI (INSTANT)
        this.scoreText.setText(this.score);
        this.coinText.setText(this.coinsCollected);
        
        // Destroy coin (INSTANT)
        coin.destroy();
        
        // Clean up emitter after animation
        this.time.delayedCall(600, () => emitter.remove());
        
        // CRITICAL: DO NOT PAUSE, DO NOT STOP, GAME CONTINUES!
      }

      hitObstacle() {
        if (this.gameOver) return;
        
        console.log("💥 Game over!");
        this.gameOver = true;
        
        this.player.setTint(0xFF0000);
        this.cameras.main.shake(300, 0.02);
        
        const explosion = this.particles.createEmitter({
          x: this.player.x,
          y: this.player.y,
          speed: { min: 200, max: 500 },
          angle: { min: 0, max: 360 },
          scale: { start: 2, end: 0 },
          tint: [0xFF0000, 0xFF6600, 0xFFFF00],
          lifespan: 1000,
          blendMode: 'ADD',
          quantity: 40,
        });
        explosion.explode();
        
        if (this.obstacleTimer) this.obstacleTimer.destroy();
        if (this.coinTimer) this.coinTimer.destroy();
        if (this.levelTimer) this.levelTimer.destroy();
        
        this.time.delayedCall(600, () => explosion.remove());
        
        this.showGameOver();
      }

      async showGameOver() {
        const { width, height } = this.scale;
        
        const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.9)
          .setOrigin(0).setDepth(2000);
        
        const card = this.add.graphics();
        card.fillStyle(0xFFFFFF, 0.15);
        card.fillRoundedRect(width/2 - 300, height/2 - 220, 600, 440, 25);
        card.lineStyle(3, 0xFFFFFF, 0.3);
        card.strokeRoundedRect(width/2 - 300, height/2 - 220, 600, 440, 25);
        card.setDepth(2001);
        
        this.add.text(width / 2, height / 2 - 140, '🏁 RACE FINISHED! 🏁', {
          fontSize: '48px',
          color: '#FFD700',
          fontFamily: 'Arial',
          fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(2002);
        
        this.add.text(width / 2, height / 2 - 40,
          `Final Score: ${this.score}\n` +
          `Coins Collected: ${this.coinsCollected}\n` +
          `Distance: ${Math.floor(this.distance)}m\n` +
          `Level Reached: ${this.level}\n` +
          `Time: ${this.formatTime(this.gameTime)}`,
          {
            fontSize: '28px',
            color: '#FFFFFF',
            fontFamily: 'Arial',
            align: 'center',
            lineSpacing: 16,
          }
        ).setOrigin(0.5).setDepth(2002);
        
        console.log("💾 Saving to database...");
        try {
          await gameAPI.updateScore({
            score: this.score,
            coinsCollected: this.coinsCollected,
            timeSpent: Math.floor(this.gameTime),
            completed: true,
          });
          console.log("✅ Score saved!");
        } catch (error) {
          console.error("❌ Save failed:", error);
        }
        
        this.time.delayedCall(3500, () => {
          if (window.onGameComplete) {
            window.onGameComplete({
              score: this.score,
              coins: this.coinsCollected,
              distance: Math.floor(this.distance),
              level: this.level,
              time: this.gameTime,
            });
          }
        });
      }

      formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
      }

      update(time, delta) {
        // CRITICAL: Check for pause/game over before processing
        if (!this.started || this.gameOver || this.isPaused) return;
        
        this.gameTime = (this.time.now - this.startTime) / 1000;
        this.timeText.setText(this.formatTime(this.gameTime));
        
        this.groundTiles.forEach((tile) => {
          tile.tilePositionY -= this.currentSpeed * delta * 0.001;
        });
        
        this.distance += this.currentSpeed * delta * 0.001;
        this.distanceText.setText(Math.floor(this.distance) + 'm');
        
        // CRITICAL: Collision check is non-blocking
        this.checkCollisions();
        
        if (Phaser.Input.Keyboard.JustDown(this.cursors.left) || 
            Phaser.Input.Keyboard.JustDown(this.keyA)) {
          this.moveLeft();
        }
        if (Phaser.Input.Keyboard.JustDown(this.cursors.right) || 
            Phaser.Input.Keyboard.JustDown(this.keyD)) {
          this.moveRight();
        }
        if (Phaser.Input.Keyboard.JustDown(this.cursors.up) || 
            Phaser.Input.Keyboard.JustDown(this.keyW)) {
          this.jump();
        }
      }

      pauseGame() {
        if (!this.started || this.gameOver) return;
        this.isPaused = true;
        this.scene.pause();
      }

      resumeGame() {
        if (!this.started || this.gameOver) return;
        this.isPaused = false;
        this.scene.resume();
      }
    }

    const config = {
      type: Phaser.AUTO,
      width: window.innerWidth,
      height: window.innerHeight,
      parent: "phaser-container",
      backgroundColor: "#667eea",
      scene: MainScene,
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
    };

    console.log("🎮 Initializing Glass Racer...");
    gameRef.current = new Phaser.Game(config);
    sceneRef.current = gameRef.current.scene.scenes[0];
    
    setTimeout(() => {
      setGameState((prev) => ({ ...prev, isLoading: false }));
    }, 500);

    window.onGameComplete = async (results) => {
      try {
        const response = await gameAPI.getStats();
        if (response.data.success) {
          updateUser({ totalPoints: response.data.data.totalPoints });
        }
      } catch (error) {
        console.error("Failed to update stats:", error);
      }
      
      setTimeout(() => navigate("/dashboard"), 500);
    };

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
      window.onGameComplete = null;
    };
  }, [navigate, updateUser, user]);

  const handlePause = () => {
    if (sceneRef.current) {
      sceneRef.current.pauseGame();
      setGameState((prev) => ({ ...prev, isPaused: true }));
    }
  };

  const handleResume = () => {
    if (sceneRef.current) {
      sceneRef.current.resumeGame();
      setGameState((prev) => ({ ...prev, isPaused: false }));
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {gameState.isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-50 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500">
          <div className="text-center backdrop-blur-md bg-white/10 p-12 rounded-3xl border-2 border-white/30">
            <div className="text-7xl mb-6 animate-bounce">🏎️</div>
            <div className="text-3xl text-white font-bold">
              Loading Glass Racer...
            </div>
          </div>
        </div>
      )}

      <div id="phaser-container" className="w-full h-full"></div>

      {gameState.isPaused && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-40">
          <div className="bg-white/20 backdrop-blur-xl p-10 rounded-3xl border-2 border-white/30 shadow-2xl">
            <h2 className="text-5xl font-bold text-white mb-8 text-center">⏸️ PAUSED</h2>
            <div className="space-y-4">
              <button 
                onClick={handleResume}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 px-10 rounded-2xl text-xl transition-all transform hover:scale-105 shadow-lg"
              >
                ▶️ Resume Race
              </button>
              <button
                onClick={() => navigate("/dashboard")}
                className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-bold py-4 px-10 rounded-2xl text-xl transition-all transform hover:scale-105 shadow-lg"
              >
                🚪 Quit to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {!gameState.isLoading && !gameState.isPaused && (
        <button
          onClick={handlePause}
          className="absolute top-6 right-6 bg-white/20 backdrop-blur-md hover:bg-white/30 text-white p-4 rounded-2xl z-30 text-2xl transition-all transform hover:scale-110 border-2 border-white/30 shadow-lg"
        >
          ⏸️
        </button>
      )}
    </div>
  );
};

export default Game;
