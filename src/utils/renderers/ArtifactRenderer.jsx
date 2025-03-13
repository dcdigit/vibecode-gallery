import React, { useEffect, useState } from 'react';
import artifactComponents from './artifactComponents';

/**
 * A simple component that renders an artifact based on the component name
 * @param props - Component properties
 * @param props.componentName - Name of the component to render
 * @param props.props - Props to pass to the rendered component
 */
export default function ArtifactRenderer({ componentName, props = {} }) {
  const [renderAttempted, setRenderAttempted] = useState(false);

  useEffect(() => {
    setRenderAttempted(true);
    
    return () => {
      // Cleanup if needed
    };
  }, [componentName, props]);

  // Get the component from the components map
  const Component = artifactComponents[componentName];
  
  // If component doesn't exist, show an error message
  if (!Component) {
    return (
      <div className="p-4 border-2 border-red-500 rounded bg-red-100 text-red-800">
        <h2 className="text-xl font-bold mb-2">Component Not Found</h2>
        <p>The component "{componentName}" does not exist in the artifacts collection.</p>
        <p className="mt-2 text-sm">Available components: {Object.keys(artifactComponents).join(', ')}</p>
      </div>
    );
  }
  
  // Render the component with the provided props
  try {
    return <Component {...props} />;
  } catch (error) {
    return (
      <div className="p-4 border-2 border-red-500 rounded bg-red-100 text-red-800">
        <h2 className="text-xl font-bold mb-2">Rendering Error</h2>
        <p>Failed to render component "{componentName}"</p>
        <p className="mt-2 text-sm">Error: {error.message}</p>
      </div>
    );
  }
}
