import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RiddleGenerator } from '../../cli/modules/RiddleGenerator.js';

describe('RiddleGenerator', () => {
  beforeEach(() => {
    // Clear environment variables
    delete process.env.OPENAI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
  });

  describe('generateFallbackRiddle', () => {
    it('should generate English fallback riddle with hint and explanation', () => {
      const riddle = RiddleGenerator.generateFallbackRiddle('ABLE', 'en', 0);

      expect(riddle.id).toBe(1);
      expect(riddle.answer).toBe('ABLE');
      expect(riddle.position).toBe(0);
      expect(riddle.prompt).toContain('A');
      expect(typeof riddle.prompt).toBe('string');
      expect(typeof riddle.hint).toBe('string');
      expect(typeof riddle.explanation).toBe('string');
      expect(riddle.hint.length).toBeGreaterThan(0);
      expect(riddle.explanation.length).toBeGreaterThan(0);
    });

    it('should generate Hebrew fallback riddle with hint and explanation', () => {
      const riddle = RiddleGenerator.generateFallbackRiddle('אבגד', 'he', 0);

      expect(riddle.id).toBe(1);
      expect(riddle.answer).toBe('אבגד');
      expect(riddle.position).toBe(0);
      expect(typeof riddle.prompt).toBe('string');
      expect(typeof riddle.hint).toBe('string');
      expect(typeof riddle.explanation).toBe('string');
      expect(riddle.hint.length).toBeGreaterThan(0);
      expect(riddle.explanation.length).toBeGreaterThan(0);
    });

    it('should cycle through templates for different indices', () => {
      const riddle1 = RiddleGenerator.generateFallbackRiddle('ABLE', 'en', 0);
      const riddle2 = RiddleGenerator.generateFallbackRiddle('ABLE', 'en', 1);

      expect(riddle1.prompt).not.toBe(riddle2.prompt);
      expect(riddle1.hint).not.toBe(riddle2.hint);
      expect(riddle1.explanation).not.toBe(riddle2.explanation);
    });

    it('should use English template as fallback for unknown language', () => {
      const riddle = RiddleGenerator.generateFallbackRiddle('ABLE', 'fr', 0);

      expect(riddle.prompt).toBeTruthy();
      expect(typeof riddle.prompt).toBe('string');
      expect(typeof riddle.hint).toBe('string');
      expect(typeof riddle.explanation).toBe('string');
    });
  });

  describe('getPromptTemplate', () => {
    it('should return English prompt template', () => {
      const prompt = RiddleGenerator.getPromptTemplate('ABLE', 'en');

      expect(prompt).toContain('ABLE');
      expect(prompt).toContain('riddle');
    });

    it('should return Hebrew prompt template', () => {
      const prompt = RiddleGenerator.getPromptTemplate('אבגד', 'he');

      expect(prompt).toContain('אבגד');
      expect(prompt).toContain('חידה');
    });

    it('should fallback to English for unknown language', () => {
      const prompt = RiddleGenerator.getPromptTemplate('ABLE', 'fr');

      expect(prompt).toContain('ABLE');
      expect(prompt).toContain('riddle');
    });
  });

  describe('generateRiddles', () => {
    it('should generate riddles for multiple words using fallback', async () => {
      const words = ['ABLE', 'BARE', 'CARE', 'DARE'];

      const riddles = await RiddleGenerator.generateRiddles(words, 'en');

      expect(riddles).toHaveLength(4);
      expect(riddles[0].answer).toBe('ABLE');
      expect(riddles[1].answer).toBe('BARE');
      expect(riddles[2].answer).toBe('CARE');
      expect(riddles[3].answer).toBe('DARE');
    });

    it('should assign correct IDs and positions', async () => {
      const words = ['ABLE', 'BARE'];

      const riddles = await RiddleGenerator.generateRiddles(words, 'en');

      expect(riddles[0].id).toBe(1);
      expect(riddles[0].position).toBe(0);
      expect(riddles[1].id).toBe(2);
      expect(riddles[1].position).toBe(1);
    });
  });

  describe('generateRiddle', () => {
    it('should use fallback when no API key is set', async () => {
      const riddle = await RiddleGenerator.generateRiddle('ABLE', 'en', 0);

      expect(riddle.id).toBe(1);
      expect(riddle.answer).toBe('ABLE');
      expect(riddle.prompt).toBeTruthy();
    });
  });

  describe('retryWithBackoff', () => {
    it('should succeed on first try', async () => {
      const fn = vi.fn().mockResolvedValue('success');

      const result = await RiddleGenerator.retryWithBackoff(fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValueOnce('success');

      const result = await RiddleGenerator.retryWithBackoff(fn, 3, 10);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should throw after max retries', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('fail'));

      await expect(
        RiddleGenerator.retryWithBackoff(fn, 2, 10)
      ).rejects.toThrow('fail');

      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe('API Integration (mocked)', () => {
    it('should call OpenAI API when key is set', async () => {
      process.env.OPENAI_API_KEY = 'test-key';
      
      // Mock fetch
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: 'Test riddle for ABLE'
            }
          }]
        })
      });

      const riddle = await RiddleGenerator.generateOpenAIRiddle('ABLE', 'en', 0);

      expect(riddle.prompt).toBe('Test riddle for ABLE');
      expect(riddle.answer).toBe('ABLE');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-key'
          })
        })
      );
    });

    it('should handle OpenAI API errors', async () => {
      process.env.OPENAI_API_KEY = 'test-key';
      
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429
      });

      await expect(
        RiddleGenerator.generateOpenAIRiddle('ABLE', 'en', 0)
      ).rejects.toThrow('OpenAI API error');
    });

    it('should call Anthropic API when key is set', async () => {
      process.env.ANTHROPIC_API_KEY = 'test-key';
      
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          content: [{
            text: 'Test riddle for ABLE'
          }]
        })
      });

      const riddle = await RiddleGenerator.generateAnthropicRiddle('ABLE', 'en', 0);

      expect(riddle.prompt).toBe('Test riddle for ABLE');
      expect(riddle.answer).toBe('ABLE');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.anthropic.com/v1/messages',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'x-api-key': 'test-key'
          })
        })
      );
    });
  });
});
