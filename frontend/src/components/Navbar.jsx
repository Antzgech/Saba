import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Phaser from "phaser";

const Game = () => {
  const gameRef = useRef(null);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("Game component mounted");
    
    if (gameRef.current) {
      console.log("Game already exists, skipping");
      return;
    }

    console.log("Creating new Phaser game...");

    // Simple test scene
    class TestScene extends Phaser.Scene {
      constructor() {
        super({ key: 'TestScene' });
        console.log("TestScene constructor");
      }

      preload() {
        console.log("TestScene preload");
      }

      create() {
        console.log("TestScene create START");
        
        const { width, height } = this.scale;
        console.log(`Canvas size: ${width}x${height}`);

        // Simple background
        this.add.rectangle(0, 0, width, height, 0xFF0000).setOrigin(0);
        
        // Test text
        this.add.text(width/2, height/2, 'GAME LOADED!', {
          fontSize: '48px',
          color: '#FFFFFF',
          fontFamily: 'Arial'
        }).setOrigin(0.5);

        console.log("TestScene create END");
      }
    }

    const config = {
      type: Phaser.AUTO,
      parent: 'phaser-container',
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: '#0000FF',
      scene: TestScene,
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
    };

    console.log("Config created, initializing Phaser.Game");
    
    try {
      gameRef.current = new Phaser.Game(config);
      console.log("Phaser.Game created successfully!");
      
      setTimeout(() => {
        console.log("Setting loading to false");
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error("ERROR creating Phaser game:", error);
    }

    return () => {
      console.log("Cleanup: destroying game");
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  return (
    <div className="relative w-full h-screen bg-black">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-green-500 z-50">
          <div className="text-white text-4xl">Loading...</div>
        </div>
      )}
      
      <div 
        id="phaser-container" 
        className="w-full h-full"
        style={{ background: 'yellow' }}
      />
      
      <button
        onClick={() => {
          console.log("Back button clicked");
          navigate("/dashboard");
        }}
        className="absolute top-4 right-4 bg-white text-black p-4 rounded z-50"
      >
        Back
      </button>
    </div>
  );
};

export default Game;
