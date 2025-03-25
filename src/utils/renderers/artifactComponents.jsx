import React from 'react';

// Use Vite's import.meta.glob to automatically discover and import all components
// from the artifacts directory
const componentModules = import.meta.glob('../../components/artifacts/*.{jsx,tsx}', { eager: true });

// Create a map of component names (without file extension) to their components
const artifactComponents = {};

// Process each discovered module
Object.entries(componentModules).forEach(([path, module]) => {
  // Extract the file name without extension from the path
  const fileName = path.split('/').pop()?.replace(/\.(jsx|tsx)$/, '');  
  // Add the component to our map
  artifactComponents[fileName] = module.default;
});

console.log('Registered artifact components:', Object.keys(artifactComponents));

export default artifactComponents;
