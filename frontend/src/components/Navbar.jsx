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
    finalScore: 0,
    coins: 0,
    distance: 0,
    time: 0,
    level: 1,
  });

  useEffect(() => {
    if (gameRef.current) return;

    // ============================================================
    // MAIN GAME SCENE - Professional Glassmorphic Design
    // ============================================================
    class MainScene extends Phaser.Scene {
      constructor() {
        super({ key: "MainScene" });
        this.player = null;
        this.score = 0;
        this.coins = 0;
        this.distance = 0;
        this.gameTime = 0;
        this.level = 1;
        this.gameOver = false;
        this.started = false;
        this.isPaused = false;
        this.baseSpeed = 280;
        this.currentSpeed = 280;
        this.currentLane = 1;
        this.laneWidth = 0;
        this.isMoving = false;
        this.username = user?.username || user?.firstName || "Player";
      }

      preload() {
        console.log("Creating glassmorphic graphics...");
        this.createGlassyGraphics();
      }

      createGlassyGraphics() {
        const g = this.make.graphics({ add: false });
        
        // ============================================================
        // PLAYER CAR - Sleek Sports Car
        // ============================================================
        g.clear();
        
        // Car body - gradient glass effect
        g.fillStyle(0x00D9FF, 1); // Cyan glass
        g.fillRoundedRect(5, 10, 50, 80, 12);
        
        // Windshield - darker glass
        g.fillStyle(0x0088AA, 0.8);
        g.fillRoundedRect(15, 20, 30, 25, 8);
        
        // Wheels - glossy black
        g.fillStyle(0x1a1a1a, 1);
        g.fillCircle(15, 15, 8);
        g.fillCircle(45, 15, 8);
        g.fillCircle(15, 75, 8);
        g.fillCircle(45, 75, 8);
        
        // Wheel shine
        g.fillStyle(0x666666, 1);
        g.fillCircle(15, 15, 4);
        g.fillCircle(45, 15, 4);
        g.fillCircle(15, 75, 4);
        g.fillCircle(45, 75, 4);
        
        // Hood stripe
        g.fillStyle(0x00FFFF, 0.6);
        g.fillRoundedRect(25, 50, 10, 30, 4);
        
        // Headlights glow
        g.fillStyle(0xFFFFFF, 0.9);
        g.fillCircle(18, 85, 4);
        g.fillCircle(42, 85, 4);
        
        g.generateTexture('player', 60, 90);
        
        // ============================================================
        // OBSTACLE CAR - Red Glass Sports Car
        // ============================================================
        g.clear();
        
        // Car body - red glass
        g.fillStyle(0xFF3366, 1);
        g.fillRoundedRect(5, 10, 50, 80, 12);
        
        // Windshield
        g.fillStyle(0xAA0022, 0.8);
        g.fillRoundedRect(15, 20, 30, 25, 8);
        
        // Wheels
        g.fillStyle(0x1a1a1a, 1);
        g.fillCircle(15, 15, 8);
        g.fillCircle(45, 15, 8);
        g.fillCircle(15, 75, 8);
        g.fillCircle(45, 75, 8);
        
        // Wheel shine
        g.fillStyle(0x666666, 1);
        g.fillCircle(15, 15, 4);
        g.fillCircle(45, 15, 4);
        g.fillCircle(15, 75, 4);
        g.fillCircle(45, 75, 4);
        
        // Racing stripe
        g.fillStyle(0xFFFFFF, 0.5);
        g.fillRoundedRect(25, 40, 10, 40, 4);
        
        // Taillights
        g.fillStyle(0xFF0000, 0.9);
        g.fillCircle(18, 13, 3);
        g.fillCircle(42, 13, 3);
        
        g.generateTexture('obstacle_car', 60, 90);
        
        // ============================================================
        // OBSTACLE ROCK - Glass Crystal
        // ============================================================
        g.clear();
        
        // Main crystal - purple glass
        g.fillStyle(0x9D4EDD, 1);
        g.beginPath();
        g.moveTo(40, 10);
        g.lineTo(70, 40);
        g.lineTo(60, 70);
        g.lineTo(20, 70);
        g.lineTo(10, 40);
        g.closePath();
        g.fillPath();
        
        // Inner glow
        g.fillStyle(0xC77DFF, 0.6);
        g.beginPath();
        g.moveTo(40, 20);
        g.lineTo(60, 40);
        g.lineTo(50, 60);
        g.lineTo(30, 60);
        g.lineTo(20, 40);
        g.closePath();
        g.fillPath();
        
        // Shine spot
        g.fillStyle(0xFFFFFF, 0.4);
        g.fillCircle(45, 30, 8);
        
        g.generateTexture('obstacle_rock', 80, 80);
        
        // ============================================================
        // COIN - Glass Orb with Glow
        // ============================================================
        g.clear();
        
        // Outer glow
        g.fillStyle(0xFFD700, 0.3);
        g.fillCircle(25, 25, 22);
        
        // Main orb - golden glass
        g.fillStyle(0xFFD700, 1);
        g.fillCircle(25, 25, 18);
        
        // Inner shine
        g.fillStyle(0xFFF4A3, 0.8);
        g.fillCircle(25, 25, 12);
        
        // Highlight
        g.fillStyle(0xFFFFFF, 0.6);
        g.fillCircle(20, 20, 6);
        
        // Crown symbol
        g.lineStyle(3, 0xFFAA00, 1);
        g.strokeTriangle(18, 22, 25, 15, 32, 22);
        g.strokeRect(16, 22, 18, 8);
        
        g.generateTexture('coin', 50, 50);
        
        // ============================================================
        // GROUND TILE - Glass Road
        // ============================================================
        g.clear();
        
        // Road base - dark glass
        g.fillStyle(0x2D3142, 0.9);
        g.fillRect(0, 0, 100, 100);
        
        // Grid lines - glowing
        g.lineStyle(2, 0x00D9FF, 0.3);
        g.strokeRect(0, 0, 100, 100);
        g.moveTo(0, 50);
        g.lineTo(100, 50);
        g.strokePath();
        g.moveTo(50, 0);
        g.lineTo(50, 100);
        g.strokePath();
        
        // Center glow
        g.fillStyle(0x4A5568, 0.5);
        g.fillCircle(50, 50, 15);
        
        g.generateTexture('ground', 100, 100);
        
        // ============================================================
        // PARTICLE - Glow Dot
        // ============================================================
        g.clear();
        g.fillStyle(0x00D9FF, 0.8);
        g.fillCircle(5, 5, 5);
        g.fillStyle(0xFFFFFF, 0.4);
        g.fillCircle(5, 5, 3);
        g.generateTexture('particle', 10, 10);
        
        g.destroy();
        console.log("Glassmorphic graphics created!");
      }

      create() {
        const { width, height } = this.scale;
        
        // ============================================================
        // BACKGROUND - Gradient Glass Effect
        // ============================================================
        
        // Sky gradient
        const gradient = this.add.graphics();
        gradient.fillGradientStyle(0x667eea, 0x667eea, 0x764ba2, 0x764ba2, 1, 1, 1, 1);
        gradient.fillRect(0, 0, width, height);
        
        // Floating particles background
        this.particles = this.add.particles('particle');
        this.particles.createEmitter({
          x: { min: 0, max: width },
          y: { min: -50, max: 0 },
          speedY: { min: 50, max: 150 },
          lifespan: 8000,
          frequency: 200,
          scale: { start: 0.8, end: 0.3 },
          alpha: { start: 0.3, end: 0 },
          blendMode: 'ADD',
        });
        
        // ============================================================
        // LANE SYSTEM
        // ============================================================
        
        this.laneWidth = width / 3;
        
        // Ground tiles with glass effect
        this.groundTiles = [];
        for (let i = 0; i < 8; i++) {
          const tile = this.add.tileSprite(
            width / 2,
            height - 200 + (i * 120),
            width * 0.8,
            120,
            'ground'
          );
          tile.setAlpha(0.8);
          this.groundTiles.push(tile);
        }
        
        // Lane dividers - glowing glass lines
        const leftLine = this.add.rectangle(this.laneWidth, 0, 6, height, 0x00D9FF, 0.4)
          .setOrigin(0.5, 0);
        const rightLine = this.add.rectangle(this.laneWidth * 2, 0, 6, height, 0x00D9FF, 0.4)
          .setOrigin(0.5, 0);
        
        // Glowing effect
        this.tweens.add({
          targets: [leftLine, rightLine],
          alpha: 0.2,
          duration: 1000,
          yoyo: true,
          repeat: -1,
        });
        
        // ============================================================
        // PLAYER CAR
        // ============================================================
        
        this.player = this.add.sprite(
          this.getLaneX(1),
          height - 220,
          'player'
        );
        this.player.setScale(0.9);
        this.player.setDepth(100);
        
        // Car engine vibration effect
        this.tweens.add({
          targets: this.player,
          y: height - 222,
          duration: 100,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
        
        // ============================================================
        // UI - GLASSMORPHIC DESIGN
        // ============================================================
        
        this.createGlassUI();
        
        // ============================================================
        // GROUPS
        // ============================================================
        
        this.obstacles = this.add.group();
        this.coins = this.add.group();
        
        // ============================================================
        // INPUT HANDLERS
        // ============================================================
        
        this.setupControls();
        
        // ============================================================
        // SHOW INTRO
        // ============================================================
        
        this.showIntro();
      }

      createGlassUI() {
        const { width, height } = this.scale;
        
        // Top glass panel background
        const topPanel = this.add.graphics();
        topPanel.fillStyle(0x000000, 0.3);
        topPanel.fillRoundedRect(10, 10, width - 20, 140, 20);
        topPanel.setDepth(900);
        
        // Glass effect border
        topPanel.lineStyle(2, 0xFFFFFF, 0.2);
        topPanel.strokeRoundedRect(10, 10, width - 20, 140, 20);
        
        // Username with glass badge
        const userBadge = this.add.graphics();
        userBadge.fillStyle(0x00D9FF, 0.3);
        userBadge.fillRoundedRect(25, 25, 200, 40, 12);
        userBadge.lineStyle(2, 0x00D9FF, 0.6);
        userBadge.strokeRoundedRect(25, 25, 200, 40, 12);
        userBadge.setDepth(901);
        
        this.usernameText = this.add.text(35, 45, `👤 ${this.username}`, {
          fontSize: '20px',
          color: '#FFFFFF',
          fontFamily: 'Arial',
          fontStyle: 'bold',
        }).setOrigin(0, 0.5).setDepth(902);
        
        // Stats row
        const statsY = 85;
        const statsSpacing = (width - 60) / 3;
        
        // Score glass container
        this.createStatBadge(30, statsY, 'SCORE', 903);
        this.scoreText = this.add.text(30 + 80, statsY + 20, '0', {
          fontSize: '28px',
          color: '#FFD700',
          fontFamily: 'Arial',
          fontStyle: 'bold',
        }).setOrigin(0, 0.5).setDepth(904);
        
        // Time glass container
        this.createStatBadge(30 + statsSpacing, statsY, 'TIME', 903);
        this.timeText = this.add.text(30 + statsSpacing + 80, statsY + 20, '0:00', {
          fontSize: '28px',
          color: '#00D9FF',
          fontFamily: 'Arial',
          fontStyle: 'bold',
        }).setOrigin(0, 0.5).setDepth(904);
        
        // Level glass container
        this.createStatBadge(30 + statsSpacing * 2, statsY, 'LEVEL', 903);
        this.levelText = this.add.text(30 + statsSpacing * 2 + 80, statsY + 20, '1', {
          fontSize: '28px',
          color: '#9D4EDD',
          fontFamily: 'Arial',
          fontStyle: 'bold',
        }).setOrigin(0, 0.5).setDepth(904);
        
        // Coins counter (bottom left glass badge)
        const coinBadge = this.add.graphics();
        coinBadge.fillStyle(0xFFD700, 0.3);
        coinBadge.fillRoundedRect(20, height - 80, 150, 60, 15);
        coinBadge.lineStyle(2, 0xFFD700, 0.6);
        coinBadge.strokeRoundedRect(20, height - 80, 150, 60, 15);
        coinBadge.setDepth(900);
        
        this.add.text(35, height - 50, '💰', {
          fontSize: '32px',
        }).setOrigin(0, 0.5).setDepth(901);
        
        this.coinText = this.add.text(75, height - 50, '0', {
          fontSize: '32px',
          color: '#FFD700',
          fontFamily: 'Arial',
          fontStyle: 'bold',
        }).setOrigin(0, 0.5).setDepth(901);
        
        // Distance (bottom right glass badge)
        const distBadge = this.add.graphics();
        distBadge.fillStyle(0x00D9FF, 0.3);
        distBadge.fillRoundedRect(width - 170, height - 80, 150, 60, 15);
        distBadge.lineStyle(2, 0x00D9FF, 0.6);
        distBadge.strokeRoundedRect(width - 170, height - 80, 150, 60, 15);
        distBadge.setDepth(900);
        
        this.distanceText = this.add.text(width - 85, height - 50, '0m', {
          fontSize: '28px',
          color: '#FFFFFF',
          fontFamily: 'Arial',
          fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(901);
      }

      createStatBadge(x, y, label, depth) {
        const badge = this.add.graphics();
        badge.fillStyle(0xFFFFFF, 0.15);
        badge.fillRoundedRect(x, y, 150, 50, 10);
        badge.lineStyle(1, 0xFFFFFF, 0.3);
        badge.strokeRoundedRect(x, y, 150, 50, 10);
        badge.setDepth(depth);
        
        this.add.text(x + 10, y + 8, label, {
          fontSize: '12px',
          color: '#FFFFFF',
          fontFamily: 'Arial',
          alpha: 0.6,
        }).setDepth(depth + 1);
      }

      setupControls() {
        // Touch controls
        this.input.on('pointerdown', (pointer) => {
          this.swipeStartX = pointer.x;
          this.swipeStartY = pointer.y;
          this.swipeStartTime = this.time.now;
        });
        
        this.input.on('pointerup', (pointer) => {
          if (!this.started || this.gameOver) return;
          
          const swipeTime = this.time.now - this.swipeStartTime;
          if (swipeTime > 500) return;
          
          const diffX = pointer.x - this.swipeStartX;
          const diffY = pointer.y - this.swipeStartY;
          
          if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
            if (diffX > 0) this.moveRight();
            else this.moveLeft();
          } else if (diffY < -50) {
            this.jump();
          }
        });
        
        // Keyboard
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
        
        // Glass overlay
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.7);
        overlay.fillRect(0, 0, width, height);
        overlay.setDepth(1000);
        
        // Glass card
        const card = this.add.graphics();
        card.fillStyle(0xFFFFFF, 0.15);
        card.fillRoundedRect(width/2 - 250, height/2 - 200, 500, 400, 25);
        card.lineStyle(3, 0xFFFFFF, 0.3);
        card.strokeRoundedRect(width/2 - 250, height/2 - 200, 500, 400, 25);
        card.setDepth(1001);
        
        // Title
        const title = this.add.text(width / 2, height / 2 - 130, 
          '🏎️ GLASS RACER 🏎️', {
            fontSize: '48px',
            color: '#FFFFFF',
            fontFamily: 'Arial',
            fontStyle: 'bold',
          }
        ).setOrigin(0.5).setDepth(1002);
        
        // Glow effect
        this.tweens.add({
          targets: title,
          alpha: 0.7,
          duration: 1000,
          yoyo: true,
          repeat: -1,
        });
        
        // Instructions
        const instructions = this.add.text(width / 2, height / 2 - 30,
          'SWIPE LEFT/RIGHT - Change Lanes\n' +
          'SWIPE UP - Jump\n\n' +
          'Arrow Keys: ← → ↑\n' +
          'WASD: A D W\n\n' +
          'Avoid cars & rocks!\n' +
          'Collect golden orbs!',
          {
            fontSize: '18px',
            color: '#FFFFFF',
            fontFamily: 'Arial',
            align: 'center',
            lineSpacing: 8,
          }
        ).setOrigin(0.5).setDepth(1002);
        
        // Start button - glass style
        const btnGraphics = this.add.graphics();
        btnGraphics.fillStyle(0x00D9FF, 0.5);
        btnGraphics.fillRoundedRect(width/2 - 100, height/2 + 130, 200, 60, 15);
        btnGraphics.lineStyle(3, 0x00D9FF, 0.8);
        btnGraphics.strokeRoundedRect(width/2 - 100, height/2 + 130, 200, 60, 15);
        btnGraphics.setDepth(1001);
        btnGraphics.setInteractive(
          new Phaser.Geom.Rectangle(width/2 - 100, height/2 + 130, 200, 60),
          Phaser.Geom.Rectangle.Contains
        );
        
        const btnText = this.add.text(width / 2, height / 2 + 160, '▶ START RACE', {
          fontSize: '24px',
          color: '#FFFFFF',
          fontFamily: 'Arial',
          fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(1002);
        
        btnGraphics.on('pointerover', () => {
          btnGraphics.clear();
          btnGraphics.fillStyle(0x00D9FF, 0.7);
          btnGraphics.fillRoundedRect(width/2 - 100, height/2 + 130, 200, 60, 15);
          btnGraphics.lineStyle(3, 0x00D9FF, 1);
          btnGraphics.strokeRoundedRect(width/2 - 100, height/2 + 130, 200, 60, 15);
        });
        
        btnGraphics.on('pointerout', () => {
          btnGraphics.clear();
          btnGraphics.fillStyle(0x00D9FF, 0.5);
          btnGraphics.fillRoundedRect(width/2 - 100, height/2 + 130, 200, 60, 15);
          btnGraphics.lineStyle(3, 0x00D9FF, 0.8);
          btnGraphics.strokeRoundedRect(width/2 - 100, height/2 + 130, 200, 60, 15);
        });
        
        btnGraphics.on('pointerdown', () => {
          overlay.destroy();
          card.destroy();
          title.destroy();
          instructions.destroy();
          btnGraphics.destroy();
          btnText.destroy();
          this.startGame();
        });
      }

      startGame() {
        console.log("Race started!");
        this.started = true;
        this.startTime = this.time.now;
        
        // Spawn obstacles
        this.time.addEvent({
          delay: 2000,
          callback: this.spawnObstacle,
          callbackScope: this,
          loop: true,
        });
        
        // Spawn coins
        this.time.addEvent({
          delay: 1800,
          callback: this.spawnCoin,
          callbackScope: this,
          loop: true,
        });
        
        // Level up every 30 seconds
        this.time.addEvent({
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
        const text = this.add.text(width / 2, height / 2, `LEVEL ${this.level}!`, {
          fontSize: '64px',
          color: '#FFD700',
          fontFamily: 'Arial',
          fontStyle: 'bold',
          stroke: '#000',
          strokeThickness: 8,
        }).setOrigin(0.5).setDepth(2000).setAlpha(0);
        
        this.tweens.add({
          targets: text,
          alpha: 1,
          scale: 1.2,
          duration: 500,
          yoyo: true,
          onComplete: () => text.destroy()
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
        
        // Random obstacle type
        const isCar = Math.random() > 0.4;
        const obs = this.add.sprite(x, -100, isCar ? 'obstacle_car' : 'obstacle_rock');
        obs.setData('lane', lane);
        obs.setScale(isCar ? 0.8 : 0.9);
        this.obstacles.add(obs);
        
        // Glow effect for obstacles
        const glow = this.add.circle(x, -100, 30, isCar ? 0xFF3366 : 0x9D4EDD, 0.3);
        glow.setBlendMode('ADD');
        
        this.tweens.add({
          targets: [obs, glow],
          y: height + 100,
          duration: 2200 - (this.level * 100),
          ease: 'Linear',
          onComplete: () => {
            obs.destroy();
            glow.destroy();
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
        coin.setScale(0.7);
        this.coins.add(coin);
        
        // Glow aura
        const glow = this.add.circle(x, -100, 25, 0xFFD700, 0.4);
        glow.setBlendMode('ADD');
        coin.setData('glow', glow);
        
        // Floating animation
        this.tweens.add({
          targets: coin,
          angle: 360,
          duration: 1500,
          repeat: -1,
        });
        
        // Pulse glow
        this.tweens.add({
          targets: glow,
          alpha: 0.2,
          scale: 1.2,
          duration: 800,
          yoyo: true,
          repeat: -1,
        });
        
        // Move down
        const moveTween = this.tweens.add({
          targets: [coin, glow],
          y: height + 100,
          duration: 2200 - (this.level * 100),
          ease: 'Linear',
          onComplete: () => {
            if (!coin.getData('collected')) {
              coin.destroy();
              glow.destroy();
            }
          }
        });
        
        coin.setData('moveTween', moveTween);
      }

      checkCollisions() {
        const playerY = this.player.y;
        const playerLane = this.currentLane;
        
        // Check obstacles
        this.obstacles.children.entries.forEach((obs) => {
          if (!obs.active) return;
          
          const obsY = obs.y;
          const obsLane = obs.getData('lane');
          
          if (obsLane === playerLane && Math.abs(obsY - playerY) < 70) {
            if (!this.player.isJumping) {
              this.hitObstacle();
            }
          }
        });
        
        // Check coins - FIXED: Prevent stuck collection
        this.coins.children.entries.forEach((coin) => {
          if (!coin.active || coin.getData('collected')) return;
          
          const coinY = coin.y;
          const coinLane = coin.getData('lane');
          
          if (coinLane === playerLane && Math.abs(coinY - playerY) < 60) {
            // Mark as collected immediately to prevent re-collection
            coin.setData('collected', true);
            
            const glow = coin.getData('glow');
            const moveTween = coin.getData('moveTween');
            
            // Stop movement
            if (moveTween) moveTween.stop();
            
            // Burst effect
            const burst = this.add.particles('particle');
            burst.createEmitter({
              x: coin.x,
              y: coin.y,
              speed: { min: 100, max: 200 },
              lifespan: 600,
              quantity: 15,
              scale: { start: 1, end: 0 },
              tint: 0xFFD700,
              blendMode: 'ADD',
              on: false,
            }).explode();
            
            this.time.delayedCall(600, () => burst.destroy());
            
            // Destroy immediately
            coin.destroy();
            if (glow) glow.destroy();
            
            // Update score
            this.coins++;
            this.score += 10;
            this.scoreText.setText(this.score);
            this.coinText.setText(this.coins);
            
            // Score pop animation
            this.tweens.add({
              targets: this.scoreText,
              scale: 1.3,
              duration: 100,
              yoyo: true,
            });
          }
        });
      }

      hitObstacle() {
        if (this.gameOver) return;
        this.gameOver = true;
        
        this.player.setTint(0xFF0000);
        this.cameras.main.shake(300, 0.02);
        
        // Explosion effect
        const explosion = this.add.particles('particle');
        explosion.createEmitter({
          x: this.player.x,
          y: this.player.y,
          speed: { min: 200, max: 400 },
          lifespan: 800,
          quantity: 30,
          scale: { start: 1.5, end: 0 },
          tint: [0xFF0000, 0xFF6600, 0xFFFF00],
          blendMode: 'ADD',
          on: false,
        }).explode();
        
        this.showGameOver();
      }

      async showGameOver() {
        const { width, height } = this.scale;
        
        // Glass overlay
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.8);
        overlay.fillRect(0, 0, width, height);
        overlay.setDepth(2000);
        
        // Glass card
        const card = this.add.graphics();
        card.fillStyle(0xFFFFFF, 0.15);
        card.fillRoundedRect(width/2 - 250, height/2 - 200, 500, 400, 25);
        card.lineStyle(3, 0xFFFFFF, 0.3);
        card.strokeRoundedRect(width/2 - 250, height/2 - 200, 500, 400, 25);
        card.setDepth(2001);
        
        // Title
        this.add.text(width / 2, height / 2 - 130, 'RACE FINISHED!', {
          fontSize: '48px',
          color: '#FFD700',
          fontFamily: 'Arial',
          fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(2002);
        
        // Stats
        this.add.text(width / 2, height / 2 - 40,
          `Final Score: ${this.score}\n` +
          `Coins Collected: ${this.coins}\n` +
          `Distance: ${Math.floor(this.distance)}m\n` +
          `Level Reached: ${this.level}\n` +
          `Time: ${this.formatTime(this.gameTime)}`,
          {
            fontSize: '24px',
            color: '#FFFFFF',
            fontFamily: 'Arial',
            align: 'center',
            lineSpacing: 12,
          }
        ).setOrigin(0.5).setDepth(2002);
        
        try {
          await gameAPI.updateScore({
            score: this.score,
            coinsCollected: this.coins,
            timeSpent: Math.floor(this.gameTime),
            completed: true,
          });
        } catch (error) {
          console.error("Save failed:", error);
        }
        
        this.time.delayedCall(3500, () => {
          if (window.onGameComplete) {
            window.onGameComplete({
              score: this.score,
              coins: this.coins,
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
        if (!this.started || this.gameOver || this.isPaused) return;
        
        // Update time
        this.gameTime = (this.time.now - this.startTime) / 1000;
        this.timeText.setText(this.formatTime(this.gameTime));
        
        // Move ground
        this.groundTiles.forEach((tile) => {
          tile.tilePositionY -= this.currentSpeed * delta * 0.001;
        });
        
        // Update distance
        this.distance += this.currentSpeed * delta * 0.001;
        this.distanceText.setText(Math.floor(this.distance) + 'm');
        
        // Check collisions
        this.checkCollisions();
        
        // Keyboard
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

    // ============================================================
    // PHASER CONFIG
    // ============================================================
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

    gameRef.current = new Phaser.Game(config);
    sceneRef.current = gameRef.current.scene.scenes[0];
    
    setTimeout(() => {
      setGameState((prev) => ({ ...prev, isLoading: false }));
    }, 1000);

    window.onGameComplete = async (results) => {
      setGameState({
        isLoading: false,
        isPaused: false,
        finalScore: results.score,
        coins: results.coins,
        distance: results.distance,
        level: results.level,
        time: results.time,
      });

      try {
        const response = await gameAPI.getStats();
        if (response.data.success) {
          updateUser({
            totalPoints: response.data.data.totalPoints,
          });
        }
      } catch (error) {
        console.error("Failed to update stats:", error);
      }

      setTimeout(() => {
        navigate("/dashboard");
      }, 500);
    };

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
        sceneRef.current = null;
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

  const handleQuit = () => {
    if (window.confirm("Quit race? Progress will be lost.")) {
      navigate("/dashboard");
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gradient-to-b from-indigo-500 to-purple-600">
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
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-40">
          <div className="bg-white/20 backdrop-blur-xl p-10 rounded-3xl shadow-2xl border-2 border-white/30">
            <h2 className="text-5xl font-bold text-white mb-8 text-center">
              ⏸️ PAUSED
            </h2>
            <div className="space-y-4">
              <button 
                onClick={handleResume}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 px-10 rounded-2xl text-xl transition-all transform hover:scale-105 shadow-lg"
              >
                ▶️ Resume Race
              </button>
              <button
                onClick={handleQuit}
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
