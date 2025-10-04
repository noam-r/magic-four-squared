import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execSync } from 'child_process';
import { existsSync, writeFileSync, unlinkSync, readdirSync, readFileSync } from 'fs';

describe('CLI Integration Tests', () => {
  const testWordlist = 'test-cli-wordlist.txt';
  const testOutput = 'test-cli-output';

  beforeEach(() => {
    // Create a test word list with words that can form a magic square
    const words = [
      'ABLE',
      'BARE',
      'LREA',
      'EEAR',
      'CARE',
      'DARE',
      'RARE',
      'WARE'
    ].join('\n');
    
    writeFileSync(testWordlist, words, 'utf-8');
  });

  afterEach(() => {
    // Clean up
    if (existsSync(testWordlist)) {
      unlinkSync(testWordlist);
    }
    
    if (existsSync(testOutput)) {
      const files = readdirSync(testOutput);
      files.forEach(file => {
        if (file.endsWith('.json')) {
          unlinkSync(`${testOutput}/${file}`);
        }
      });
    }
  });

  it('should show help message', () => {
    const output = execSync('node cli/index.js --help', { encoding: 'utf-8' });
    
    expect(output).toContain('Magic Four Squared');
    expect(output).toContain('Usage:');
    expect(output).toContain('--wordlist');
  });

  it('should fail without required wordlist argument', () => {
    try {
      execSync('node cli/index.js', { encoding: 'utf-8', stdio: 'pipe' });
      expect.fail('Should have thrown an error');
    } catch (error) {
      expect(error.status).toBe(1);
      expect(error.stderr.toString()).toContain('--wordlist is required');
    }
  });

  it('should generate puzzles from word list', () => {
    const output = execSync(
      `node cli/index.js --wordlist ${testWordlist} --output ${testOutput} --language en --count 1`,
      { encoding: 'utf-8' }
    );

    expect(output).toContain('Loading word list');
    expect(output).toContain('Finding magic squares');
    expect(output).toContain('Generating riddles');
    expect(output).toContain('Writing puzzle artifacts');
    expect(output).toContain('Generation Complete');
  }, 30000); // 30 second timeout for API calls

  it('should create valid JSON artifacts', () => {
    execSync(
      `node cli/index.js --wordlist ${testWordlist} --output ${testOutput} --language en --count 1`,
      { encoding: 'utf-8' }
    );

    expect(existsSync(testOutput)).toBe(true);
    
    const files = readdirSync(testOutput).filter(f => f.endsWith('.json'));
    expect(files.length).toBeGreaterThan(0);

    // Validate JSON structure
    const puzzleContent = readFileSync(`${testOutput}/${files[0]}`, 'utf-8');
    const puzzle = JSON.parse(puzzleContent);

    expect(puzzle.puzzleId).toBeTruthy();
    expect(puzzle.version).toBe('1.0.0');
    expect(puzzle.language).toBe('en');
    expect(puzzle.grid).toHaveLength(4);
    expect(puzzle.words).toHaveLength(4);
    expect(puzzle.riddles).toHaveLength(4);
  }, 30000);

  it('should respect count parameter', () => {
    execSync(
      `node cli/index.js --wordlist ${testWordlist} --output ${testOutput} --language en --count 2`,
      { encoding: 'utf-8' }
    );

    const files = readdirSync(testOutput).filter(f => f.endsWith('.json'));
    expect(files.length).toBeLessThanOrEqual(2);
  }, 30000);

  it('should handle invalid word list file', () => {
    try {
      execSync(
        'node cli/index.js --wordlist non-existent.txt --output ${testOutput}',
        { encoding: 'utf-8', stdio: 'pipe' }
      );
      expect.fail('Should have thrown an error');
    } catch (error) {
      expect(error.status).toBe(1);
      expect(error.stderr.toString()).toContain('not found');
    }
  });

  it('should validate difficulty parameter', () => {
    try {
      execSync(
        `node cli/index.js --wordlist ${testWordlist} --output ${testOutput} --difficulty invalid`,
        { encoding: 'utf-8', stdio: 'pipe' }
      );
      expect.fail('Should have thrown an error');
    } catch (error) {
      expect(error.status).toBe(1);
      expect(error.stderr.toString()).toContain('difficulty');
    }
  });

  it('should validate count parameter', () => {
    try {
      execSync(
        `node cli/index.js --wordlist ${testWordlist} --output ${testOutput} --count 0`,
        { encoding: 'utf-8', stdio: 'pipe' }
      );
      expect.fail('Should have thrown an error');
    } catch (error) {
      expect(error.status).toBe(1);
      expect(error.stderr.toString()).toContain('count');
    }
  });
});
