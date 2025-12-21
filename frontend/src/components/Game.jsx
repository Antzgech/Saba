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
        this.coins = 0;
        this.distance = 0;
        this.gameTime = 0;
        this.level = 1;
        this.gameOver = false;
        this.started = false;
        this.currentSpeed = 280;
        this.currentLane = 1;
        this.isMoving = false;
        this.username = user?.username || user?.firstName || "Player";
      }

      preload() {
        this.createGraphics();
      }

      createGraphics() {
        const g = this.make.graphics({ add: false });
        
        // PLAYER CAR - Cyan glass
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
        
        // OBSTACLE CAR - Red
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
        
        // ROCK - Purple crystal
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
        
        // COIN - Golden orb
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
        
        g.destroy();
      }

      create() {
        const { width, height } = this.scale;
        
        // Background gradient
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x667eea, 0x667eea, 0x764ba2, 0x764ba2, 1, 1, 1, 1);
        bg.fillRect(0, 0, width, height);
        
        // Lane setup
        this.laneWidth = width / 3;
        
        // Ground tiles
        this.groundTiles = [];
        for (let i = 0; i < 8; i++) {
          const tile = this.add.tileSprite(width / 2, height - 200 + (i * 120), width * 0.8, 120, 'ground');
          tile.setAlpha(0.8);
          this.groundTiles.push(tile);
        }
        
        // Lane lines
        this.add.rectangle(this.laneWidth, 0, 6, height, 0x00D9FF, 0.4).setOrigin(0.5, 0);
        this.add.rectangle(this.laneWidth * 2, 0, 6, height, 0x00D9FF, 0.4).setOrigin(0.5, 0);
        
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
        this.obstacles = this.add.group();
        this.coins = this.add.group();
        
        // Controls
        this.setupControls();
        
        // Show intro
        this.showIntro();
      }

      createUI() {
        const { width, height } = this.scale;
        
        // Top panel
        const panel = this.add.graphics();
        panel.fillStyle(0x000000, 0.3);
        panel.fillRoundedRect(10, 10, width - 20, 140, 20);
        panel.setDepth(900);
        
        // Username
        this.add.text(30, 35, `👤 ${this.username}`, {
          fontSize: '24px',
          color: '#FFFFFF',
          fontFamily: 'Arial',
          fontStyle: 'bold',
        }).setDepth(901);
        
        // Stats labels
        const y = 80;
        const spacing = (width - 60) / 3;
        
        this.add.text(30, y, 'SCORE', { fontSize: '14px', color: '#FFF', alpha: 0.6 }).setDepth(901);
        this.scoreText = this.add.text(30, y + 20, '0', {
          fontSize: '32px',
          color: '#FFD700',
          fontFamily: 'Arial',
          fontStyle: 'bold',
        }).setDepth(901);
        
        this.add.text(30 + spacing, y, 'TIME', { fontSize: '14px', color: '#FFF', alpha: 0.6 }).setDepth(901);
        this.timeText = this.add.text(30 + spacing, y + 20, '0:00', {
          fontSize: '32px',
          color: '#00D9FF',
          fontFamily: 'Arial',
          fontStyle: 'bold',
        }).setDepth(901);
        
        this.add.text(30 + spacing * 2, y, 'LEVEL', { fontSize: '14px', color: '#FFF', alpha: 0.6 }).setDepth(901);
        this.levelText = this.add.text(30 + spacing * 2, y + 20, '1', {
          fontSize: '32px',
          color: '#9D4EDD',
          fontFamily: 'Arial',
          fontStyle: 'bold',
        }).setDepth(901);
        
        // Coins
        this.add.text(30, height - 50, '💰', { fontSize: '28px' }).setDepth(901);
        this.coinText = this.add.text(70, height - 40, '0', {
          fontSize: '28px',
          color: '#FFD700',
          fontFamily: 'Arial',
          fontStyle: 'bold',
        }).setDepth(901);
        
        // Distance
        this.distanceText = this.add.text(width - 30, height - 40, '0m', {
          fontSize: '24px',
          color: '#FFF',
          fontFamily: 'Arial',
          fontStyle: 'bold',
        }).setOrigin(1, 0).setDepth(901);
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
        
        const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.8).setOrigin(0).setDepth(1000);
        
        const title = this.add.text(width / 2, height / 2 - 100, '🏎️ GLASS RACER 🏎️', {
          fontSize: '52px',
          color: '#FFFFFF',
          fontFamily: 'Arial',
          fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(1001);
        
        const instructions = this.add.text(width / 2, height / 2,
          'SWIPE LEFT/RIGHT - Move lanes\nSWIPE UP - Jump\n\nArrow Keys: ← → ↑\nWASD Keys: A D W\n\nAvoid cars & rocks!\nCollect golden orbs!',
          {
            fontSize: '20px',
            color: '#FFF',
            fontFamily: 'Arial',
            align: 'center',
            lineSpacing: 10,
          }
        ).setOrigin(0.5).setDepth(1001);
        
        const btn = this.add.rectangle(width / 2, height / 2 + 130, 200, 60, 0x00D9FF)
          .setDepth(1001)
          .setInteractive();
        
        const btnText = this.add.text(width / 2, height / 2 + 130, '▶ START', {
          fontSize: '28px',
          color: '#FFF',
          fontFamily: 'Arial',
          fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(1002);
        
        btn.on('pointerover', () => btn.setFillStyle(0x00FFFF));
        btn.on('pointerout', () => btn.setFillStyle(0x00D9FF));
        btn.on('pointerdown', () => {
          overlay.destroy();
          title.destroy();
          instructions.destroy();
          btn.destroy();
          btnText.destroy();
          this.startGame();
        });
      }

      startGame() {
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
        
        this.time.addEvent({
          delay: 30000,
          callback: () => {
            this.level++;
            this.currentSpeed = Math.min(this.currentSpeed + 40, 550);
            this.levelText.setText(this.level);
          },
          callbackScope: this,
          loop: true,
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
        this.obstacles.add(obs);
        
        this.tweens.add({
          targets: obs,
          y: height + 100,
          duration: 2500 - (this.level * 80),
          onComplete: () => obs.destroy()
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
        
        this.tweens.add({
          targets: coin,
          angle: 360,
          duration: 1500,
          repeat: -1,
        });
        
        this.tweens.add({
          targets: coin,
          y: height + 100,
          duration: 2500 - (this.level * 80),
          onComplete: () => {
            if (!coin.getData('collected')) coin.destroy();
          }
        });
      }

      checkCollisions() {
        const playerY = this.player.y;
        const playerLane = this.currentLane;
        
        // Obstacles
        this.obstacles.children.entries.forEach((obs) => {
          if (!obs.active) return;
          
          const obsY = obs.y;
          const obsLane = obs.getData('lane');
          
          if (obsLane === playerLane && Math.abs(obsY - playerY) < 60) {
            if (!this.player.isJumping) {
              this.hitObstacle();
            }
          }
        });
        
        // Coins
        this.coins.children.entries.forEach((coin) => {
          if (!coin.active || coin.getData('collected')) return;
          
          const coinY = coin.y;
          const coinLane = coin.getData('lane');
          
          if (coinLane === playerLane && Math.abs(coinY - playerY) < 50) {
            coin.setData('collected', true);
            coin.destroy();
            
            this.coins++;
            this.score += 10;
            this.scoreText.setText(this.score);
            this.coinText.setText(this.coins);
          }
        });
      }

      hitObstacle() {
        if (this.gameOver) return;
        this.gameOver = true;
        
        this.player.setTint(0xFF0000);
        this.cameras.main.shake(300, 0.02);
        
        if (this.obstacleTimer) this.obstacleTimer.destroy();
        if (this.coinTimer) this.coinTimer.destroy();
        
        this.showGameOver();
      }

      async showGameOver() {
        const { width, height } = this.scale;
        
        const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.85)
          .setOrigin(0).setDepth(2000);
        
        this.add.text(width / 2, height / 2 - 100, 'RACE FINISHED!', {
          fontSize: '48px',
          color: '#FFD700',
          fontFamily: 'Arial',
          fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(2001);
        
        this.add.text(width / 2, height / 2 + 20,
          `Score: ${this.score}\nCoins: ${this.coins}\nDistance: ${Math.floor(this.distance)}m\nLevel: ${this.level}\nTime: ${this.formatTime(this.gameTime)}`,
          {
            fontSize: '24px',
            color: '#FFF',
            fontFamily: 'Arial',
            align: 'center',
            lineSpacing: 12,
          }
        ).setOrigin(0.5).setDepth(2001);
        
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
        
        this.time.delayedCall(3000, () => {
          if (window.onGameComplete) {
            window.onGameComplete({
              score: this.score,
              coins: this.coins,
              distance: Math.floor(this.distance),
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
        if (!this.started || this.gameOver) return;
        
        this.gameTime = (this.time.now - this.startTime) / 1000;
        this.timeText.setText(this.formatTime(this.gameTime));
        
        this.groundTiles.forEach((tile) => {
          tile.tilePositionY -= this.currentSpeed * delta * 0.001;
        });
        
        this.distance += this.currentSpeed * delta * 0.001;
        this.distanceText.setText(Math.floor(this.distance) + 'm');
        
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
        this.scene.pause();
      }

      resumeGame() {
        if (!this.started || this.gameOver) return;
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
          <div className="text-center">
            <div className="text-7xl mb-6 animate-bounce">🏎️</div>
            <div className="text-3xl text-white font-bold">Loading...</div>
          </div>
        </div>
      )}

      <div id="phaser-container" className="w-full h-full"></div>

      {gameState.isPaused && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-40">
          <div className="bg-white/20 backdrop-blur-xl p-10 rounded-3xl">
            <h2 className="text-5xl font-bold text-white mb-8 text-center">⏸️ PAUSED</h2>
            <div className="space-y-4">
              <button 
                onClick={handleResume}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-10 rounded-2xl text-xl"
              >
                ▶️ Resume
              </button>
              <button
                onClick={() => navigate("/dashboard")}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-10 rounded-2xl text-xl"
              >
                🚪 Quit
              </button>
            </div>
          </div>
        </div>
      )}

      {!gameState.isLoading && !gameState.isPaused && (
        <button
          onClick={handlePause}
          className="absolute top-6 right-6 bg-white/20 backdrop-blur-md hover:bg-white/30 text-white p-4 rounded-2xl z-30 text-2xl"
        >
          ⏸️
        </button>
      )}
    </div>
  );
};

export default Game;
