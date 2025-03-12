#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
/**
 * This script ensures that the artifacts directory exists.
 * It should be run before dev or build commands.
 */

// Get the directory name equivalent to __dirname in CommonJS
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const artifactDir = path.join(__dirname, 'src', 'components', 'artifacts');
if (!fs.existsSync(artifactDir)) {
  console.log(`Creating ${artifactDir} directory...`);
  
  // Create the directory structure recursively
  fs.mkdirSync(artifactDir, { recursive: true });
  
  console.log(`✅ Directory created successfully.`);
} else {
  console.log(`✅ ${artifactDir} directory already exists.`);
}

console.log(`Ready to use AI artifacts in: ${artifactDir}`);

