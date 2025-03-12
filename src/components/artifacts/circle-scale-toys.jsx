/*
* @description Musical Toy
*/

import React, { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';

const ToneCirclesDemo = () => {
  // State for synths and UI
  const [ready, setReady] = useState(false);
  const [activeNotes, setActiveNotes] = useState({});
  const [mixerPosition, setMixerPosition] = useState({ x: 0, y: 0 });
  const [currentMixerNote, setCurrentMixerNote] = useState(null);
  const [oscillatorWeights, setOscillatorWeights] = useState({
    sine: 0.25, square: 0.25, triangle: 0.25, sawtooth: 0.25
  });
  
  // Refs for persistent data
  const containerRef = useRef(null);
  const synthsRef = useRef({});
  const mixerSynthRef = useRef(null);
  
  // Constants
  const OSCILLATOR_TYPES = ['sine', 'square', 'triangle', 'sawtooth'];
  const SCALE_NOTES = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'];
  const NUM_CIRCLES = SCALE_NOTES.length;
  
  // Colors for each oscillator type
  const COLORS = {
    sine: ['#E6F7FF', '#BAE7FF', '#91D5FF', '#69C0FF', '#40A9FF', '#1890FF', '#096DD9', '#0050B3'],
    square: ['#F9F0FF', '#EFDBFF', '#D3ADF7', '#B37FEB', '#9254DE', '#722ED1', '#531DAB', '#391085'],
    triangle: ['#F6FFED', '#D9F7BE', '#B7EB8F', '#95DE64', '#73D13D', '#52C41A', '#389E0D', '#237804'],
    sawtooth: ['#FFF1F0', '#FFCCC7', '#FFA39E', '#FF7875', '#FF4D4F', '#F5222D', '#CF1322', '#A8071A'],
    mixer: ['#FFF7E6', '#FFE7BA', '#FFD591', '#FFC069', '#FFA940', '#FA8C16', '#D46B08', '#AD4E00']
  };

  // Only create synths - don't start audio context yet
  useEffect(() => {
    // Create synths without starting them
    const createSynths = () => {
      // Create synths for each oscillator type (but don't connect to destination yet)
      OSCILLATOR_TYPES.forEach(type => {
        synthsRef.current[type] = new Tone.Synth({
          oscillator: { type },
          envelope: { attack: 0.05, decay: 0.2, sustain: 0.4, release: 1 }
        });
      });
      
      // Create mixer synth
      mixerSynthRef.current = new Tone.Synth({
        oscillator: { type: 'sine' },
        envelope: { attack: 0.05, decay: 0.2, sustain: 0.4, release: 1 }
      });
    };
    
    createSynths();
    
    // Cleanup
    return () => {
      OSCILLATOR_TYPES.forEach(type => {
        if (synthsRef.current[type]) {
          synthsRef.current[type].dispose();
        }
      });
      
      if (mixerSynthRef.current) {
        mixerSynthRef.current.dispose();
      }
    };
  }, []);
  
  // Function to start audio (must be called after user interaction)
  const startAudio = async () => {
    try {
      // Start audio context
      await Tone.start();
      
      // Connect all synths to destination
      OSCILLATOR_TYPES.forEach(type => {
        if (synthsRef.current[type]) {
          synthsRef.current[type].toDestination();
        }
      });
      
      if (mixerSynthRef.current) {
        mixerSynthRef.current.toDestination();
      }
      
      setReady(true);
    } catch (error) {
      console.error("Error starting audio:", error);
    }
  };
  
  // Play a note with specified synth
  const playNote = (oscillatorType, index) => {
    if (!ready) return;
    
    const synth = oscillatorType === 'mixer' 
      ? mixerSynthRef.current 
      : synthsRef.current[oscillatorType];
    
    if (!synth) return;
    
    const note = SCALE_NOTES[index];
    
    // If mixer is playing, update current note
    if (oscillatorType === 'mixer') {
      setCurrentMixerNote(note);
    }
    
    // Play the note
    synth.triggerAttackRelease(note, '8n');
    
    // Update active notes state
    setActiveNotes(prev => ({
      ...prev,
      [`${oscillatorType}-${index}`]: { note, oscillatorType }
    }));
    
    // Reset after the note duration
    setTimeout(() => {
      setActiveNotes(prev => {
        const newState = { ...prev };
        delete newState[`${oscillatorType}-${index}`];
        return newState;
      });
      
      if (oscillatorType === 'mixer') {
        setCurrentMixerNote(null);
      }
    }, 500);
  };
  
  // Update the mixer synth based on mouse position
  const updateMixerOscillator = (event) => {
    if (!containerRef.current || !mixerSynthRef.current || !ready) return;
    
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    
    // Calculate mouse position within the container
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    setMixerPosition({ x, y });
    
    // Define the centers of each oscillator circle set
    const centers = {
      sine: { x: rect.width/4, y: rect.height/4 },
      square: { x: 3*rect.width/4, y: rect.height/4 },
      triangle: { x: rect.width/4, y: 3*rect.height/4 },
      sawtooth: { x: 3*rect.width/4, y: 3*rect.height/4 }
    };
    
    // Calculate distances to each oscillator center
    const distances = {};
    OSCILLATOR_TYPES.forEach(type => {
      distances[type] = Math.sqrt(
        Math.pow(x - centers[type].x, 2) + 
        Math.pow(y - centers[type].y, 2)
      );
    });
    
    // Calculate inverse distances (closer = higher weight)
    const maxDistance = Math.sqrt(Math.pow(rect.width, 2) + Math.pow(rect.height, 2));
    const inverseDistances = {};
    
    OSCILLATOR_TYPES.forEach(type => {
      inverseDistances[type] = Math.max(0, maxDistance - distances[type]);
    });
    
    // Normalize weights to sum to 1
    const totalWeight = Object.values(inverseDistances).reduce((sum, w) => sum + w, 0);
    const weights = {};
    
    if (totalWeight > 0) {
      OSCILLATOR_TYPES.forEach(type => {
        weights[type] = inverseDistances[type] / totalWeight;
      });
      
      // Find the dominant oscillator type (highest weight)
      const dominantType = OSCILLATOR_TYPES.reduce(
        (prev, curr) => weights[curr] > weights[prev] ? curr : prev, 
        OSCILLATOR_TYPES[0]
      );
      
      // Set the mixer synth oscillator type to the dominant type
      if (mixerSynthRef.current) {
        mixerSynthRef.current.oscillator.type = dominantType;
      }
      
      // Update weights for UI
      setOscillatorWeights(weights);
    }
  };
  
  // Get a mixed color based on oscillator weights
  const getMixedColor = (index) => {
    // Get the color values for each oscillator type at this index
    const colors = OSCILLATOR_TYPES.map(type => {
      const hex = COLORS[type][index];
      // Convert hex to RGB
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return { r, g, b };
    });
    
    // Mix colors based on weights
    let r = 0, g = 0, b = 0;
    OSCILLATOR_TYPES.forEach((type, i) => {
      r += colors[i].r * oscillatorWeights[type];
      g += colors[i].g * oscillatorWeights[type];
      b += colors[i].b * oscillatorWeights[type];
    });
    
    // Convert back to hex
    return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
  };
  
  // CircleSet component - renders a set of concentric circles for an oscillator type
  const CircleSet = ({ oscillatorType, position }) => {
    const maxRadius = 60;
    const radiusStep = maxRadius / NUM_CIRCLES;
    
    return (
      <div className="relative w-32 h-32" style={{ left: position.x, top: position.y }}>
        {Array.from({ length: NUM_CIRCLES }).map((_, i) => {
          const index = NUM_CIRCLES - i - 1; // Reverse index for drawing outer to inner
          const radius = radiusStep * (index + 1);
          
          return (
            <div
              key={index}
              className="absolute rounded-full cursor-pointer transition-all duration-300 flex items-center justify-center"
              style={{
                width: `${radius * 2}px`,
                height: `${radius * 2}px`,
                backgroundColor: COLORS[oscillatorType][index],
                top: `${-radius + 64}px`,
                left: `${-radius + 64}px`,
                opacity: activeNotes[`${oscillatorType}-${index}`] ? 0.8 : 0.6,
                transform: activeNotes[`${oscillatorType}-${index}`] ? 'scale(1.05)' : 'scale(1)'
              }}
              onMouseEnter={() => playNote(oscillatorType, index)}
            >
              {index === 0 && (
                <div className="text-xs font-bold">
                  {oscillatorType.charAt(0).toUpperCase() + oscillatorType.slice(1)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };
  
  // MixerCircleSet component - the central mixer that blends oscillator types
  const MixerCircleSet = () => {
    const maxRadius = 60;
    const radiusStep = maxRadius / NUM_CIRCLES;
    
    return (
      <div 
        className="relative w-32 h-32"
        style={{ 
          left: `calc(50% - 64px)`, 
          top: `calc(50% - 64px)`,
          cursor: 'pointer'
        }}
      >
        {Array.from({ length: NUM_CIRCLES }).map((_, i) => {
          const index = NUM_CIRCLES - i - 1; // Reverse index for drawing outer to inner
          const radius = radiusStep * (index + 1);
          const isActive = activeNotes[`mixer-${index}`];
          const mixedColor = getMixedColor(index);
          
          return (
            <div
              key={index}
              className="absolute rounded-full transition-all duration-300 flex items-center justify-center"
              style={{
                width: `${radius * 2}px`,
                height: `${radius * 2}px`,
                backgroundColor: mixedColor,
                top: `${-radius + 64}px`,
                left: `${-radius + 64}px`,
                opacity: isActive ? 0.8 : 0.6,
                transform: isActive ? 'scale(1.05)' : 'scale(1)'
              }}
              onMouseEnter={() => playNote('mixer', index)}
            >
              {index === 0 && (
                <div className="text-xs font-bold text-white">
                  Mixer{currentMixerNote ? `: ${currentMixerNote}` : ''}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Generate oscillator weight indicators
  const WeightIndicators = () => (
    <div className="flex justify-center space-x-4 mt-2">
      {OSCILLATOR_TYPES.map(type => (
        <div key={type} className="text-xs" style={{color: COLORS[type][4]}}>
          {type}: {Math.round(oscillatorWeights[type] * 100)}%
        </div>
      ))}
    </div>
  );

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-96 bg-gray-100 rounded-lg shadow-md p-4 overflow-hidden"
      onMouseMove={ready ? updateMixerOscillator : undefined}
    >
      <h2 className="text-xl font-bold mb-4 text-center">Concentric Sound Circles</h2>
      
      {!ready ? (
        <div className="flex flex-col items-center justify-center h-64">
          <p className="text-center mb-4">
            Click the button below to activate the audio interface.<br/>
            (Web Audio requires user interaction to start)
          </p>
          <button
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            onClick={startAudio}
          >
            Start Audio
          </button>
        </div>
      ) : (
        <>
          <p className="text-sm text-center mb-2">
            Hover over circles to play sounds. The mixer in the center uses the oscillator type 
            that's closest to your mouse position.
          </p>
          <WeightIndicators />
          
          <div className="relative w-full h-64">
            {/* Top left: Sine */}
            <div className="absolute top-0 left-0">
              <CircleSet oscillatorType="sine" position={{ x: 0, y: 0 }} />
            </div>
            
            {/* Top right: Square */}
            <div className="absolute top-0 right-0">
              <CircleSet oscillatorType="square" position={{ x: 0, y: 0 }} />
            </div>
            
            {/* Bottom left: Triangle */}
            <div className="absolute bottom-0 left-0">
              <CircleSet oscillatorType="triangle" position={{ x: 0, y: 0 }} />
            </div>
            
            {/* Bottom right: Sawtooth */}
            <div className="absolute bottom-0 right-0">
              <CircleSet oscillatorType="sawtooth" position={{ x: 0, y: 0 }} />
            </div>
            
            {/* Center: Mixer */}
            <MixerCircleSet />
          </div>
        </>
      )}
    </div>
  );
};

export default ToneCirclesDemo;