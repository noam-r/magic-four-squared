# Developer Guide

Complete guide for developers working on Magic Four².

## Table of Contents

- [Setup](#setup)
- [Architecture](#architecture)
- [Development Workflow](#development-workflow)
- [URL Encoding](#url-encoding)
- [Security](#security)
- [Internationalization](#internationalization)
- [Testing](#testing)
- [Deployment](#deployment)

## Setup

### Prerequisites

- Node.js 16+ and npm
- Git
- Modern browser (Chrome, Firefox, Safari, Edge)

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/magic-four-squared.git
cd magic-four-squared

# Install dependencies
npm install

# Start development server
npm run dev
```

### Project Structure

```
magic-four-squared/
├── cli/                      # Puzzle generator CLI
│   ├── index.js             # CLI entry point
│   └── modules/
│       ├── MagicSquareFinder.js
│       ├── RiddleGenerator.js
│       ├── WordListLoader.js
│       ├── ArtifactWriter.js
│       └── QualityValidator.js
├── client/                   # Game client
│   ├── index.html           # Main HTML
│   ├── main.js              # Entry point
│   ├── styles.css           # Global styles
│   └── src/
│       ├── Game.js          # Main game controller
│       ├── components/      # UI components
│       │   ├── GridRenderer.js
│       │   ├── RiddleDisplay.js
│       │   └── CheckButton.js
│       └── modules/         # Core logic
│           ├── PuzzleLoader.js
│           ├── PuzzleEncoder.js
│           ├── PuzzleSanitizer.js
│           ├── GameStateManager.js
│           ├── AnswerChecker.js
│           ├── InputValidator.js
│           ├── RTLSupport.js
│           └── i18n.js
├── editor/                   # Visual puzzle editor
│   ├── index.html
│   ├── editor.js
│   └── README.md
├── shared/                   # Shared code
│   ├── schemas/
│   │   ├── puzzle-schema.json
│   │   └── validator.js
│   └── PuzzleEncoder.js
├── tests/                    # Tests
│   ├── unit/
│   └── integration/
├── puzzles/                  # Sample puzzles
├── wordlists/                # Word lists
└── scripts/                  # Utility scripts
```

## Architecture

### Component Overview

```
┌─────────────────────────────────────┐
│           Game.js                   │
│      (Main Controller)              │
└──────────┬──────────────────────────┘
           │
    ┌──────┴──────┬──────────┬────────┐
    │             │          │        │
┌───▼───┐   ┌────▼────┐  ┌──▼──┐  ┌──▼──┐
│ Grid  │   │ Riddle  │  │Check│  │State│
│Render │   │ Display │  │ Btn │  │ Mgr │
└───────┘   └─────────┘  └─────┘  └─────┘
```

### Data Flow

```
URL Parameter
    ↓
PuzzleLoader.loadFromInline()
    ↓
PuzzleEncoder.decode()
    ↓
PuzzleSanitizer.validateAndSanitize()
    ↓
Game.initFromPuzzle()
    ↓
Components render
```

### State Management

Game state is managed by `GameStateManager`:
- Current puzzle
- Revealed words
- Attempt counts
- Score
- Completion status

State is persisted to `localStorage` for resume functionality.

## Development Workflow

### Adding a New Feature

1. **Create a branch**
   ```bash
   git checkout -b feature/my-feature
   ```

2. **Write tests first** (TDD)
   ```javascript
   // tests/unit/MyFeature.test.js
   describe('MyFeature', () => {
     it('should do something', () => {
       // Test code
     });
   });
   ```

3. **Implement the feature**
   ```javascript
   // client/src/modules/MyFeature.js
   export class MyFeature {
     // Implementation
   }
   ```

4. **Run tests**
   ```bash
   npm test
   ```

5. **Test manually**
   ```bash
   npm run dev
   ```

6. **Commit and push**
   ```bash
   git add .
   git commit -m "feat: add my feature"
   git push origin feature/my-feature
   ```

### Code Style

- Use ES6+ features
- Prefer `const` over `let`
- Use descriptive variable names
- Add JSDoc comments for public methods
- Keep functions small and focused

Example:
```javascript
/**
 * Validates a puzzle answer
 * @param {string} answer - User's answer
 * @param {string} correctAnswer - Correct answer
 * @returns {boolean} - True if correct
 */
function validateAnswer(answer, correctAnswer) {
  return answer.toUpperCase() === correctAnswer.toUpperCase();
}
```

## URL Encoding

### Technical Implementation

The URL encoding feature allows puzzles to be embedded directly in URLs using compression.

#### Encoding Process

```javascript
import { PuzzleEncoder } from './modules/PuzzleEncoder.js';

// Encode a puzzle
const puzzle = { /* puzzle object */ };
const encoded = PuzzleEncoder.encode(puzzle);
const url = `https://example.com/?p=${encoded}`;

// Decode a puzzle
const decoded = PuzzleEncoder.decode(encoded);
```

#### Compression Pipeline

1. **JSON.stringify()** - Convert object to string
2. **TextEncoder** - Convert to Uint8Array
3. **pako.deflate()** - Compress with zlib
4. **base64url** - URL-safe encoding

#### Statistics

- Original: ~1,474 bytes
- Compressed: ~633 bytes (43% ratio)
- Base64url: ~844 characters
- Final URL: ~869 characters

#### URL Format

```
http://localhost:5173/?p=eJx9lc1u2kAQx-88xWrPODKG8HXrsfdKlVr1YNgNsWQwMnbTJso72...
```

Parameters:
- `p` - Inline encoded puzzle (new)
- `puzzle` - Path to puzzle file (legacy)

Priority: `p` parameter is checked first.

### Creating Shareable URLs

**From Editor:**
```javascript
// In editor.js
const encoded = PuzzleEncoder.encode(puzzle);
const shareUrl = `${baseUrl}/?p=${encoded}`;
```

**From CLI:**
```bash
node scripts/generate-share-url.js puzzles/my-puzzle.json
```

## Security

### XSS Prevention

The application implements multiple layers of XSS protection.

#### 1. Safe DOM Manipulation

Always use `textContent` for user data, never `innerHTML`:

```javascript
// ✅ SAFE
element.textContent = userInput;

// ❌ DANGEROUS
element.innerHTML = userInput;
```

#### 2. Input Sanitization

All puzzle data is sanitized before rendering:

```javascript
import { PuzzleSanitizer } from './modules/PuzzleSanitizer.js';

// Sanitize puzzle
const safePuzzle = PuzzleSanitizer.validateAndSanitize(puzzle);
```

The sanitizer:
- Removes HTML tags
- Decodes HTML entities
- Detects suspicious patterns
- Enforces length limits

#### 3. Content Security Policy

CSP header in `client/index.html`:

```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' https://cdnjs.cloudflare.com; 
               style-src 'self' 'unsafe-inline';">
```

#### 4. Schema Validation

All puzzles are validated against JSON schema:

```javascript
import { validatePuzzle } from './shared/validator.js';

const validation = validatePuzzle(puzzle);
if (!validation.valid) {
  throw new Error(validation.errors.join(', '));
}
```

### Security Checklist

- [x] All user input uses `textContent`
- [x] Puzzle data is sanitized
- [x] CSP header configured
- [x] Schema validation in place
- [x] No `eval()` or `Function()`
- [x] No dynamic script loading
- [x] Suspicious pattern detection

### Reporting Security Issues

Please report security vulnerabilities privately to [security@example.com].

## Internationalization

### Adding a New Language

1. **Add translations to i18n.js**

```javascript
// client/src/modules/i18n.js
const translations = {
  en: {
    score: 'Score',
    // ...
  },
  es: {  // New language
    score: 'Puntuación',
    // ...
  }
};
```

2. **Add to editor translations**

```javascript
// editor/editor.js
const translations = {
  en: { /* ... */ },
  es: { /* ... */ }  // New language
};
```

3. **Test RTL if needed**

For RTL languages (Arabic, Hebrew, etc.):

```javascript
// In i18n.js
static setLanguage(lang) {
  this.currentLanguage = lang;
  
  // Set document direction
  if (lang === 'ar' || lang === 'he') {
    document.documentElement.dir = 'rtl';
  } else {
    document.documentElement.dir = 'ltr';
  }
}
```

### RTL Support

The game fully supports RTL languages:

- Text direction automatically switches
- Grid layout mirrors for RTL
- UI elements reposition correctly

Implementation in `RTLSupport.js`:

```javascript
export class RTLSupport {
  static applyRTL(language) {
    const isRTL = ['he', 'ar'].includes(language);
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }
}
```

### Translation Guidelines

- Keep text concise
- Avoid idioms
- Test with actual native speakers
- Consider text expansion (some languages are longer)
- Test RTL layout thoroughly

## Testing

### Running Tests

```bash
# All tests
npm test

# Watch mode
npm run test:watch

# Specific file
npm test -- MagicSquareFinder.test.js

# Coverage
npm run test:coverage
```

### Writing Tests

#### Unit Tests

```javascript
// tests/unit/MyModule.test.js
import { describe, it, expect } from 'vitest';
import { MyModule } from '../../client/src/modules/MyModule.js';

describe('MyModule', () => {
  it('should do something', () => {
    const result = MyModule.doSomething();
    expect(result).toBe(expected);
  });
});
```

#### Integration Tests

```javascript
// tests/integration/game-flow.test.js
import { describe, it, expect } from 'vitest';
import { Game } from '../../client/src/Game.js';

describe('Game Flow', () => {
  it('should complete a full game', async () => {
    const game = new Game();
    await game.init('puzzles/sample-en.json');
    // Test game flow
  });
});
```

### Test Coverage Goals

- Unit tests: >80%
- Integration tests: Critical paths
- E2E tests: Main user flows

## Deployment

### Building for Production

```bash
# Build
npm run build

# Output: dist/
```

### Static Hosting

The app is a pure static site and can be deployed anywhere:

#### GitHub Pages

```bash
# Build
npm run build

# Deploy dist/ folder
gh-pages -d dist
```

#### Netlify

```bash
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"
```

#### Vercel

```bash
# vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist"
}
```

### Environment Variables

No environment variables needed for production! The app is completely static.

For development with AI features (if re-enabled):
```bash
# .env
OPENAI_API_KEY=your_key_here
```

### Performance Optimization

- Vite automatically code-splits
- Assets are hashed for caching
- Compression enabled in production
- Service worker for offline support (optional)

### Monitoring

Consider adding:
- Error tracking (Sentry)
- Analytics (Plausible, Google Analytics)
- Performance monitoring (Web Vitals)

## Troubleshooting

### Common Issues

**Issue: Tests fail with "document is not defined"**
```javascript
// Solution: Mock DOM in test
import { JSDOM } from 'jsdom';
global.document = new JSDOM().window.document;
```

**Issue: Vite dev server won't start**
```bash
# Solution: Clear cache and reinstall
rm -rf node_modules dist
npm install
```

**Issue: Hebrew text not displaying**
```javascript
// Solution: Check font supports Hebrew
// Add to CSS:
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
```

## Contributing

### Pull Request Process

1. Fork the repository
2. Create a feature branch
3. Write tests
4. Implement feature
5. Run tests and linting
6. Update documentation
7. Submit PR with clear description

### Code Review Checklist

- [ ] Tests pass
- [ ] Code follows style guide
- [ ] Documentation updated
- [ ] No console.logs left
- [ ] Security considerations addressed
- [ ] Performance impact considered

## Resources

- [Vite Documentation](https://vitejs.dev/)
- [Vitest Documentation](https://vitest.dev/)
- [MDN Web Docs](https://developer.mozilla.org/)
- [Web.dev](https://web.dev/)

## Getting Help

- Check existing issues
- Read documentation
- Ask in discussions
- Contact maintainers

---

**Happy coding! 🚀**
