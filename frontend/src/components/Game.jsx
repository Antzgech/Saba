import React, { useEffect, useRef, useState } from 'react';
import { gameAPI } from '../services/api';
import { useAuthStore } from '../store';
import toast from 'react-hot-toast';

const Game = () => {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState('ready'); // ready, playing, finished
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [sessionId, setSessionId] = useState(null);
  const updateUser = useAuthStore(state => state.updateUser);
  const refreshProfile = useAuthStore(state => state.refreshProfile);

  useEffect(() => {
    if (gameState === 'playing') {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      // Simple game: Click the moving circles
      let circles = [];
      let animationId;
      let startTime = Date.now();
      
      const createCircle = () => ({
        x: Math.random() * (canvas.width - 40) + 20,
        y: Math.random() * (canvas.height - 40) + 20,
        radius: 20,
        dx: (Math.random() - 0.5) * 4,
        dy: (Math.random() - 0.5) * 4,
        color: `hsl(${Math.random() * 360}, 70%, 60%)`,
      });
      
      // Initialize circles
      for (let i = 0; i < 5; i++) {
        circles.push(createCircle());
      }
      
      const drawCircle = (circle) => {
        ctx.beginPath();
        ctx.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2);
        ctx.fillStyle = circle.color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
      };
      
      const updateCircles = () => {
        circles.forEach(circle => {
          circle.x += circle.dx;
          circle.y += circle.dy;
          
          if (circle.x + circle.radius > canvas.width || circle.x - circle.radius < 0) {
            circle.dx = -circle.dx;
          }
          if (circle.y + circle.radius > canvas.height || circle.y - circle.radius < 0) {
            circle.dy = -circle.dy;
          }
        });
      };
      
      const draw = () => {
        ctx.fillStyle = '#0a0a0b';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        circles.forEach(drawCircle);
        updateCircles();
        
        // Update timer
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const remaining = Math.max(0, 600 - elapsed);
        setTimeLeft(remaining);
        
        if (remaining > 0) {
          animationId = requestAnimationFrame(draw);
        } else {
          endGame();
        }
      };
      
      const handleClick = (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        circles = circles.filter(circle => {
          const distance = Math.sqrt((x - circle.x) ** 2 + (y - circle.y) ** 2);
          if (distance < circle.radius) {
            setScore(s => s + 10);
            return false;
          }
          return true;
        });
        
        // Add new circle if less than 5
        while (circles.length < 5) {
          circles.push(createCircle());
        }
      };
      
      canvas.addEventListener('click', handleClick);
      draw();
      
      return () => {
        cancelAnimationFrame(animationId);
        canvas.removeEventListener('click', handleClick);
      };
    }
  }, [gameState]);

  const startGame = async () => {
    try {
      const response = await gameAPI.startGame();
      setSessionId(response.data.data.sessionId);
      setGameState('playing');
      setScore(0);
      setTimeLeft(600);
      toast.success('Game started! Click the circles!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to start game');
    }
  };

  const endGame = async () => {
    setGameState('finished');
    try {
      const response = await gameAPI.completeGame({
        score,
        durationSeconds: 600 - timeLeft,
      });
      
      const { pointsEarned, totalPoints, currentLevel } = response.data.data;
      updateUser({ totalPoints, currentLevel });
      
      toast.success(`Game complete! You earned ${pointsEarned} points!`);
      await refreshProfile();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to complete game');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-display font-bold gradient-text">Daily Challenge</h2>
          <div className="flex gap-6 text-sm">
            <div className="text-center">
              <div className="text-gray-400">Score</div>
              <div className="text-2xl font-bold text-primary-500">{score}</div>
            </div>
            <div className="text-center">
              <div className="text-gray-400">Time</div>
              <div className="text-2xl font-bold">{formatTime(timeLeft)}</div>
            </div>
          </div>
        </div>
        
        {gameState === 'ready' && (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold mb-4">Ready to Play?</h3>
            <p className="text-gray-400 mb-6">Click the moving circles to score points! You have 10 minutes.</p>
            <button onClick={startGame} className="btn-primary">
              Start Game
            </button>
          </div>
        )}
        
        {gameState === 'playing' && (
          <canvas
            ref={canvasRef}
            width={800}
            height={500}
            className="w-full border-2 border-dark-600 rounded-xl cursor-pointer"
          />
        )}
        
        {gameState === 'finished' && (
          <div className="text-center py-12">
            <h3 className="text-3xl font-bold mb-4">Game Over!</h3>
            <p className="text-xl text-primary-500 mb-2">Final Score: {score}</p>
            <p className="text-gray-400 mb-6">Come back tomorrow to play again!</p>
            <button onClick={() => window.location.href = '/dashboard'} className="btn-primary">
              Back to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Game;
