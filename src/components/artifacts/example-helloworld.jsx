/*
 * @description Simple Hello World demo
 */
import React from 'react';

const HelloWorld = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-blue-500 to-purple-600">
      <div className="bg-white p-8 rounded-lg shadow-xl">
        <h1 className="text-4xl font-bold text-center text-gray-800">
          Hello World
        </h1>
        <p className="mt-4 text-lg text-center text-gray-600">
          A minimal example styled with Tailwind CSS
        </p>
        <div className="mt-6 flex justify-center">
          <button className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors duration-200">
            Click me
          </button>
        </div>
      </div>
    </div>
  );
};

export default HelloWorld;