import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { gameAPI } from '../services/api';
import { useAuthStore } from '../store';
import toast from 'react-hot-toast';
import { Crown, Zap, ArrowLeft } from 'lucide-react';

const MarioGame = () => {
  const canvasRef = useRef(null);
  const navigate = useNavigate();
  const [score, setScore] = useState(0);
  const [gameTime, setGameTime] = useState(600); // 10 minutes
  const [lives, setLives] = useState(3);
  const [gameState, setGameState] = useState('ready'); // ready, playing, paused, finished
  const [highScore, setHighScore] = useState(0);
  const { user, updateUser, refreshProfile } = useAuthStore();

  useEffect(() => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Game constants
    const GRAVITY = 0.6;
    const JUMP_POWER = -15;
    const MOVE_SPEED = 5;
    const CANVAS_WIDTH = canvas.width;
    const CANVAS_HEIGHT = canvas.height;

    // Game state
    let animationId;
    let keys = {};
    let gameStartTime = Date.now();
    let currentScore = 0;

    // Player (Queen)
    const player = {
      x: 100,
      y: CANVAS_HEIGHT - 150,
      width: 50,
      height: 50,
      velocityY: 0,
      velocityX: 0,
      isJumping: false,
      direction: 'right',
      animation: 0
    };

    // Platforms
    const platforms = [
      { x: 0, y: CANVAS_HEIGHT - 50, width: CANVAS_WIDTH, height: 50 }, // Ground
      { x: 300, y: CANVAS_HEIGHT - 200, width: 200, height: 20 },
      { x: 600, y: CANVAS_HEIGHT - 300, width: 200, height: 20 },
      { x: 200, y: CANVAS_HEIGHT - 350, width: 150, height: 20 },
      { x: 500, y: CANVAS_HEIGHT - 450, width: 180, height: 20 },
      { x: 850, y: CANVAS_HEIGHT - 250, width: 200, height: 20 },
      { x: 1100, y: CANVAS_HEIGHT - 350, width: 150, height: 20 },
    ];

    // Coins
    let coins = [
      { x: 350, y: CANVAS_HEIGHT - 250, collected: false },
      { x: 400, y: CANVAS_HEIGHT - 250, collected: false },
      { x: 650, y: CANVAS_HEIGHT - 350, collected: false },
      { x: 700, y: CANVAS_HEIGHT - 350, collected: false },
      { x: 250, y: CANVAS_HEIGHT - 400, collected: false },
      { x: 550, y: CANVAS_HEIGHT - 500, collected: false },
      { x: 600, y: CANVAS_HEIGHT - 500, collected: false },
      { x: 900, y: CANVAS_HEIGHT - 300, collected: false },
      { x: 1150, y: CANVAS_HEIGHT - 400, collected: false },
      { x: 1200, y: CANVAS_HEIGHT - 400, collected: false },
    ];

    // Enemies (obstacles)
    let enemies = [
      { x: 450, y: CANVAS_HEIGHT - 80, width: 40, height: 30, velocityX: 2, type: 'mushroom' },
      { x: 750, y: CANVAS_HEIGHT - 330, width: 40, height: 30, velocityX: -2, type: 'mushroom' },
      { x: 1000, y: CANVAS_HEIGHT - 280, width: 40, height: 30, velocityX: 2, type: 'mushroom' },
    ];

    // Camera offset
    let cameraX = 0;

    // Key handlers
    const handleKeyDown = (e) => {
      keys[e.key] = true;
      if (e.key === ' ' && !player.isJumping) {
        player.velocityY = JUMP_POWER;
        player.isJumping = true;
      }
    };

    const handleKeyUp = (e) => {
      keys[e.key] = false;
    };

    // Drawing functions
    const drawBackground = () => {
      // Sky gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      gradient.addColorStop(0, '#87CEEB');
      gradient.addColorStop(1, '#E0F6FF');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Clouds
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.beginPath();
      ctx.arc(200 - cameraX * 0.5, 80, 30, 0, Math.PI * 2);
      ctx.arc(230 - cameraX * 0.5, 80, 40, 0, Math.PI * 2);
      ctx.arc(260 - cameraX * 0.5, 80, 30, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(600 - cameraX * 0.5, 120, 35, 0, Math.PI * 2);
      ctx.arc(635 - cameraX * 0.5, 120, 45, 0, Math.PI * 2);
      ctx.arc(670 - cameraX * 0.5, 120, 35, 0, Math.PI * 2);
      ctx.fill();
    };

    const drawPlatforms = () => {
      platforms.forEach(platform => {
        // Draw brick-like platforms
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(platform.x - cameraX, platform.y, platform.width, platform.height);
        
        // Brick texture
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 2;
        for (let i = 0; i < platform.width; i += 40) {
          for (let j = 0; j < platform.height; j += 20) {
            ctx.strokeRect(platform.x - cameraX + i, platform.y + j, 40, 20);
          }
        }
      });
    };

    const drawPlayer = () => {
      const screenX = player.x - cameraX;
      
      // Draw Queen character
      ctx.save();
      
      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.beginPath();
      ctx.ellipse(screenX + player.width / 2, player.y + player.height + 5, 20, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Body (dress)
      ctx.fillStyle = '#FF1493';
      ctx.beginPath();
      ctx.moveTo(screenX + player.width / 2, player.y + 20);
      ctx.lineTo(screenX + 10, player.y + player.height);
      ctx.lineTo(screenX + player.width - 10, player.y + player.height);
      ctx.closePath();
      ctx.fill();

      // Head
      ctx.fillStyle = '#FFE4C4';
      ctx.beginPath();
      ctx.arc(screenX + player.width / 2, player.y + 15, 15, 0, Math.PI * 2);
      ctx.fill();

      // Crown
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.moveTo(screenX + player.width / 2 - 12, player.y + 5);
      ctx.lineTo(screenX + player.width / 2 - 8, player.y - 2);
      ctx.lineTo(screenX + player.width / 2 - 4, player.y + 2);
      ctx.lineTo(screenX + player.width / 2, player.y - 5);
      ctx.lineTo(screenX + player.width / 2 + 4, player.y + 2);
      ctx.lineTo(screenX + player.width / 2 + 8, player.y - 2);
      ctx.lineTo(screenX + player.width / 2 + 12, player.y + 5);
      ctx.closePath();
      ctx.fill();

      // Eyes
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(screenX + player.width / 2 - 5, player.y + 12, 2, 0, Math.PI * 2);
      ctx.arc(screenX + player.width / 2 + 5, player.y + 12, 2, 0, Math.PI * 2);
      ctx.fill();

      // Smile
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(screenX + player.width / 2, player.y + 15, 5, 0, Math.PI);
      ctx.stroke();

      ctx.restore();
    };

    const drawCoins = () => {
      coins.forEach(coin => {
        if (coin.collected) return;
        
        const screenX = coin.x - cameraX;
        const pulse = Math.sin(Date.now() / 200) * 2;
        
        // Coin glow
        ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
        ctx.beginPath();
        ctx.arc(screenX, coin.y, 15 + pulse, 0, Math.PI * 2);
        ctx.fill();

        // Coin
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(screenX, coin.y, 12, 0, Math.PI * 2);
        ctx.fill();
        
        // Coin shine
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(screenX - 3, coin.y - 3, 4, 0, Math.PI * 2);
        ctx.fill();

        // Crown symbol on coin
        ctx.fillStyle = '#DAA520';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('♕', screenX, coin.y + 4);
      });
    };

    const drawEnemies = () => {
      enemies.forEach(enemy => {
        const screenX = enemy.x - cameraX;
        
        // Mushroom enemy
        ctx.fillStyle = '#FF0000';
        ctx.beginPath();
        ctx.arc(screenX + enemy.width / 2, enemy.y + 10, 15, 0, Math.PI);
        ctx.fill();
        
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(screenX + 10, enemy.y + 5, 5, 0, Math.PI * 2);
        ctx.arc(screenX + 25, enemy.y + 5, 5, 0, Math.PI * 2);
        ctx.fill();

        // Body
        ctx.fillStyle = '#FFE4C4';
        ctx.fillRect(screenX + 8, enemy.y + 15, 24, 15);
        
        // Eyes
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(screenX + 13, enemy.y + 20, 2, 0, Math.PI * 2);
        ctx.arc(screenX + 27, enemy.y + 20, 2, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    const drawHUD = () => {
      // Score
      ctx.fillStyle = '#000';
      ctx.font = 'bold 24px Arial';
      ctx.fillText(`Score: ${currentScore}`, 20, 40);
      
      // Time
      const timeLeft = Math.max(0, Math.floor((600000 - (Date.now() - gameStartTime)) / 1000));
      ctx.fillText(`Time: ${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}`, 20, 75);
      
      // Lives
      ctx.fillText(`Lives: `, 20, 110);
      for (let i = 0; i < lives; i++) {
        ctx.fillText('♥', 100 + i * 25, 110);
      }
    };

    // Collision detection
    const checkCollision = (rect1, rect2) => {
      return rect1.x < rect2.x + rect2.width &&
             rect1.x + rect1.width > rect2.x &&
             rect1.y < rect2.y + rect2.height &&
             rect1.y + rect1.height > rect2.y;
    };

    const checkPlatformCollision = () => {
      let onGround = false;
      platforms.forEach(platform => {
        if (checkCollision(player, platform)) {
          if (player.velocityY > 0 && player.y + player.height - platform.y < 20) {
            player.y = platform.y - player.height;
            player.velocityY = 0;
            player.isJumping = false;
            onGround = true;
          }
        }
      });
      return onGround;
    };

    const checkCoinCollision = () => {
      coins.forEach(coin => {
        if (coin.collected) return;
        const distance = Math.sqrt(
          Math.pow(player.x + player.width / 2 - coin.x, 2) +
          Math.pow(player.y + player.height / 2 - coin.y, 2)
        );
        if (distance < 30) {
          coin.collected = true;
          currentScore += 10;
          setScore(currentScore);
        }
      });
    };

    const checkEnemyCollision = () => {
      enemies.forEach(enemy => {
        if (checkCollision(player, enemy)) {
          // Check if jumping on enemy
          if (player.velocityY > 0 && player.y + player.height - enemy.y < 15) {
            enemy.x = -1000; // Remove enemy
            player.velocityY = JUMP_POWER / 2;
            currentScore += 20;
            setScore(currentScore);
          } else {
            // Hit by enemy
            setLives(prev => prev - 1);
            player.x = 100;
            player.y = CANVAS_HEIGHT - 150;
            player.velocityY = 0;
          }
        }
      });
    };

    // Update game state
    const update = () => {
      // Player movement
      if (keys['ArrowLeft'] || keys['a']) {
        player.velocityX = -MOVE_SPEED;
        player.direction = 'left';
      } else if (keys['ArrowRight'] || keys['d']) {
        player.velocityX = MOVE_SPEED;
        player.direction = 'right';
      } else {
        player.velocityX = 0;
      }

      // Apply gravity
      player.velocityY += GRAVITY;
      
      // Update position
      player.x += player.velocityX;
      player.y += player.velocityY;

      // Boundaries
      if (player.x < 0) player.x = 0;
      if (player.x > 1500) player.x = 1500;

      // Camera follow
      if (player.x - cameraX > CANVAS_WIDTH / 2) {
        cameraX = player.x - CANVAS_WIDTH / 2;
      }
      if (player.x - cameraX < CANVAS_WIDTH / 3) {
        cameraX = player.x - CANVAS_WIDTH / 3;
      }
      cameraX = Math.max(0, Math.min(cameraX, 800));

      // Check collisions
      checkPlatformCollision();
      checkCoinCollision();
      checkEnemyCollision();

      // Move enemies
      enemies.forEach(enemy => {
        enemy.x += enemy.velocityX;
        if (enemy.x < 0 || enemy.x > 1400) {
          enemy.velocityX *= -1;
        }
      });

      // Check game over
      if (player.y > CANVAS_HEIGHT) {
        setLives(prev => prev - 1);
        player.x = 100;
        player.y = CANVAS_HEIGHT - 150;
        player.velocityY = 0;
      }

      // Update time
      const elapsed = Math.floor((Date.now() - gameStartTime) / 1000);
      setGameTime(Math.max(0, 600 - elapsed));
      
      if (gameTime <= 0 || lives <= 0) {
        endGame();
      }
    };

    // Main game loop
    const gameLoop = () => {
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      drawBackground();
      drawPlatforms();
      drawCoins();
      drawEnemies();
      drawPlayer();
      drawHUD();
      
      update();
      
      animationId = requestAnimationFrame(gameLoop);
    };

    const endGame = async () => {
      cancelAnimationFrame(animationId);
      setGameState('finished');
      
      try {
        // Save score to backend
        const response = await gameAPI.completeGame({
          score: currentScore,
          durationSeconds: 600 - gameTime,
        });
        
        const { pointsEarned, totalPoints, currentLevel } = response.data.data;
        updateUser({ totalPoints, currentLevel });
        
        toast.success(`Game complete! You earned ${pointsEarned} points!`);
        await refreshProfile();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to save score');
      }
    };

    // Event listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Start game loop
    gameLoop();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, lives, gameTime, updateUser, refreshProfile]);

  const startGame = async () => {
    try {
      await gameAPI.startGame();
      setGameState('playing');
      setScore(0);
      setLives(3);
      setGameTime(600);
      toast.success('Queen\'s adventure begins!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to start game');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-400 to-blue-600 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg hover:bg-white/30 transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
            <span className="text-white font-semibold">Back</span>
          </button>
          <div className="text-white text-xl font-bold">Queen's Coin Quest</div>
          <div className="flex gap-4 text-white">
            <div className="bg-black/30 px-4 py-2 rounded-lg backdrop-blur-sm">
              <Crown className="w-5 h-5 inline mr-2 text-yellow-400" />
              Score: {score}
            </div>
          </div>
        </div>

        {/* Game Canvas */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border-8 border-yellow-500">
          {gameState === 'ready' && (
            <div className="h-[600px] flex flex-col items-center justify-center bg-gradient-to-b from-sky-400 to-sky-300 p-8">
              <Crown className="w-24 h-24 text-yellow-400 mb-6 animate-bounce-slow" />
              <h2 className="text-4xl font-bold text-white mb-4 text-center drop-shadow-lg">
                Queen's Coin Quest
              </h2>
              <div className="bg-white/90 rounded-xl p-6 mb-6 max-w-md">
                <h3 className="font-bold text-xl mb-3 text-gray-800">How to Play:</h3>
                <ul className="text-gray-700 space-y-2">
                  <li>🎮 <strong>Move:</strong> Arrow Keys or A/D</li>
                  <li>⬆️ <strong>Jump:</strong> Spacebar</li>
                  <li>👑 <strong>Collect:</strong> Golden coins for points</li>
                  <li>🍄 <strong>Avoid:</strong> Mushroom enemies</li>
                  <li>⭐ <strong>Bonus:</strong> Jump on enemies for extra points</li>
                  <li>⏱️ <strong>Time:</strong> 10 minutes to score maximum points</li>
                </ul>
              </div>
              <button onClick={startGame} className="btn-primary text-xl px-12 py-4">
                Start Adventure!
              </button>
            </div>
          )}

          {gameState === 'playing' && (
            <canvas
              ref={canvasRef}
              width={1200}
              height={600}
              className="w-full"
            />
          )}

          {gameState === 'finished' && (
            <div className="h-[600px] flex flex-col items-center justify-center bg-gradient-to-b from-purple-500 to-pink-500 p-8">
              <Crown className="w-32 h-32 text-yellow-300 mb-6 animate-pulse" />
              <h2 className="text-5xl font-bold text-white mb-4">Adventure Complete!</h2>
              <div className="bg-white/90 rounded-2xl p-8 mb-6">
                <div className="text-center mb-4">
                  <div className="text-gray-600 text-lg mb-2">Final Score</div>
                  <div className="text-6xl font-black text-yellow-500">{score}</div>
                </div>
                {score > highScore && (
                  <div className="text-center text-green-600 font-bold text-xl">
                    🎉 New High Score! 🎉
                  </div>
                )}
              </div>
              <div className="flex gap-4">
                <button onClick={() => navigate('/dashboard')} className="btn-primary px-8 py-3">
                  Back to Kingdom
                </button>
                <button onClick={startGame} className="btn-secondary px-8 py-3">
                  Play Again
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        {gameState === 'playing' && (
          <div className="mt-4 bg-white/20 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center justify-between text-white text-sm">
              <div>⏱️ Time: {formatTime(gameTime)}</div>
              <div>♥ Lives: {lives}</div>
              <div>👑 Journey to King Solomon's palace by collecting coins!</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarioGame;
