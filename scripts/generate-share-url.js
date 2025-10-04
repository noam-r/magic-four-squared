#!/usr/bin/env node

/**
 * Generates a shareable URL from a puzzle JSON file
 */

import { readFileSync } from 'fs';
import { deflateSync } from 'zlib';

function base64urlEncode(buffer) {
  return buffer.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function generateShareUrl(puzzleFile, baseUrl = 'http://localhost:5173') {
  // Read puzzle file
  const json = readFileSync(puzzleFile, 'utf-8');
  const puzzle = JSON.parse(json);
  
  // Compress
  const compressed = deflateSync(json);
  const encoded = base64urlEncode(compressed);
  
  // Generate URL
  const url = `${baseUrl}/?p=${encoded}`;
  
  // Stats
  console.log('📊 Compression Stats:');
  console.log(`   Original: ${json.length} bytes`);
  console.log(`   Compressed: ${compressed.length} bytes`);
  console.log(`   Base64: ${encoded.length} chars`);
  console.log(`   Ratio: ${(compressed.length / json.length * 100).toFixed(1)}%`);
  console.log('');
  console.log('🔗 Shareable URL:');
  console.log(url);
  console.log('');
  console.log(`📏 URL Length: ${url.length} characters`);
  
  return url;
}

// Run if called directly
if (process.argv.length < 3) {
  console.error('Usage: node generate-share-url.js <puzzle-file.json> [base-url]');
  process.exit(1);
}

const puzzleFile = process.argv[2];
const baseUrl = process.argv[3] || 'http://localhost:5173';

generateShareUrl(puzzleFile, baseUrl);
