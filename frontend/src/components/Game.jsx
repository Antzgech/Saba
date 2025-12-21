import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Phaser from "phaser";
import { gameAPI } from "../services/api";
import { useAuthStore } from "../store";

// Import assets
import bg1 from "../assets/bg-sheba-desert.png";
import bg2 from "../assets/bg-sheba-city.png";
import playerImg from "../assets/player-guardian.png";
import dustImg from "../assets/dust.png";
import coinImg from "../assets/coin-gold.png";
import obstacleImg from "../assets/obstacle-pillar.png";
import bannerImg from "../assets/ui-banner.png";
import buttonImg from "../assets/ui-button.png";

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
    // Prevent multiple game instances
    if (gameRef.current) return;

    // ============================================================
    // MAIN GAME SCENE - Professional Architecture
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
        this.baseSpeed = 260;
        this.currentSpeed = 260;
        this.difficulty = 1;
        this.obstacleInterval = 1500;
        this.coinInterval = 1200;
        
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
      }

      preload() {
        // Load all assets
        this.load.image("bg1", bg1);
        this.load.image("bg2", bg2);
        this.load.image("player", playerImg);
        this.load.image("dust", dustImg);
        this.load.image("coin", coinImg);
        this.load.image("obstacle", obstacleImg);
        this.load.image("banner", bannerImg);
        this.load.image("button", buttonImg);
        
        // Loading progress (optional)
        this.load.on("progress", (value) => {
          console.log("Loading:", Math.floor(value * 100) + "%");
        });
      }

      create() {
        const { width, height } = this.scale;

        // Smooth camera fade-in
        this.cameras.main.fadeIn(600, 0, 0, 0);

        // ============================================================
        // PARALLAX BACKGROUND SYSTEM
        // ============================================================
        this.bg1 = this.add
          .tileSprite(0, 0, width, height, "bg1")
          .setOrigin(0)
          .setDepth(-2);
        
        this.bg2 = this.add
          .tileSprite(0, 0, width, height, "bg2")
          .setOrigin(0)
          .setAlpha(0.7)
          .setDepth(-1);

        // ============================================================
        // GROUND PHYSICS
        // ============================================================
        this.ground = this.physics.add.staticGroup();
        const groundHeight = 40;
        this.ground
          .create(width / 2, height - groundHeight / 2, "bg1")
          .setDisplaySize(width, groundHeight)
          .setAlpha(0.3)
          .refreshBody();

        // ============================================================
        // PLAYER SETUP
        // ============================================================
        this.player = this.physics.add.sprite(120, height - 120, "player");
        this.player.setGravityY(900);
        this.player.setCollideWorldBounds(true);
        this.player.setScale(1.2);
        this.player.setDepth(10);
        
        // Player physics collision
        this.physics.add.collider(this.player, this.ground, () => {
          this.player.canJump = true;
        });

        // ============================================================
        // PARTICLE EFFECTS - Dust Trail
        // ============================================================
        this.dust = this.add.particles("dust");
        this.dustEmitter = this.dust.createEmitter({
          x: this.player.x - 20,
          y: this.player.y + 20,
          speedX: { min: -80, max: -150 },
          speedY: { min: -20, max: 20 },
          scale: { start: 0.5, end: 0 },
          alpha: { start: 0.6, end: 0 },
          lifespan: 400,
          quantity: 0,
          blendMode: "ADD",
        });

        // ============================================================
        // UI SETUP - Score, Coins, Distance
        // ============================================================
        const uiBannerY = 50;
        
        // Score banner
        this.add
          .image(width / 2, uiBannerY, "banner")
          .setScale(0.6)
          .setDepth(100);
        
        this.scoreText = this.add
          .text(width / 2, uiBannerY, "0", {
            fontSize: "32px",
            color: "#FFD700",
            fontFamily: "Cinzel, serif",
            fontStyle: "bold",
            stroke: "#8B4513",
            strokeThickness: 4,
          })
          .setOrigin(0.5)
          .setDepth(101);

        // Coin counter (top left)
        this.add
          .text(20, 20, "🪙", {
            fontSize: "28px",
          })
          .setDepth(100);
        
        this.coinText = this.add
          .text(55, 20, "0", {
            fontSize: "24px",
            color: "#FFD700",
            fontFamily: "Cinzel, serif",
            fontStyle: "bold",
            stroke: "#000",
            strokeThickness: 3,
          })
          .setDepth(101);

        // Distance counter (top right)
        this.distanceText = this.add
          .text(width - 20, 20, "0m", {
            fontSize: "20px",
            color: "#FFF",
            fontFamily: "Cinzel, serif",
            alpha: 0.8,
          })
          .setOrigin(1, 0)
          .setDepth(100);

        // ============================================================
        // PHYSICS GROUPS
        // ============================================================
        this.obstacles = this.physics.add.group();
        this.coins = this.physics.add.group();

        // ============================================================
        // COLLISION DETECTION
        // ============================================================
        this.physics.add.overlap(
          this.player,
          this.coins,
          this.collectCoin,
          null,
          this
        );
        
        this.physics.add.overlap(
          this.player,
          this.obstacles,
          this.hitObstacle,
          null,
          this
        );

        // ============================================================
        // INPUT HANDLERS
        // ============================================================
        // Touch/Click to jump
        this.input.on("pointerdown", () => {
          this.handleJump();
        });
        
        // Keyboard support
        this.cursors = this.input.keyboard.createCursorKeys();
        this.input.keyboard.on("keydown-SPACE", () => {
          this.handleJump();
        });

        // ============================================================
        // SHOW INTRO SCREEN
        // ============================================================
        this.showIntro();
      }

      // ============================================================
      // INTRO SCREEN
      // ============================================================
      showIntro() {
        const { width, height } = this.scale;

        // Title with glow effect
        this.introText = this.add
          .text(width / 2, height / 2 - 80, "Trial of the Queen", {
            fontSize: "48px",
            color: "#FFD700",
            fontFamily: "Cinzel, serif",
            fontStyle: "bold",
            stroke: "#8B4513",
            strokeThickness: 6,
          })
          .setOrigin(0.5)
          .setDepth(200);

        // Subtitle
        this.introSubtitle = this.add
          .text(width / 2, height / 2 - 20, "Collect coins • Avoid obstacles", {
            fontSize: "20px",
            color: "#FFF",
            fontFamily: "Cinzel, serif",
            alpha: 0.8,
          })
          .setOrigin(0.5)
          .setDepth(200);

        // Instructions
        this.introInstructions = this.add
          .text(width / 2, height / 2 + 20, "Tap to jump", {
            fontSize: "18px",
            color: "#FFD700",
            fontFamily: "Cinzel, serif",
            alpha: 0.6,
          })
          .setOrigin(0.5)
          .setDepth(200);

        // Start button
        this.startButton = this.add
          .image(width / 2, height / 2 + 80, "button")
          .setInteractive({ useHandCursor: true })
          .setScale(0.8)
          .setDepth(200);

        this.startLabel = this.add
          .text(width / 2, height / 2 + 80, "BEGIN TRIAL", {
            fontSize: "24px",
            color: "#000",
            fontFamily: "Cinzel, serif",
            fontStyle: "bold",
          })
          .setOrigin(0.5)
          .setDepth(201);

        // Button hover effect
        this.startButton.on("pointerover", () => {
          this.startButton.setScale(0.85);
        });
        
        this.startButton.on("pointerout", () => {
          this.startButton.setScale(0.8);
        });

        // Start game on click
        this.startButton.on("pointerdown", () => {
          this.startTrial();
        });
      }

      // ============================================================
      // START GAME
      // ============================================================
      startTrial() {
        this.started = true;

        // Fade out intro elements
        this.tweens.add({
          targets: [
            this.introText,
            this.introSubtitle,
            this.introInstructions,
            this.startButton,
            this.startLabel,
          ],
          alpha: 0,
          duration: 300,
          onComplete: () => {
            this.introText?.destroy();
            this.introSubtitle?.destroy();
            this.introInstructions?.destroy();
            this.startButton?.destroy();
            this.startLabel?.destroy();
          },
        });

        // Start dust trail
        this.dustEmitter.setQuantity(2);

        // Start spawning obstacles
        this.obstacleTimer = this.time.addEvent({
          delay: this.obstacleInterval,
          callback: this.spawnObstacle,
          callbackScope: this,
          loop: true,
        });

        // Start spawning coins
        this.coinTimer = this.time.addEvent({
          delay: this.coinInterval,
          callback: this.spawnCoin,
          callbackScope: this,
          loop: true,
        });

        // Increase difficulty over time
        this.difficultyTimer = this.time.addEvent({
          delay: 10000, // Every 10 seconds
          callback: this.increaseDifficulty,
          callbackScope: this,
          loop: true,
        });
      }

      // ============================================================
      // JUMP MECHANIC
      // ============================================================
      handleJump() {
        if (!this.started || this.gameOver || this.isPaused) return;
        
        if (this.player.body.touching.down) {
          this.player.setVelocityY(-550);
          
          // Jump particle burst
          this.dust.createEmitter({
            x: this.player.x,
            y: this.player.y + 30,
            speedX: { min: -100, max: 100 },
            speedY: { min: -50, max: 50 },
            scale: { start: 0.6, end: 0 },
            lifespan: 300,
            quantity: 6,
            on: false,
          }).explode();
        }
      }

      // ============================================================
      // SPAWN OBSTACLE
      // ============================================================
      spawnObstacle() {
        if (!this.started || this.gameOver || this.isPaused) return;

        const { width, height } = this.scale;
        
        // Random obstacle height variation
        const obstacleY = height - Phaser.Math.Between(80, 120);
        
        const obs = this.obstacles.create(width + 50, obstacleY, "obstacle");
        obs.setVelocityX(-this.currentSpeed);
        obs.setImmovable(true);
        obs.setScale(Phaser.Math.FloatBetween(0.9, 1.2));
        obs.body.setSize(obs.width * 0.8, obs.height); // Tighter hitbox
      }

      // ============================================================
      // SPAWN COIN
      // ============================================================
      spawnCoin() {
        if (!this.started || this.gameOver || this.isPaused) return;

        const { width, height } = this.scale;
        
        // Coins at varying heights
        const coinY = Phaser.Math.Between(height - 300, height - 150);
        
        const coin = this.coins.create(width + 50, coinY, "coin");
        coin.setVelocityX(-this.currentSpeed + 40);
        coin.setScale(1.2);
        
        // Coin rotation animation
        this.tweens.add({
          targets: coin,
          angle: 360,
          duration: 1500,
          repeat: -1,
        });
        
        // Coin pulse animation
        this.tweens.add({
          targets: coin,
          scaleX: 1.3,
          scaleY: 1.3,
          duration: 500,
          yoyo: true,
          repeat: -1,
        });
      }

      // ============================================================
      // COLLECT COIN
      // ============================================================
      collectCoin(player, coin) {
        // Particle burst effect
        this.dust.createEmitter({
          x: coin.x,
          y: coin.y,
          speedX: { min: -100, max: 100 },
          speedY: { min: -100, max: 100 },
          scale: { start: 0.8, end: 0 },
          tint: 0xFFD700,
          lifespan: 400,
          quantity: 8,
          on: false,
        }).explode();
        
        coin.destroy();
        this.coins++;
        this.score += 10;
        
        this.scoreText.setText(this.score);
        this.coinText.setText(this.coins);
        
        // Score pop animation
        this.tweens.add({
          targets: this.scoreText,
          scaleX: 1.2,
          scaleY: 1.2,
          duration: 100,
          yoyo: true,
        });
      }

      // ============================================================
      // HIT OBSTACLE - GAME OVER
      // ============================================================
      hitObstacle() {
        if (this.gameOver) return;

        this.gameOver = true;
        
        // Pause physics
        this.physics.pause();
        
        // Stop timers
        if (this.obstacleTimer) this.obstacleTimer.destroy();
        if (this.coinTimer) this.coinTimer.destroy();
        if (this.difficultyTimer) this.difficultyTimer.destroy();
        
        // Player death effect
        this.player.setTint(0xff0000);
        this.player.setVelocity(0);
        
        // Camera shake
        this.cameras.main.shake(200, 0.01);
        
        // Stop dust
        this.dustEmitter.stop();
        
        // Show game over
        this.showGameOver();
      }

      // ============================================================
      // GAME OVER SCREEN
      // ============================================================
      async showGameOver() {
        const { width, height } = this.scale;

        // Darken screen
        const overlay = this.add
          .rectangle(0, 0, width, height, 0x000000, 0.7)
          .setOrigin(0)
          .setDepth(300)
          .setAlpha(0);
        
        this.tweens.add({
          targets: overlay,
          alpha: 0.7,
          duration: 500,
        });

        // Game Over text
        this.time.delayedCall(300, () => {
          const gameOverText = this.add
            .text(width / 2, height / 2 - 100, "TRIAL COMPLETE", {
              fontSize: "48px",
              color: "#FFD700",
              fontFamily: "Cinzel, serif",
              fontStyle: "bold",
              stroke: "#8B4513",
              strokeThickness: 6,
            })
            .setOrigin(0.5)
            .setDepth(301)
            .setAlpha(0);

          // Stats
          const statsText = this.add
            .text(
              width / 2,
              height / 2,
              `Score: ${this.score}\nCoins: ${this.coins}\nDistance: ${this.distance}m`,
              {
                fontSize: "24px",
                color: "#FFF",
                fontFamily: "Cinzel, serif",
                align: "center",
                lineSpacing: 10,
              }
            )
            .setOrigin(0.5)
            .setDepth(301)
            .setAlpha(0);

          // Fade in game over UI
          this.tweens.add({
            targets: [gameOverText, statsText],
            alpha: 1,
            duration: 500,
          });
        });

        // Save score to backend
        try {
          await this.saveScore();
        } catch (error) {
          console.error("Failed to save score:", error);
        }

        // Redirect to dashboard
        this.time.delayedCall(3000, () => {
          this.cameras.main.fadeOut(800);
        });

        this.cameras.main.once("camerafadeoutcomplete", () => {
          // Notify React component
          if (window.onGameComplete) {
            window.onGameComplete({
              score: this.score,
              coins: this.coins,
              distance: this.distance,
            });
          }
        });
      }

      // ============================================================
      // SAVE SCORE TO BACKEND
      // ============================================================
      async saveScore() {
        try {
          const response = await gameAPI.updateScore({
            score: this.score,
            coinsCollected: this.coins,
            timeSpent: Math.floor(this.distance / 10),
            completed: true,
          });
          
          console.log("Score saved successfully:", response.data);
        } catch (error) {
          console.error("Error saving score:", error);
        }
      }

      // ============================================================
      // INCREASE DIFFICULTY
      // ============================================================
      increaseDifficulty() {
        if (this.gameOver) return;
        
        this.difficulty += 0.1;
        this.currentSpeed = Math.min(this.baseSpeed * this.difficulty, 450);
        
        // Decrease spawn intervals
        this.obstacleInterval = Math.max(1000, this.obstacleInterval - 50);
        this.coinInterval = Math.max(800, this.coinInterval - 40);
        
        // Update timers
        if (this.obstacleTimer) {
          this.obstacleTimer.delay = this.obstacleInterval;
        }
        if (this.coinTimer) {
          this.coinTimer.delay = this.coinInterval;
        }
      }

      // ============================================================
      // UPDATE LOOP
      // ============================================================
      update(time, delta) {
        if (!this.started || this.gameOver || this.isPaused) return;

        // Parallax scrolling
        const scrollSpeed = this.currentSpeed / 100;
        this.bg1.tilePositionX += scrollSpeed * 1.5;
        this.bg2.tilePositionX += scrollSpeed * 0.8;

        // Update dust trail position
        this.dustEmitter.setPosition(
          this.player.x - 20,
          this.player.y + 20
        );

        // Update distance
        this.distance += scrollSpeed * 2;
        this.distanceText.setText(Math.floor(this.distance) + "m");

        // Cleanup off-screen objects
        this.obstacles.children.iterate((obj) => {
          if (obj && obj.x < -100) {
            obj.destroy();
          }
        });

        this.coins.children.iterate((obj) => {
          if (obj && obj.x < -100) {
            obj.destroy();
          }
        });

        // Keyboard jump support
        if (this.cursors.up.isDown || this.cursors.space?.isDown) {
          this.handleJump();
        }
      }

      // ============================================================
      // PAUSE/RESUME - FIXED
      // ============================================================
      pauseGame() {
        if (!this.started || this.gameOver) return;
        
        this.isPaused = true;
        this.physics.pause();
        
        // Fix: Check if timers exist before pausing
        if (this.obstacleTimer) {
          this.obstacleTimer.paused = true;
        }
        if (this.coinTimer) {
          this.coinTimer.paused = true;
        }
        if (this.difficultyTimer) {
          this.difficultyTimer.paused = true;
        }
      }

      resumeGame() {
        if (!this.started || this.gameOver) return;
        
        this.isPaused = false;
        this.physics.resume();
        
        // Fix: Check if timers exist before resuming
        if (this.obstacleTimer) {
          this.obstacleTimer.paused = false;
        }
        if (this.coinTimer) {
          this.coinTimer.paused = false;
        }
        if (this.difficultyTimer) {
          this.difficultyTimer.paused = false;
        }
      }
    }

    // ============================================================
    // PHASER GAME CONFIGURATION
    // ============================================================
    const config = {
      type: Phaser.AUTO,
      width: window.innerWidth,
      height: window.innerHeight,
      parent: "phaser-container",
      backgroundColor: "#1a1a1a",
      physics: {
        default: "arcade",
        arcade: {
          gravity: { y: 0 },
          debug: false, // Set to true for hitbox debugging
        },
      },
      scene: MainScene,
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
    };

    // Create game instance
    gameRef.current = new Phaser.Game(config);
    sceneRef.current = gameRef.current.scene.scenes[0];
    
    // Mark as loaded
    setGameState((prev) => ({ ...prev, isLoading: false }));

    // ============================================================
    // GAME COMPLETION CALLBACK
    // ============================================================
    window.onGameComplete = async (results) => {
      setGameState({
        isLoading: false,
        isPaused: false,
        finalScore: results.score,
        coins: results.coins,
        distance: results.distance,
      });

      // Update user points in global state
      try {
        const response = await gameAPI.getStats();
        if (response.data.success) {
          updateUser({
            totalPoints: response.data.data.totalPoints,
          });
        }
      } catch (error) {
        console.error("Failed to update user stats:", error);
      }

      // Navigate back to dashboard
      setTimeout(() => {
        navigate("/dashboard");
      }, 500);
    };

    // ============================================================
    // CLEANUP ON UNMOUNT
    // ============================================================
    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
        sceneRef.current = null;
      }
      window.onGameComplete = null;
    };
  }, [navigate, updateUser]);

  // ============================================================
  // PAUSE/RESUME HANDLERS (External UI)
  // ============================================================
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
    if (window.confirm("Are you sure you want to quit? Progress will be lost.")) {
      navigate("/dashboard");
    }
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* Loading Screen */}
      {gameState.isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-arena-black z-50">
          <div className="text-center">
            <div className="spinner mx-auto mb-4"></div>
            <p className="text-arena-gold text-xl font-arena">
              Loading Trial...
            </p>
          </div>
        </div>
      )}

      {/* Game Container */}
      <div id="phaser-container" className="w-full h-full"></div>

      {/* Pause Overlay */}
      {gameState.isPaused && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-40">
          <div className="arena-card p-8 text-center">
            <h2 className="text-3xl font-bold text-arena-gold mb-6">
              PAUSED
            </h2>
            <div className="space-y-4">
              <button onClick={handleResume} className="arena-button w-full">
                Resume
              </button>
              <button
                onClick={handleQuit}
                className="bg-red-900 hover:bg-red-800 text-white font-bold py-3 px-6 rounded-lg w-full"
              >
                Quit to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Control Buttons (Top Right) */}
      {!gameState.isLoading && (
        <div className="absolute top-4 right-4 flex gap-2 z-30">
          {!gameState.isPaused ? (
            <button
              onClick={handlePause}
              className="bg-arena-red/80 hover:bg-arena-red text-white p-3 rounded-lg backdrop-blur-sm"
              title="Pause"
            >
              ⏸️
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default Game;
