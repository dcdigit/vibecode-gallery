/*
 * @description Subtle floating particles animation
 */
import React, { useState, useEffect, useRef } from 'react';

const InteractiveParticles = () => {
  const canvasRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [mousePosition, setMousePosition] = useState({ x: null, y: null });
  const particlesRef = useRef([]);
  const animationFrameRef = useRef();
  const ripplesRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const resizeCanvas = () => {
      const { width, height } = canvas.getBoundingClientRect();
      canvas.width = width;
      canvas.height = height;
      setDimensions({ width, height });
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Initialize particles
    particlesRef.current = Array.from({ length: 150 }, () => ({
      x: Math.random() * dimensions.width,
      y: Math.random() * dimensions.height,
      size: Math.random() * 3 + 0.5,
      originalSize: Math.random() * 3 + 0.5, // Store original size for pulsing effect
      speedX: Math.random() * 1.2 - 0.6,
      speedY: Math.random() * 1.2 - 0.6,
      opacity: Math.random() * 0.5 + 0.1,
      hue: Math.random() * 90 + 180, // Random hue between 180-270 (teals, blues, purples)
      pulsePhase: Math.random() * Math.PI * 2, // Random starting phase for varied pulsing
      pulseSpeed: 0.05 + Math.random() * 0.05, // How fast the particle pulses
    }));

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  useEffect(() => {
    if (dimensions.width === 0 || dimensions.height === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    const animate = () => {
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);
      
      // Draw and update ripples
      if (ripplesRef.current.length > 0) {
        // Update ripples in place
        ripplesRef.current = ripplesRef.current
          .map(ripple => {
            // Increase ripple radius
            ripple.radius += ripple.speed;
            ripple.opacity -= 0.01; // Gradually fade out
            
            // Draw ripple
            ctx.beginPath();
            ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
            ctx.strokeStyle = `hsla(${ripple.hue}, 80%, 70%, ${ripple.opacity})`;
            ctx.lineWidth = 2;
            ctx.stroke();
            
            return ripple;
          })
          .filter(ripple => ripple.opacity > 0); // Remove ripples that have faded out
      }
      
      particlesRef.current.forEach(particle => {
        // Move particles
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        
        // Wrap around edges
        if (particle.x > dimensions.width) particle.x = 0;
        if (particle.x < 0) particle.x = dimensions.width;
        if (particle.y > dimensions.height) particle.y = 0;
        if (particle.y < 0) particle.y = dimensions.height;
        
        // Mouse interaction
        if (mousePosition.x !== null && mousePosition.y !== null) {
          const dx = mousePosition.x - particle.x;
          const dy = mousePosition.y - particle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // Subtle repulsion effect
          if (distance < 80) {
            const angle = Math.atan2(dy, dx);
            particle.x -= Math.cos(angle) * 0.5;
            particle.y -= Math.sin(angle) * 0.5;
            
            // Pulsing effect for nearby particles
            // Calculate pulse factor (0 to 1) based on distance
            const pulseInfluence = 1 - (distance / 80);
            
            // Update particle size with pulsing effect
            // The closer to the mouse, the stronger the pulse
            particle.pulsePhase += particle.pulseSpeed;
            const pulseFactor = 1 + (Math.sin(particle.pulsePhase) * 0.5 * pulseInfluence);
            particle.size = particle.originalSize * pulseFactor;
            
            // Temporarily increase brightness and saturation
            particle.brightnessBoost = 15 * pulseInfluence; // 0-15% brightness boost
          } else {
            // Reset size and brightness when away from mouse
            particle.pulsePhase += particle.pulseSpeed * 0.2; // Slower pulse when away from cursor
            const idlePulse = 1 + (Math.sin(particle.pulsePhase) * 0.1); // Subtle idle pulse
            particle.size = particle.originalSize * idlePulse;
            particle.brightnessBoost = 0;
          }
        } else {
          // Default subtle pulsing when mouse is not on canvas
          particle.pulsePhase += particle.pulseSpeed * 0.2;
          const idlePulse = 1 + (Math.sin(particle.pulsePhase) * 0.1);
          particle.size = particle.originalSize * idlePulse;
          particle.brightnessBoost = 0;
        }
        
        // Handle ripple interactions
        ripplesRef.current.forEach(ripple => {
          const dx = ripple.x - particle.x;
          const dy = ripple.y - particle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // Check if particle is within the ripple's effect radius
          // Effect is strongest when the ripple wave passes through the particle
          const rippleEffectWidth = 20; // Width of the ripple effect band
          const distFromRippleEdge = Math.abs(distance - ripple.radius);
          
          if (distFromRippleEdge < rippleEffectWidth) {
            // Calculate effect strength (0-1)
            const effect = 1 - (distFromRippleEdge / rippleEffectWidth);
            
            // Push particles away from ripple center
            const angle = Math.atan2(dy, dx);
            const force = effect * 3; // Adjust force multiplier as needed
            particle.speedX -= Math.cos(angle) * force;
            particle.speedY -= Math.sin(angle) * force;
            
            // Limit max speed
            const speed = Math.sqrt(particle.speedX * particle.speedX + particle.speedY * particle.speedY);
            if (speed > 4) {
              particle.speedX = (particle.speedX / speed) * 4;
              particle.speedY = (particle.speedY / speed) * 4;
            }
            
            // Temporarily change color (blue/purple to vibrant colors)
            particle.colorShift = {
              hue: (ripple.hue + 180) % 360, // Complementary color
              amount: effect, // How much to shift toward the new color
              duration: 60 // How long the shift lasts (in frames)
            };
          }
        });
        
        // Process any active color shift
        if (particle.colorShift && particle.colorShift.duration > 0) {
          // Calculate the mixed hue based on shift amount
          const hueShift = particle.colorShift.amount;
          const displayHue = particle.hue * (1 - hueShift) + particle.colorShift.hue * hueShift;
          
          // Decrease duration
          particle.colorShift.duration -= 1;
          particle.displayHue = displayHue;
          
          // Increase brightness and saturation for affected particles
          particle.satBoost = 30 * particle.colorShift.amount;
          particle.lightBoost = 15 * particle.colorShift.amount;
        } else {
          particle.displayHue = particle.hue;
          particle.satBoost = 0;
          particle.lightBoost = 0;
        }
        
        // Apply gentle speed dampening to gradually return to normal speed
        particle.speedX *= 0.99;
        particle.speedY *= 0.99;
        
        // Default subtle pulsing if not already handled by mouse interaction
        if (!particle.brightnessBoost) {
          particle.pulsePhase += particle.pulseSpeed * 0.2;
          const idlePulse = 1 + (Math.sin(particle.pulsePhase) * 0.1);
          particle.size = particle.originalSize * idlePulse;
          particle.brightnessBoost = 0;
        }
        
        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        
        // Apply brightness boost if particle is near cursor
        const brightness = 75 + (particle.brightnessBoost || 0) + (particle.lightBoost || 0);
        const saturation = 70 + (particle.brightnessBoost ? 10 : 0) + (particle.satBoost || 0);
        ctx.fillStyle = `hsla(${particle.displayHue || particle.hue}, ${saturation}%, ${brightness}%, ${particle.opacity})`;
        ctx.fill();
      });
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [dimensions, mousePosition]);

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleMouseLeave = () => {
    setMousePosition({ x: null, y: null });
  };
  
  const getCanvasCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Handle both mouse clicks and touch events
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };
  
  const createRipple = (x, y) => {
    // Create a new ripple
    const newRipple = {
      x,
      y,
      radius: 0,
      opacity: 0.6,
      speed: 5,
      hue: Math.floor(Math.random() * 60) + 180 // Blue to purple hues
    };
    
    // Add ripple directly to the ref
    ripplesRef.current = [...ripplesRef.current, newRipple];
  };
  
  const handleCanvasClick = (e) => {
    const coords = getCanvasCoordinates(e);
    createRipple(coords.x, coords.y);
  };
  
  const handleTouchStart = (e) => {
    e.preventDefault(); // Prevent scrolling
    const coords = getCanvasCoordinates(e);
    createRipple(coords.x, coords.y);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        width: '100%',
        backgroundColor: '#121824',
        borderRadius: '8px',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: '100%',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '20px',
        }}
      >
        <h3 style={{ color: '#ffffff', marginBottom: '15px' }}>
          Interactive Particles
        </h3>
        <p style={{ color: '#a0aec0', textAlign: 'center', marginBottom: '20px' }}>
          Hover to see particles pulse and glow. Click or tap to create ripples!
        </p>
        <div
          style={{
            width: '100%',
            height: '300px',
            position: 'relative',
            overflow: 'hidden',
            borderRadius: '8px',
            backgroundColor: '#1a202c',
          }}
        >
          <canvas
            ref={canvasRef}
            style={{
              width: '100%',
              height: '100%',
              display: 'block',
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={handleCanvasClick}
            onTouchStart={handleTouchStart}
            onTouchMove={handleMouseMove}
          />
        </div>
      </div>
    </div>
  );
};

export default InteractiveParticles;

