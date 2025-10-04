#!/usr/bin/env node

/**
 * Build script for GitHub Pages
 * Builds both the client (game) and editor
 */

import { execSync } from 'child_process';
import { cpSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

console.log('🏗️  Building for GitHub Pages...\n');

// Set environment variable
process.env.GITHUB_PAGES = 'true';

try {
  // Clean dist directory
  console.log('1️⃣  Cleaning dist directory...');
  if (existsSync('dist')) {
    execSync('rm -rf dist', { stdio: 'inherit' });
  }
  mkdirSync('dist', { recursive: true });

  // Build client (game)
  console.log('\n2️⃣  Building client (game)...');
  execSync('vite build', { stdio: 'inherit', env: { ...process.env, GITHUB_PAGES: 'true' } });

  // Copy editor to dist
  console.log('\n3️⃣  Copying editor...');
  mkdirSync('dist/editor', { recursive: true });
  cpSync('editor', 'dist/editor', { recursive: true });

  // Copy puzzles to dist
  console.log('\n4️⃣  Copying puzzles...');
  mkdirSync('dist/puzzles', { recursive: true });
  cpSync('puzzles', 'dist/puzzles', { recursive: true, filter: (src) => src.endsWith('.json') || src === 'puzzles' });

  // Copy shared files needed by editor
  console.log('\n5️⃣  Copying shared files...');
  mkdirSync('dist/shared', { recursive: true });
  cpSync('shared', 'dist/shared', { recursive: true });

  console.log('\n✅ Build complete! Output in dist/');
  console.log('\nStructure:');
  console.log('  dist/');
  console.log('  ├── index.html        (game)');
  console.log('  ├── editor/           (puzzle editor)');
  console.log('  ├── puzzles/          (sample puzzles)');
  console.log('  └── shared/           (shared code)');

} catch (error) {
  console.error('\n❌ Build failed:', error.message);
  process.exit(1);
}
