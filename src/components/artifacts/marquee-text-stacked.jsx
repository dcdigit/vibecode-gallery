/*
* @description Lots of words
*/
import React, { useState, useEffect, useRef, useCallback } from 'react';

// Marquee component that can be reused with different props
const Marquee = ({ speed, initialQuoteIndex, initialColorIndex, height = 16 }) => {
  // ===== Constants =====
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
  '#E0E0E0', // Light gray
  '#C6A97C', // Muted gold
  '#80D8FF', // Soft blue
  '#E8A87C', // Soft peach
  '#A0E8C4', // Sage green
  '#D7B5D8', // Lavender
  '#89DAFF', // Sky blue
  '#E8E086', // Pale yellow
  '#9CC69B', // Mossy green
];

  // ===== State =====
  const [quoteIndex, setQuoteIndex] = useState(initialQuoteIndex);
  const [colorIndex, setColorIndex] = useState(initialColorIndex);
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
    const pixelsToMove = (speed * elapsed) / 1000;
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
  }, [position, nextQuote, speed]);
  
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
    <div 
      ref={containerRef}
      className={`relative h-${height} overflow-hidden border border-gray-600 rounded cursor-pointer mb-2`} 
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
            fontSize: '1.6rem',
            fontWeight: '500',
            color: currentColor
          }}
        >
          "{currentQuote.text}" — <em>{currentQuote.author}</em>
        </div>
      </div>
    </div>
  );
};

// Main App that creates multiple marquees
const App = () => {
  // Number of marquees to display
  const [marqueeCount, setMarqueeCount] = useState(6); // Default number
  
  // Generate random starting indices
  const generateRandomMarquees = useCallback(() => {
    const marquees = [];
    
    for (let i = 0; i < marqueeCount; i++) {
      // Create marquees with different:
      // 1. Starting quote (random starting position)
      // 2. Speed (between 200 and 500 px/sec)
      // 3. Starting color
      marquees.push({
        key: i,
        quoteIndex: Math.floor(Math.random() * 18), // Random quote from 18 quotes
        colorIndex: Math.floor(Math.random() * 9), // Random color from 9 colors
        speed: 50 + Math.floor(Math.random() * 300) // Speed between 200-500
      });
    }
    
    return marquees;
  }, [marqueeCount]);
  
  // State to hold marquee configurations
  const [marquees, setMarquees] = useState([]);
  
  // Calculate marquee count and generate on mount
  useEffect(() => {
    // Adjust marquee count based on viewport height
    const viewportHeight = window.innerHeight;
    const marqueeHeight = 80; // Approximate height of each marquee in pixels
    const estimatedCount = Math.floor(viewportHeight / marqueeHeight);
    
    // Update count if needed
    if (estimatedCount !== marqueeCount) {
      setMarqueeCount(Math.max(3, estimatedCount)); // At least 3 marquees
    } else {
      // Generate initial marquees
      setMarquees(generateRandomMarquees());
    }
  }, [marqueeCount, generateRandomMarquees]);
  
  // Regenerate marquees when count changes
  useEffect(() => {
    setMarquees(generateRandomMarquees());
  }, [marqueeCount, generateRandomMarquees]);
  
  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const viewportHeight = window.innerHeight;
      const marqueeHeight = 80; // Approximate height in pixels
      const estimatedCount = Math.floor(viewportHeight / marqueeHeight);
      setMarqueeCount(Math.max(3, estimatedCount)); // At least 3 marquees
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="bg-gray-800 text-white p-4 rounded-lg shadow-lg">
        {marquees.map((marquee) => (
          <Marquee
            key={marquee.key}
            initialQuoteIndex={marquee.quoteIndex}
            initialColorIndex={marquee.colorIndex}
            speed={marquee.speed}
          />
        ))}
      </div>
    </div>
  );
};

export default App;