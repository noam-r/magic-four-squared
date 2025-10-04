/**
 * PuzzleEncoder - Compresses and encodes puzzles for URL sharing
 * Uses pako for compression (lightweight zlib implementation for browsers)
 */

export class PuzzleEncoder {
  /**
   * Encodes a puzzle object to a URL-safe compressed string
   * @param {Object} puzzle - Puzzle object
   * @returns {string} - Base64url encoded compressed string
   */
  static encode(puzzle) {
    try {
      // Convert to JSON string
      const json = JSON.stringify(puzzle);
      
      // Convert to Uint8Array
      const encoder = new TextEncoder();
      const data = encoder.encode(json);
      
      // Compress using native CompressionStream (modern browsers)
      // For older browsers, we'll use a fallback
      return this.compressAndEncode(data);
    } catch (error) {
      throw new Error(`Failed to encode puzzle: ${error.message}`);
    }
  }

  /**
   * Decodes a URL-safe compressed string to a puzzle object
   * @param {string} encoded - Base64url encoded compressed string
   * @returns {Object} - Puzzle object
   */
  static decode(encoded) {
    try {
      // Decode from base64url
      const compressed = this.base64urlDecode(encoded);
      
      // Decompress
      const decompressed = this.decompress(compressed);
      
      // Convert to string
      const decoder = new TextDecoder();
      const json = decoder.decode(decompressed);
      
      // Parse JSON
      return JSON.parse(json);
    } catch (error) {
      throw new Error(`Failed to decode puzzle: ${error.message}`);
    }
  }

  /**
   * Compresses data and encodes to base64url
   * Uses pako library for compression
   * @param {Uint8Array} data - Data to compress
   * @returns {string} - Base64url encoded string
   */
  static compressAndEncode(data) {
    // Use pako for compression (loaded via CDN in HTML)
    if (typeof pako === 'undefined') {
      throw new Error('Pako compression library not loaded');
    }
    
    const compressed = pako.deflate(data);
    return this.base64urlEncode(compressed);
  }

  /**
   * Decompresses data from Uint8Array
   * @param {Uint8Array} compressed - Compressed data
   * @returns {Uint8Array} - Decompressed data
   */
  static decompress(compressed) {
    // Use pako for decompression
    if (typeof pako === 'undefined') {
      throw new Error('Pako compression library not loaded');
    }
    
    return pako.inflate(compressed);
  }

  /**
   * Encodes Uint8Array to base64url (URL-safe base64)
   * @param {Uint8Array} data - Data to encode
   * @returns {string} - Base64url string
   */
  static base64urlEncode(data) {
    // Convert to regular base64
    let binary = '';
    for (let i = 0; i < data.length; i++) {
      binary += String.fromCharCode(data[i]);
    }
    const base64 = btoa(binary);
    
    // Convert to URL-safe base64
    return base64
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Decodes base64url to Uint8Array
   * @param {string} base64url - Base64url string
   * @returns {Uint8Array} - Decoded data
   */
  static base64urlDecode(base64url) {
    // Convert from URL-safe base64 to regular base64
    let base64 = base64url
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    
    // Add padding if needed
    while (base64.length % 4) {
      base64 += '=';
    }
    
    // Decode base64
    const binary = atob(base64);
    const data = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      data[i] = binary.charCodeAt(i);
    }
    
    return data;
  }

  /**
   * Generates a shareable URL for a puzzle
   * @param {Object} puzzle - Puzzle object
   * @param {string} baseUrl - Base URL (optional, defaults to current origin)
   * @returns {string} - Shareable URL
   */
  static generateShareableUrl(puzzle, baseUrl = null) {
    const encoded = this.encode(puzzle);
    const base = baseUrl || window.location.origin;
    return `${base}/?p=${encoded}`;
  }

  /**
   * Gets compression statistics for a puzzle
   * @param {Object} puzzle - Puzzle object
   * @returns {Object} - Statistics object
   */
  static getCompressionStats(puzzle) {
    const json = JSON.stringify(puzzle);
    const encoded = this.encode(puzzle);
    
    return {
      originalSize: json.length,
      compressedSize: encoded.length,
      compressionRatio: (encoded.length / json.length * 100).toFixed(1) + '%',
      urlLength: encoded.length + 5 // +5 for "/?p="
    };
  }
}
