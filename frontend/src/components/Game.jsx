import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Phaser from "phaser";
import { gameAPI } from "../services/api";
import { useAuthStore } from "../store";

const Game = () => {
  const gameRef = useRef(null);
  const sceneRef = useRef(null);
  const navigate = useNavigate();
  const { updateUser } = useAuthStore();
  
  const [gameState, setGameState] = useState({
    isLoading: true,
    isPaused: false,
    finalScore: 0,
    coins: 0,
    distance: 0,
  });

  useEffect(() => {
    if (gameRef.current) return;

    // ============================================================
    // MAIN GAME SCENE - Temple Run Style
    // ============================================================
    class MainScene extends Phaser.Scene {
      constructor() {
        super({ key: "MainScene" });
        
        // Game state
        this.player = null;
        this.score = 0;
        this.coins = 0;
        this.distance = 0;
        this.gameOver = false;
        this.started = false;
        this.isPaused = false;
        
        // Game mechanics
        this.baseSpeed = 300;
        this.currentSpeed = 300;
        this.difficulty = 1;
        this.obstacleInterval = 2000;
        this.coinInterval = 1500;
        
        // Lane system (3 lanes)
        this.lanes = [0, 1, 2]; // Left, Center, Right
        this.currentLane = 1; // Start in center
        this.laneWidth = 0;
        this.isMoving = false;
        
        // UI Elements
        this.scoreText = null;
        this.coinText = null;
        this.distanceText = null;
        
        // Timers
        this.obstacleTimer = null;
        this.coinTimer = null;
        this.difficultyTimer = null;
        
        // Groups
        this.obstacles = null;
        this.coins = null;
        this.groundTiles = null;
      }

      preload() {
        // Create all graphics procedurally - no external images needed
        this.createGraphics();
      }

      // ============================================================
      // CREATE ALL GRAPHICS PROGRAMMATICALLY
      // ============================================================
      createGraphics() {
        const graphics = this.make.graphics({ x: 0, y: 0, add: false });
        
        // 1. PLAYER (Running character)
        graphics.clear();
        graphics.fillStyle(0xFF6B35, 1); // Orange body
        graphics.fillRoundedRect(0, 0, 40, 60, 8);
        // Head
        graphics.fillStyle(0xFFB088, 1); // Skin tone
        graphics.fillCircle(20, 15, 12);
        // Cape (for royal look)
        graphics.fillStyle(0x8B0000, 1); // Dark red cape
        graphics.fillTriangle(5, 25, 35, 25, 20, 55);
        graphics.generateTexture('player', 40, 60);
        
        // 2. GROUND TILE (Stone path)
        graphics.clear();
        graphics.fillStyle(0x8B7355, 1); // Brown stone
        graphics.fillRect(0, 0, 150, 150);
        // Add grid pattern
        graphics.lineStyle(2, 0x6B5344, 0.5);
        graphics.strokeRect(5, 5, 140, 140);
        graphics.strokeRect(40, 40, 70, 70);
        graphics.generateTexture('ground', 150, 150);
        
        // 3. OBSTACLE (Pillar)
        graphics.clear();
        graphics.fillStyle(0x8B4513, 1); // Brown pillar
        graphics.fillRect(10, 0, 50, 80);
        // Top cap
        graphics.fillStyle(0xD2691E, 1);
        graphics.fillRect(0, 0, 70, 15);
        // Shadow
        graphics.fillStyle(0x000000, 0.3);
        graphics.fillRect(15, 70, 40, 10);
        graphics.generateTexture('obstacle', 70, 80);
        
        // 4. COIN (Gold coin with crown)
        graphics.clear();
        graphics.fillStyle(0xFFD700, 1); // Gold
        graphics.fillCircle(20, 20, 18);
        // Inner circle
        graphics.fillStyle(0xFFA500, 1);
        graphics.fillCircle(20, 20, 12);
        // Crown symbol
        graphics.fillStyle(0xFFD700, 1);
        graphics.fillTriangle(16, 15, 20, 10, 24, 15);
        graphics.fillRect(14, 15, 12, 8);
        graphics.generateTexture('coin', 40, 40);
        
        // 5. DUST PARTICLE
        graphics.clear();
        graphics.fillStyle(0xFFFFFF, 0.6);
        graphics.fillCircle(5, 5, 5);
        graphics.generateTexture('dust', 10, 10);
        
        // 6. BACKGROUND ELEMENTS
        // Sky gradient (we'll use rectangles)
        graphics.clear();
        const gradient = graphics.createLinearGradient(0, 0, 0, 600);
        // Desert sky colors
        graphics.fillGradientStyle(0x87CEEB, 0x87CEEB, 0xF4A460, 0xF4A460, 1);
        graphics.fillRect(0, 0, 1000, 600);
        graphics.generateTexture('sky', 1000, 600);
        
        // 7. MOUNTAIN SILHOUETTE
        graphics.clear();
        graphics.fillStyle(0x8B7355, 0.6);
        graphics.fillTriangle(0, 300, 250, 100, 500, 300);
        graphics.fillTriangle(200, 300, 400, 150, 600, 300);
        graphics.generateTexture('mountains', 600, 300);
        
        // 8. LANE MARKERS
        graphics.clear();
        graphics.fillStyle(0xFFFFFF, 0.3);
        graphics.fillRect(0, 0, 10, 100);
        graphics.generateTexture('lane_marker', 10, 100);

        graphics.destroy();
      }

      create() {
        const { width, height } = this.scale;
        
        this.cameras.main.fadeIn(600, 135, 206, 235);

        // ============================================================
        // BACKGROUND LAYERS
        // ============================================================
        
        // Sky
        this.add.rectangle(0, 0, width, height, 0x87CEEB).setOrigin(0);
        
        // Desert sand ground color
        this.add.rectangle(0, height - 200, width, 200, 0xF4A460).setOrigin(0);
        
        // Mountains (parallax background)
        this.mountains = this.add.tileSprite(0, height - 300, width, 300, 'mountains')
          .setOrigin(0)
          .setAlpha(0.6);

        // ============================================================
        // 3D PERSPECTIVE LANE SYSTEM
        // ============================================================
        
        this.laneWidth = width / 3;
        
        // Draw lane markers
        this.laneMarkers = this.add.group();
        for (let i = 0; i < 10; i++) {
          const y = (height / 2) + (i * 100);
          
          // Left lane marker
          const leftMarker = this.add.rectangle(
            this.laneWidth - 5,
            y,
            10,
            80,
            0xFFFFFF,
            0.3
          );
          this.laneMarkers.add(leftMarker);
          
          // Right lane marker
          const rightMarker = this.add.rectangle(
            this.laneWidth * 2 + 5,
            y,
            10,
            80,
            0xFFFFFF,
            0.3
          );
          this.laneMarkers.add(rightMarker);
        }

        // ============================================================
        // GROUND TILES (Moving perspective)
        // ============================================================
        
        this.groundTiles = this.add.group();
        for (let i = 0; i < 8; i++) {
          const tile = this.add.tileSprite(
            width / 2,
            (height / 2) + (i * 100),
            width,
            100,
            'ground'
          );
          tile.setScale(1 - (i * 0.08)); // Perspective scaling
          this.groundTiles.add(tile);
        }

        // ============================================================
        // PLAYER SETUP
        // ============================================================
        
        this.player = this.add.sprite(
          this.getLaneX(this.currentLane),
          height - 250,
          'player'
        );
        this.player.setScale(1.5);
        this.player.setDepth(100);
        
        // Running animation (bob up and down)
        this.tweens.add({
          targets: this.player,
          y: height - 260,
          duration: 200,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });

        // ============================================================
        // PARTICLE EFFECTS
        // ============================================================
        
        this.dust = this.add.particles('dust');
        this.dustEmitter = this.dust.createEmitter({
          x: this.player.x,
          y: this.player.y + 30,
          speedX: { min: -150, max: -250 },
          speedY: { min: -30, max: 30 },
          scale: { start: 1, end: 0 },
          alpha: { start: 0.6, end: 0 },
          lifespan: 500,
          quantity: 0,
          blendMode: 'ADD',
        });

        // ============================================================
        // UI ELEMENTS
        // ============================================================
        
        // Score display
        const uiY = 40;
        
        // Score
        this.scoreText = this.add.text(width / 2, uiY, '0', {
          fontSize: '48px',
          color: '#FFD700',
          fontFamily: 'Arial Black, sans-serif',
          stroke: '#000000',
          strokeThickness: 6,
        }).setOrigin(0.5).setDepth(1000);

        // Coin counter
        this.add.text(30, 30, '🪙', { fontSize: '32px' }).setDepth(1000);
        this.coinText = this.add.text(70, 30, '0', {
          fontSize: '28px',
          color: '#FFD700',
          fontFamily: 'Arial, sans-serif',
          stroke: '#000',
          strokeThickness: 4,
        }).setDepth(1000);

        // Distance
        this.distanceText = this.add.text(width - 30, 30, '0m', {
          fontSize: '24px',
          color: '#FFF',
          fontFamily: 'Arial, sans-serif',
          alpha: 0.9,
        }).setOrigin(1, 0).setDepth(1000);

        // Speed indicator
        this.speedText = this.add.text(width - 30, 60, 'Speed: 1x', {
          fontSize: '18px',
          color: '#FFF',
          fontFamily: 'Arial, sans-serif',
          alpha: 0.7,
        }).setOrigin(1, 0).setDepth(1000);

        // ============================================================
        // PHYSICS GROUPS
        // ============================================================
        
        this.obstacles = this.add.group();
        this.coins = this.add.group();

        // ============================================================
        // INPUT HANDLERS
        // ============================================================
        
        // Swipe detection
        this.input.on('pointerdown', (pointer) => {
          this.swipeStartX = pointer.x;
          this.swipeStartY = pointer.y;
        });
        
        this.input.on('pointerup', (pointer) => {
          if (!this.started || this.gameOver || this.isPaused) return;
          
          const swipeEndX = pointer.x;
          const swipeEndY = pointer.y;
          const diffX = swipeEndX - this.swipeStartX;
          const diffY = swipeEndY - this.swipeStartY;
          
          // Horizontal swipe (lane change)
          if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
            if (diffX > 0) {
              this.moveRight();
            } else {
              this.moveLeft();
            }
          }
          // Vertical swipe
          else if (Math.abs(diffY) > 50) {
            if (diffY < 0) {
              this.jump();
            } else {
              this.slide();
            }
          }
        });
        
        // Keyboard controls
        this.cursors = this.input.keyboard.createCursorKeys();
        this.input.keyboard.on('keydown-A', () => this.moveLeft());
        this.input.keyboard.on('keydown-D', () => this.moveRight());
        this.input.keyboard.on('keydown-W', () => this.jump());
        this.input.keyboard.on('keydown-S', () => this.slide());

        // ============================================================
        // SHOW INTRO
        // ============================================================
        
        this.showIntro();
      }

      // ============================================================
      // INTRO SCREEN
      // ============================================================
      showIntro() {
        const { width, height } = this.scale;

        // Overlay
        const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.7)
          .setOrigin(0)
          .setDepth(500);

        // Title
        this.introTitle = this.add.text(width / 2, height / 2 - 120, 
          '👑 QUEEN\'S TEMPLE RUN 👑', {
            fontSize: '52px',
            color: '#FFD700',
            fontFamily: 'Arial Black, sans-serif',
            stroke: '#8B0000',
            strokeThickness: 8,
            align: 'center',
          }
        ).setOrigin(0.5).setDepth(501);

        // Instructions
        const instructions = [
          'SWIPE LEFT/RIGHT - Change lanes',
          'SWIPE UP - Jump over obstacles',
          'SWIPE DOWN - Slide under barriers',
          '',
          'Or use Arrow Keys / WASD',
        ];

        this.introInstructions = this.add.text(
          width / 2, 
          height / 2, 
          instructions.join('\n'),
          {
            fontSize: '20px',
            color: '#FFF',
            fontFamily: 'Arial, sans-serif',
            align: 'center',
            lineSpacing: 8,
          }
        ).setOrigin(0.5).setDepth(501);

        // Start button
        const buttonBg = this.add.rectangle(width / 2, height / 2 + 120, 250, 60, 0xFF6B35)
          .setDepth(501)
          .setInteractive({ useHandCursor: true });
        
        const buttonText = this.add.text(width / 2, height / 2 + 120, 'START RUNNING', {
          fontSize: '24px',
          color: '#FFF',
          fontFamily: 'Arial Black, sans-serif',
        }).setOrigin(0.5).setDepth(502);

        // Button hover
        buttonBg.on('pointerover', () => {
          buttonBg.setFillStyle(0xFF8C55);
          buttonBg.setScale(1.05);
        });
        
        buttonBg.on('pointerout', () => {
          buttonBg.setFillStyle(0xFF6B35);
          buttonBg.setScale(1);
        });

        // Start game
        buttonBg.on('pointerdown', () => {
          this.tweens.add({
            targets: [overlay, this.introTitle, this.introInstructions, buttonBg, buttonText],
            alpha: 0,
            duration: 300,
            onComplete: () => {
              overlay.destroy();
              this.introTitle.destroy();
              this.introInstructions.destroy();
              buttonBg.destroy();
              buttonText.destroy();
              this.startGame();
            }
          });
        });

        this.introElements = [overlay, this.introTitle, this.introInstructions, buttonBg, buttonText];
      }

      // ============================================================
      // START GAME
      // ============================================================
      startGame() {
        this.started = true;
        this.dustEmitter.setQuantity(3);

        // Start spawning
        this.obstacleTimer = this.time.addEvent({
          delay: this.obstacleInterval,
          callback: this.spawnObstacle,
          callbackScope: this,
          loop: true,
        });

        this.coinTimer = this.time.addEvent({
          delay: this.coinInterval,
          callback: this.spawnCoin,
          callbackScope: this,
          loop: true,
        });

        // Increase difficulty
        this.difficultyTimer = this.time.addEvent({
          delay: 15000, // Every 15 seconds
          callback: this.increaseDifficulty,
          callbackScope: this,
          loop: true,
        });
      }

      // ============================================================
      // LANE MOVEMENT
      // ============================================================
      getLaneX(lane) {
        return (lane * this.laneWidth) + (this.laneWidth / 2);
      }

      moveLeft() {
        if (this.isMoving || this.currentLane <= 0) return;
        this.isMoving = true;
        this.currentLane--;
        
        this.tweens.add({
          targets: this.player,
          x: this.getLaneX(this.currentLane),
          duration: 200,
          ease: 'Sine.easeOut',
          onComplete: () => {
            this.isMoving = false;
          }
        });
      }

      moveRight() {
        if (this.isMoving || this.currentLane >= 2) return;
        this.isMoving = true;
        this.currentLane++;
        
        this.tweens.add({
          targets: this.player,
          x: this.getLaneX(this.currentLane),
          duration: 200,
          ease: 'Sine.easeOut',
          onComplete: () => {
            this.isMoving = false;
          }
        });
      }

      jump() {
        if (this.player.isJumping) return;
        
        this.player.isJumping = true;
        const originalY = this.player.y;
        
        this.tweens.add({
          targets: this.player,
          y: originalY - 120,
          duration: 400,
          ease: 'Quad.easeOut',
          yoyo: true,
          onComplete: () => {
            this.player.isJumping = false;
          }
        });
      }

      slide() {
        if (this.player.isSliding) return;
        
        this.player.isSliding = true;
        const originalScaleY = this.player.scaleY;
        
        this.player.setScale(this.player.scaleX, 0.5);
        
        this.time.delayedCall(600, () => {
          this.player.setScale(this.player.scaleX, originalScaleY);
          this.player.isSliding = false;
        });
      }

      // ============================================================
      // SPAWN OBSTACLE
      // ============================================================
      spawnObstacle() {
        if (!this.started || this.gameOver || this.isPaused) return;

        const { height } = this.scale;
        const lane = Phaser.Math.Between(0, 2);
        const x = this.getLaneX(lane);
        
        // Random obstacle type
        const type = Phaser.Math.Between(0, 1);
        
        const obstacle = this.add.sprite(x, -100, 'obstacle');
        obstacle.setData('lane', lane);
        obstacle.setData('type', type); // 0 = jump over, 1 = slide under
        
        if (type === 1) {
          // Barrier - must slide under
          obstacle.setTint(0xFF0000);
          obstacle.y = height - 350;
        }
        
        this.obstacles.add(obstacle);
        
        // Move obstacle toward player
        this.tweens.add({
          targets: obstacle,
          y: height + 100,
          duration: 2000 / (this.difficulty * 0.5),
          ease: 'Linear',
          onComplete: () => {
            obstacle.destroy();
          }
        });
      }

      // ============================================================
      // SPAWN COIN
      // ============================================================
      spawnCoin() {
        if (!this.started || this.gameOver || this.isPaused) return;

        const { height } = this.scale;
        const lane = Phaser.Math.Between(0, 2);
        const x = this.getLaneX(lane);
        
        const coin = this.add.sprite(x, -100, 'coin');
        coin.setData('lane', lane);
        coin.setScale(1.2);
        this.coins.add(coin);
        
        // Rotate coin
        this.tweens.add({
          targets: coin,
          angle: 360,
          duration: 1000,
          repeat: -1,
        });
        
        // Move coin
        this.tweens.add({
          targets: coin,
          y: height + 100,
          duration: 2000 / (this.difficulty * 0.5),
          ease: 'Linear',
          onComplete: () => {
            coin.destroy();
          }
        });
      }

      // ============================================================
      // COLLISION DETECTION
      // ============================================================
      checkCollisions() {
        const playerZone = this.player.y;
        const playerLane = this.currentLane;
        
        // Check obstacles
        this.obstacles.children.entries.forEach((obstacle) => {
          const obstacleZone = obstacle.y;
          const obstacleLane = obstacle.getData('lane');
          const obstacleType = obstacle.getData('type');
          
          if (obstacleLane === playerLane && 
              Math.abs(obstacleZone - playerZone) < 80) {
            
            // Check if player can avoid
            if (obstacleType === 0 && !this.player.isJumping) {
              // Need to jump, but didn't
              this.hitObstacle();
            } else if (obstacleType === 1 && !this.player.isSliding) {
              // Need to slide, but didn't
              this.hitObstacle();
            }
          }
        });
        
        // Check coins
        this.coins.children.entries.forEach((coin) => {
          const coinZone = coin.y;
          const coinLane = coin.getData('lane');
          
          if (coinLane === playerLane && 
              Math.abs(coinZone - playerZone) < 60) {
            this.collectCoin(coin);
          }
        });
      }

      // ============================================================
      // COLLECT COIN
      // ============================================================
      collectCoin(coin) {
        // Particle burst
        this.dust.createEmitter({
          x: coin.x,
          y: coin.y,
          speedX: { min: -100, max: 100 },
          speedY: { min: -100, max: 100 },
          scale: { start: 1.5, end: 0 },
          tint: 0xFFD700,
          lifespan: 400,
          quantity: 10,
          on: false,
        }).explode();
        
        coin.destroy();
        this.coins++;
        this.score += 10;
        
        this.scoreText.setText(this.score);
        this.coinText.setText(this.coins);
        
        // Score pop
        this.tweens.add({
          targets: this.scoreText,
          scale: 1.2,
          duration: 100,
          yoyo: true,
        });
      }

      // ============================================================
      // HIT OBSTACLE
      // ============================================================
      hitObstacle() {
        if (this.gameOver) return;
        
        this.gameOver = true;
        
        // Stop timers
        if (this.obstacleTimer) this.obstacleTimer.destroy();
        if (this.coinTimer) this.coinTimer.destroy();
        if (this.difficultyTimer) this.difficultyTimer.destroy();
        
        // Player stumble
        this.player.setTint(0xFF0000);
        this.tweens.add({
          targets: this.player,
          angle: 90,
          y: this.player.y + 50,
          duration: 500,
          ease: 'Bounce.easeOut',
        });
        
        // Camera shake
        this.cameras.main.shake(300, 0.02);
        
        // Stop dust
        this.dustEmitter.stop();
        
        this.showGameOver();
      }

      // ============================================================
      // GAME OVER
      // ============================================================
      async showGameOver() {
        const { width, height } = this.scale;

        // Dark overlay
        const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.8)
          .setOrigin(0)
          .setDepth(1000)
          .setAlpha(0);
        
        this.tweens.add({
          targets: overlay,
          alpha: 0.8,
          duration: 500,
        });

        // Game over text
        this.time.delayedCall(400, () => {
          const gameOverText = this.add.text(width / 2, height / 2 - 120, 
            'RUN COMPLETE!', {
              fontSize: '56px',
              color: '#FFD700',
              fontFamily: 'Arial Black, sans-serif',
              stroke: '#8B0000',
              strokeThickness: 8,
            }
          ).setOrigin(0.5).setDepth(1001).setAlpha(0);

          const statsText = this.add.text(width / 2, height / 2,
            `Final Score: ${this.score}\n` +
            `Coins Collected: ${this.coins}\n` +
            `Distance: ${Math.floor(this.distance)}m`,
            {
              fontSize: '28px',
              color: '#FFF',
              fontFamily: 'Arial, sans-serif',
              align: 'center',
              lineSpacing: 12,
            }
          ).setOrigin(0.5).setDepth(1001).setAlpha(0);

          this.tweens.add({
            targets: [gameOverText, statsText],
            alpha: 1,
            duration: 500,
          });
        });

        // Save score
        try {
          await gameAPI.updateScore({
            score: this.score,
            coinsCollected: this.coins,
            timeSpent: Math.floor(this.distance / 10),
            completed: true,
          });
        } catch (error) {
          console.error("Save failed:", error);
        }

        // Redirect
        this.time.delayedCall(3500, () => {
          this.cameras.main.fadeOut(800);
        });

        this.cameras.main.once('camerafadeoutcomplete', () => {
          if (window.onGameComplete) {
            window.onGameComplete({
              score: this.score,
              coins: this.coins,
              distance: Math.floor(this.distance),
            });
          }
        });
      }

      // ============================================================
      // INCREASE DIFFICULTY
      // ============================================================
      increaseDifficulty() {
        if (this.gameOver) return;
        
        this.difficulty += 0.15;
        this.currentSpeed = Math.min(this.baseSpeed * this.difficulty, 600);
        
        this.obstacleInterval = Math.max(1200, this.obstacleInterval - 100);
        this.coinInterval = Math.max(1000, this.coinInterval - 80);
        
        if (this.obstacleTimer) {
          this.obstacleTimer.delay = this.obstacleInterval;
        }
        if (this.coinTimer) {
          this.coinTimer.delay = this.coinInterval;
        }

        // Update speed display
        this.speedText.setText(`Speed: ${this.difficulty.toFixed(1)}x`);
      }

      // ============================================================
      // UPDATE LOOP
      // ============================================================
      update(time, delta) {
        if (!this.started || this.gameOver || this.isPaused) return;

        // Move ground tiles (perspective effect)
        this.groundTiles.children.entries.forEach((tile, index) => {
          tile.tilePositionY -= this.currentSpeed * delta * 0.001 * (1 + index * 0.1);
        });

        // Move lane markers
        this.laneMarkers.children.entries.forEach((marker) => {
          marker.y += this.currentSpeed * delta * 0.01;
          if (marker.y > this.scale.height) {
            marker.y = this.scale.height / 2 - 500;
          }
        });

        // Parallax mountains
        this.mountains.tilePositionY += this.currentSpeed * delta * 0.0002;

        // Update dust
        this.dustEmitter.setPosition(this.player.x, this.player.y + 30);

        // Update distance
        this.distance += this.currentSpeed * delta * 0.001;
        this.distanceText.setText(Math.floor(this.distance) + 'm');

        // Check collisions
        this.checkCollisions();

        // Keyboard controls
        if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) {
          this.moveLeft();
        }
        if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
          this.moveRight();
        }
        if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
          this.jump();
        }
        if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) {
          this.slide();
        }
      }

      // ============================================================
      // PAUSE/RESUME
      // ============================================================
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
      backgroundColor: "#87CEEB",
      scene: MainScene,
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
    };

    gameRef.current = new Phaser.Game(config);
    sceneRef.current = gameRef.current.scene.scenes[0];
    
    setGameState((prev) => ({ ...prev, isLoading: false }));

    // Completion callback
    window.onGameComplete = async (results) => {
      setGameState({
        isLoading: false,
        isPaused: false,
        finalScore: results.score,
        coins: results.coins,
        distance: results.distance,
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
  }, [navigate, updateUser]);

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
    if (window.confirm("Quit run? Progress will be lost.")) {
      navigate("/dashboard");
    }
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {gameState.isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-sky-400 to-orange-200 z-50">
          <div className="text-center">
            <div className="text-6xl mb-4 animate-bounce">🏃‍♀️</div>
            <div className="text-2xl text-gray-800 font-bold">
              Preparing Temple Run...
            </div>
          </div>
        </div>
      )}

      <div id="phaser-container" className="w-full h-full"></div>

      {gameState.isPaused && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-40">
          <div className="bg-gradient-to-b from-orange-500 to-red-600 p-8 rounded-2xl shadow-2xl border-4 border-yellow-400">
            <h2 className="text-4xl font-bold text-white mb-6 text-center">
              ⏸️ PAUSED
            </h2>
            <div className="space-y-4">
              <button 
                onClick={handleResume}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-xl text-xl transition-all transform hover:scale-105"
              >
                ▶️ Resume Run
              </button>
              <button
                onClick={handleQuit}
                className="w-full bg-red-900 hover:bg-red-800 text-white font-bold py-4 px-8 rounded-xl text-xl transition-all transform hover:scale-105"
              >
                🚪 Quit to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {!gameState.isLoading && (
        <div className="absolute top-4 right-4 z-30">
          {!gameState.isPaused && (
            <button
              onClick={handlePause}
              className="bg-orange-600/90 hover:bg-orange-700 text-white p-4 rounded-xl backdrop-blur-sm shadow-lg text-2xl transition-all transform hover:scale-110"
              title="Pause"
            >
              ⏸️
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default Game;
