import React, { useState, useEffect, useRef } from 'react';

const TwilightLanterns = () => {
  // State variables
  const [isDawnMode, setIsDawnMode] = useState(false);
  const [lanterns, setLanterns] = useState([]);
  const [particles, setParticles] = useState([]);
  const [isMounted, setIsMounted] = useState(false);
  const [smallViewport, setSmallViewport] = useState(false);
  
  // Refs
  const lanternsGroupRef = useRef(null);
  const particlesContainerRef = useRef(null);
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  
  // Constants
  const lanternColors = ['#ffecb3', '#ffe0e0', '#e0f0ff'];
  
  // Default lantern data
  const defaultLanternData = [
    {id: 1, x: 120, y: 120, r: 24, inner: 9, color: 0, dur: 8, opacityDur: 5},
    {id: 2, x: 210, y: 150, r: 27, inner: 10, color: 1, dur: 10, opacityDur: 6},
    {id: 3, x: 108, y: 90, r: 21, inner: 8, color: 2, dur: 9, opacityDur: 7},
    {id: 4, x: 72, y: 108, r: 18, inner: 7, color: 0, dur: 7, opacityDur: 4},
    {id: 5, x: 150, y: 60, r: 15, inner: 6, color: 1, dur: 6, opacityDur: 4.5}
  ];
  
  // Safe check for window object (SSR-compatible)
  const isBrowser = typeof window !== 'undefined';
  
  // Add CSS to document for hover effects - only in browser
  useEffect(() => {
    if (!isBrowser) return;
    
    setIsMounted(true);
    
    const style = document.createElement('style');
    style.textContent = `
      #animation-container:hover .controls, 
      #animation-container:hover .title {
        opacity: 0.8 !important;
        transform: translateY(0) !important;
      }
      
      #animation-container button:hover {
        background: rgba(255,255,255,0.2) !important;
      }
      
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, [isBrowser]);
  
  // Initialize lanterns and handle viewport changes
  useEffect(() => {
    if (!isBrowser) return;
    
    const checkViewport = () => {
      const width = window.innerWidth || 1000;
      const height = window.innerHeight || 800;
      setSmallViewport(width < 500 || height < 350);
    };
    
    checkViewport();
    setLanterns(defaultLanternData);
    
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, [isBrowser]);
  
  // Handle resize
  useEffect(() => {
    if (!isBrowser || !svgRef.current || !containerRef.current) return;
    
    const handleResize = () => {
      // Always ensure SVG fills container
      if (svgRef.current) {
        svgRef.current.style.width = '100%';
        svgRef.current.style.height = '100%';
      }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();
    
    return () => window.removeEventListener('resize', handleResize);
  }, [isBrowser, isMounted]);
  
  // Toggle between night and dawn modes
  const toggleMode = () => {
    setIsDawnMode(!isDawnMode);
  };
  
  // Add a new lantern
  const addNewLantern = () => {
    if (!isBrowser) return;
    
    const scaleFactor = smallViewport ? 0.6 : 1;
    
    const newLantern = {
      id: Date.now(),
      x: (50 + Math.random() * 300) * scaleFactor,
      y: (50 + Math.random() * 200) * scaleFactor,
      r: (15 + Math.random() * 15) * scaleFactor,
      color: Math.floor(Math.random() * 3),
      dur: 6 + Math.random() * 4,
      opacityDur: 4 + Math.random() * 3,
      fadeIn: true,
      inner: (15 + Math.random() * 15) * scaleFactor * 0.4
    };
    
    setLanterns(prevLanterns => [...prevLanterns, newLantern]);
    createParticles(smallViewport ? 3 : 5);
  };
  
  // Create particle effects
  const createParticles = (count) => {
    if (!isBrowser) return;
    
    const newParticles = [];
    
    for (let i = 0; i < count; i++) {
      const width = isBrowser ? window.innerWidth : 1000;
      const height = isBrowser ? window.innerHeight : 800;
      
      const particle = {
        id: Date.now() + i,
        x: Math.random() * width,
        y: height - Math.random() * 200,
        size: 1 + Math.random() * 2,
        duration: 3 + Math.random() * 4,
        angle: Math.random() * Math.PI * 2,
        distance: 50 + Math.random() * 100
      };
      
      newParticles.push(particle);
      
      // Remove particle after animation
      setTimeout(() => {
        setParticles(prevParticles => 
          prevParticles.filter(p => p.id !== particle.id)
        );
      }, particle.duration * 1000);
    }
    
    setParticles(prevParticles => [...prevParticles, ...newParticles]);
  };
  
  // Render lantern SVG elements
  const renderLantern = (lantern) => {
    const { id, x, y, r, inner, color, dur, opacityDur, fadeIn } = lantern;
    const fillColor = lanternColors[color];
    const glowUrlId = `url(#lanternGlow${color + 1})`;
    
    // Apply fade-in animation if needed
    const style = fadeIn ? { animation: 'fadeIn 1s forwards' } : {};
    
    return (
      <g key={id} className="lantern" data-color={fillColor} style={style}>
        <circle 
          cx={x} 
          cy={y} 
          r={r * 2.5} 
          fill={glowUrlId} 
          opacity={0.8} 
          filter="url(#blur)"
        >
          <animate 
            attributeName="cy" 
            values={`${y};${y+10};${y};${y-10};${y}`} 
            dur={`${dur}s`} 
            repeatCount="indefinite" 
          />
          <animate 
            attributeName="opacity" 
            values="0.8;0.6;0.8" 
            dur={`${opacityDur}s`} 
            repeatCount="indefinite" 
          />
        </circle>
        
        <circle 
          cx={x} 
          cy={y} 
          r={inner} 
          fill={fillColor}
        >
          <animate 
            attributeName="cy" 
            values={`${y};${y+10};${y};${y-10};${y}`} 
            dur={`${dur}s`} 
            repeatCount="indefinite" 
          />
        </circle>
        
        <path 
          d={`M${x},${y-inner} L${x},${y-inner-20}`} 
          stroke="#dbd2bc" 
          strokeWidth="1"
        >
          <animate 
            attributeName="d" 
            values={`M${x},${y-inner} L${x},${y-inner-20};` + 
                    `M${x},${y+10-inner} L${x},${y+10-inner-20};` + 
                    `M${x},${y-inner} L${x},${y-inner-20}`} 
            dur={`${dur}s`} 
            repeatCount="indefinite" 
          />
        </path>
      </g>
    );
  };
  
  // Render particle elements - only client side
  const renderParticle = (particle) => {
    const { id, x, y, size, duration, angle, distance } = particle;
    
    const particleStyle = {
      position: 'absolute',
      width: `${size}px`,
      height: `${size}px`,
      left: `${x}px`,
      top: `${y}px`,
      borderRadius: '50%',
      background: 'rgba(255,255,255,0.5)',
      animation: `particleSpread${id} ${duration}s ease-out`
    };
    
    // Create keyframes for this particle
    const keyframes = `
      @keyframes particleSpread${id} {
        0% { transform: translate(0, 0); opacity: 0; }
        10% { opacity: 0.8; }
        100% { transform: translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px); opacity: 0; }
      }
    `;
    
    return (
      <React.Fragment key={id}>
        <style>{keyframes}</style>
        <div className="particle" style={particleStyle} />
      </React.Fragment>
    );
  };
  
  // Calculate title font size safely
  const getTitleFontSize = () => {
    if (!isBrowser) return '16px';
    return smallViewport ? '16px' : '24px';
  };
  
  // Calculate title letter spacing safely
  const getTitleLetterSpacing = () => {
    if (!isBrowser) return '1px';
    return smallViewport ? '1px' : '3px';
  };
  
  // Render the component
  return (
    <div 
      ref={containerRef}
      id="animation-container" 
      style={{
        position: 'relative',
        width: '100%',
        height: '100vh', 
        minHeight: '200px',
        minWidth: '300px',
        overflow: 'hidden',
        background: '#0a121f'
      }}
    >
      <div className="title" style={{
        position: 'absolute',
        top: '10px',
        left: 0,
        right: 0,
        textAlign: 'center',
        fontSize: getTitleFontSize(),
        fontWeight: 300,
        letterSpacing: getTitleLetterSpacing(),
        textTransform: 'uppercase',
        opacity: 0,
        transform: 'translateY(-10px)',
        transition: 'all 1s',
        zIndex: 5,
        textShadow: '0 0 10px rgba(0,0,0,0.5)'
      }}>
        Twilight Lanterns
      </div>
      
      <svg 
        ref={svgRef}
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 400 300" 
        preserveAspectRatio="xMidYMid meet"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          minWidth: '300px',
          minHeight: '200px'
        }}
      >
        <defs>
          <linearGradient id="skyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={isDawnMode ? "#4a5980" : "#1a2a3a"} />
            <stop offset="100%" stopColor={isDawnMode ? "#d88c74" : "#3d5a7a"} />
          </linearGradient>
          
          <radialGradient id="lanternGlow1" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
            <stop offset="0%" stopColor="#fffaed" stopOpacity="0.9" />
            <stop offset="80%" stopColor="#ffb42d" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#ff8f00" stopOpacity="0" />
          </radialGradient>
          
          <radialGradient id="lanternGlow2" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
            <stop offset="0%" stopColor="#ffe8e8" stopOpacity="0.9" />
            <stop offset="80%" stopColor="#ff9d9d" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#ff5252" stopOpacity="0" />
          </radialGradient>
          
          <radialGradient id="lanternGlow3" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
            <stop offset="0%" stopColor="#e8f5ff" stopOpacity="0.9" />
            <stop offset="80%" stopColor="#9dcdff" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#5294ff" stopOpacity="0" />
          </radialGradient>
          
          <filter id="blur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
          </filter>
          
          <pattern id="stars" width="200" height="200" patternUnits="userSpaceOnUse">
            <circle cx="10" cy="10" r="0.8" fill="white" opacity="0.5" />
            <circle cx="30" cy="40" r="0.6" fill="white" opacity="0.4" />
            <circle cx="70" cy="30" r="0.7" fill="white" opacity="0.5" />
            <circle cx="100" cy="70" r="0.9" fill="white" opacity="0.6" />
            <circle cx="150" cy="30" r="0.5" fill="white" opacity="0.4" />
            <circle cx="180" cy="100" r="0.8" fill="white" opacity="0.5" />
            <circle cx="120" cy="160" r="0.7" fill="white" opacity="0.5" />
            <circle cx="50" cy="180" r="0.6" fill="white" opacity="0.4" />
          </pattern>
        </defs>
        
        <rect width="400" height="300" fill="url(#skyGradient)" />
        <rect width="400" height="300" fill="url(#stars)" opacity="0.8" />
        
        <path d="M0,300 L0,225 Q50,190 100,215 Q150,190 200,215 Q250,175 300,215 Q350,195 400,220 L400,300 Z" fill="#172635" />
        <path d="M0,300 L0,240 Q75,200 150,240 Q225,210 300,245 Q350,230 400,250 L400,300 Z" fill="#0e1823" />
        <path d="M0,300 L400,300 L400,250 Q350,260 300,255 Q225,265 150,260 Q75,270 0,265 Z" fill="#304968" opacity="0.4" />
        
        <g ref={lanternsGroupRef} id="lanterns">
          {lanterns.map(lantern => renderLantern(lantern))}
        </g>
        
        <g opacity="0.6">
          <circle cx="25" cy="110" r="1.5" fill="#ffecb3">
            <animate attributeName="cy" values="110;107;110;112;110" dur="8s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.6;0.4;0.6" dur="5s" repeatCount="indefinite" />
          </circle>
          <circle cx="375" cy="95" r="2" fill="#e0f0ff">
            <animate attributeName="cy" values="95;97;95;92;95" dur="9s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.6;0.4;0.6" dur="6s" repeatCount="indefinite" />
          </circle>
          <circle cx="200" cy="60" r="1.5" fill="#ffe0e0">
            <animate attributeName="cy" values="60;62;60;57;60" dur="7s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.6;0.4;0.6" dur="4s" repeatCount="indefinite" />
          </circle>
        </g>
        
        <path d="M0,250 Q100,260 200,255 Q300,265 400,260 L400,300 L0,300 Z" fill="white" opacity="0.05" />
        <path d="M0,260 Q150,250 250,255 Q350,245 400,255 L400,300 L0,300 Z" fill="white" opacity="0.03" />
        
        <g id="twinklingStars">
          <circle cx="50" cy="25" r="0.5" fill="white"><animate attributeName="opacity" values="0.9;0.1;0.9" dur="3s" repeatCount="indefinite" /></circle>
          <circle cx="150" cy="40" r="0.6" fill="white"><animate attributeName="opacity" values="0.9;0.2;0.9" dur="4s" repeatCount="indefinite" /></circle>
          <circle cx="250" cy="20" r="0.5" fill="white"><animate attributeName="opacity" values="0.9;0.3;0.9" dur="5s" repeatCount="indefinite" /></circle>
          <circle cx="350" cy="35" r="0.55" fill="white"><animate attributeName="opacity" values="0.9;0.1;0.9" dur="3.5s" repeatCount="indefinite" /></circle>
          <circle cx="100" cy="50" r="0.45" fill="white"><animate attributeName="opacity" values="0.9;0.2;0.9" dur="4.5s" repeatCount="indefinite" /></circle>
          <circle cx="300" cy="60" r="0.5" fill="white"><animate attributeName="opacity" values="0.9;0.3;0.9" dur="2.5s" repeatCount="indefinite" /></circle>
        </g>
      </svg>
      
      {isMounted && (
        <div 
          ref={particlesContainerRef} 
          className="particles" 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none'
          }}
        >
          {particles.map(particle => renderParticle(particle))}
        </div>
      )}
      
      <div className="controls" style={{
        position: 'absolute',
        bottom: '20px',
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        gap: '20px',
        zIndex: 10,
        opacity: 0,
        transition: 'opacity 0.5s'
      }}>
        <button 
          onClick={addNewLantern}
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: '#fff',
            padding: '8px 16px',
            borderRadius: '20px',
            cursor: 'pointer',
            backdropFilter: 'blur(5px)',
            transition: 'all 0.3s'
          }}
        >
          Release New Lantern
        </button>
        <button 
          onClick={toggleMode}
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: '#fff',
            padding: '8px 16px',
            borderRadius: '20px',
            cursor: 'pointer',
            backdropFilter: 'blur(5px)',
            transition: 'all 0.3s'
          }}
        >
          Night/Dawn Toggle
        </button>
      </div>
    </div>
  );
};

export default TwilightLanterns;