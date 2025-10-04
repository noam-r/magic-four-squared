#!/usr/bin/env node

/**
 * Magic Four Squared - Puzzle Generator CLI
 * Generates 4x4 magic square puzzles with riddles
 */

import { WordListLoader } from './modules/WordListLoader.js';
import { MagicSquareFinder } from './modules/MagicSquareFinder.js';
import { RiddleGenerator } from './modules/RiddleGenerator.js';
import { ArtifactWriter } from './modules/ArtifactWriter.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Parses command line arguments
 * @returns {Object} - Parsed arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {
    wordlist: null,
    output: 'puzzles',
    language: 'en',
    count: 5,
    difficulty: 'medium'
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--wordlist' && i + 1 < args.length) {
      parsed.wordlist = args[++i];
    } else if (arg === '--output' && i + 1 < args.length) {
      parsed.output = args[++i];
    } else if (arg === '--language' && i + 1 < args.length) {
      parsed.language = args[++i];
    } else if (arg === '--count' && i + 1 < args.length) {
      parsed.count = parseInt(args[++i], 10);
    } else if (arg === '--difficulty' && i + 1 < args.length) {
      parsed.difficulty = args[++i];
    } else if (arg === '--help' || arg === '-h') {
      printUsage();
      process.exit(0);
    }
  }

  return parsed;
}

/**
 * Prints usage information
 */
function printUsage() {
  console.log(`
Magic Four Squared - Puzzle Generator

Usage:
  node cli/index.js --wordlist <path> [options]

Options:
  --wordlist <path>      Path to word list file (required)
  --output <dir>         Output directory for puzzles (default: puzzles)
  --language <code>      Language code: en, he, etc. (default: en)
  --count <number>       Number of puzzles to generate (default: 5)
  --difficulty <level>   Difficulty level: easy, medium, hard (default: medium)
  --help, -h            Show this help message

Examples:
  node cli/index.js --wordlist wordlists/eng-4.txt --output puzzles/ --language en
  node cli/index.js --wordlist wordlists/heb-4.txt --output puzzles/ --language he --count 10

Environment Variables:
  OPENAI_API_KEY        OpenAI API key for riddle generation
  ANTHROPIC_API_KEY     Anthropic API key for riddle generation (alternative)
  OPENAI_MODEL          OpenAI model to use (default: gpt-4)
  ANTHROPIC_MODEL       Anthropic model to use (default: claude-3-sonnet-20240229)
`);
}

/**
 * Validates configuration
 * @param {Object} config - Configuration object
 * @returns {Object} - { valid: boolean, errors: Array }
 */
function validateConfig(config) {
  const errors = [];

  if (!config.wordlist) {
    errors.push('--wordlist is required');
  }

  if (config.count < 1 || config.count > 100) {
    errors.push('--count must be between 1 and 100');
  }

  if (!['easy', 'medium', 'hard'].includes(config.difficulty)) {
    errors.push('--difficulty must be easy, medium, or hard');
  }

  const validLanguages = ['en', 'he', 'ar', 'fr', 'es', 'de'];
  if (!validLanguages.includes(config.language)) {
    console.warn(`Warning: Language '${config.language}' may not be fully supported`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Main execution function
 */
async function main() {
  console.log('Magic Four Squared - Puzzle Generator\n');

  // Parse arguments
  const config = parseArgs();

  // Validate configuration
  const validation = validateConfig(config);
  if (!validation.valid) {
    console.error('Configuration errors:');
    validation.errors.forEach(error => console.error(`  - ${error}`));
    console.error('\nUse --help for usage information');
    process.exit(1);
  }

  try {
    // Step 1: Load word list
    console.log(`\n[1/4] Loading word list from: ${config.wordlist}`);
    const wordListData = WordListLoader.load(config.wordlist, config.language);
    console.log(`Loaded ${wordListData.words.length} words`);
    console.log(`Language: ${wordListData.language}, Direction: ${wordListData.direction}`);

    // Step 2: Find magic squares
    console.log(`\n[2/4] Finding magic squares (target: ${config.count})...`);
    const magicSquares = MagicSquareFinder.findMagicSquares(
      wordListData.words,
      config.count
    );

    if (magicSquares.length === 0) {
      console.error('No magic squares found in the word list.');
      console.error('Try using a larger word list or different words.');
      process.exit(1);
    }

    console.log(`Found ${magicSquares.length} magic squares`);

    // Step 3: Generate riddles
    console.log(`\n[3/4] Generating riddles...`);
    const puzzlesWithRiddles = [];

    for (let i = 0; i < magicSquares.length; i++) {
      const square = magicSquares[i];
      console.log(`\nGenerating riddles for puzzle ${i + 1}/${magicSquares.length}`);
      console.log(`Words: ${square.words.join(', ')}`);

      const riddles = await RiddleGenerator.generateRiddles(
        square.words,
        config.language
      );

      puzzlesWithRiddles.push({
        magicSquare: square,
        riddles
      });
    }

    // Step 4: Write artifacts
    console.log(`\n[4/4] Writing puzzle artifacts to: ${config.output}`);
    const metadata = {
      language: config.language,
      direction: wordListData.direction,
      difficulty: config.difficulty
    };

    const writtenPuzzles = ArtifactWriter.writeMultiple(
      puzzlesWithRiddles,
      config.output,
      metadata
    );

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('Generation Complete!');
    console.log('='.repeat(50));
    console.log(`Total puzzles generated: ${writtenPuzzles.length}`);
    console.log(`Output directory: ${config.output}`);
    console.log(`Language: ${config.language}`);
    console.log(`Difficulty: ${config.difficulty}`);
    console.log('\nPuzzle files:');
    writtenPuzzles.forEach((puzzle, i) => {
      console.log(`  ${i + 1}. ${puzzle.puzzleId}.json`);
    });

  } catch (error) {
    console.error('\nError:', error.message);
    if (process.env.DEBUG) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run the CLI
main();
