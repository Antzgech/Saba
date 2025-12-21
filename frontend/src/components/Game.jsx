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
    // MAIN GAME SCENE
    // ============================================================
    class MainScene extends Phaser.Scene {
      constructor() {
        super({ key: "MainScene" });
        this.player = null;
        this.score = 0;
        this.coins = 0;
        this.distance = 0;
        this.gameOver = false;
        this.started = false;
        this.isPaused = false;
        this.baseSpeed = 300;
        this.currentSpeed = 300;
        this.currentLane = 1;
        this.laneWidth = 0;
        this.isMoving = false;
      }

      preload() {
        console.log("Preload started");
        // Create graphics
        this.createAllGraphics();
        console.log("Graphics created");
      }

      createAllGraphics() {
        const g = this.make.graphics({ add: false });
        
        // PLAYER
        g.clear();
        g.fillStyle(0xFF6B35, 1);
        g.fillRect(0, 0, 40, 60);
        g.fillStyle(0xFFB088, 1);
        g.fillCircle(20, 10, 8);
        g.generateTexture('player', 40, 60);
        
        // GROUND
        g.clear();
        g.fillStyle(0x8B7355, 1);
        g.fillRect(0, 0, 100, 100);
        g.lineStyle(2, 0x6B5344, 0.5);
        g.strokeRect(5, 5, 90, 90);
        g.generateTexture('ground', 100, 100);
        
        // OBSTACLE
        g.clear();
        g.fillStyle(0x8B4513, 1);
        g.fillRect(10, 0, 50, 70);
        g.fillStyle(0xD2691E, 1);
        g.fillRect(0, 0, 70, 10);
        g.generateTexture('obstacle', 70, 70);
        
        // COIN
        g.clear();
        g.fillStyle(0xFFD700, 1);
        g.fillCircle(15, 15, 12);
        g.fillStyle(0xFFA500, 1);
        g.fillCircle(15, 15, 8);
        g.generateTexture('coin', 30, 30);
        
        g.destroy();
      }

      create() {
        console.log("Create started");
        const { width, height } = this.scale;
        
        // Background
        this.add.rectangle(0, 0, width, height, 0x87CEEB).setOrigin(0);
        this.add.rectangle(0, height - 150, width, 150, 0xF4A460).setOrigin(0);
        
        // Lane setup
        this.laneWidth = width / 3;
        
        // Ground
        this.groundTiles = [];
        for (let i = 0; i < 6; i++) {
          const tile = this.add.tileSprite(
            width / 2,
            height - 100 + (i * 100),
            width,
            100,
            'ground'
          );
          this.groundTiles.push(tile);
        }
        
        // Lane lines
        this.add.rectangle(this.laneWidth, 0, 4, height, 0xFFFFFF, 0.3).setOrigin(0.5, 0);
        this.add.rectangle(this.laneWidth * 2, 0, 4, height, 0xFFFFFF, 0.3).setOrigin(0.5, 0);
        
        // Player
        this.player = this.add.sprite(
          this.getLaneX(1),
          height - 200,
          'player'
        );
        this.player.setScale(1.5);
        
        // Running animation
        this.tweens.add({
          targets: this.player,
          y: height - 210,
          duration: 200,
          yoyo: true,
          repeat: -1,
        });
        
        // UI
        this.scoreText = this.add.text(width / 2, 40, '0', {
          fontSize: '48px',
          color: '#FFD700',
          fontFamily: 'Arial',
          stroke: '#000',
          strokeThickness: 6,
        }).setOrigin(0.5);
        
        this.coinText = this.add.text(60, 30, '0', {
          fontSize: '28px',
          color: '#FFD700',
          fontFamily: 'Arial',
          stroke: '#000',
          strokeThickness: 4,
        });
        
        this.add.text(20, 30, '🪙', { fontSize: '32px' });
        
        this.distanceText = this.add.text(width - 20, 30, '0m', {
          fontSize: '24px',
          color: '#FFF',
          fontFamily: 'Arial',
        }).setOrigin(1, 0);
        
        // Groups
        this.obstacles = this.add.group();
        this.coins = this.add.group();
        
        // Input
        this.input.on('pointerdown', (pointer) => {
          this.swipeStartX = pointer.x;
          this.swipeStartY = pointer.y;
          this.swipeStartTime = this.time.now;
        });
        
        this.input.on('pointerup', (pointer) => {
          if (!this.started || this.gameOver) return;
          
          const swipeTime = this.time.now - this.swipeStartTime;
          if (swipeTime > 500) return; // Too slow
          
          const diffX = pointer.x - this.swipeStartX;
          const diffY = pointer.y - this.swipeStartY;
          
          if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
            if (diffX > 0) this.moveRight();
            else this.moveLeft();
          } else if (Math.abs(diffY) > 50) {
            if (diffY < 0) this.jump();
            else this.slide();
          }
        });
        
        // Keyboard
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keyA = this.input.keyboard.addKey('A');
        this.keyD = this.input.keyboard.addKey('D');
        this.keyW = this.input.keyboard.addKey('W');
        this.keyS = this.input.keyboard.addKey('S');
        
        console.log("Create completed - showing intro");
        this.showIntro();
      }

      getLaneX(lane) {
        return (lane * this.laneWidth) + (this.laneWidth / 2);
      }

      showIntro() {
        const { width, height } = this.scale;
        
        const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.7)
          .setOrigin(0)
          .setDepth(500);
        
        const title = this.add.text(width / 2, height / 2 - 100, 
          '👑 TEMPLE RUN 👑', {
            fontSize: '48px',
            color: '#FFD700',
            fontFamily: 'Arial',
            stroke: '#8B0000',
            strokeThickness: 8,
          }
        ).setOrigin(0.5).setDepth(501);
        
        const instructions = this.add.text(width / 2, height / 2,
          'SWIPE LEFT/RIGHT - Move\nSWIPE UP - Jump\nSWIPE DOWN - Slide\n\nArrow Keys also work!',
          {
            fontSize: '18px',
            color: '#FFF',
            fontFamily: 'Arial',
            align: 'center',
          }
        ).setOrigin(0.5).setDepth(501);
        
        const button = this.add.rectangle(width / 2, height / 2 + 100, 200, 50, 0xFF6B35)
          .setDepth(501)
          .setInteractive({ useHandCursor: true });
        
        const buttonText = this.add.text(width / 2, height / 2 + 100, 'START', {
          fontSize: '24px',
          color: '#FFF',
          fontFamily: 'Arial',
        }).setOrigin(0.5).setDepth(502);
        
        button.on('pointerover', () => button.setFillStyle(0xFF8C55));
        button.on('pointerout', () => button.setFillStyle(0xFF6B35));
        button.on('pointerdown', () => {
          overlay.destroy();
          title.destroy();
          instructions.destroy();
          button.destroy();
          buttonText.destroy();
          this.startGame();
        });
      }

      startGame() {
        console.log("Game started!");
        this.started = true;
        
        this.time.addEvent({
          delay: 2000,
          callback: this.spawnObstacle,
          callbackScope: this,
          loop: true,
        });
        
        this.time.addEvent({
          delay: 1500,
          callback: this.spawnCoin,
          callbackScope: this,
          loop: true,
        });
        
        this.time.addEvent({
          delay: 15000,
          callback: () => {
            this.currentSpeed = Math.min(this.currentSpeed + 30, 600);
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
          y: startY - 100,
          duration: 300,
          yoyo: true,
          onComplete: () => { this.player.isJumping = false; }
        });
      }

      slide() {
        if (this.player.isSliding) return;
        this.player.isSliding = true;
        this.player.scaleY = 0.5;
        
        this.time.delayedCall(500, () => {
          this.player.scaleY = 1.5;
          this.player.isSliding = false;
        });
      }

      spawnObstacle() {
        if (!this.started || this.gameOver) return;
        
        const lane = Phaser.Math.Between(0, 2);
        const x = this.getLaneX(lane);
        const { height } = this.scale;
        
        const obs = this.add.sprite(x, -50, 'obstacle');
        obs.setData('lane', lane);
        obs.setData('type', 0);
        this.obstacles.add(obs);
        
        this.tweens.add({
          targets: obs,
          y: height + 50,
          duration: 2500,
          onComplete: () => obs.destroy()
        });
      }

      spawnCoin() {
        if (!this.started || this.gameOver) return;
        
        const lane = Phaser.Math.Between(0, 2);
        const x = this.getLaneX(lane);
        const { height } = this.scale;
        
        const coin = this.add.sprite(x, -50, 'coin');
        coin.setData('lane', lane);
        coin.setScale(1.5);
        this.coins.add(coin);
        
        this.tweens.add({
          targets: coin,
          angle: 360,
          duration: 1000,
          repeat: -1,
        });
        
        this.tweens.add({
          targets: coin,
          y: height + 50,
          duration: 2500,
          onComplete: () => coin.destroy()
        });
      }

      checkCollisions() {
        const playerY = this.player.y;
        const playerLane = this.currentLane;
        
        this.obstacles.children.entries.forEach((obs) => {
          const obsY = obs.y;
          const obsLane = obs.getData('lane');
          
          if (obsLane === playerLane && Math.abs(obsY - playerY) < 60) {
            if (!this.player.isJumping) {
              this.hitObstacle();
            }
          }
        });
        
        this.coins.children.entries.forEach((coin) => {
          const coinY = coin.y;
          const coinLane = coin.getData('lane');
          
          if (coinLane === playerLane && Math.abs(coinY - playerY) < 50) {
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
        this.cameras.main.shake(200, 0.01);
        
        this.showGameOver();
      }

      async showGameOver() {
        const { width, height } = this.scale;
        
        const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.8)
          .setOrigin(0)
          .setDepth(1000);
        
        this.add.text(width / 2, height / 2 - 80, 'GAME OVER', {
          fontSize: '56px',
          color: '#FFD700',
          fontFamily: 'Arial',
          stroke: '#8B0000',
          strokeThickness: 8,
        }).setOrigin(0.5).setDepth(1001);
        
        this.add.text(width / 2, height / 2 + 20,
          `Score: ${this.score}\nCoins: ${this.coins}\nDistance: ${Math.floor(this.distance)}m`,
          {
            fontSize: '28px',
            color: '#FFF',
            fontFamily: 'Arial',
            align: 'center',
          }
        ).setOrigin(0.5).setDepth(1001);
        
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

      update(time, delta) {
        if (!this.started || this.gameOver || this.isPaused) return;
        
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
        if (Phaser.Input.Keyboard.JustDown(this.cursors.down) || 
            Phaser.Input.Keyboard.JustDown(this.keyS)) {
          this.slide();
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
      backgroundColor: "#87CEEB",
      scene: MainScene,
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
    };

    console.log("Creating Phaser game...");
    gameRef.current = new Phaser.Game(config);
    sceneRef.current = gameRef.current.scene.scenes[0];
    
    // Mark as loaded after a short delay
    setTimeout(() => {
      console.log("Game loaded!");
      setGameState((prev) => ({ ...prev, isLoading: false }));
    }, 1000);

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
    <div className="relative w-full h-screen bg-sky-400 overflow-hidden">
      {gameState.isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-sky-400 to-orange-200 z-50">
          <div className="text-center">
            <div className="text-6xl mb-4 animate-bounce">🏃‍♀️</div>
            <div className="text-2xl text-gray-800 font-bold">
              Loading Temple Run...
            </div>
          </div>
        </div>
      )}

      <div id="phaser-container" className="w-full h-full"></div>

      {gameState.isPaused && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-40">
          <div className="bg-orange-600 p-8 rounded-2xl shadow-2xl">
            <h2 className="text-4xl font-bold text-white mb-6 text-center">
              ⏸️ PAUSED
            </h2>
            <div className="space-y-4">
              <button 
                onClick={handleResume}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-xl"
              >
                ▶️ Resume
              </button>
              <button
                onClick={handleQuit}
                className="w-full bg-red-900 hover:bg-red-800 text-white font-bold py-4 px-8 rounded-xl"
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
          className="absolute top-4 right-4 bg-orange-600/90 hover:bg-orange-700 text-white p-4 rounded-xl z-30 text-2xl"
        >
          ⏸️
        </button>
      )}
    </div>
  );
};

export default Game;
