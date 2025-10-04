/**
 * JSON Schema validator for puzzle artifacts
 * Works in both Node.js and browser environments
 */

// Inline schema for browser compatibility
const schema = {
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Magic Four Squared Puzzle",
  "description": "Schema for a 4x4 magic square word puzzle with riddles",
  "type": "object",
  "required": ["puzzleId", "version", "language", "direction", "grid", "words", "riddles", "metadata"],
  "properties": {
    "puzzleId": {
      "type": "string",
      "description": "Unique identifier for the puzzle (UUID)",
      "pattern": "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"
    },
    "version": {
      "type": "string",
      "description": "Schema version (semver)",
      "pattern": "^\\d+\\.\\d+\\.\\d+$"
    },
    "language": {
      "type": "string",
      "description": "ISO 639-1 language code",
      "pattern": "^[a-z]{2}$"
    },
    "direction": {
      "type": "string",
      "description": "Text direction",
      "enum": ["ltr", "rtl"]
    },
    "grid": {
      "type": "array",
      "description": "4x4 grid of characters",
      "minItems": 4,
      "maxItems": 4,
      "items": {
        "type": "array",
        "minItems": 4,
        "maxItems": 4,
        "items": {
          "type": "string",
          "minLength": 1,
          "maxLength": 1
        }
      }
    },
    "words": {
      "type": "array",
      "description": "The 4 words that form the magic square",
      "minItems": 4,
      "maxItems": 4,
      "items": {
        "type": "string",
        "minLength": 4,
        "maxLength": 4
      }
    },
    "riddles": {
      "type": "array",
      "description": "Riddles for each word",
      "minItems": 4,
      "maxItems": 4,
      "items": {
        "type": "object",
        "required": ["id", "prompt", "answer", "solutionWord", "position"],
        "properties": {
          "id": {
            "type": "integer",
            "description": "Riddle identifier (1-4)",
            "minimum": 1,
            "maximum": 4
          },
          "prompt": {
            "type": "string",
            "description": "The riddle text",
            "minLength": 1
          },
          "answer": {
            "type": "string",
            "description": "The answer to the riddle (appears in the grid)",
            "minLength": 4,
            "maxLength": 4
          },
          "position": {
            "type": "integer",
            "description": "Row/column index (0-3)",
            "minimum": 0,
            "maximum": 3
          },
          "hint": {
            "type": "string",
            "description": "Optional hint to help solve the riddle"
          },
          "explanation": {
            "type": "string",
            "description": "Optional explanation of why the answer is correct"
          }
        }
      }
    },
    "metadata": {
      "type": "object",
      "required": ["createdAt", "difficulty"],
      "properties": {
        "createdAt": {
          "type": "string",
          "description": "ISO 8601 timestamp",
          "format": "date-time"
        },
        "difficulty": {
          "type": "string",
          "description": "Puzzle difficulty level",
          "enum": ["easy", "medium", "hard"]
        }
      }
    }
  }
};

/**
 * Validates a puzzle object against the schema
 * @param {Object} puzzle - The puzzle object to validate
 * @returns {Object} - { valid: boolean, errors: Array }
 */
export function validatePuzzle(puzzle) {
  const errors = [];

  // Check required fields
  const requiredFields = ['puzzleId', 'version', 'language', 'direction', 'grid', 'words', 'riddles', 'metadata'];
  for (const field of requiredFields) {
    if (!(field in puzzle)) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  // Validate puzzleId (UUID format)
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
  if (!uuidPattern.test(puzzle.puzzleId)) {
    errors.push('puzzleId must be a valid UUID');
  }

  // Validate version (semver format)
  const semverPattern = /^\d+\.\d+\.\d+$/;
  if (!semverPattern.test(puzzle.version)) {
    errors.push('version must be in semver format (e.g., 1.0.0)');
  }

  // Validate language (ISO 639-1)
  const langPattern = /^[a-z]{2}$/;
  if (!langPattern.test(puzzle.language)) {
    errors.push('language must be a 2-letter ISO 639-1 code');
  }

  // Validate direction
  if (!['ltr', 'rtl'].includes(puzzle.direction)) {
    errors.push('direction must be either "ltr" or "rtl"');
  }

  // Validate grid
  if (!Array.isArray(puzzle.grid) || puzzle.grid.length !== 4) {
    errors.push('grid must be an array of 4 rows');
  } else {
    puzzle.grid.forEach((row, i) => {
      if (!Array.isArray(row) || row.length !== 4) {
        errors.push(`grid row ${i} must contain exactly 4 characters`);
      } else {
        row.forEach((char, j) => {
          if (typeof char !== 'string' || char.length !== 1) {
            errors.push(`grid[${i}][${j}] must be a single character`);
          }
        });
      }
    });
  }

  // Validate words
  if (!Array.isArray(puzzle.words) || puzzle.words.length !== 4) {
    errors.push('words must be an array of exactly 4 words');
  } else {
    puzzle.words.forEach((word, i) => {
      if (typeof word !== 'string' || word.length !== 4) {
        errors.push(`words[${i}] must be a 4-character string`);
      }
    });
  }

  // Validate riddles
  if (!Array.isArray(puzzle.riddles) || puzzle.riddles.length !== 4) {
    errors.push('riddles must be an array of exactly 4 riddles');
  } else {
    puzzle.riddles.forEach((riddle, i) => {
      const riddleErrors = validateRiddle(riddle, i);
      errors.push(...riddleErrors);
    });
  }

  // Validate metadata
  if (typeof puzzle.metadata !== 'object') {
    errors.push('metadata must be an object');
  } else {
    if (!puzzle.metadata.createdAt) {
      errors.push('metadata.createdAt is required');
    }
    if (!['easy', 'medium', 'hard'].includes(puzzle.metadata.difficulty)) {
      errors.push('metadata.difficulty must be "easy", "medium", or "hard"');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validates a single riddle object
 * @param {Object} riddle - The riddle to validate
 * @param {number} index - The riddle index for error messages
 * @returns {Array} - Array of error messages
 */
function validateRiddle(riddle, index) {
  const errors = [];

  if (typeof riddle !== 'object') {
    errors.push(`riddles[${index}] must be an object`);
    return errors;
  }

  // Check required fields
  const requiredFields = ['id', 'prompt', 'answer', 'position'];
  for (const field of requiredFields) {
    if (!(field in riddle)) {
      errors.push(`riddles[${index}].${field} is required`);
    }
  }

  // Validate id
  if (typeof riddle.id !== 'number' || riddle.id < 1 || riddle.id > 4) {
    errors.push(`riddles[${index}].id must be a number between 1 and 4`);
  }

  // Validate prompt
  if (typeof riddle.prompt !== 'string' || riddle.prompt.length === 0) {
    errors.push(`riddles[${index}].prompt must be a non-empty string`);
  }

  // Validate answer
  if (typeof riddle.answer !== 'string' || riddle.answer.length !== 4) {
    errors.push(`riddles[${index}].answer must be a 4-character string`);
  }

  // Validate position
  if (typeof riddle.position !== 'number' || riddle.position < 0 || riddle.position > 3) {
    errors.push(`riddles[${index}].position must be a number between 0 and 3`);
  }

  return errors;
}

/**
 * Gets the JSON schema
 * @returns {Object} - The puzzle schema
 */
export function getSchema() {
  return schema;
}
