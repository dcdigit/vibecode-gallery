/*
* @description Button menagerie
*/
import React, { useState } from 'react';
import { ChevronRight, Send, Download, Star, Bell, Play } from 'lucide-react';

const FancyButtons = () => {
  const [clicked, setClicked] = useState({});

  const handleClick = (buttonId) => {
    setClicked(prev => ({
      ...prev,
      [buttonId]: true
    }));
    
    setTimeout(() => {
      setClicked(prev => ({
        ...prev,
        [buttonId]: false
      }));
    }, 1000);
  };

  return (
    <div className="flex flex-col items-center p-8 space-y-8 bg-gray-50 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Interactive Button Demo</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl">
        {/* Gradient Button with Slide Effect */}
        <div className="flex flex-col items-center space-y-2">
          <button 
            onClick={() => handleClick('gradient')}
            className={`
              relative overflow-hidden group
              px-6 py-3 rounded-lg font-semibold 
              bg-gradient-to-r from-blue-500 to-purple-600
              text-white shadow-lg transform transition-all duration-300
              hover:shadow-xl hover:scale-105
              focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50
            `}
          >
            <span className="relative z-10 flex items-center">
              Get Started
              <ChevronRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
            </span>
            <span className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
          </button>
          <span className="text-sm text-gray-600">Gradient + Slide</span>
        </div>

        {/* 3D Button */}
        <div className="flex flex-col items-center space-y-2">
          <button 
            onClick={() => handleClick('3d')}
            className={`
              px-6 py-3 rounded-lg font-semibold
              text-white bg-green-500
              border-b-4 border-green-700
              shadow-lg transition-all duration-150
              hover:bg-green-600 hover:border-green-800
              active:border-b-0 active:border-t-4 active:border-t-green-300
              focus:outline-none
              ${clicked['3d'] ? 'border-b-0 border-t-4 border-t-green-300 transform translate-y-1' : ''}
            `}
          >
            <span className="flex items-center">
              <Download className="mr-2 h-5 w-5" />
              Download Now
            </span>
          </button>
          <span className="text-sm text-gray-600">3D Press Effect</span>
        </div>

        {/* Pulse Button with Text Animation */}
        <div className="flex flex-col items-center space-y-2">
          <button 
            onClick={() => handleClick('pulse')}
            className="relative px-6 py-3 rounded-lg font-semibold text-white bg-red-500 shadow-lg transition-colors duration-300 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 overflow-hidden"
          >
            <span className="flex items-center z-10 relative">
              <Bell className="mr-2 h-5 w-5" />
              <span className={`inline-block transition-all duration-300 ${clicked['pulse'] ? 'scale-125 font-bold' : ''}`}>
                {clicked['pulse'] ? "Done!" : "Notify Me"}
              </span>
            </span>
            <span className={`
              absolute inset-0 rounded-lg bg-red-400 opacity-70
              ${clicked['pulse'] ? 'animate-ping' : ''}
            `}></span>
          </button>
          <span className="text-sm text-gray-600">Text Growth + Pulse</span>
        </div>

        {/* Neon Button */}
        <div className="flex flex-col items-center space-y-2">
          <button 
            onClick={() => handleClick('neon')}
            className={`
              px-6 py-3 rounded-lg font-semibold
              text-cyan-400 bg-gray-900
              border-2 border-cyan-400
              shadow-lg transition-all duration-300
              hover:text-white hover:bg-cyan-400 hover:shadow-cyan-300/50
              focus:outline-none
            `}
          >
            <span className="flex items-center">
              <Star className="mr-2 h-5 w-5" />
              Glow Effect
            </span>
          </button>
          <span className="text-sm text-gray-600">Neon Glow</span>
        </div>

        {/* Expanding Button */}
        <div className="flex flex-col items-center space-y-2 md:col-span-2">
          <button 
            onClick={() => handleClick('expanding')}
            className={`
              group relative overflow-hidden
              w-48 px-6 py-3 rounded-full font-semibold
              text-white bg-indigo-500
              shadow-lg transition-all duration-500
              hover:w-64
              focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50
            `}
          >
            <span className="flex items-center justify-center">
              <Play className="mr-2 h-5 w-5" />
              <span>Watch Demo</span>
              <span className="absolute right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500">Now</span>
            </span>
          </button>
          <span className="text-sm text-gray-600">Expanding Button</span>
        </div>
      </div>

      {/* Status Indicator */}
      <div className="mt-8 text-center">
        {Object.values(clicked).some(v => v) ? (
          <p className="text-green-600 font-medium">Button clicked!</p>
        ) : (
          <p className="text-gray-500">Click any button to see effects</p>
        )}
      </div>
    </div>
  );
};

export default FancyButtons;