/*
* @description Run away!
*/

import React, { useState, useEffect, useRef } from 'react';

const AvoidingCircle = () => {
  const [position, setPosition] = useState({ x: 200, y: 200 });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);
  
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);
  
  useEffect(() => {
    // Calculate the direction away from the mouse
    const dx = position.x - mousePos.x;
    const dy = position.y - mousePos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Only move the circle if the mouse is within a certain range
    if (distance < 150) {
      // Calculate new position (moving away from mouse)
      const speed = 3 * (1 - distance / 150); // Move faster when mouse is closer
      const angle = Math.atan2(dy, dx);
      
      // Calculate boundaries
      const containerWidth = containerRef.current ? containerRef.current.clientWidth : 400;
      const containerHeight = containerRef.current ? containerRef.current.clientHeight : 400;
      
      let newX = position.x + Math.cos(angle) * speed * 5;
      let newY = position.y + Math.sin(angle) * speed * 5;
      
      // Keep the circle within the container bounds
      newX = Math.max(40, Math.min(containerWidth - 40, newX));
      newY = Math.max(40, Math.min(containerHeight - 40, newY));
      
      setPosition({ x: newX, y: newY });
    }
  }, [mousePos, position]);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-2xl font-bold mb-4 text-gray-800">Circle That Avoids Your Mouse</h1>
      <p className="mb-6 text-gray-600">Try to catch the circle - it will run away from your cursor!</p>
      
      <div 
        ref={containerRef}
        className="relative w-full max-w-lg h-96 bg-white rounded-lg shadow-md overflow-hidden border border-gray-200"
      >
        <div
          className="absolute w-20 h-20 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 shadow-lg transition-all duration-100 ease-out flex items-center justify-center text-white font-medium"
          style={{
            left: `${position.x - 40}px`,
            top: `${position.y - 40}px`,
          }}
        >
          Catch me!
        </div>
      </div>
      
      <div className="mt-4 text-gray-500 text-sm">
        Mouse position: ({Math.round(mousePos.x)}, {Math.round(mousePos.y)})
      </div>
    </div>
  );
};

export default AvoidingCircle;