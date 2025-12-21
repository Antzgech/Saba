import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Phaser from "phaser";

const RunnerGame = () => {
  const gameRef = useRef(null);
  const navigate = useNavigate();
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (gameRef.current) return;

    class RunnerScene extends Phaser.Scene {
      constructor() {
        super("RunnerScene");
        this.player = null;
        this.lane = 1; // 0: Left, 1: Center, 2: Right
        this.gameSpeed = 5;
        this.isMoving = false;
        this.scoreCount = 0;
        this.isGameOver = false;
      }

      preload() {
        this.createAssets();
      }

      createAssets() {
        const g = this.make.graphics({ add: false });
        
        // 1. NEON PLAYER (Google Dino inspired but "Glass")
        g.clear();
        g.lineStyle(2, 0x00ffcc, 1);
        g.fillStyle(0x00ffcc, 0.2);
        g.fillRoundedRect(0, 0, 50, 50, 8);
        g.strokeRoundedRect(0, 0, 50, 50, 8);
        g.generateTexture('hero', 50, 50);

        // 2. GLOWING CRYSTAL (Professional Coin)
        g.clear();
        g.lineStyle(2, 0xff00ff, 1);
        g.fillStyle(0xff00ff, 0.5);
        g.beginPath();
        g.moveTo(15, 0); g.lineTo(30, 15); g.lineTo(15, 30); g.lineTo(0, 15);
        g.closePath();
        g.fillPath();
        g.strokePath();
        g.generateTexture('coin', 30, 30);

        // 3. HAZARD
        g.clear();
        g.lineStyle(2, 0xff4444, 1);
        g.strokeRect(0, 0, 60, 20);
        g.generateTexture('barrier', 60, 20);

        g.destroy();
      }

      create() {
        const { width, height } = this.scale;
        
        // --- DRAW ROAD PERSPECTIVE ---
        const road = this.add.graphics();
        road.lineStyle(2, 0x334155, 1);
        // Vanishing Point lines
        road.lineBetween(width / 2, 200, 0, height);
        road.lineBetween(width / 2, 200, width, height);
        road.lineBetween(width / 2, 200, width / 2, height);

        // Physics Groups
        this.coins = this.add.group();
        this.obstacles = this.add.group();

        // Player Setup
        this.player = this.add.sprite(width / 2, height - 100, 'hero');
        
        // Input Handling
        this.setupControls();

        // Spawning Loop
        this.time.addEvent({ delay: 1000, callback: this.spawnObject, callbackScope: this, loop: true });
      }

      setupControls() {
        this.input.on('pointerdown', (pointer) => {
          if (pointer.x < this.scale.width / 2) this.moveLane(-1);
          else this.moveLane(1);
        });

        this.input.keyboard.on('keydown-LEFT', () => this.moveLane(-1));
        this.input.keyboard.on('keydown-RIGHT', () => this.moveLane(1));
      }

      moveLane(dir) {
        if (this.isMoving || this.isGameOver) return;
        const newLane = Phaser.Math.Clamp(this.lane + dir, 0, 2);
        if (newLane === this.lane) return;

        this.isMoving = true;
        this.lane = newLane;
        
        const laneX = [this.scale.width * 0.2, this.scale.width * 0.5, this.scale.width * 0.8];
        
        this.tweens.add({
          targets: this.player,
          x: laneX[this.lane],
          duration: 100,
          ease: 'Back.easeOut',
          onComplete: () => this.isMoving = false
        });
      }

      spawnObject() {
        if (this.isGameOver) return;
        const type = Math.random() > 0.3 ? 'coin' : 'barrier';
        const targetLane = Phaser.Math.Between(0, 2);
        const laneXStart = this.scale.width / 2;
        const laneXEnd = [this.scale.width * 0.1, this.scale.width * 0.5, this.scale.width * 0.9];

        const obj = this.add.sprite(laneXStart, 200, type);
        obj.setScale(0.1);
        obj.setAlpha(0);

        if (type === 'coin') this.coins.add(obj);
        else this.obstacles.add(obj);

        // PERSPECTIVE EFFECT: Object grows and moves toward the camera
        this.tweens.add({
          targets: obj,
          x: laneXEnd[targetLane],
          y: this.scale.height + 100,
          scale: 1.5,
          alpha: 1,
          duration: 3000 / (this.gameSpeed / 5),
          onComplete: () => obj.destroy()
        });
      }

      update() {
        if (this.isGameOver) return;

        // Collision Check (Fixes the "Stacking" bug)
        this.coins.children.iterate(coin => {
          if (coin && Phaser.Geom.Intersects.RectangleToRectangle(this.player.getBounds(), coin.getBounds())) {
            this.collectCoin(coin);
          }
        });

        this.obstacles.children.iterate(obs => {
          if (obs && Phaser.Geom.Intersects.RectangleToRectangle(this.player.getBounds(), obs.getBounds())) {
            this.hitBarrier();
          }
        });
      }

      collectCoin(coin) {
        // IMPORTANT: Disable physics/interaction immediately
        coin.destroy(); 
        this.scoreCount += 10;
        this.events.emit('updateScore', this.scoreCount);

        // Flashy Feedback
        this.cameras.main.flash(100, 0, 255, 200, 0.1);
      }

      hitBarrier() {
        this.isGameOver = true;
        this.cameras.main.shake(500, 0.02);
        this.player.setTint(0xff0000);
        
        setTimeout(() => navigate("/dashboard"), 2000);
      }
    }

    const config = {
      type: Phaser.AUTO,
      parent: "game-root",
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: "#0f172a",
      scene: RunnerScene,
      scale: { mode: Phaser.Scale.RESIZE }
    };

    gameRef.current = new Phaser.Game(config);

    return () => gameRef.current.destroy(true);
  }, [navigate]);

  return (
    <div className="relative w-full h-screen">
      <div id="game-root" className="w-full h-full" />
      
      {/* HUD: Clean Glassmorphism */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 pointer-events-none">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 px-8 py-3 rounded-full shadow-2xl">
          <span className="text-pink-400 font-mono text-sm uppercase tracking-tighter mr-2">Score</span>
          <span className="text-white text-3xl font-bold font-mono">0000</span>
        </div>
      </div>
    </div>
  );
};

export default RunnerGame;
