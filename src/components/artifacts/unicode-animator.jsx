/*
* @description Animate unicode characters
*/

import React, { useState, useEffect } from 'react';

const UnicodeAnimator = () => {
  const [currentCodePoint, setCurrentCodePoint] = useState(0x12000);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(100); // ms between updates
  
  const startCodePoint = 0x12000;
  const numCodePoints = 1000;
  
  useEffect(() => {
    let animationTimer;
    
    if (isPlaying) {
      animationTimer = setInterval(() => {
        setCurrentCodePoint(current => {
          // Loop back to start when we reach the end of our range
          if (current >= startCodePoint + numCodePoints - 1) {
            return startCodePoint;
          }
          return current + 1;
        });
      }, speed);
    }
    
    return () => {
      clearInterval(animationTimer);
    };
  }, [isPlaying, speed]);
  
  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };
  
  const speedUp = () => {
    if (speed > 20) {
      setSpeed(prevSpeed => prevSpeed - 20);
    }
  };
  
  const slowDown = () => {
    setSpeed(prevSpeed => prevSpeed + 20);
  };
  
  const reset = () => {
    setCurrentCodePoint(startCodePoint);
    setIsPlaying(true);
  };
  
  // Format the current code point in hex notation
  const formattedCodePoint = `U+${currentCodePoint.toString(16).toUpperCase()}`;
  
  return (
    <div className="flex flex-col items-center p-6 max-w-md mx-auto bg-gray-50 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Unicode Character Animator</h2>
      
      <div className="flex flex-col items-center mb-6">
        <div className="text-8xl h-36 flex items-center justify-center">
          {String.fromCodePoint(currentCodePoint)}
        </div>
        <p className="mt-4 text-gray-600">{formattedCodePoint}</p>
      </div>
      
      <div className="flex space-x-4 mb-6">
        <button 
          onClick={togglePlayPause} 
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <button 
          onClick={reset} 
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Reset
        </button>
      </div>
      
      <div className="flex items-center space-x-4">
        <button 
          onClick={slowDown} 
          className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400"
        >
          Slower
        </button>
        <div className="text-sm text-gray-600">
          Speed: {Math.round(1000 / speed)} chars/sec
        </div>
        <button 
          onClick={speedUp} 
          className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400"
        >
          Faster
        </button>
      </div>
      
      <div className="mt-6 text-sm text-gray-500">
        Showing characters {startCodePoint.toString(16).toUpperCase()} to {(startCodePoint + numCodePoints - 1).toString(16).toUpperCase()}
      </div>
    </div>
  );
};

export default UnicodeAnimator;