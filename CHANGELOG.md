# Changelog

All notable changes to Magic Four² will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-04-10

### Added
- Initial release of Magic Four²
- 4x4 magic square puzzle game with riddles
- URL-encoded puzzles for easy sharing
- Visual puzzle editor with drag-and-drop
- CLI puzzle generator
- Multi-language support (English, Hebrew)
- RTL text support for Hebrew
- Offline-capable gameplay
- Mobile-responsive design
- Paste JSON feature in editor
- Share link modal with compression stats
- Security sanitization for XSS prevention
- Comprehensive test suite

### Features
- **Game Client**: Play riddle-based magic square puzzles
- **Puzzle Editor**: Create custom puzzles visually
- **CLI Generator**: Generate puzzles from wordlists
- **URL Encoding**: Share puzzles via compressed URLs (43% compression ratio)
- **Multi-Language**: Full English and Hebrew support
- **Security**: XSS prevention with input sanitization and CSP
- **Testing**: Unit and integration tests with Vitest

### Technical
- Built with Vanilla JavaScript + Vite
- Pure CSS styling (no frameworks)
- Pako compression for URL encoding
- JSON Schema validation
- LocalStorage for game state persistence

---

## Release Notes

### v1.0.0 - Initial Release

Magic Four² is a word puzzle game that combines riddles with 4x4 magic squares. Players solve riddles to reveal words that form a perfect magic square where every row and column creates a valid 4-letter word.

**Key Highlights:**
- 🎮 Engaging riddle-based gameplay
- 🔗 Revolutionary URL-encoded puzzles
- 🌍 Multi-language support with RTL
- 🎨 Beautiful, responsive design
- 🚀 Zero infrastructure required
- 📱 Works on all devices

**Getting Started:**
```bash
npm install
npm run dev
```

Open http://localhost:5173 and start playing!

---

[1.0.0]: https://github.com/yourusername/magic-four-squared/releases/tag/v1.0.0
