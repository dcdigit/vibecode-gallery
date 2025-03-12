import React from 'react';
import { useConfig } from '../context/ConfigContext';

export default function ArtifactCard({ artifact }) {
  const siteConfig = useConfig();
  return (
    <a
      href={`/artifacts/${artifact.name}`}
      className="block bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 h-full"
    >
      <div className="p-4 flex flex-col h-full">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center flex-grow">
            <div className="mr-2 p-1.5 rounded-md bg-purple-100">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-4 w-4 text-purple-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                />
              </svg>
            </div>
            <div className="flex flex-wrap items-baseline">
              <h2 className="text-lg font-semibold text-gray-800 mr-2">
                {artifact.title}
              </h2>
              <span className="text-xs font-medium text-gray-500">
                {artifact.fileName}
              </span>
            </div>
          </div>
          {siteConfig.artifacts.showCreationDate && (
            <div className="text-xs text-gray-500 whitespace-nowrap ml-2">
              {new Date(artifact.lastModified).toLocaleDateString()}
            </div>
          )}
        </div>
        
        {siteConfig.artifacts.showDescription && artifact.description && (
          <p className="text-gray-600 text-sm line-clamp-2 flex-grow">{artifact.description}</p>
        )}
      </div>
    </a>
  );
}

