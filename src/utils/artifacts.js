// Existing imports stay the same
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { siteConfig } from '../config.js';

// Updated ARTIFACTS_DIR definition
const ARTIFACTS_DIR = 
  // Check if we're in production (Netlify)
  process.env.NODE_ENV === 'production' || process.env.NETLIFY === 'true'
    ? path.join(process.cwd(), 'src/components/artifacts')
    : path.join(path.dirname(fileURLToPath(import.meta.url)), '../components/artifacts');

/**
 * Get the paths to all artifact files in the format required by Astro's getStaticPaths
 * @returns 
 *         Array of objects with params and props for Astro's getStaticPaths
 */
export function getArtifactPaths() {
  try {
    if (!fs.existsSync(ARTIFACTS_DIR)) {
      console.warn(`Artifacts directory not found: ${ARTIFACTS_DIR}`);
      return [];
    }

    const artifacts = fs
      .readdirSync(ARTIFACTS_DIR)
      .filter(file => {
        // Filter for React component files (jsx or tsx extensions)
        return file.endsWith('.jsx') || file.endsWith('.tsx');
      });
    
    // Return array in the format Astro expects for getStaticPaths
    return artifacts.map(fileName => {
      const name = path.basename(fileName, path.extname(fileName));
      const filePath = path.join(ARTIFACTS_DIR, fileName);
      // Read file content and pass it directly to getArtifactMetadata to avoid circular dependency
      let content = null;
      try {
        content = fs.readFileSync(filePath, 'utf-8');
      } catch (error) {
        console.error(`Error reading file ${filePath}:`, error);
      }
      const metadata = getArtifactMetadata(name, filePath, content);
      
      return {
        params: { artifact: name },
        props: { 
          fileName,
          name,
          path: filePath,
          metadata
        }
      };
    });
  } catch (error) {
    console.error('Error reading artifacts directory:', error);
    return [];
  }
}

/**
 * Get information about all artifacts
 * @returns Array of artifact info objects
 */
export function getAllArtifacts() {
  const artifactPaths = getArtifactPaths();
  
  return artifactPaths.map(item => {
    // Extract data from the new getArtifactPaths structure
    const { props } = item;
    const { fileName, name, path: artifactPath, metadata } = props;
    
    // Calculate relative path
    const relativePath = path.relative(ARTIFACTS_DIR, artifactPath);
    
    return {
      fileName,
      name,
      path: artifactPath,
      relativePath,
      metadata
    };
  });
}

/**
 * Get information about a specific artifact by its filename
 * @param fileName - The filename of the artifact
 * @returns The artifact info or null if not found
 */
export function getArtifactByFileName(fileName) {
  const artifacts = getAllArtifacts();
  const artifact = artifacts.find(artifact => artifact.fileName === fileName) || null;
  
  if (!artifact) {
    console.warn(`Artifact with filename "${fileName}" not found`);
    return null;
  }
  
  return artifact;
}

/**
 * Get information about a specific artifact by its name (without extension)
 * @param name - The name of the artifact (without extension)
 * @returns The artifact info or null if not found
 */
export function getArtifactByName(name) {
  const artifacts = getAllArtifacts();
  const artifact = artifacts.find(artifact => artifact.name === name) || null;
  
  if (!artifact) {
    console.warn(`Artifact with name "${name}" not found`);
    return null;
  }
  
  return artifact;
}

/**
 * Dynamically import a specific artifact component
 * @param name - The name of the artifact (without extension)
 * @returns A promise that resolves to the component
 */
export async function importArtifactComponent(name) {
  const artifact = getArtifactByName(name);
  
  if (!artifact) {
    throw new Error(`Artifact not found: ${name}`);
  }
  
  try {
    // Using dynamic import to load the component
    const module = await import(/* @vite-ignore */ `../components/artifacts/${artifact.fileName}`);
    return module.default || module;
  } catch (error) {
    console.error(`Error importing artifact ${name}:`, error);
    throw error;
  }
}

/**
 * Reads the content of an artifact file
 * @param name - The name of the artifact (without extension)
 * @returns The content of the file or null if not found
 */
export function getArtifactContent(name) {
  const artifact = getArtifactByName(name);
  
  if (!artifact) {
    return null;
  }
  
  try {
    return fs.readFileSync(artifact.path, 'utf-8');
  } catch (error) {
    console.error(`Error reading artifact ${name}:`, error);
    return null;
  }
}

/**
 * Extract metadata from artifact content (JSDoc comments, etc.)
 * @param name - The name of the artifact (without extension) 
 * @param [filePath] - Optional direct path to the file
 * @param [content] - Optional content of the file
 * @returns The extracted metadata
 */
export function getArtifactMetadata(name, filePath, content) {
  // If content is not provided directly, try to get it
  if (!content) {
    // If filePath is provided, read content from the file directly
    if (filePath && fs.existsSync(filePath)) {
      try {
        content = fs.readFileSync(filePath, 'utf-8');
      } catch (error) {
        console.error(`Error reading file at ${filePath}:`, error);
        content = null;
      }
    } else {
      // Fall back to the original behavior
      content = getArtifactContent(name);
    }
  }
  
  if (!content) {
    return { title: name, description: '' };
  }
  
  // Default metadata
  let metadata = {
    title: formatTitle(name),
    description: '',
  };
  
  // Try to extract JSDoc-style comments for metadata
  const titleMatch = content.match(/\* @title\s+(.+)$/m);
  if (titleMatch && titleMatch[1]) {
    metadata.title = titleMatch[1].trim();
  }
  
  const descriptionMatch = content.match(/\* @description\s+(.+)$/m);
  if (descriptionMatch && descriptionMatch[1]) {
    metadata.description = descriptionMatch[1].trim();
  }
  
  // If no JSDoc title/description found, try to extract from regular comments
  if (!titleMatch && !descriptionMatch) {
    const commentMatch = content.match(/\/\*\*?([\s\S]*?)\*\//);
    if (commentMatch && commentMatch[1]) {
      const comment = commentMatch[1].trim();
      metadata.description = comment;
    }
  }
  
  return metadata;
}

/**
 * Format a filename into a readable title
 * @param name - The artifact name (filename without extension)
 * @returns A formatted title
 */
function formatTitle(name) {
  return name
    .replace(/[-_]/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2') // Convert camelCase to spaces
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get the adjacent (previous and next) artifacts for a given artifact
 * @param {string} currentName - The name of the current artifact
 * @returns {Object} An object containing previousArtifact and nextArtifact
 */
export function getAdjacentArtifacts(currentName) {
  // Get all artifacts
  const allArtifacts = getAllArtifacts();
  
  if (!allArtifacts || allArtifacts.length <= 1) {
    return { previousArtifact: null, nextArtifact: null };
  }
  
  // Sort artifacts based on config settings
  const sortBy = siteConfig.artifacts?.sortBy || 'date';
  const sortDirection = siteConfig.artifacts?.sortDirection || 'desc';
  
  // Sort artifacts based on the sortBy setting
  const sortedArtifacts = [...allArtifacts].sort((a, b) => {
    let comparison = 0;
    
    if (sortBy === 'date') {
      // Use the filesystem timestamp if available
      const aTime = fs.statSync(a.path).mtime.getTime();
      const bTime = fs.statSync(b.path).mtime.getTime();
      comparison = aTime - bTime;
    } 
    else if (sortBy === 'name') {
      // Sort by title
      comparison = a.metadata.title.localeCompare(b.metadata.title);
    } 
    else if (sortBy === 'category') {
      // Sort by category if available
      const aCategory = a.metadata.category || '';
      const bCategory = b.metadata.category || '';
      comparison = aCategory.localeCompare(bCategory);
    }
    
    // Apply sort direction
    return sortDirection === 'desc' ? -comparison : comparison;
  });
  
  // Find the index of the current artifact
  const currentIndex = sortedArtifacts.findIndex(artifact => artifact.name === currentName);
  
  if (currentIndex === -1) {
    console.warn(`Current artifact "${currentName}" not found in sorted artifacts.`);
    return { previousArtifact: null, nextArtifact: null };
  }
  
  // Calculate previous and next indices with looping
  const prevIndex = currentIndex === 0 ? sortedArtifacts.length - 1 : currentIndex - 1;
  const nextIndex = currentIndex === sortedArtifacts.length - 1 ? 0 : currentIndex + 1;
  
  // Return the adjacent artifacts
  return {
    previousArtifact: sortedArtifacts[prevIndex],
    nextArtifact: sortedArtifacts[nextIndex]
  };
}

