# Magic Four² 🎮

A word puzzle game combining riddles with 4x4 magic squares. Solve riddles to reveal words that form a perfect magic square where every row and column creates a valid 4-letter word.

## ✨ Features

- **Riddle-Based Gameplay** - Solve clever riddles to reveal the magic square
- **URL-Encoded Puzzles** - Share entire puzzles via simple links (no server needed!)
- **Multi-Language Support** - Full English and Hebrew support with RTL text
- **Web-Based Editor** - Create and share custom puzzles visually
- **CLI Generator** - Generate puzzles programmatically from wordlists
- **Offline-Capable** - Play without an internet connection
- **Mobile-Responsive** - Works great on phones and tablets
- **Zero Infrastructure** - Pure static site, deploy anywhere

## 🚀 Quick Start

### Play the Game

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:5173
```

### Create a Puzzle

**Option 1: Use the Visual Editor**
```bash
# Open http://localhost:5173/editor/
# Create your puzzle visually
# Click "Generate Share Link" to get a shareable URL
```

**Option 2: Use the CLI**
```bash
# Generate puzzles from wordlist
npm run generate -- --language en --count 3

# Output: puzzles/puzzle-en-*.json
```

### Share a Puzzle

Puzzles can be shared as simple URLs:
```
http://localhost:5173/?p=eJx9lc1u2kAQx...
```

No files to upload, no server needed - just share the link!

## 📖 How to Play

1. **Read the Riddles** - Four riddles, one for each row
2. **Guess the Words** - Type your 4-letter answer
3. **Check Your Answer** - Submit to see if you're correct
4. **Reveal the Square** - Solve all riddles to complete the magic square

### Magic Square Rules

- Each row forms a valid 4-letter word (horizontal)
- Each column forms a valid 4-letter word (vertical)
- All 16 letters create a perfect 4x4 grid

Example:
```
T E A R
E A R N
A R E A
R N A B
```

## 🎯 Game Modes

### Standard Mode
- Solve riddles in any order
- Get hints if you're stuck
- See explanations after solving

### URL-Encoded Mode
- Share puzzles via URL
- No file downloads needed
- Works on any device with a browser

## 🛠️ Development

### Project Structure

```
magic-four-squared/
├── client/         # Game client (Vite + Vanilla JS)
├── editor/         # Visual puzzle editor
├── cli/            # Puzzle generator CLI
├── shared/         # Shared code (schemas, validators)
├── tests/          # Unit & integration tests
├── puzzles/        # Sample puzzles
└── wordlists/      # English wordlists
```

### Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run preview          # Preview production build

# Testing
npm test                 # Run all tests
npm run test:watch       # Watch mode

# Puzzle Generation
npm run generate         # Generate puzzles (CLI)
npm run manifest         # Update puzzle manifest (deprecated)
```

### Technology Stack

- **Frontend:** Vanilla JavaScript + Vite
- **Styling:** Pure CSS (no frameworks)
- **Compression:** Pako (zlib for URL encoding)
- **Testing:** Vitest
- **CLI:** Node.js

## 📝 Creating Puzzles

### Using the Visual Editor

1. Open `http://localhost:5173/editor/`
2. Fill in the 4x4 grid with letters
3. Write riddles for each row
4. Add optional hints and explanations
5. Click "Generate Share Link"
6. Share the URL!

### Using the CLI

```bash
# Generate 5 English puzzles
npm run generate -- --language en --count 5

# Specify output directory
npm run generate -- --language en --count 3 --output my-puzzles/

# Use custom wordlist
npm run generate -- --wordlist my-words.txt --count 10
```

### Paste JSON Feature

Already have a puzzle JSON file?
1. Open the editor
2. Click "📋 Paste JSON"
3. Paste your JSON content
4. Click "Import JSON"
5. Generate a shareable link!

## 🔗 URL Encoding

Puzzles are compressed and encoded into URLs for easy sharing.

### How It Works

```
JSON (1474 bytes)
    ↓ Compress (zlib)
Compressed (633 bytes - 43% of original)
    ↓ Base64url encode
URL Parameter (844 chars)
    ↓ Add to URL
Shareable Link (869 chars total)
```

### Example

```javascript
// Original puzzle
const puzzle = { /* 1474 bytes */ };

// Encoded URL
http://localhost:5173/?p=eJx9lc1u2kAQx...  // 869 chars
```

### Benefits

- ✅ No server required
- ✅ No database needed
- ✅ Works on any static host
- ✅ Share via copy/paste
- ✅ Embed in QR codes
- ✅ Post on social media

## 🌍 Multi-Language Support

### Supported Languages

- **English** - Full support
- **Hebrew** - Full support with RTL text

### Adding a New Language

See [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md#internationalization) for details on adding new languages.

## 🎨 Customization

### Styling

All styles are in `client/styles.css`. The game uses CSS custom properties for easy theming:

```css
:root {
  --primary-color: #667eea;
  --secondary-color: #764ba2;
  /* ... */
}
```

### Puzzle Difficulty

Difficulty is determined by:
- Riddle complexity
- Word obscurity
- Hint availability

## 📦 Deployment

### Static Hosting

Deploy to any static host:

```bash
# Build for production
npm run build

# Deploy the dist/ folder to:
# - GitHub Pages
# - Netlify
# - Vercel
# - Cloudflare Pages
# - Any static host
```

### GitHub Pages

```bash
# Build
npm run build

# Deploy dist/ folder
# Configure GitHub Pages to serve from dist/
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

## 🤝 Contributing

Contributions are welcome! Please read [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) for development setup and guidelines.

### Quick Contribution Guide

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`npm test`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📄 License

This project is licensed under the [PolyForm Noncommercial License 1.0.0](LICENSE.md).

**TL;DR:** Free for personal, educational, and non-commercial use. Commercial use requires a separate license.

For commercial licensing inquiries, please contact: [kalbigames@pm.me]

## 🙏 Acknowledgments

- Inspired by classic word puzzle games
- Built with modern web technologies
- Designed for accessibility and performance

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/noam-r/magic-four-squared/issues)
- **Discussions:** [GitHub Discussions](https://github.com/noam-r/magic-four-squared/discussions)

## 🗺️ Roadmap

- [ ] More language support
- [ ] Difficulty levels
- [ ] Daily puzzles
- [ ] Leaderboards
- [ ] Puzzle collections
- [ ] Mobile app (PWA)

---

**Made with ❤️ for puzzle enthusiasts**
