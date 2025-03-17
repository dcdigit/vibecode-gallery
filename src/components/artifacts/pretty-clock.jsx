import React, { useState, useEffect } from 'react';

// The base Toggle component - fully controlled from outside
const ToggleSwitch = ({
  rotation = 0,
  checked = false,
  onChange,
  width = 56, 
  height = 32, 
  circleSize = 24, 
  circleOffset = 4, 
  primaryColor = 'bg-blue-500',
  secondaryColor = 'bg-gray-300',
  label = '',
  innerContent = null, // New prop for inner content
  id = `toggle-${Math.random().toString(36).substring(2, 9)}`,
}) => {
  // Calculate how far to translate the circle when toggled
  const translateDistance = width - circleSize - (circleOffset * 2);
  
  return (
    <div className="flex items-center space-x-2">
      <label 
        htmlFor={id}
        className="relative inline-flex items-center cursor-pointer"
        style={{ transform: `rotate(${rotation}deg)` }}>
        <input
          type="checkbox"
          id={id}
          className="sr-only"
          checked={checked}
          onChange={onChange}
        />
        <div
          className={`${checked ? primaryColor : secondaryColor} rounded-full transition-colors duration-200 ease-in-out relative`}
          style={{ width: `${width}px`, height: `${height}px` }}>
          <div
            className="bg-white rounded-full shadow-md absolute transition-transform duration-200 ease-in-out flex items-center justify-center"
            style={{ 
              width: `${circleSize}px`, 
              height: `${circleSize}px`,
              top: `${circleOffset}px`, 
              left: `${circleOffset}px`,
              transform: checked ? `translateX(${translateDistance}px)` : 'translateX(0px)'
            }}
          >
            {checked && innerContent} {/* Only show inner content when checked */}
          </div>
        </div>
        {label && (
          <span className="ml-3 text-sm font-medium text-gray-900"
                style={{ transform: `rotate(-${rotation}deg)` }}>
            {label}
          </span>
        )}
      </label>
    </div>
  );
};

// Generator function to create toggle switches with predefined settings
const createToggleSwitch = (config = {}) => {
  return (props) => (
    <ToggleSwitch
      {...config}
      {...props}
    />
  );
};

// Create a thin, long blue toggle for seconds
const ThinLongBlueToggle = createToggleSwitch({
  width: 80,
  height: 12,
  circleSize: 10,
  circleOffset: 1,
  primaryColor: 'bg-blue-500',
  secondaryColor: 'bg-blue-200'
});

// Create a burnt orange toggle for minutes
const BurntOrangeToggle = createToggleSwitch({
  width: 40,
  height: 12,
  circleSize: 10,
  circleOffset: 1,
  primaryColor: 'bg-orange-600',
  secondaryColor: 'bg-orange-200'
});

// Create a purple toggle for hours
const PurpleToggle = createToggleSwitch({
  width: 100,
  height: 20,
  circleSize: 18,
  circleOffset: 1,
  primaryColor: 'bg-purple-600',
  secondaryColor: 'bg-purple-200'
});

const ToggleSwitchDemo = () => {
  // State to track the active second, minute, and hour
  const [activeSecond, setActiveSecond] = useState(0);
  const [activeMinute, setActiveMinute] = useState(0);
  const [activeHour, setActiveHour] = useState(0);
  
  // Set up a timer to update the active toggles every second
  useEffect(() => {
    // Function to update based on current time
    const updateTime = () => {
      const now = new Date();
      setActiveSecond(now.getSeconds());
      setActiveMinute(now.getMinutes());
      setActiveHour(now.getHours() % 12); // Convert to 12-hour format
    };
    
    // Set initial position
    updateTime();
    
    // Update every second
    const intervalId = setInterval(updateTime, 1000);
    
    // Clean up on unmount
    return () => clearInterval(intervalId);
  }, []);
  
  // Function to calculate positions for second hands (outer circle)
  const calculateSecondPositions = () => {
    const positions = [];
    const radius = 180; // Outer circle radius
    const toggleCount = 60;
    const angleDelta = 6; // 6 degrees per position (360/60)
    
    for (let i = 0; i < toggleCount; i++) {
      const angle = i * angleDelta - 90; // Subtract 90 to start at top (12 o'clock)
      const radians = (angle * Math.PI) / 180;
      
      positions.push({
        x: radius * Math.cos(radians),
        y: radius * Math.sin(radians),
        rotation: angle
      });
    }
    
    return positions;
  };
  
  // Function to calculate positions for minute hands (inner circle)
  const calculateMinutePositions = () => {
    const positions = [];
    const radius = 150; // Inner circle radius - closer to outer circle
    const toggleCount = 60;
    const angleDelta = 6; // 6 degrees per position (360/60)
    
    for (let i = 0; i < toggleCount; i++) {
      const angle = i * angleDelta - 90; // Subtract 90 to start at top (12 o'clock)
      const radians = (angle * Math.PI) / 180;
      
      positions.push({
        x: radius * Math.cos(radians),
        y: radius * Math.sin(radians),
        rotation: angle
      });
    }
    
    return positions;
  };
  
  // Empty handler function since the clock is automated
  const handleToggleChange = () => {};
  
  // Function to calculate positions for hour hand (innermost circle)
  const calculateHourPositions = () => {
    const positions = [];
    const radius = 100; // Innermost circle radius
    const toggleCount = 12; // 12 hours
    const angleDelta = 30; // 30 degrees per position (360/12)
    
    for (let i = 0; i < toggleCount; i++) {
      const angle = i * angleDelta - 90; // Subtract 90 to start at top (12 o'clock)
      const radians = (angle * Math.PI) / 180;
      
      positions.push({
        x: radius * Math.cos(radians),
        y: radius * Math.sin(radians),
        rotation: angle
      });
    }
    
    return positions;
  };
  
  // Get the positions for all three circles
  const secondPositions = calculateSecondPositions();
  const minutePositions = calculateMinutePositions();
  const hourPositions = calculateHourPositions();
  
  return (
    <div className="flex flex-col items-center justify-between h-full">
      {/* Digital time display at the top */}
      <div className="mb-8 font-mono text-2xl font-bold text-black">
        {String(activeHour === 0 ? 12 : activeHour).padStart(2, '0')}:{String(activeMinute).padStart(2, '0')}:{String(activeSecond).padStart(2, '0')}
      </div>
      
      {/* Clock container */}
      <div className="relative" style={{ width: '400px', height: '400px' }}>
        {/* Center point marker */}
        <div className="absolute w-2 h-2 rounded-full bg-gray-400" 
             style={{ 
               left: '50%', 
               top: '50%', 
               transform: 'translate(-50%, -50%)',
               zIndex: 20
             }} 
        />
        
        {/* Second toggles (outer circle) */}
        {secondPositions.map((pos, index) => (
          <div 
            key={`second-${index}`} 
            className="absolute"
            style={{ 
              left: '50%', 
              top: '50%', 
              transform: `translate(-50%, -50%) translate(${pos.x}px, ${pos.y}px)`,
              transformOrigin: 'center',
              zIndex: 5
            }}
          >
            <ThinLongBlueToggle
              rotation={pos.rotation}
              checked={activeSecond === index}
              onChange={handleToggleChange}
              innerContent={
                <span 
                  className="absolute text-blue-800"
                  style={{ 
                    transform: `rotate(${-pos.rotation}deg)`,
                    display: 'inline-block',
                    fontSize: '5pt'
                  }}>
                  {index}
                </span>
              }
            />
          </div>
        ))}
        
        {/* Minute toggles (middle circle) */}
        {minutePositions.map((pos, index) => (
          <div 
            key={`minute-${index}`} 
            className="absolute"
            style={{ 
              left: '50%', 
              top: '50%', 
              transform: `translate(-50%, -50%) translate(${pos.x}px, ${pos.y}px)`,
              transformOrigin: 'center',
              zIndex: 10
            }}
          >
            <BurntOrangeToggle
              rotation={pos.rotation}
              checked={activeMinute === index}
              onChange={handleToggleChange}
              innerContent={
                <span 
                  className="absolute text-orange-800"
                  style={{ 
                    transform: `rotate(${-pos.rotation}deg)`,
                    display: 'inline-block',
                    fontSize: '5pt'
                  }}>
                  {index}
                </span>
              }
            />
          </div>
        ))}
        
        {/* Hour toggles (reaching from center outward) */}
        {hourPositions.map((pos, index) => {
          // Calculate position to place the toggle so it starts near center and reaches the minute hand
          // Since the toggle is 100px wide and minute hands are at 150px radius,
          // We want to position the hours so they just touch the minute toggles
          const positioningRadius = 40; // Position further from center
          const adjustedX = (positioningRadius * Math.cos((index * 30 - 90) * Math.PI / 180));
          const adjustedY = (positioningRadius * Math.sin((index * 30 - 90) * Math.PI / 180));
          
          // Convert index (0-11) to hour number (1-12)
          const hourNumber = index === 0 ? 12 : index;
          
          return (
            <div 
  key={`hour-${index}`} 
  className="absolute"
  style={{ 
    left: '50%', 
    top: '50%', 
    transform: `translate(-50%, -50%) translate(${adjustedX}px, ${adjustedY}px)`,
    transformOrigin: 'center',
    zIndex: activeHour === index ? 20 : 15
  }}
>
              <PurpleToggle
                rotation={pos.rotation}
                checked={activeHour === index}
                onChange={handleToggleChange}
                innerContent={
                  <span 
                    className="text-xs text-purple-800 absolute"
                    style={{ 
                      transform: `rotate(${-pos.rotation}deg)`,
                      display: 'inline-block'
                    }}>
                    {hourNumber}
                  </span>
                }
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Export the main component
export default function ToggleClockVisualization() {
  return (
    <div className="w-full p-4 flex justify-center items-center" style={{ height: "500px" }}>
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-lg shadow-lg p-6 h-full">
          <ToggleSwitchDemo />
        </div>
      </div>
    </div>
  );
}