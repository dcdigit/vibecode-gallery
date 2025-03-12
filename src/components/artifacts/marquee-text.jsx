/*
* @description Moving words
*/

import React, { useState, useEffect, useRef, useCallback } from 'react';

const App = () => {
  // ===== Constants =====
  const SCROLL_SPEED = 300; // pixels per second
  const TRANSITION_DELAY = 50; // ms
  
  const QUOTES = [
    { text: "When fascism comes to America, it will be wrapped in the flag and carrying a cross.", author: "Sinclair Lewis" },
    { text: "Fascism is a lie told by bullies.", author: "Ernest Hemingway" },
    { text: "Fascism attempts to organize the newly created proletarian masses without affecting the property structure which the masses strive to eliminate.", author: "Walter Benjamin" },
    { text: "The only thing necessary for the triumph of evil is for good men to do nothing.", author: "Edmund Burke" },
    { text: "Fascism should more appropriately be called Corporatism because it is a merger of state and corporate power.", author: "Benito Mussolini" },
    { text: "It is the nature of fascism to have no philosophy, no intellectual side. It is pure action.", author: "George Orwell" },
    { text: "We stand for the maintenance of private property... We shall protect free enterprise as the most expedient, or rather the sole possible economic order.", author: "Adolf Hitler" },
    { text: "The strategic adversary is fascism... the fascism in us all, in our heads and in our everyday behavior, the fascism that causes us to love power, to desire the very thing that dominates and exploits us.", author: "Michel Foucault" },
    { text: "Fascism is capitalism in decay.", author: "Vladimir Lenin" },
    { text: "Fascism begins the moment a ruling class, fearing the people may use their political democracy to gain economic democracy, begins to destroy political democracy in order to retain its power of exploitation and special privilege.", author: "Tommy Douglas" },
    { text: "Fascism is not defined by the number of its victims, but by the way it kills them.", author: "Jean-Paul Sartre" },
    { text: "Fascism is capitalism plus murder.", author: "Upton Sinclair" },
    { text: "Fascism was a counter-revolution against a revolution that never took place.", author: "Ignazio Silone" },
    { text: "The symptoms of fascist thinking are colored by environment and adapted to immediate circumstances. But always and everywhere they can be identified by their appeal to prejudice and by the desire to play upon the fears and vanities of different groups in order to gain power.", author: "Henry A. Wallace" },
    { text: "The first truth is that the liberty of a democracy is not safe if the people tolerate the growth of private power to a point where it becomes stronger than their democratic state itself.", author: "Franklin D. Roosevelt" },
    { text: "Fascism is a religion. The twentieth century will be known in history as the century of Fascism.", author: "Benito Mussolini" },
    { text: "Fascism, the more it considers and observes the future and the development of humanity, quite apart from political considerations of the moment, believes neither in the possibility nor the utility of perpetual peace.", author: "Benito Mussolini" },
    { text: "Under fascism, what is private is private only at the sufferance of the state.", author: "Hannah Arendt" }
  ];
  
  const COLORS = [
    '#FFFFFF', // White
    '#FFD700', // Gold
    '#00FFFF', // Cyan
    '#FF9500', // Orange (brighter)
    '#7CFFCB', // Mint green
    '#FF55FF', // Bright pink
    '#55FFFF', // Bright cyan
    '#FFFF55', // Bright yellow
    '#55FF55', // Bright green
  ];

  // ===== State =====
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [colorIndex, setColorIndex] = useState(0);
  const [position, setPosition] = useState(100);
  
  // ===== Refs =====
  const containerRef = useRef(null);
  const textRef = useRef(null);
  const animationRef = useRef(null);
  const lastTimestampRef = useRef(null);
  
  // ===== Computed values =====
  const currentQuote = QUOTES[quoteIndex];
  const currentColor = COLORS[colorIndex];
  
  // ===== Functions =====
  // Get next index with wraparound
  const getNextIndex = (current, max) => (current + 1) % max;
  
  // Handle moving to the next quote
  const nextQuote = useCallback(() => {
    // Cancel any ongoing animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    // Hide text during transition
    if (textRef.current) {
      textRef.current.style.opacity = '0';
    }
    
    // Update state
    setQuoteIndex(getNextIndex(quoteIndex, QUOTES.length));
    setColorIndex(getNextIndex(colorIndex, COLORS.length));
    
    // Reset position and show text after DOM updates
    setTimeout(() => {
      setPosition(100);
      if (textRef.current) {
        textRef.current.style.opacity = '1';
      }
      // Reset timestamp for smooth animation
      lastTimestampRef.current = null;
    }, TRANSITION_DELAY);
  }, [quoteIndex, colorIndex]);
  
  // Animation frame handler
  const animate = useCallback((timestamp) => {
    if (!containerRef.current || !textRef.current) return;
    
    // Initialize timestamp on first frame
    if (!lastTimestampRef.current) {
      lastTimestampRef.current = timestamp;
      animationRef.current = requestAnimationFrame(animate);
      return;
    }
    
    // Get element dimensions
    const textWidth = textRef.current.offsetWidth;
    const containerWidth = containerRef.current.offsetWidth;
    
    // Calculate movement
    const elapsed = timestamp - lastTimestampRef.current;
    const pixelsToMove = (SCROLL_SPEED * elapsed) / 1000;
    const percentToMove = (pixelsToMove / containerWidth) * 100;
    
    // Update position
    const newPosition = position - percentToMove;
    
    // Check if text has completely exited viewport
    const exitThreshold = -100 * (textWidth / containerWidth);
    
    if (newPosition <= exitThreshold) {
      // Text has exited, move to next quote
      nextQuote();
      return;
    }
    
    // Continue animation
    setPosition(newPosition);
    lastTimestampRef.current = timestamp;
    animationRef.current = requestAnimationFrame(animate);
  }, [position, nextQuote]);
  
  // ===== Effects =====
  // Start animation when component mounts or position changes
  useEffect(() => {
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animate, position]);
  
  // ===== Render =====
  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-gray-100">
      <header className="bg-gray-800 text-white p-4 w-full rounded-lg shadow-lg">
        <div 
          ref={containerRef}
          className="relative h-16 overflow-hidden border border-gray-600 rounded cursor-pointer" 
          onClick={nextQuote}
        >
          <div className="w-full h-full overflow-hidden relative">
            <div
              ref={textRef}
              style={{
                position: 'absolute',
                top: '50%',
                left: `${position}%`,
                transform: 'translateY(-50%)',
                whiteSpace: 'nowrap',
                fontSize: '2.6rem',
                fontWeight: '500',
                color: currentColor
              }}
            >
              "{currentQuote.text}" — <em>{currentQuote.author}</em>
            </div>
          </div>
        </div>
      </header>
    </div>
  );
};

export default App;