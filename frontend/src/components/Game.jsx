import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Phaser from "phaser";
import { gameAPI } from "../services/api";
import { useAuthStore } from "../store";

const Game = () => {
  const gameRef = useRef(null);
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Prevent multiple instances in Strict Mode
    if (gameRef.current) return;

    class MainScene extends Phaser.Scene {
      constructor() {
        super({ key: "MainScene" });
        // --- Game Logic Variables ---
        this.player = null;
        this.score = 0;
        this.coinScore = 0; // Fixed: Use a different name from the group
        this.currentLane = 1;
        this.isMoving = false;
        this.gameOver = false;
        this.gameStarted = false;
        this.speed = 350;
      }

      preload() {
        this.createVectorGraphics();
      }

      createVectorGraphics() {
        const g = this.make.graphics({ add: false });
        
        // 1. NEON PLAYER (Cyan Glow)
        g.clear();
        g.lineStyle(2, 0x00ffff, 1);
        g.fillStyle(0x00ffff, 0.1);
        g.fillRoundedRect(2, 2, 56, 86, 10);
        g.strokeRoundedRect(2, 2, 56, 86, 10);
        g.fillStyle(0xffffff, 0.8);
        g.fillCircle(15, 12, 4); // Headlight L
        g.fillCircle(45, 12, 4); // Headlight R
        g.generateTexture('player_car', 60, 90);

        // 2. GLOWING COIN
        g.clear();
        g.lineStyle(3, 0xffd700, 1);
        g.fillStyle(0xffd700, 0.4);
        g.fillCircle(20, 20, 15);
        g.strokeCircle(20, 20, 15);
        g.generateTexture('neon_coin', 40, 40);

        // 3. OBSTACLE (Red Hazard)
        g.clear();
        g.lineStyle(2, 0xff0055, 1);
        g.fillStyle(0xff0055, 0.2);
        g.fillRoundedRect(5, 5, 50, 50, 8);
        g.strokeRoundedRect(5, 5, 50, 50, 8);
        g.generateTexture('hazard', 60, 60);

        // 4. PARTICLES
        g.clear();
        g.fillStyle(0xffffff, 1);
        g.fillRect(0, 0, 4, 4);
        g.generateTexture('spark', 4, 4);

        g.destroy();
      }

      create() {
        const { width, height } = this.scale;
        this.laneWidth = width / 3;

        // Background: Cyber Grid
        this.grid = this.add.grid(width/2, height/2, width, height * 2, 60, 60, 0, 0, 0x00ffff, 0.05);
        
        // Physics Groups
        this.coinGroup = this.add.group(); // Fixed naming
        this.hazardGroup = this.add.group();

        // Player
        this.player = this.add.sprite(this.getLaneX(1), height - 150, 'player_car');
        this.player.setDepth(10);

        // Particle Emitter for collections
        this.emitter = this.add.particles(0, 0, 'spark', {
          speed: { min: -150, max: 150 },
          scale: { start: 1, end: 0 },
          blendMode: 'ADD',
          lifespan: 600,
          emitting: false
        });

        this.setupControls();
        this.startSequence();
        setIsLoading(false);
      }

      getLaneX(lane) {
        return (lane * this.laneWidth) + (this.laneWidth / 2);
      }

      setupControls() {
        this.input.keyboard.on('keydown-LEFT', () => this.moveLane(-1));
        this.input.keyboard.on('keydown-A', () => this.moveLane(-1));
        this.input.keyboard.on('keydown-RIGHT', () => this.moveLane(1));
        this.input.keyboard.on('keydown-D', () => this.moveLane(1));
      }

      moveLane(dir) {
        if (this.isMoving || this.gameOver) return;
        const targetLane = Phaser.Math.Clamp(this.currentLane + dir, 0, 2);
        if (targetLane === this.currentLane) return;

        this.isMoving = true;
        this.currentLane = targetLane;

        this.tweens.add({
          targets: this.player,
          x: this.getLaneX(this.currentLane),
          duration: 150,
          ease: 'Power2',
          onComplete: () => { this.isMoving = false; }
        });
      }

      startSequence() {
        this.gameStarted = true;
        this.time.addEvent({ delay: 1200, callback: this.spawnHazard, callbackScope: this, loop: true });
        this.time.addEvent({ delay: 1000, callback: this.spawnCoin, callbackScope: this, loop: true });
      }

      spawnCoin() {
        if (this.gameOver) return;
        const x = this.getLaneX(Phaser.Math.Between(0, 2));
        const coin = this.add.sprite(x, -50, 'neon_coin');
        this.coinGroup.add(coin);

        this.tweens.add({
          targets: coin,
          y: this.scale.height + 100,
          duration: 3000,
          onComplete: () => coin.destroy()
        });
      }

      spawnHazard() {
        if (this.gameOver) return;
        const x = this.getLaneX(Phaser.Math.Between(0, 2));
        const hazard = this.add.sprite(x, -50, 'hazard');
        this.hazardGroup.add(hazard);

        this.tweens.add({
          targets: hazard,
          y: this.scale.height + 100,
          duration: 2500,
          onComplete: () => hazard.destroy()
        });
      }

      update(time, delta) {
        if (this.gameOver || !this.gameStarted) return;

        // Scroll Grid
        this.grid.y += (this.speed * delta) / 1000;
        if (this.grid.y > this.scale.height) this.grid.y = 0;

        // Collision Check: Coins
        this.coinGroup.children.iterate(coin => {
          if (coin && Phaser.Geom.Intersects.RectangleToRectangle(this.player.getBounds(), coin.getBounds())) {
            this.collectCoin(coin);
          }
        });

        // Collision Check: Hazards
        this.hazardGroup.children.iterate(hazard => {
          if (hazard && Phaser.Geom.Intersects.RectangleToRectangle(this.player.getBounds(), hazard.getBounds())) {
            this.endGame();
          }
        });
      }

      collectCoin(coin) {
        this.emitter.emitParticleAt(coin.x, coin.y, 10);
        this.coinScore += 1;
        this.score += 10;
        
        // Visual pop for the player
        this.tweens.add({ targets: this.player, scale: 1.05, duration: 50, yoyo: true });
        
        coin.destroy();
      }

      endGame() {
        this.gameOver = true;
        this.cameras.main.shake(400, 0.02);
        this.player.setTint(0xff0000);
        
        // Call React to handle transition
        setTimeout(() => {
          navigate("/dashboard");
        }, 1500);
      }
    }

    const config = {
      type: Phaser.AUTO,
      parent: "phaser-game-container",
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: "#020617",
      scene: MainScene,
      scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH }
    };

    gameRef.current = new Phaser.Game(config);

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [navigate]);

  return (
    <div className="relative w-full h-screen bg-slate-950">
      {isLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950">
           <div className="text-cyan-400 text-xl font-mono animate-pulse">INITIALIZING SYSTEM...</div>
        </div>
      )}
      
      <div id="phaser-game-container" className="w-full h-full" />

      {/* Modern React HUD */}
      {!isLoading && (
        <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start pointer-events-none">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl">
            <div className="text-xs text-cyan-400 font-bold uppercase tracking-widest">Score</div>
            <div className="text-3xl text-white font-mono font-bold">
              {/* Note: In a real app, you'd sync Phaser score to React state or just use Phaser text */}
              SYSTEM ACTIVE
            </div>
          </div>
          
          <button 
            onClick={() => setIsPaused(!isPaused)}
            className="pointer-events-auto bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl hover:bg-white/20 transition-all"
          >
            <span className="text-2xl">{isPaused ? "▶️" : "⏸️"}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default Game;
