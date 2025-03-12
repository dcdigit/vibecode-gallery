/*
 * @description Interactive pulsing color grid
 */
import React, { useState, useEffect } from 'react';
const PulsingGrid = () => {
  const rows = 5;
  const cols = 5;
  const [squares, setSquares] = useState([]);
  
  // Initialize the grid with random timing values
  useEffect(() => {
    const initialSquares = [];
    for (let i = 0; i < rows * cols; i++) {
      initialSquares.push({
        id: i,
        scale: 1,
        // Random values for creating unique pulsing patterns
        pulseSpeed: 0.5 + Math.random() * 1.5, // Between 0.5 and 2
        pulseSize: 0.2 + Math.random() * 0.3,  // Between 0.2 and 0.5
        offset: Math.random() * Math.PI * 2,   // Random phase offset
        hue: Math.floor(Math.random() * 360)   // Random hue for color
      });
    }
    setSquares(initialSquares);
  }, []);
  
  // Animation loop
  useEffect(() => {
    let animationFrameId;
    const startTime = Date.now();
    
    const animate = () => {
      const currentTime = (Date.now() - startTime) / 1000; // Convert to seconds
      
      setSquares(prevSquares => 
        prevSquares.map(square => {
          // Calculate pulse based on sine wave with square's unique parameters
          const pulse = Math.sin(currentTime * square.pulseSpeed + square.offset);
          const newScale = 1 + pulse * square.pulseSize;
          
          return {
            ...square,
            scale: newScale,
          };
        })
      );
      
      animationFrameId = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4">
      <h1 className="text-2xl font-bold mb-6 text-white">Pulsing Grid</h1>
      
      <div className="grid grid-cols-5 gap-4 p-4 bg-gray-800 rounded-lg shadow-xl">
        {squares.map(square => (
          <div 
            key={square.id}
            className="flex items-center justify-center rounded transition-all duration-200 ease-in-out"
            style={{
              width: '64px',
              height: '64px',
              transform: `scale(${square.scale})`,
              backgroundColor: `hsl(${square.hue}, 80%, 60%)`,
            }}
          >
          </div>
        ))}
      </div>
      
      <p className="mt-6 text-gray-400 text-center max-w-md">
        Each square pulses with its own unique rhythm, speed, and color.
      </p>
    </div>
  );
};

export default PulsingGrid;