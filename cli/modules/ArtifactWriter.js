/**
 * ArtifactWriter - Serializes puzzles to JSON files
 */

import { writeFileSync, existsSync, mkdirSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { validatePuzzle } from '../../shared/schemas/validator.js';
import { QualityValidator } from './QualityValidator.js';

export class ArtifactWriter {
  /**
   * Writes a puzzle artifact to a JSON file
   * @param {Object} magicSquare - Magic square object with grid and words
   * @param {Array} riddles - Array of riddle objects
   * @param {string} outputPath - Path to write the JSON file
   * @param {Object} metadata - Additional metadata (language, direction, difficulty)
   * @returns {Object} - The complete puzzle object
   * @throws {Error} - If validation fails or file cannot be written
   */
  static write(magicSquare, riddles, outputPath, metadata = {}) {
    // Create the puzzle object
    const puzzle = this.createPuzzle(magicSquare, riddles, metadata);

    // Validate the puzzle schema
    const validation = validatePuzzle(puzzle);
    if (!validation.valid) {
      throw new Error(`Puzzle validation failed: ${validation.errors.join(', ')}`);
    }

    // Validate puzzle quality
    const qualityValidation = QualityValidator.validatePuzzle(puzzle);
    const qualityReport = QualityValidator.generateReport(qualityValidation);
    console.log(qualityReport);

    if (!qualityValidation.valid) {
      throw new Error(`Puzzle quality validation failed. See report above.`);
    }

    if (qualityValidation.warnings.length > 0) {
      console.warn(`⚠️  Puzzle has ${qualityValidation.warnings.length} warning(s). Review recommended.`);
    }

    // Ensure output directory exists
    const dir = dirname(outputPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    // Write to file
    try {
      const json = JSON.stringify(puzzle, null, 2);
      writeFileSync(outputPath, json, 'utf-8');
      console.log(`Puzzle artifact written to: ${outputPath}`);
      return puzzle;
    } catch (error) {
      throw new Error(`Failed to write puzzle artifact: ${error.message}`);
    }
  }

  /**
   * Creates a puzzle object from components
   * @param {Object} magicSquare - Magic square with grid and words
   * @param {Array} riddles - Array of riddles
   * @param {Object} metadata - Metadata object
   * @returns {Object} - Complete puzzle object
   */
  static createPuzzle(magicSquare, riddles, metadata = {}) {
    const puzzleId = uuidv4();
    const version = '1.0.0';
    const language = metadata.language || 'en';
    const direction = metadata.direction || 'ltr';
    const difficulty = metadata.difficulty || 'medium';

    return {
      puzzleId,
      version,
      language,
      direction,
      grid: magicSquare.grid,
      words: magicSquare.words,
      riddles: riddles.map((riddle, index) => {
        const riddleObj = {
          id: riddle.id || index + 1,
          prompt: riddle.prompt,
          answer: riddle.answer,
          solutionWord: riddle.solutionWord || riddle.answer,
          position: riddle.position !== undefined ? riddle.position : index
        };
        
        // Include optional hint and explanation if present
        if (riddle.hint) {
          riddleObj.hint = riddle.hint;
        }
        if (riddle.explanation) {
          riddleObj.explanation = riddle.explanation;
        }
        
        return riddleObj;
      }),
      metadata: {
        createdAt: new Date().toISOString(),
        difficulty
      }
    };
  }

  /**
   * Generates a filename for a puzzle
   * @param {string} language - Language code
   * @param {number} index - Puzzle index
   * @returns {string} - Filename
   */
  static generateFilename(language, index) {
    const timestamp = Date.now();
    return `puzzle-${language}-${index}-${timestamp}.json`;
  }

  /**
   * Writes multiple puzzles to files
   * @param {Array} puzzles - Array of puzzle data objects
   * @param {string} outputDir - Output directory
   * @param {Object} metadata - Shared metadata
   * @returns {Array} - Array of written puzzle objects
   */
  static writeMultiple(puzzles, outputDir, metadata = {}) {
    const writtenPuzzles = [];
    const puzzleInfos = [];

    puzzles.forEach((puzzleData, index) => {
      const filename = this.generateFilename(metadata.language || 'en', index + 1);
      const outputPath = join(outputDir, filename);

      try {
        const puzzle = this.write(
          puzzleData.magicSquare,
          puzzleData.riddles,
          outputPath,
          metadata
        );
        writtenPuzzles.push(puzzle);
        
        // Collect info for manifest
        puzzleInfos.push({
          filename,
          language: puzzle.language,
          difficulty: puzzle.metadata.difficulty,
          puzzleId: puzzle.puzzleId
        });
      } catch (error) {
        if (error.message.includes('quality validation failed')) {
          console.error(`❌ Puzzle ${index + 1} rejected due to quality issues`);
        } else {
          console.error(`Failed to write puzzle ${index + 1}: ${error.message}`);
        }
      }
    });

    const rejectedCount = puzzles.length - writtenPuzzles.length;
    console.log(`Successfully wrote ${writtenPuzzles.length}/${puzzles.length} puzzles`);
    if (rejectedCount > 0) {
      console.log(`❌ Rejected ${rejectedCount} puzzle(s) due to quality issues`);
    }
    
    // Update manifest with new puzzles
    if (puzzleInfos.length > 0) {
      this.updateManifest(outputDir, puzzleInfos);
    }
    
    return writtenPuzzles;
  }

  /**
   * Updates the manifest.json file with new puzzle entries
   * @param {string} outputDir - Output directory
   * @param {Array} newPuzzles - Array of puzzle info objects
   */
  static updateManifest(outputDir, newPuzzles) {
    const manifestPath = join(outputDir, 'manifest.json');
    let manifest = {
      version: '1.0.0',
      puzzles: []
    };

    // Load existing manifest if it exists
    if (existsSync(manifestPath)) {
      try {
        const content = readFileSync(manifestPath, 'utf-8');
        manifest = JSON.parse(content);
      } catch (error) {
        console.warn('Could not read existing manifest, creating new one');
      }
    }

    // Add new puzzles to manifest (avoid duplicates by puzzleId)
    const existingIds = new Set(manifest.puzzles.map(p => p.puzzleId));
    newPuzzles.forEach(puzzleInfo => {
      if (!existingIds.has(puzzleInfo.puzzleId)) {
        manifest.puzzles.push(puzzleInfo);
      }
    });

    // Write updated manifest
    try {
      const json = JSON.stringify(manifest, null, 2);
      writeFileSync(manifestPath, json, 'utf-8');
      console.log(`Updated manifest with ${newPuzzles.length} new puzzle(s)`);
    } catch (error) {
      console.error(`Failed to update manifest: ${error.message}`);
    }
  }

  /**
   * Validates puzzle data before writing
   * @param {Object} magicSquare - Magic square object
   * @param {Array} riddles - Array of riddles
   * @returns {Object} - { valid: boolean, errors: Array }
   */
  static validateBeforeWrite(magicSquare, riddles) {
    const errors = [];

    // Validate magic square
    if (!magicSquare || !magicSquare.grid || !magicSquare.words) {
      errors.push('Magic square must have grid and words properties');
    }

    // Validate riddles
    if (!Array.isArray(riddles)) {
      errors.push('Riddles must be an array');
    } else if (riddles.length !== 4) {
      errors.push('Must have exactly 4 riddles');
    } else {
      riddles.forEach((riddle, index) => {
        if (!riddle.prompt || !riddle.answer) {
          errors.push(`Riddle ${index} is missing required fields`);
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
